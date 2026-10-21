# Launcher BengkelPro

Buka `BengkelPro Launcher.vbs` dari folder proyek untuk menjalankan launcher tanpa jendela terminal. Shortcut desktop dapat diarahkan ke file tersebut. File `.cmd` lama juga meneruskan ke launcher yang sama, tetapi Windows mungkin menampilkan CMD sebentar saat file `.cmd` dibuka.

Update Git, Generate Prisma, Migration, dan Build berjalan di latar belakang. Hanya satu proses pemeliharaan dapat berjalan pada satu waktu. Panel log menampilkan output/error dan hasil akhir beserta kode kegagalan. Status menampilkan durasi proses; tidak ada persentase buatan. Proses yang meminta input terminal tidak didukung; pastikan akses Git sudah dikonfigurasi sebelum digunakan klien.

Log output dan error setiap proses tersimpan terpisah di `%LOCALAPPDATA%\BengkelPro\Launcher`. Tombol **Buka folder log launcher** membuka lokasinya. Log tetap tersedia setelah launcher ditutup dan dapat dihapus manual jika tidak diperlukan lagi. Panel membatasi teks yang ditampilkan agar tetap ringan, sedangkan file menyimpan output lengkap.

Setelah Build berhasil, klik **Start Production**, tunggu pesan server pada panel log, lalu **Buka Aplikasi**. Server menjalankan `node dist/server.cjs`, sama dengan perintah `npm start` saat ini. **Stop Server** dan **Restart Server** hanya mengelola proses server yang dimulai oleh launcher ini. Proses luar yang memakai port 3000 harus dihentikan dari tempat asalnya.

Biarkan launcher terbuka selama aplikasi digunakan. Menutup launcher meminta konfirmasi untuk menghentikan server. Penutupan ditolak selama pemeliharaan berlangsung agar migration/build tidak terputus. Stop/Restart menghentikan proses server; lakukan saat tidak ada transaksi aktif.

Verifikasi tanpa menjalankan aplikasi atau migration:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File tools/Launcher.tests.ps1
powershell.exe -NoProfile -ExecutionPolicy Bypass -File tools/print-companion/Launcher.tests.ps1
```
