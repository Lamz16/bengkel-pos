# Read-only unit harness: extracts lifecycle functions without opening WinForms or starting processes.
$ErrorActionPreference = 'Stop'
$launcherPath = Join-Path $PSScriptRoot '..\BengkelProLauncher.ps1'
$tokens = $null; $parseErrors = $null
$ast = [System.Management.Automation.Language.Parser]::ParseFile($launcherPath, [ref]$tokens, [ref]$parseErrors)
if ($parseErrors.Count) { throw ($parseErrors | Out-String) }
$ast.FindAll({ param($node) $node -is [System.Management.Automation.Language.FunctionDefinitionAst] -and $node.Name -in @('Start-PrintCompanion', 'Stop-PrintCompanion') }, $true) |
    ForEach-Object { Invoke-Expression $_.Extent.Text }
function Assert($condition, $message) { if (-not $condition) { throw $message } }
$printerStatus = [pscustomobject]@{Text=''}
$startPrinter = [pscustomobject]@{Enabled=$true}
$stopPrinter = [pscustomobject]@{Enabled=$false}
$projectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$script:busy = @(); $script:starts = 0; $script:missing = $false; $script:launchFailure = $false
function Get-CompanionLogDirectory { return $projectRoot }
function Get-BusyPorts { return $script:busy }
function Test-Path { return (-not $script:missing) }
function New-Item { }
function Start-Process {
    param($FilePath, $WindowStyle, [switch]$PassThru, $ErrorAction, $ArgumentList, $WorkingDirectory, $RedirectStandardError, $RedirectStandardOutput)
    Assert ($WindowStyle -eq 'Hidden') 'Companion must run hidden'
    Assert ($ArgumentList -contains 'http://localhost:3000') 'Must use exact launcher origin'
    Assert (-not ($ArgumentList -contains '*')) 'Wildcard origin prohibited'
    if ($script:launchFailure) { throw 'Mock start failure' }
    $script:starts++
    $p = [pscustomobject]@{HasExited=$false; Killed=$false; Disposed=$false}
    $p | Add-Member ScriptMethod Kill { $this.Killed=$true; $this.HasExited=$true }
    $p | Add-Member ScriptMethod Dispose { $this.Disposed=$true }
    return $p
}
$script:printCompanionProcess = $null
Start-PrintCompanion
Assert ($script:starts -eq 1 -and $stopPrinter.Enabled) 'Start must create one child'
$owned = $script:printCompanionProcess
Start-PrintCompanion
Assert ($script:starts -eq 1) 'Repeated clicks must not duplicate child'
Stop-PrintCompanion
Assert ($owned.Killed -and $owned.Disposed -and -not $script:printCompanionProcess) 'Stop must clean up owned child'
Stop-PrintCompanion
$script:busy = @(17843)
Start-PrintCompanion
Assert ($script:starts -eq 1 -and $printerStatus.Text -like '*dipakai*') 'Busy port must not start or kill anything'
$script:busy = @(); $script:missing = $true
Start-PrintCompanion
Assert ($script:starts -eq 1 -and $startPrinter.Enabled) 'Missing file must allow fallback and retry'
$script:missing = $false; $script:launchFailure = $true
Start-PrintCompanion
Assert ($startPrinter.Enabled -and -not $stopPrinter.Enabled) 'Start failure must allow retry'
$script:launchFailure = $false
Start-PrintCompanion
Assert ($script:starts -eq 2) 'Retry must work'
Stop-PrintCompanion
$launcherSource = Get-Content -LiteralPath $launcherPath -Raw
Assert ($launcherSource.Contains('if ($autoCompanion.Checked) { Start-PrintCompanion }')) 'Launcher actions must auto-start companion'
Assert ($launcherSource.Contains('$form.Add_FormClosed({ $printerTimer.Stop(); Stop-PrintCompanion;')) 'Closing launcher must clean up child'
Write-Output 'PASS: launcher syntax, hidden launch, exact origin, duplicate start, owned stop, busy port, missing file, failed start and retry.'

