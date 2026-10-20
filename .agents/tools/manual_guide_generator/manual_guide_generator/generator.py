from __future__ import annotations
import csv, html, re
from collections import defaultdict
from pathlib import Path

def load_rows(output: Path) -> list[dict[str,str]]:
    path=output / "feature-coverage-matrix.csv"
    if not path.exists(): raise FileNotFoundError("Jalankan discover terlebih dahulu.")
    with path.open(encoding="utf-8", newline="") as fh: return list(csv.DictReader(fh))

GUIDES={
 "AUTH-01":("Masuklah menggunakan akun Anda dan keluar saat pekerjaan selesai.",["Masukkan email dan kata sandi.","Pilih **Masuk**.","Gunakan tombol **Keluar** sebelum meninggalkan komputer."]),
 "POS-01":("Gunakan Transaksi untuk servis motor maupun penjualan sparepart.",["Pilih pelanggan dan kendaraan.","Tambahkan jasa dan/atau sparepart.","Periksa total, catat pembayaran, lalu simpan."]),
 "POS-02":("Rincian jasa, barang, dan diskon menentukan total pelanggan.",["Tambahkan jasa yang dikerjakan.","Pilih sparepart dan jumlahnya; periksa stok.","Masukkan diskon yang disetujui lalu periksa total."]),
 "PAY-01":("Catat pembayaran agar kas dan laporan sesuai.",["Pilih metode pembayaran.","Untuk tunai, masukkan uang diterima dan periksa kembalian.","Simpan setelah nominal sudah benar."]),
 "PAY-02":("Gunakan pembayaran parsial jika tagihan belum lunas.",["Masukkan nominal yang diterima.","Isi tanggal jatuh tempo.","Pantau sisa tagihan di Piutang hingga lunas."]),
 "QUEUE-01":("Antrean membantu mengatur motor yang menunggu pengerjaan.",["Tambahkan antrean dengan pelanggan, kendaraan, dan keluhan.","Perbarui status saat motor mulai atau selesai ditangani.","Konversikan antrean menjadi transaksi saat siap dicatat kasir."]),
 "RET-01":("Retur dipakai saat barang transaksi perlu dikembalikan.",["Buka detail transaksi asal.","Pilih barang, jumlah, dan alasan retur.","Simpan dan periksa stok serta nilai transaksi."]),
 "CUS-01":("Simpan pelanggan dan kendaraan agar transaksi berikutnya cepat.",["Tambah nama dan kontak pelanggan.","Tambahkan data kendaraan.","Pilih data tersebut saat membuat antrean atau transaksi."]),
 "INV-01":("Kelola produk sebelum barang dijual.",["Tambah atau ubah produk.","Isi SKU, harga, kategori, dan varian bila digunakan.","Simpan dan pastikan nama barang mudah dikenali kasir."]),
 "INV-02":("Pantau stok minimum agar barang penting segera dipesan.",["Buka stok barang dan lihat indikator stok menipis.","Periksa histori untuk mengetahui stok masuk atau keluar.","Tambahkan stok sebelum barang habis."]),
 "TEMPO-01":("Nota tempo mencatat pembelian yang dibayar bertahap.",["Masukkan pemasok, item, total, dan jatuh tempo.","Simpan dan periksa stok pembelian.","Catat setiap cicilan hingga sisa tagihan nol."]),
 "MECH-02":("Rekap gaji menggabungkan komisi, absensi, dan potongan.",["Pastikan absensi dan potongan sudah dicatat.","Periksa komisi dari transaksi selesai.","Tinjau rekap sebelum membayar gaji."]),
 "WARR-02":("Catat klaim garansi agar riwayat pelanggan tetap jelas.",["Buka transaksi terkait.","Isi alasan dan periksa ketentuan garansi.","Terapkan potongan mekanik hanya sesuai kebijakan."]),
 "SET-01":("Atur identitas bengkel sebelum nota pertama dicetak.",["Isi nama dan kontak bengkel.","Atur branding serta template nota.","Cetak percobaan untuk memastikan informasi terbaca."]),
}

