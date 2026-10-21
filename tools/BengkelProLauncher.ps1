Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$projectRoot = Split-Path -Parent $PSScriptRoot

function Start-TaskTerminal([string]$title, [string]$command) {
    Start-Process -FilePath 'cmd.exe' -ArgumentList @('/k', "title $title && $command") -WorkingDirectory $projectRoot
}

function Get-BusyPorts([int[]]$ports) {
    return @(Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue |
        Where-Object { $_.LocalPort -in $ports } |
        Select-Object -ExpandProperty LocalPort -Unique)
}

$form = New-Object System.Windows.Forms.Form
$form.Text = 'BengkelPro Launcher'
$form.Size = New-Object System.Drawing.Size(560, 710)
$form.StartPosition = 'CenterScreen'
$form.FormBorderStyle = 'FixedDialog'
$form.MaximizeBox = $false
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
    $status.Text = 'Status: terminal update Git sudah dibuka.'
    $status.ForeColor = [System.Drawing.Color]::FromArgb(5, 150, 105)
})
$form.Controls.Add($update)

$generate = New-Object System.Windows.Forms.Button
$generate.Text = 'Generate Prisma'
$generate.Size = New-Object System.Drawing.Size(150, 40)
$generate.Location = New-Object System.Drawing.Point(195, 230)
$generate.Add_Click({
    Start-TaskTerminal 'BengkelPro Prisma Generate' 'npm run db:generate'
    $status.Text = 'Status: generate Prisma berjalan di terminal.'
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
    $status.Text = 'Status: migration database berjalan di terminal.'
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
        [System.Windows.Forms.MessageBox]::Show('Port 3000 masih dipakai. Tutup server development/production lama terlebih dahulu, lalu build ulang.', 'BengkelPro Launcher', 'OK', 'Warning')
        return
    }
    Start-TaskTerminal 'BengkelPro Build' 'npm run build'
    $status.Text = 'Status: build berjalan di terminal. Setelah berhasil, klik Start.'
    $status.ForeColor = [System.Drawing.Color]::FromArgb(5, 150, 105)
})
$form.Controls.Add($deploy)

$start = New-Object System.Windows.Forms.Button
$start.Text = 'Start Production'
$start.Size = New-Object System.Drawing.Size(235, 44)
$start.Location = New-Object System.Drawing.Point(275, 290)
$start.Add_Click({
    $busyPorts = Get-BusyPorts @(3000)
    if ($busyPorts.Count -gt 0) {
        if ($autoCompanion.Checked) { Start-PrintCompanion }
        [System.Windows.Forms.MessageBox]::Show('Port 3000 masih dipakai. Jika aplikasi sudah berjalan, klik Buka Aplikasi. Untuk menjalankan ulang, tutup terminal server lama terlebih dahulu.', 'BengkelPro Launcher', 'OK', 'Warning')
        return
    }
    if (-not (Test-Path -LiteralPath (Join-Path $projectRoot 'dist/server.cjs') -PathType Leaf) -or
        -not (Test-Path -LiteralPath (Join-Path $projectRoot 'dist/index.html') -PathType Leaf)) {
        [System.Windows.Forms.MessageBox]::Show('Hasil build belum tersedia. Klik Build Aplikasi dan tunggu hingga berhasil, lalu klik Start Production.', 'BengkelPro Launcher', 'OK', 'Warning')
        return
    }
    if ($autoCompanion.Checked) { Start-PrintCompanion }
    Start-TaskTerminal 'BengkelPro Production' 'npm start'
    $status.Text = 'Status: terminal server production sudah dibuka.'
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
$hint.Text = "Terminal menampilkan log server. Tutup terminal tersebut untuk menghentikan aplikasi.`r`nSetelah server siap, buka http://localhost:3000 atau gunakan tombol Buka Aplikasi."
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
$form.Add_FormClosed({ $printerTimer.Stop(); Stop-PrintCompanion; $printerTimer.Dispose() })
[void]$form.ShowDialog()
