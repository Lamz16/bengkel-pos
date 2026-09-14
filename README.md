# 🛠️ WorkshopPro POS & Bengkel Management System

Sistem Informasi Manajemen Bengkel Motor & Kasir POS (Point of Sale) berbasis Web modern. Dirancang khusus untuk mempermudah operasional bengkel, manajemen antrean servis, stok suku cadang & penataan rak gudang, gaji & komisi mekanik, sistem loyalitas pelanggan, hingga laporan keuangan komprehensif.

---

## 🌟 Fitur Utama

- **🏎️ Kasir POS & Transaksi Servis**: Pembuatan nota resmi, perhitungan biaya jasa & suku cadang, otomatisasi potongan diskon tier pelanggan (Silver/Gold/VIP), dan cetak struk resmi.
- **📋 Antrean & Pelacakan Servis**: Pelacakan status pengerjaan secara real-time (*Pending*, *In Progress*, *Ready*, *Done*), nomor antrean otomatis, dan klaim garansi servis.
- **📦 Stok Suku Cadang & Gudang**: Manajemen SKU unik, barcode, titik stok minimum (alarm stok menipis), lokasi rak detail (*Zone*, *Bin*, *Shelf*), serta riwayat keluar-masuk barang.
- **👨‍🔧 Komisi & Penggajian Mekanik**: Perhitungan bonus komisi dari setiap pengerjaan servis, potongan absen/denda garansi, serta rekap harian gaji mekanik.
- **👥 Pelanggan & Program Loyalitas**: Pencatatan riwayat servis per kendaraan/plat nomor, otomatisasi tier loyalitas (*Bronze*, *Silver*, *Gold*, *VIP*), dan promo otomatis via CS WhatsApp.
- **📊 Laporan Keuangan & Pengeluaran**: Rekapitulasi omset harian/bulanan, biaya operasional, estimasi laba bersih, serta grafik statistik visual.
- **🤖 Diagnosa Cerdas AI (Gemini)**: Fitur rekomendasi suku cadang & estimasi penanganan berbasis AI dari keluhan pelanggan.

---

## 🏗️ Arsitektur & Teknologi