def guide_for(row):
    return GUIDES.get(row["feature_id"], (f"Fitur ini membantu mengelola **{row['feature_name'].lower()}**.", [f"Buka menu **{row['entry_point']}**.","Isi atau periksa data yang ditampilkan.","Simpan, lalu periksa hasilnya pada daftar atau laporan terkait."]))

# Labels below are taken from the React views where they exist; alternatives are
# deliberately worded as UI outcomes when a view has no stable text button.
BUTTONS={
 "QUEUE-01":("Antrean Servis","Daftarkan kendaraan","Simpan antrean","kode antrean muncul pada daftar"),
 "POS-01":("Transaksi","transaksi baru","Submit Order atau Complete Sale","transaksi tampil pada riwayat"),
 "POS-02":("form Transaksi","+ Tambah Jasa","Submit Order atau Complete Sale","total akhir berubah sesuai item"),
 "PAY-01":("form Transaksi","Status Pembayaran","Submit Order atau Complete Sale","status pembayaran dan total tersimpan"),
 "PAY-02":("form Transaksi","Status Pembayaran","Submit Order atau Complete Sale","sisa tagihan tampil di Piutang"),
 "TEMPO-01":("Nota Tempo","Tambah Nota Tempo","Simpan Nota Tempo","nota baru muncul dengan sisa tagihan"),
 "INV-02":("Stok Barang","Tambah Stok","Simpan","jumlah stok dan histori bertambah"),
 "INV-03":("Stok Barang","atur lokasi/rak produk","Simpan Letak Rak","lokasi simpan muncul di rincian produk"),
 "CUS-01":("Pelanggan","Tambah Pelanggan","Simpan","pelanggan tampil pada daftar"),
 "MECH-02":("Mekanik & Gaji","pilih tanggal absensi","Simpan atau Perbarui","status absensi tampil pada mekanik"),
 "SET-01":("Pengaturan","isi formulir profil","Simpan Profil","notifikasi pengaturan berhasil disimpan"),
 "RCPT-01":("detail transaksi","buka nota","Cetak atau bagikan sesuai pilihan","pratinjau/nota terbuka"),
}

def detailed_steps(row, base_steps):
    open_at, start, save, check=BUTTONS.get(row["feature_id"], (row["entry_point"], "tombol Tambah atau aksi yang sesuai", "Simpan", "data baru/yang diperbarui tampil pada daftar"))
    return [
        f"Di menu **{open_at}**, klik **{start}**.",
        *base_steps,
        "Periksa kembali isian wajib, nominal, jumlah barang, dan tanggal sebelum melanjutkan.",
        f"Klik **{save}**. Jangan menutup formulir selama proses penyimpanan berjalan.",
        f"Setelah formulir menutup atau muncul notifikasi, pastikan {check}.",
        "Jika ada kesalahan sebelum disimpan, klik **Batal** atau tutup formulir; jangan menyimpan data yang belum benar.",
    ]

