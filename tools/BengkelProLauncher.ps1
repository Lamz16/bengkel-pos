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
$form.Size = New-Object System.Drawing.Size(560, 520)
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
$description.Text = 'Jalankan, perbarui, migrasikan, dan deploy aplikasi lokal.'
$description.AutoSize = $true
$description.Location = New-Object System.Drawing.Point(31, 61)
$form.Controls.Add($description)

$status = New-Object System.Windows.Forms.Label
$status.Text = 'Status: siap dijalankan'
$status.AutoSize = $true
$status.ForeColor = [System.Drawing.Color]::FromArgb(71, 85, 105)
$status.Location = New-Object System.Drawing.Point(31, 95)
$form.Controls.Add($status)

$start = New-Object System.Windows.Forms.Button
$start.Text = 'Jalankan Development'
$start.Size = New-Object System.Drawing.Size(190, 44)
$start.Location = New-Object System.Drawing.Point(30, 130)
$start.BackColor = [System.Drawing.Color]::FromArgb(37, 99, 235)
$start.ForeColor = [System.Drawing.Color]::White
$start.FlatStyle = 'Flat'
$start.FlatAppearance.BorderSize = 0
$start.Add_Click({
    if (-not (Get-Command npm.cmd -ErrorAction SilentlyContinue)) {
        [System.Windows.Forms.MessageBox]::Show('npm tidak ditemukan. Instal Node.js LTS terlebih dahulu.', 'BengkelPro Launcher', 'OK', 'Error')
        return
    }

    $busyPorts = Get-BusyPorts @(3000, 24678)
    if ($busyPorts.Count -gt 0) {
        $ports = $busyPorts -join ', '
        $status.Text = "Status: server development sudah aktif (port $ports sedang digunakan)."
        $status.ForeColor = [System.Drawing.Color]::FromArgb(217, 119, 6)
        [System.Windows.Forms.MessageBox]::Show("Server sudah berjalan pada port $ports. Gunakan tombol Buka Aplikasi atau tutup terminal server lama sebelum menjalankan ulang.", 'BengkelPro Launcher', 'OK', 'Information')
        return
    }

    Start-TaskTerminal 'BengkelPro Development' 'npm run dev'
    $status.Text = 'Status: terminal development sudah dibuka. Tunggu hingga server siap.'
    $status.ForeColor = [System.Drawing.Color]::FromArgb(5, 150, 105)
})
$form.Controls.Add($start)

$openApp = New-Object System.Windows.Forms.Button
$openApp.Text = 'Buka Aplikasi'
$openApp.Size = New-Object System.Drawing.Size(160, 44)
$openApp.Location = New-Object System.Drawing.Point(240, 130)
$openApp.FlatStyle = 'Flat'
$openApp.FlatAppearance.BorderColor = [System.Drawing.Color]::FromArgb(203, 213, 225)
$openApp.Add_Click({ Start-Process 'http://localhost:3000' })
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
$deploy.Text = 'Build & Jalankan Production'
$deploy.Size = New-Object System.Drawing.Size(315, 44)
$deploy.Location = New-Object System.Drawing.Point(30, 290)
$deploy.BackColor = [System.Drawing.Color]::FromArgb(5, 150, 105)
$deploy.ForeColor = [System.Drawing.Color]::White
$deploy.FlatStyle = 'Flat'
$deploy.FlatAppearance.BorderSize = 0
$deploy.Add_Click({
    $busyPorts = Get-BusyPorts @(3000)
    if ($busyPorts.Count -gt 0) {
        [System.Windows.Forms.MessageBox]::Show('Port 3000 masih dipakai. Tutup server development/production lama terlebih dahulu, lalu deploy ulang.', 'BengkelPro Launcher', 'OK', 'Warning')
        return
    }
    $answer = [System.Windows.Forms.MessageBox]::Show('Build aplikasi lalu jalankan server production lokal pada port 3000?', 'Konfirmasi Deploy Lokal', 'YesNo', 'Question')
    if ($answer -ne 'Yes') { return }
    Start-TaskTerminal 'BengkelPro Production' 'npm run build && npm start'
    $status.Text = 'Status: build dan server production berjalan di terminal.'
    $status.ForeColor = [System.Drawing.Color]::FromArgb(5, 150, 105)
})
$form.Controls.Add($deploy)

$deployInfo = New-Object System.Windows.Forms.Label
$deployInfo.Text = 'Urutan update: Update Git -> Generate Prisma -> Terapkan Migration -> Build dan Jalankan Production.'
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

[void]$form.ShowDialog()
