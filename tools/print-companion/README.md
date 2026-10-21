# Pendamping deteksi printer Windows

Cara sehari-hari (tanpa command):

1. Klik dua kali **BengkelPro Launcher.cmd** di folder proyek.
2. Klik **Start Production**, lalu **Buka Aplikasi**. Pendamping otomatis dimulai di latar belakang untuk origin `http://localhost:3000`.
3. Biarkan launcher terbuka selama deteksi. Di nota, buka **Pengaturan lanjutan cetak B/W > Deteksi ulang**, pilih printer, **Cetak uji**, lalu **Simpan profil**.

Launcher menyediakan **Mulai pendamping**, **Hentikan pendamping**, status proses, dan **Buka log**. Menutup launcher menghentikan hanya proses pendamping yang dimulai oleh launcher tersebut; server aplikasi tetap mengikuti terminalnya. Profil tersimpan tidak hilang. Checkbox otomatis bisa dimatikan untuk sesi launcher saat ini. Jika port dipakai proses lain, launcher tidak menggandakan atau menghentikan proses tersebut. Kegagalan pendamping tidak menghalangi membuka aplikasi. Status proses berjalan belum membuktikan koneksi browser; gunakan Deteksi ulang di nota.

Log disimpan di `%LOCALAPPDATA%\BengkelPro\PrintCompanion`. Jika gagal, klik **Buka log** untuk melihat pesan Windows tanpa mengetik command.

Untuk administrator yang memakai origin aplikasi berbeda, alternatif manual Windows PowerShell 5.1:

```powershell
powershell.exe -NoProfile -File .\tools\print-companion\BengkelProPrintCompanion.ps1 -AllowedOrigins 'http://localhost:3000'
```

Ganti origin dengan origin aplikasi yang persis (skema, host, port; tanpa slash akhir). Jangan gunakan wildcard. Pendamping hanya bind `127.0.0.1:17843`, memeriksa Host dan Origin sebelum enumerasi, dan hanya menyediakan GET `/printers`. Tidak ada endpoint mengirim pekerjaan cetak. Jangan membuat port forwarding atau firewall publik. Jika Windows menolak izin HttpListener, administrator dapat memberi URL ACL khusus akun kasir untuk URL loopback tersebut; jangan memperluas prefix ke `+` atau `*`.

API Windows melalui System.Drawing.Printing membaca InstalledPrinters, PaperSizes, dan DefaultPageSettings.PrintableArea; Win32_Printer membaca DriverName. Area tersedia mengikuti kertas default driver, bukan semua kombinasi form. Atur default driver ke roll yang digunakan, lalu Deteksi ulang. Printer yang tidak bisa dibaca dilewati, sehingga konfigurasi manual tetap tersedia. Browser mungkin meminta izin akses jaringan lokal atau memblokir akses dari HTTPS; izinkan hanya untuk origin tepercaya atau gunakan fallback browser.

Di nota, buka Pengaturan lanjutan cetak B/W, Deteksi ulang, pilih hasil, Cetak uji, koreksi mm/skala, kemudian Simpan profil. Perubahan profil tersimpan hanya dilakukan oleh pengguna. Browser tetap menentukan printer akhir: pilih printer yang cocok dan skala 100%. PDF/browser memiliki mode eksplisit yang mengabaikan semua koreksi printer dan mempertahankan PDF B/W bawaan. Download PDF/WhatsApp berwarna tidak berubah. Kembali ke pengaturan bawaan menonaktifkan profil tanpa menghapusnya.

Profil versi 1 disimpan di localStorage browser per origin/perangkat dengan identitas printer dan snapshot driver. Mode PDF tidak memakai profil printer. Versi tak dikenal, data rusak, dan kegagalan storage kembali ke bawaan. Deteksi hanya atas permintaan, timeout web 2,5 detik; tidak ada deteksi sebelum transaksi atau tiap pencetakan. Printer berubah baru diketahui ketika Deteksi ulang dijalankan. Profil tidak sinkron antar browser.

Verifikasi fisik wajib pada printer target: batas kiri/kanan, garis ukur 20 mm, nama panjang, nota panjang, font, skala browser, dan pemotongan roll. Membuka/menutup dialog tidak membuktikan pekerjaan tercetak. Tidak ada perubahan transaksi dari jalur cetak.