def generate(output: Path) -> None:
    rows=load_rows(output); modules=defaultdict(list)
    for row in rows: modules[row["module"]].append(row)
    out=["# Panduan Penggunaan BengkelPro POS","","Selamat datang di BengkelPro POS. Panduan ini membantu tim bengkel bekerja dari menerima motor hingga melihat hasil usaha.","","## Sebelum mulai","- Gunakan akun sesuai tugas Anda; menu dapat berbeda pada setiap role.","- Siapkan data dasar: bengkel, pengguna, mekanik, produk, stok, dan pelanggan.","- Selalu periksa total dan stok sebelum menekan **Simpan**.","","## Alur kerja sehari-hari","1. Terima pelanggan dan motor melalui **Antrean Servis** atau **Transaksi**.","2. Tambahkan jasa, sparepart, diskon, serta mekanik yang menangani.","3. Catat pembayaran dan berikan nota.","4. Setelah pekerjaan selesai, perbarui status transaksi.","5. Akhiri hari dengan mengecek piutang, stok, pengeluaran, dan laporan.","","## Hak akses","- **Owner:** seluruh pengaturan, laporan, pengguna, audit, pemasok, dan penggajian.","- **Admin, Kasir, Staf:** transaksi, antrean servis, dan stok sesuai menu pada akun mereka.","","## Panduan menu"]
    for module, items in modules.items():
        out += [f"\n## {module}"]
        for r in items:
            intro,steps=guide_for(r); steps=detailed_steps(r, steps)
            out += [f"\n### {r['feature_name']}",intro,"","Langkah demi langkah:",*[f"{i}. {s}" for i,s in enumerate(steps,1)],"",f"**Perlu diperhatikan:** {r['business_impact']}.",f"**Akses:** {r['roles']}.",f"\n> 📷 Screenshot yang disarankan: halaman **{r['entry_point']}**.",f"\n<!-- Feature ID audit: [{r['feature_id']}] -->"]
    out += ["","## Skenario yang sering digunakan","### Servis dibayar lunas","Buat transaksi → pilih pelanggan dan kendaraan → tambahkan jasa serta sparepart → pilih pembayaran → simpan → cetak nota → selesaikan setelah pekerjaan selesai.","","### Servis dengan sisa tagihan","Buat transaksi → catat nominal diterima → isi jatuh tempo → simpan → pantau Piutang hingga tagihan lunas.","","### Barang datang dari pemasok","Pastikan produk tersedia → catat pembelian atau nota tempo → masukkan item dan jumlah → periksa stok dan lokasi penyimpanan.","","### Klaim garansi atau retur","Buka transaksi asal → periksa kelayakan → masukkan alasan dan item → simpan → pastikan stok dan nilai transaksi sudah benar.","","## Jika ada yang tidak sesuai","Jangan menghapus transaksi hanya untuk mencoba. Catat nomor transaksi, pesan yang muncul, dan langkah yang dilakukan; lalu hubungi Owner atau administrator.","","---","Dokumen ini dibuat dari source aplikasi dan perlu dilengkapi screenshot dari konfigurasi bengkel Anda. Rincian audit teknis tersedia pada `business-flow-catalog.md`."]
    markdown="\n".join(out)+"\n"; (output/"manual-guide-draft.md").write_text(markdown,encoding="utf-8")
    page=[]
    for line in markdown.splitlines():
        t=html.escape(line)
        if line.startswith("# "): page.append(f"<h1>{t[2:]}</h1>")
        elif line.startswith("## "): page.append(f"<h2>{t[3:]}</h2>")
        elif line.startswith("### "): page.append(f"<h3>{t[4:]}</h3>")
        elif line.startswith("- "): page.append(f"<p>• {t[2:]}</p>")
        elif re.match(r"\d+\. ",line): page.append(f"<p class='step'>{t}</p>")
        elif line.startswith("> "): page.append(f"<aside>{t[2:]}</aside>")
        elif line.startswith("<!--"): continue
        elif line: page.append(f"<p>{t}</p>")
    (output/"manual-guide-draft.html").write_text("<!doctype html><html lang='id'><meta charset='utf-8'><title>Panduan BengkelPro POS</title><style>body{max-width:840px;margin:auto;padding:42px 24px;color:#1f2937;font:16px/1.65 Arial,sans-serif}h1{font-size:34px;color:#0f766e}h2{margin-top:42px;padding-bottom:8px;border-bottom:2px solid #ccfbf1;color:#115e59}h3{margin-top:30px;color:#0f172a}.step{padding-left:8px}aside{background:#f0fdfa;border-left:4px solid #14b8a6;padding:12px 16px;border-radius:4px}@media print{body{padding:0}h2{break-before:page}}</style><body>"+"\n".join(page)+"</body></html>",encoding="utf-8")
    with (output/"feature-coverage-matrix.csv").open("w",newline="",encoding="utf-8") as fh:
        writer=csv.DictWriter(fh,fieldnames=list(rows[0])); writer.writeheader()
        for row in rows: row["documented"]="yes"; writer.writerow(row)
