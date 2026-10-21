Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public static class BengkelProLauncherWindow {
    [DllImport("user32.dll")]
    public static extern bool ShowWindow(IntPtr window, int command);
}
'@

$projectRoot = Split-Path -Parent $PSScriptRoot

$script:tasks = @()
$script:maintenanceTask = $null
$script:serverTask = $null
$script:logDirectory = Join-Path ([Environment]::GetFolderPath('LocalApplicationData')) 'BengkelPro\Launcher'

function Add-LauncherLog([string]$message) {
    if ($logView.TextLength -gt 100000) { $logView.Clear() }
    $logView.AppendText($message + [Environment]::NewLine)
    $logView.SelectionStart = $logView.TextLength
    $logView.ScrollToCaret()
}

function Start-TaskTerminal([string]$title, [string]$command) {
    if ($script:maintenanceTask) { return }
    $script:maintenanceTask = Start-LauncherProcess $title 'cmd.exe' "/d /c $command"
    if ($script:maintenanceTask) {
        foreach ($button in @($update, $generate, $migrate, $deploy, $start, $restartServer)) {
            if ($button) { $button.Enabled = $false }
        }
    }
}

function Start-LauncherProcess([string]$title, [string]$file, [string]$arguments) {
    $process = $null
    try {
        [void](New-Item -ItemType Directory -Path $script:logDirectory -Force -ErrorAction Stop)
        $id = (Get-Date -Format 'yyyyMMdd-HHmmss') + '-' + [Guid]::NewGuid().ToString('N')
        $output = Join-Path $script:logDirectory "$id.output.log"
        $errorLog = Join-Path $script:logDirectory "$id.error.log"
        $process = Start-Process -FilePath $file -ArgumentList $arguments -WorkingDirectory $projectRoot `
            -WindowStyle Hidden -PassThru -ErrorAction Stop -RedirectStandardOutput $output -RedirectStandardError $errorLog
        # Retain the native handle so Windows PowerShell can read even a fast child's exit code.
        $null = $process.Handle
        $readers = @($output, $errorLog) | ForEach-Object {
            $stream = [System.IO.File]::Open($_, 'Open', 'Read', 'ReadWrite')
            New-Object System.IO.StreamReader($stream)
        }
        $task = [pscustomobject]@{ Title=$title; Process=$process; Readers=@($readers); Started=(Get-Date) }
        $script:tasks += $task
        Add-LauncherLog "[$title] Dimulai. Log: $output | $errorLog"
        return $task
    } catch {
        if ($process -and -not $process.HasExited) { $process.Kill() }
        Add-LauncherLog "[$title] Gagal memulai: $($_.Exception.Message)"
        return $null
    }
}

function Stop-ProductionServer {
    if ($script:serverTask -and -not $script:serverTask.Process.HasExited) {
        # Production runs node directly, so this handle owns the server, without a shell parent.
        $script:serverTask.Process.Kill()
        $script:serverTask.Process.WaitForExit()
        Add-LauncherLog '[Server] Server dihentikan.'
    }
}

function Get-BusyPorts([int[]]$ports) {
    return @(Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue |
        Where-Object { $_.LocalPort -in $ports } |
        Select-Object -ExpandProperty LocalPort -Unique)
}

$form = New-Object System.Windows.Forms.Form
$form.Text = 'BengkelPro Launcher'
$form.Size = New-Object System.Drawing.Size(850, 970)
$form.StartPosition = 'CenterScreen'
$form.FormBorderStyle = 'Sizable'
$form.MaximizeBox = $true
$form.MinimumSize = New-Object System.Drawing.Size(600, 400)
$form.AutoScroll = $true
$form.AutoScrollMinSize = New-Object System.Drawing.Size(820, 920)
$form.Font = New-Object System.Drawing.Font('Segoe UI', 9)

$title = New-Object System.Windows.Forms.Label
$title.Text = 'BengkelPro POS'
$title.Font = New-Object System.Drawing.Font('Segoe UI Semibold', 18)
$title.AutoSize = $true
$title.Location = New-Object System.Drawing.Point(28, 24)
$form.Controls.Add($title)

$description = New-Object System.Windows.Forms.Label
$description.Text = 'Perbarui, migrasikan, dan deploy aplikasi lokal.'
$description.AutoSize = $true
$description.Location = New-Object System.Drawing.Point(31, 61)
$form.Controls.Add($description)

$status = New-Object System.Windows.Forms.Label
$status.Text = 'Status: siap dijalankan'
$status.AutoSize = $true
$status.ForeColor = [System.Drawing.Color]::FromArgb(71, 85, 105)
$status.Location = New-Object System.Drawing.Point(31, 95)
$form.Controls.Add($status)

$openApp = New-Object System.Windows.Forms.Button
$openApp.Text = 'Buka Aplikasi'
$openApp.Size = New-Object System.Drawing.Size(190, 44)
$openApp.Location = New-Object System.Drawing.Point(30, 130)
$openApp.FlatStyle = 'Flat'
$openApp.FlatAppearance.BorderColor = [System.Drawing.Color]::FromArgb(203, 213, 225)
$openApp.Add_Click({
    if ($autoCompanion.Checked) { Start-PrintCompanion }
    Start-Process 'http://localhost:3000'
})
$form.Controls.Add($openApp)

$maintenanceTitle = New-Object System.Windows.Forms.Label
$maintenanceTitle.Text = 'Pemeliharaan & Deploy'
$maintenanceTitle.Font = New-Object System.Drawing.Font('Segoe UI Semibold', 11)
$maintenanceTitle.AutoSize = $true
$maintenanceTitle.Location = New-Object System.Drawing.Point(31, 200)
$form.Controls.Add($maintenanceTitle)

$update = New-Object System.Windows.Forms.Button
$update.Text = 'Update dari Git'
$update.Size = New-Object System.Drawing.Size(150, 40)
$update.Location = New-Object System.Drawing.Point(30, 230)
$update.Add_Click({
    if (-not (Get-Command git.exe -ErrorAction SilentlyContinue)) {
        [System.Windows.Forms.MessageBox]::Show('Git tidak ditemukan. Instal Git for Windows terlebih dahulu.', 'BengkelPro Launcher', 'OK', 'Error')
        return
    }
    $changes = @(& git -C $projectRoot status --porcelain)
    if ($changes.Count -gt 0) {
        [System.Windows.Forms.MessageBox]::Show('Update dibatalkan karena ada perubahan lokal. Commit atau simpan perubahan Anda terlebih dahulu agar tidak tertimpa.', 'BengkelPro Launcher', 'OK', 'Warning')
        return
    }
    if ([System.Windows.Forms.MessageBox]::Show('Ambil update terbaru dari origin/main?', 'Konfirmasi Update', 'YesNo', 'Question') -ne 'Yes') { return }
    Start-TaskTerminal 'BengkelPro Update' 'git pull --ff-only origin main'
    $status.Text = 'Status: update Git dimulai; lihat panel log.'
    $status.ForeColor = [System.Drawing.Color]::FromArgb(5, 150, 105)
})
$form.Controls.Add($update)

$generate = New-Object System.Windows.Forms.Button
$generate.Text = 'Generate Prisma'
$generate.Size = New-Object System.Drawing.Size(150, 40)
$generate.Location = New-Object System.Drawing.Point(195, 230)
$generate.Add_Click({
    Start-TaskTerminal 'BengkelPro Prisma Generate' 'npm run db:generate'
    $status.Text = 'Status: generate Prisma dimulai; lihat panel log.'
    $status.ForeColor = [System.Drawing.Color]::FromArgb(5, 150, 105)
})
$form.Controls.Add($generate)

$migrate = New-Object System.Windows.Forms.Button
$migrate.Text = 'Terapkan Migration'
$migrate.Size = New-Object System.Drawing.Size(150, 40)
$migrate.Location = New-Object System.Drawing.Point(360, 230)
$migrate.Add_Click({
    $answer = [System.Windows.Forms.MessageBox]::Show('Migration akan diterapkan ke database yang dikonfigurasi pada file .env. Lanjutkan?', 'Konfirmasi Migration Database', 'YesNo', 'Warning')
    if ($answer -ne 'Yes') { return }
    Start-TaskTerminal 'BengkelPro Database Migration' 'npm run db:migrate'
    $status.Text = 'Status: migration database dimulai; lihat panel log.'
    $status.ForeColor = [System.Drawing.Color]::FromArgb(217, 119, 6)
})
$form.Controls.Add($migrate)

$deploy = New-Object System.Windows.Forms.Button
$deploy.Text = 'Build Aplikasi'
$deploy.Size = New-Object System.Drawing.Size(230, 44)
$deploy.Location = New-Object System.Drawing.Point(30, 290)
$deploy.BackColor = [System.Drawing.Color]::FromArgb(5, 150, 105)
$deploy.ForeColor = [System.Drawing.Color]::White
$deploy.FlatStyle = 'Flat'
$deploy.FlatAppearance.BorderSize = 0
$deploy.Add_Click({
    $busyPorts = Get-BusyPorts @(3000)
    if ($busyPorts.Count -gt 0) {
        [System.Windows.Forms.MessageBox]::Show('Port 3000 masih dipakai. Hentikan server terlebih dahulu (gunakan Stop Server jika dijalankan oleh launcher ini), lalu build ulang.', 'BengkelPro Launcher', 'OK', 'Warning')
        return
    }
    Start-TaskTerminal 'BengkelPro Build' 'npm run build'
    $status.Text = 'Status: build dimulai; lihat panel log.'
    $status.ForeColor = [System.Drawing.Color]::FromArgb(5, 150, 105)
})
$form.Controls.Add($deploy)

$start = New-Object System.Windows.Forms.Button
$start.Text = 'Start Production'
$start.Size = New-Object System.Drawing.Size(235, 44)
$start.Location = New-Object System.Drawing.Point(275, 290)
$start.Add_Click({
    if ($script:serverTask -and -not $script:serverTask.Process.HasExited) { return }
    $busyPorts = Get-BusyPorts @(3000)
    if ($busyPorts.Count -gt 0) {
        if ($autoCompanion.Checked) { Start-PrintCompanion }
        [System.Windows.Forms.MessageBox]::Show('Port 3000 masih dipakai. Klik Buka Aplikasi jika server sudah berjalan. Gunakan Stop/Restart untuk server milik launcher ini; server dari luar harus dihentikan dari tempat asalnya.', 'BengkelPro Launcher', 'OK', 'Warning')
        return
    }
    if (-not (Test-Path -LiteralPath (Join-Path $projectRoot 'dist/server.cjs') -PathType Leaf) -or
        -not (Test-Path -LiteralPath (Join-Path $projectRoot 'dist/index.html') -PathType Leaf)) {
        [System.Windows.Forms.MessageBox]::Show('Hasil build belum tersedia. Klik Build Aplikasi dan tunggu hingga berhasil, lalu klik Start Production.', 'BengkelPro Launcher', 'OK', 'Warning')
        return
    }
    if ($autoCompanion.Checked) { Start-PrintCompanion }
    $script:serverTask = Start-LauncherProcess 'BengkelPro Production' 'node.exe' 'dist/server.cjs'
    if ($script:serverTask) { $start.Enabled = $false }
    $status.Text = 'Status: server sedang dimulai; lihat panel log.'
    $status.ForeColor = [System.Drawing.Color]::FromArgb(5, 150, 105)
})
$form.Controls.Add($start)

$deployInfo = New-Object System.Windows.Forms.Label
$deployInfo.Text = 'Setelah restart laptop: Start Production -> Buka Aplikasi. Setelah update: jalankan langkah pemeliharaan yang diperlukan -> Build -> Start.'
$deployInfo.Size = New-Object System.Drawing.Size(470, 34)
$deployInfo.ForeColor = [System.Drawing.Color]::FromArgb(100, 116, 139)
$deployInfo.Location = New-Object System.Drawing.Point(31, 345)
$form.Controls.Add($deployInfo)

$hint = New-Object System.Windows.Forms.Label
$hint.Text = "Proses berjalan tanpa terminal. Gunakan Stop/Restart untuk mengelola server.`r`nBiarkan launcher terbuka selama aplikasi digunakan. Log tersimpan otomatis."
$hint.Size = New-Object System.Drawing.Size(375, 50)
$hint.ForeColor = [System.Drawing.Color]::FromArgb(100, 116, 139)
$hint.Location = New-Object System.Drawing.Point(31, 385)
$form.Controls.Add($hint)

# The launcher owns only the child process it starts. Never terminate an unrelated port owner.
$script:printCompanionProcess = $null
$script:companionLog = $null

function Stop-PrintCompanion {
    if ($script:printCompanionProcess) {
        try {
            if (-not $script:printCompanionProcess.HasExited) { $script:printCompanionProcess.Kill() }
            $script:printCompanionProcess.Dispose()
        } catch { }
        $script:printCompanionProcess = $null
    }
    $printerStatus.Text = 'Pendamping dihentikan. Cetak browser tetap tersedia.'
    $startPrinter.Enabled = $true
    $stopPrinter.Enabled = $false
}

function Get-CompanionLogDirectory {
    return Join-Path ([Environment]::GetFolderPath('LocalApplicationData')) 'BengkelPro\PrintCompanion'
}

function Start-PrintCompanion {
    if ($script:printCompanionProcess -and -not $script:printCompanionProcess.HasExited) { return }
    if ($script:printCompanionProcess) {
        $script:printCompanionProcess.Dispose()
        $script:printCompanionProcess = $null
    }
    if ((Get-BusyPorts @(17843)).Count -gt 0) {
        $printerStatus.Text = 'Port pendamping dipakai. Coba Deteksi ulang di nota; browser tetap tersedia.'
        return
    }
    try {
        $companionPath = Join-Path $projectRoot 'tools\print-companion\BengkelProPrintCompanion.ps1'
        if (-not (Test-Path -LiteralPath $companionPath -PathType Leaf)) { throw 'File pendamping tidak ditemukan.' }
        $logDirectory = Get-CompanionLogDirectory
        [void](New-Item -ItemType Directory -Path $logDirectory -Force -ErrorAction Stop)
        $logId = [Guid]::NewGuid().ToString('N')
        $script:companionLog = Join-Path $logDirectory "companion-$logId.error.log"
        $outputLog = Join-Path $logDirectory "companion-$logId.log"
        $script:printCompanionProcess = Start-Process -FilePath 'powershell.exe' -WindowStyle Hidden -PassThru -ErrorAction Stop `
            -ArgumentList @('-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', "`"$companionPath`"", '-AllowedOrigins', 'http://localhost:3000') `
            -WorkingDirectory $projectRoot -RedirectStandardError $script:companionLog -RedirectStandardOutput $outputLog
        $printerStatus.Text = 'Pendamping sedang dimulai. Cetak browser tetap tersedia.'
        $startPrinter.Enabled = $false
        $stopPrinter.Enabled = $true
    } catch {
        $printerStatus.Text = 'Pendamping gagal dimulai. Cetak browser tetap tersedia.'
        $startPrinter.Enabled = $true
        $stopPrinter.Enabled = $false
    }
}

$printerTitle = New-Object System.Windows.Forms.Label
$printerTitle.Text = 'Pendamping Printer Nota B/W'
$printerTitle.Font = New-Object System.Drawing.Font('Segoe UI Semibold', 11)
$printerTitle.AutoSize = $true
$printerTitle.Location = New-Object System.Drawing.Point(31, 445)
$form.Controls.Add($printerTitle)

$autoCompanion = New-Object System.Windows.Forms.CheckBox
$autoCompanion.Text = 'Otomatis saat Start Production / Buka Aplikasi'
$autoCompanion.Checked = $true
$autoCompanion.AutoSize = $true
$autoCompanion.Location = New-Object System.Drawing.Point(31, 477)
$form.Controls.Add($autoCompanion)

$startPrinter = New-Object System.Windows.Forms.Button
$startPrinter.Text = 'Mulai pendamping'
$startPrinter.Size = New-Object System.Drawing.Size(150, 34)
$startPrinter.Location = New-Object System.Drawing.Point(30, 505)
$startPrinter.Add_Click({ Start-PrintCompanion })
$form.Controls.Add($startPrinter)

$stopPrinter = New-Object System.Windows.Forms.Button
$stopPrinter.Text = 'Hentikan pendamping'
$stopPrinter.Size = New-Object System.Drawing.Size(160, 34)
$stopPrinter.Location = New-Object System.Drawing.Point(190, 505)
$stopPrinter.Enabled = $false
$stopPrinter.Add_Click({ Stop-PrintCompanion })
$form.Controls.Add($stopPrinter)

$printerLog = New-Object System.Windows.Forms.Button
$printerLog.Text = 'Buka log'
$printerLog.Size = New-Object System.Drawing.Size(150, 34)
$printerLog.Location = New-Object System.Drawing.Point(360, 505)
$printerLog.Add_Click({
    if ($script:companionLog -and (Test-Path -LiteralPath $script:companionLog)) {
        Start-Process -FilePath 'notepad.exe' -ArgumentList "`"$script:companionLog`""
    }
})
$form.Controls.Add($printerLog)

$printerStatus = New-Object System.Windows.Forms.Label
$printerStatus.Text = 'Pendamping belum dijalankan.'
$printerStatus.Size = New-Object System.Drawing.Size(480, 36)
$printerStatus.Location = New-Object System.Drawing.Point(31, 548)
$form.Controls.Add($printerStatus)

$printerHint = New-Object System.Windows.Forms.Label
$printerHint.Text = 'Biarkan launcher terbuka selama deteksi printer. Di nota: Pengaturan lanjutan > Deteksi ulang > Cetak uji > Simpan profil. Profil tersimpan tetap bisa dipakai setelah pendamping dihentikan.'
$printerHint.Size = New-Object System.Drawing.Size(480, 54)
$printerHint.Location = New-Object System.Drawing.Point(31, 588)
$printerHint.ForeColor = [System.Drawing.Color]::FromArgb(100, 116, 139)
$form.Controls.Add($printerHint)

$printerTimer = New-Object System.Windows.Forms.Timer
$printerTimer.Interval = 1500
$printerTimer.Add_Tick({
    if ($script:printCompanionProcess) {
        if ($script:printCompanionProcess.HasExited) {
            $script:printCompanionProcess.Dispose()
            $script:printCompanionProcess = $null
            $printerStatus.Text = 'Pendamping berhenti / gagal dimulai. Buka log; cetak browser tetap tersedia.'
            $startPrinter.Enabled = $true
            $stopPrinter.Enabled = $false
        } else {
            $printerStatus.Text = 'Proses pendamping berjalan. Periksa koneksi lewat Deteksi ulang di nota.'
        }
    }
})
$printerTimer.Start()
$stopServer = New-Object System.Windows.Forms.Button
$stopServer.Text = 'Stop Server'
$stopServer.Size = New-Object System.Drawing.Size(130, 44)
$stopServer.Location = New-Object System.Drawing.Point(530, 290)
$stopServer.Enabled = $false
$stopServer.Add_Click({ Stop-ProductionServer })
$form.Controls.Add($stopServer)

$restartServer = New-Object System.Windows.Forms.Button
$restartServer.Text = 'Restart Server'
$restartServer.Size = New-Object System.Drawing.Size(140, 44)
$restartServer.Location = New-Object System.Drawing.Point(670, 290)
$restartServer.Enabled = $false
$restartServer.Add_Click({
    Stop-ProductionServer
    $start.Enabled = $true
    $start.PerformClick()
})
$form.Controls.Add($restartServer)

$logFolder = New-Object System.Windows.Forms.Button
$logFolder.Text = 'Buka folder log launcher'
$logFolder.Size = New-Object System.Drawing.Size(230, 34)
$logFolder.Location = New-Object System.Drawing.Point(30, 650)
$logFolder.Add_Click({
    [void](New-Item -ItemType Directory -Path $script:logDirectory -Force)
    Start-Process explorer.exe -ArgumentList "`"$script:logDirectory`""
})
$form.Controls.Add($logFolder)

$logView = New-Object System.Windows.Forms.RichTextBox
$logView.Location = New-Object System.Drawing.Point(30, 695)
$logView.Size = New-Object System.Drawing.Size(780, 210)
$logView.MinimumSize = New-Object System.Drawing.Size(780, 210)
$logView.Anchor = 'Top, Bottom, Left, Right'
$logView.ReadOnly = $true
$logView.WordWrap = $false
$logView.Font = New-Object System.Drawing.Font('Consolas', 9)
$form.Controls.Add($logView)

$taskTimer = New-Object System.Windows.Forms.Timer
$taskTimer.Interval = 300
$taskTimer.Add_Tick({
    foreach ($task in @($script:tasks)) {
        foreach ($reader in $task.Readers) {
            $chunk = $reader.ReadToEnd()
            if ($chunk) { Add-LauncherLog "[$($task.Title)] $chunk" }
        }
        if ($task.Process.HasExited) {
            $code = $task.Process.ExitCode
            # Drain the last output before releasing file handles.
            foreach ($reader in $task.Readers) {
                $chunk = $reader.ReadToEnd()
                if ($chunk) { Add-LauncherLog "[$($task.Title)] $chunk" }
                $reader.Dispose()
            }
            $result = if ($code -eq 0) { 'berhasil' } else { "gagal (kode $code); periksa log" }
            Add-LauncherLog "[$($task.Title)] Selesai: $result."
            $status.Text = "Status: $($task.Title) $result."
            $status.ForeColor = if ($code -eq 0) { [System.Drawing.Color]::DarkGreen } else { [System.Drawing.Color]::Firebrick }
            if ($script:maintenanceTask -eq $task) { $script:maintenanceTask = $null }
            if ($script:serverTask -eq $task) { $script:serverTask = $null }
            $task.Process.Dispose()
            $script:tasks = @($script:tasks | Where-Object { $_ -ne $task })
        }
    }
    $busy = $null -ne $script:maintenanceTask
    foreach ($button in @($update, $generate, $migrate, $deploy, $start)) { $button.Enabled = -not $busy }
    $serverRunning = $script:serverTask -and -not $script:serverTask.Process.HasExited
    $stopServer.Enabled = [bool]$serverRunning
    $restartServer.Enabled = [bool]$serverRunning -and -not $busy
    if ($serverRunning) { $start.Enabled = $false }
    if ($busy) {
        $seconds = [int]((Get-Date) - $script:maintenanceTask.Started).TotalSeconds
        $status.Text = "Status: $($script:maintenanceTask.Title) berjalan ($seconds detik)..."
    }
})
$taskTimer.Start()
$form.Add_FormClosing({
    param($sender, $eventArgs)
    if ($script:maintenanceTask) {
        $eventArgs.Cancel = $true
        [void][System.Windows.Forms.MessageBox]::Show('Tunggu proses pemeliharaan selesai sebelum menutup launcher.', 'Proses masih berjalan')
        return
    }
    if ($script:serverTask -and -not $script:serverTask.Process.HasExited) {
        if ([System.Windows.Forms.MessageBox]::Show('Menutup launcher juga menghentikan server aplikasi. Lanjutkan?', 'Tutup launcher', 'YesNo', 'Question') -ne 'Yes') {
            $eventArgs.Cancel = $true
            return
        }
        Stop-ProductionServer
    }
})
$form.Add_FormClosed({ $printerTimer.Stop(); Stop-PrintCompanion; $printerTimer.Dispose() })
$form.Add_FormClosed({
    $taskTimer.Stop()
    $taskTimer.Dispose()
    foreach ($task in $script:tasks) {
        foreach ($reader in $task.Readers) { $reader.Dispose() }
        $task.Process.Dispose()
    }
})
# WScript starts PowerShell with SW_HIDE to hide its console. Windows can apply
# that startup flag to the first GUI window too; explicitly show the form after
# WinForms has created it. A second call overrides the inherited startup flag.
$form.Add_Shown({
    [void][BengkelProLauncherWindow]::ShowWindow($form.Handle, 5)
    [void][BengkelProLauncherWindow]::ShowWindow($form.Handle, 5)
    $form.Activate()
})
# Fit the initial window to the current display; smaller displays can scroll.
$workingArea = [System.Windows.Forms.Screen]::FromControl($form).WorkingArea
$form.Size = New-Object System.Drawing.Size([Math]::Min(850, $workingArea.Width), [Math]::Min(970, $workingArea.Height))
[void]$form.ShowDialog()
