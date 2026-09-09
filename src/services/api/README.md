# WorkshopPro REST API Integration Module

Direktori `/src/services/api` ini adalah modul khusus terpusat untuk menghubungkan aplikasi WorkshopPro ke REST API backend kustom yang telah Anda buat.

---

## 📁 Struktur Modul

```text
src/services/api/
├── config.ts              # Pengaturan Base URL, timeout, token JWT (Bearer), dan headers
├── endpoints.ts           # Registry daftar endpoint terpusat (URL paths & dynamic routes)
├── httpClient.ts          # HTTP client berbasis fetch (GET, POST, PUT, PATCH, DELETE, ApiError)
├── types.ts               # Tipe data ApiResponse<T>, ApiPaginatedResponse<T>, dll.
├── healthService.ts       # Fitur tes koneksi & ping server (latensi, status HTTP, cek CORS)
├── serviceOrderService.ts # Endpoint Transaksi Servis / SPK (CRUD, status, klaim garansi)
├── inventoryService.ts    # Endpoint Suku Cadang / Stok (CRUD, tambah stok, alert stok menipis)
├── mechanicService.ts     # Endpoint Mekanik (CRUD, komisi, sanksi/potongan, rekap payroll)
├── customerService.ts     # Endpoint Pelanggan & Kendaraan terdaftar
├── supplierService.ts     # Endpoint Pemasok & Riwayat Pembelian Barang
├── expenseService.ts      # Endpoint Biaya Pengeluaran Operasional
├── reportService.ts       # Endpoint Laporan Keuangan & Kinerja Bengkel
├── settingsService.ts     # Endpoint Profil Bengkel & Template Nota
└── index.ts               # Barrel export untuk import mudah dari mana saja
```

---

## ⚙️ 1. Konfigurasi Base URL

Anda dapat mengatur Base URL REST API melalui file `.env`:

```env
VITE_API_BASE_URL=http://localhost:8000/api
# Atau server production Anda:
# VITE_API_BASE_URL=https://api.bengkelanda.com/v1
```

Secara default, jika variabel lingkungan tidak diset, sistem akan mengarah ke `http://localhost:8000/api`.

Anda juga dapat mengatur atau mengubah Base URL secara dinamis saat runtime:
```ts
import { setApiBaseUrl, getApiBaseUrl } from '@/services/api';

setApiBaseUrl('https://api.bengkelanda.com/v1');
console.log(getApiBaseUrl());
```

---

## 🔐 2. Autentikasi & Token (Bearer Token)

Token disimpan secara aman di `localStorage` dan otomatis disisipkan ke header `Authorization: Bearer <token>` pada setiap request.

```ts
import { authApi, setAuthToken, removeAuthToken } from '@/services/api';

// 1. Login
const res = await authApi.login({
  email: 'admin@bengkel.com',
  password: 'password123'
});
// Token otomatis tersimpan, namun dapat juga diatur manual:
// setAuthToken(res.token);

// 2. Logout (otomatis menghapus token dari local storage)
await authApi.logout();
```

---

## 🚀 3. Contoh Penggunaan di Komponen React

### A. Mengambil Daftar Antrean Servis (SPK)
```ts
import { serviceOrderApi } from '@/services/api';

// Ambil semua servis yang sedang dalam antrean
const activeServices = await serviceOrderApi.getAll({ status: 'In Progress' });
```

### B. Membuat Transaksi POS Baru
```ts
import { serviceOrderApi } from '@/services/api';

const newOrder = await serviceOrderApi.create({
  customerId: 'CUST-01',
  customerName: 'Budi Santoso',
  vehiclePlate: 'B 1234 ABC',
  vehicleModel: 'Honda Vario 160',
  kilometers: 12000,
  serviceType: 'Servis Ringan + Ganti Oli',
  laborFee: 50000,
  totalAmount: 145000,
  paymentStatus: 'Paid',
  mechanicId: 'MEC-1',
  partsUsed: [
    { partId: 'P001', name: 'Oli Mesin Matic', quantity: 1, priceAtTime: 95000 }
  ]
});
```

### C. Update Stok Sparepart (Pembelian Masuk)
```ts
import { inventoryApi } from '@/services/api';

await inventoryApi.addStock({
  partId: 'P001',
  quantity: 24,
  supplierId: 'SUP-01',
  costPrice: 75000
});
```

### D. Tambah Potongan Gaji / Denda Garansi Mekanik
```ts
import { mechanicApi } from '@/services/api';

await mechanicApi.addDeduction({
  mechanicId: 'MEC-1',
  mechanicName: 'Rudi Hermawan',
  amount: 75000,
  reason: 'Klaim garansi motor B 1234 ABC CVT bergetar',
  type: 'Warranty_Complaint',
  isAbsentNextDay: false
});
```

### E. Cek Koneksi REST API (Ping Test)
```ts
import { healthApi } from '@/services/api';

const status = await healthApi.checkConnection();
if (status.online) {
  console.log(`Terhubung ke ${status.url}! Latensi: ${status.latencyMs}ms`);
} else {
  console.warn(`Gagal terhubung: ${status.message}`);
}
```

---

## 📦 4. Format Respons yang Didukung

Modul `httpClient` mendukung dua format respons umum dari backend Anda:

1. **Format Langsung (Raw JSON / Array)**:
   ```json
   [ { "id": "1", "name": "..." } ]
   ```
2. **Format Standard API Wrapper**:
   ```json
   {
     "success": true,
     "data": [ { "id": "1", "name": "..." } ],
     "message": "Data retrieved successfully"
   }
   ```
Keduanya otomatis di-unwrap sehingga kode komponen Anda menerima array/objek data yang bersih.

---

## 🛡️ 5. Catatan CORS (Cross-Origin Resource Sharing)

Jika backend Anda berjalan di domain atau port yang berbeda (misal backend di port 8000 dan frontend di port 3000), pastikan backend Anda menyertakan header CORS:
- `Access-Control-Allow-Origin: *` (atau origin frontend Anda)
- `Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type, Authorization`