- **Frontend**: [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Tailwind CSS v4](https://tailwindcss.com/), [Lucide Icons](https://lucide.dev/), [Motion](https://motion.dev/)
- **Backend**: [Express.js](https://expressjs.com/) (Node.js REST API) dengan arsitektur **SOLID** (*Controller - Service - Repository Pattern*)
- **Database & ORM**: [PostgreSQL](https://www.postgresql.org/) dengan [Prisma ORM](https://www.prisma.io/)
- **AI Integration**: [Google Gemini API](https://aistudio.google.com/) (`@google/genai`)
- **Fallback Engine**: In-Memory Store otomatis jika PostgreSQL lokal belum dihubungkan.

---

## 📋 Prasyarat Sistem

Sebelum memulai, pastikan perangkat Anda telah terpasang:

1. **Node.js**: Versi `18.x` atau yang lebih baru (direkomendasikan versi `20+`). Check dengan `node -v`.
2. **npm** (atau `yarn` / `pnpm` / `bun`). Check dengan `npm -v`.
3. **PostgreSQL**: Versi `14+` berjalan di lokal atau melalui Docker.

---

## 🚀 Langkah-Langkah Setup & Menjalankan Proyek di Lokal

### 1. Clone Repositori & Masuk ke Direktori

```bash
git clone <URL_REPOSITORI_ANDA>
cd bengkelpro-pos
```

---

### 2. Instalasi Dependensi Node.js

Jalankan perintah berikut untuk mengunduh semua pustaka yang dibutuhkan:

```bash
npm install
```

---

### 3. Konfigurasi Environment (`.env`)

Buat file `.env` di root direktori proyek dengan menyalin dari `.env.example`:

**Di Linux / macOS:**
```bash
cp .env.example .env
```

**Di Windows (Command Prompt):**
```cmd
copy .env.example .env
```

Buka file `.env` dan sesuaikan nilainya:

```env
# Database Connection URL untuk PostgreSQL lokal
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/bengkelpro?schema=public"

# Port Server Express Backend (default: 3000)
PORT=3000

# Google Gemini API Key (Opsional - untuk diagnosa AI)
GEMINI_API_KEY="your_google_gemini_api_key_here"
```

> **Catatan:** Sesuaikan `postgres:postgres` dengan *username* & *password* PostgreSQL lokal Anda.

---

### 4. Menyiapkan Database PostgreSQL di Lokal

Ada 2 cara umum untuk menyiapkan database PostgreSQL di lokal:

#### Cara A: Menggunakan Docker (Direkomendasikan & Paling Cepat)
Jika Anda memiliki Docker Desktop, jalankan perintah berikut:

```bash
docker run --name postgres-bengkel \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=bengkelpro \
  -p 5432:5432 \
  -d postgres:16-alpine
```

#### Cara B: Menggunakan PostgreSQL Lokal (pgAdmin / SQL Shell)
1. Buka PostgreSQL / pgAdmin / psql CLI.
2. Buat database baru bernama `bengkelpro`:
   ```sql
   CREATE DATABASE bengkelpro;
   ```

---

### 5. Migrasi Schema & Seeding Data ke PostgreSQL

Setelah PostgreSQL berjalan dan file `.env` siap, jalankan urutan perintah Prisma berikut:

1. **Generate Prisma Client:**
   ```bash
   npm run db:generate
   ```

2. **Database baru/kosong — push schema untuk membuat seluruh tabel:**
   ```bash
   npm run db:push
   ```

   **Database lama yang sudah berisi barang — jalankan migration normalisasi:**
   ```bash
   npm run db:migrate
   ```
   Migration akan memindahkan nilai kategori, gudang, dan rak lama ke tabel master serta foreign key tanpa menghapus data barang.

3. **Seeding Data Awal (Memasukkan data sampel awal):**
   ```bash
   npm run db:seed
   ```

> 🎉 Data awal seperti informasi bengkel, akun pengguna default, sampel mekanik, daftar suku cadang, dan riwayat pelanggan sekarang telah siap di database PostgreSQL lokal Anda!

---

### 6. Menjalankan Aplikasi

Jalankan perintah pengembangan untuk memulai server Express & Vite:

```bash
npm run dev
```

Aplikasi akan berjalan di port `3000`. Buka browser Anda dan akses:
👉 **[http://localhost:3000](http://localhost:3000)**

---

## 🔑 Akun Login Default (Dari Seed Database)

Anda dapat masuk ke aplikasi menggunakan akun bawaan berikut:

| Peran (Role) | Email | Akses Hak |
| :--- | :--- | :--- |
| **👑 Superadmin / Owner** | `owner@bengkelpro.com` | Akses penuh (POS, Antrean, Stok, Mekanik, Pemasok, Laporan Keuangan, Pengaturan Bengkel) |
| **🛠️ Admin / PIC** | `admin@bengkelpro.com` | Operasional harian (POS Kasir, Antrean Servis, Stok Suku Cadang, Pelanggan, Mekanik) |

*Password dapat diisi bebas saat mode demo/development.*

---

## 🛠️ Daftar NPM Scripts

Berikut daftar perintah npm yang dapat digunakan dalam proyek ini:

| Perintah | Keterangan |
| :--- | :--- |
| `npm run dev` | Menjalankan server pengembangan (*full-stack* Express + Vite) di `localhost:3000` |
| `npm run build` | Melakukan *generate* Prisma Client & *bundling* aplikasi untuk produksi (`dist/`) |
| `npm run start` | Menjalankan server produksi terkompilasi (`dist/server.cjs`) |
| `npm run db:generate` | Menghasilkan kode Prisma Client berdasarkan `prisma/schema.prisma` |
| `npm run db:push` | Menyinkronkan struktur schema Prisma ke PostgreSQL tanpa file migrasi |
| `npm run db:migrate` | Menerapkan migration produksi, termasuk normalisasi master kategori/rak/gudang |
| `npm run db:seed` | Menjalankan file `prisma/seed.ts` untuk mengisi data sampel awal |
| `npm run lint` | Memeriksa validasi tipe data TypeScript (`tsc --noEmit`) |

---

## 📂 Struktur Folder Proyek

```
.
├── prisma/
│   ├── schema.prisma          # Definisi skema database PostgreSQL (Prisma)
│   └── seed.ts                # Data awal (seeding) pengguna, mekanik, & suku cadang
├── src/
│   ├── components/            # Komponen tampilan UI React
│   │   ├── forms/             # Modal & form terisolasi (Staff, Part, Supplier, Dll)
│   │   ├── AuthView.tsx       # Tampilan Login & Register
│   │   ├── DashboardView.tsx  # Dashboard analitik & ringkasan
│   │   ├── POSForm.tsx        # Form transaksi kasir POS
│   │   ├── InventoryView.tsx  # Manajemen stok & lokasi rak
│   │   ├── MechanicsView.tsx  # Penggajian & komisi mekanik
│   │   ├── ReportsView.tsx    # Laporan laba rugi & pengeluaran
│   │   └── SettingsView.tsx   # Pengaturan profil bengkel & nota
│   ├── lib/                   # Utility helper (Tailwind cn, formatters)
│   ├── server/                # Arsitektur Backend SOLID
│   │   ├── controllers/       # HTTP Request Handlers (Express Controllers)
│   │   ├── db/                # Prisma client singleton & In-Memory fallback store
│   │   ├── repositories/      # Layer Akses Data (Repository Pattern)
│   │   ├── routes/            # Rute API RESTful Express (/api/*)
│   │   └── services/          # Layer Logika Bisnis & Aturan Bengkel (Service Layer)
│   ├── services/              # Client-side API fetchers (axios/fetch abstractions)
│   ├── types.ts               # Definisi tipe data global TypeScript
│   ├── AppLayout.tsx          # Komponen layout utama & manajemen tab
│   ├── main.tsx               # Entry point React Frontend
│   └── server.ts              # Entry point Server Express Backend
├── .env.example               # Template variabel environment
├── metadata.json              # Informasi metadata aplikasi
├── package.json               # Manifest dependensi & script npm
├── vite.config.ts             # Konfigurasi bundler Vite
└── README.md                  # Dokumentasi panduan proyek ini
```

---

## ❓ Troubleshooting & FAQs

### 1. Database tidak terhubung / Error `PrismaClientInitializationError`
- Pastikan service PostgreSQL Anda sudah berjalan (cek dengan `pg_isready` atau di Docker Desktop).
- Periksa kembali string `DATABASE_URL` di file `.env`, pastikan username, password, host, port (`5432`), dan nama database (`bengkelpro`) sudah sesuai.
- Apabila PostgreSQL mati, aplikasi memiliki fitur **In-Memory Fallback** bawaan sehingga tampilan UI tetap dapat berjalan dan digunakan.

### 2. Menambah / Mengubah Struktur Tabel
- Edit file `prisma/schema.prisma`.
- Jalankan `npm run db:push` untuk menerapkan perubahan pada PostgreSQL lokal Anda.
- Jalankan `npm run db:generate` untuk memperbarui tipe data Prisma Client.

---

## 📄 Lisensi

Proyek ini dibuat untuk manajemen internal bengkel dan dapat dikembangkan sesuai kebutuhan operasional bengkel Anda.
