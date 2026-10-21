# Executes only harmless child processes; never starts the app or touches the database.
$ErrorActionPreference = 'Stop'
$tokens = $null; $errors = $null
$path = Join-Path $PSScriptRoot 'BengkelProLauncher.ps1'
$ast = [System.Management.Automation.Language.Parser]::ParseFile($path, [ref]$tokens, [ref]$errors)
if ($errors.Count) { throw ($errors | Out-String) }
$ast.FindAll({ param($n) $n -is [System.Management.Automation.Language.FunctionDefinitionAst] -and $n.Name -in @('Start-LauncherProcess', 'Start-TaskTerminal', 'Stop-ProductionServer') }, $true) |
    ForEach-Object { Invoke-Expression $_.Extent.Text }
function Assert($condition, $message) { if (-not $condition) { throw $message } }
function Add-LauncherLog([string]$message) { $script:messages += $message }
$projectRoot = Split-Path -Parent $PSScriptRoot
$script:logDirectory = Join-Path $projectRoot ('.tmp-launcher-test-' + [Guid]::NewGuid().ToString('N'))
$script:tasks = @(); $script:messages = @(); $script:maintenanceTask = $null
try {
    Start-TaskTerminal 'Harmless output' 'echo launcher-ok & echo launcher-error 1>&2 & exit /b 7'
    $task = $script:maintenanceTask
    Assert ($null -ne $task) 'Task must start'
    Start-TaskTerminal 'Duplicate' 'echo must-not-run'
    Assert ($script:tasks.Count -eq 1) 'Maintenance must not overlap'
    Assert ($task.Process.WaitForExit(10000)) 'Harmless command must finish'
    Assert ($task.Process.ExitCode -eq 7) 'Must preserve failure exit code'
    $output = $task.Readers[0].ReadToEnd()
    $errorOutput = $task.Readers[1].ReadToEnd()
    Assert ($output -match 'launcher-ok') 'Must capture stdout'
    Assert ($errorOutput -match 'launcher-error') 'Must capture stderr'
    Assert (@(Get-ChildItem $script:logDirectory -Filter '*.log').Count -eq 2) 'Logs must persist'
    $script:serverTask = Start-LauncherProcess 'Harmless server stand-in' 'powershell.exe' '-NoProfile -NonInteractive -Command Start-Sleep -Seconds 60'
    Assert ($null -ne $script:serverTask) 'Server stand-in must start'
    $owned = $script:serverTask.Process
    Stop-ProductionServer
    Assert ($owned.HasExited) 'Stop must terminate owned process'
    Stop-ProductionServer
    $bad = Start-LauncherProcess 'Missing executable' 'bengkelpro-nonexistent-test.exe' ''
    Assert ($null -eq $bad) 'Start failure must be handled'
    Assert ($script:messages[-1] -match 'Gagal memulai') 'Start failure must appear in log panel'
    Write-Output 'PASS: syntax, background process, stdout/stderr logs, exit code, maintenance exclusion, owned server stop, repeated stop, start failure.'
} finally {
    foreach ($task in $script:tasks) {
        if (-not $task.Process.HasExited) { $task.Process.Kill(); $task.Process.WaitForExit() }
        foreach ($reader in $task.Readers) { $reader.Dispose() }
        $task.Process.Dispose()
    }
    # Only this harness-created directory can be removed.
    if ((Split-Path -Parent $script:logDirectory) -eq $projectRoot -and (Split-Path -Leaf $script:logDirectory) -like '.tmp-launcher-test-*') {
        Remove-Item -LiteralPath $script:logDirectory -Recurse -Force
    }
}
