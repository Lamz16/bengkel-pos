export type ServiceStatus = 'Pending' | 'In Progress' | 'Ready' | 'Done';
// Hak Akses Sistem: Superadmin/Owner dan Admin/PIC
export type UserRole = 'Owner' | 'Admin';

export interface CompanySettings {
  // Fitur Profil Bengkel
  name: string;
  slogan: string;
  address: string;
  phone: string;
  email?: string;
  operationalHours?: string;
  ownerName?: string;
  picName?: string;

  // Atur Persentase Bonus & Penalti Mekanik
  defaultMechanicBonusPercent: number; // e.g. 15% dari jasa pengerjaan
  defaultAbsencePenalty: number; // denda mangkir H+1, e.g. 50000
  defaultWarrantyPenalty: number; // denda komplain garansi, e.g. 75000
  allowCustomBonusPerTransaction: boolean; // izinkan PIC ubah % bonus per transaksi

  // Pengaturan Isi Nota / Struk
  receiptHeader?: string;
  footerNote: string;
  warrantyTerms: string; // e.g. "Garansi servis 7 hari / 500 km..."
  showMechanicOnReceipt: boolean;
  showWarrantyOnReceipt: boolean;
  showOdometerOnReceipt: boolean;
  showCustomerPhoneOnReceipt: boolean;
  receiptContactHelp?: string;

  // Program Loyalitas & Promo Pelanggan Setia
  loyaltySilverVisits?: number; // e.g. 3
  loyaltyGoldVisits?: number; // e.g. 6
  loyaltyVipVisits?: number; // e.g. 10
  loyaltySilverDiscountPercent?: number; // e.g. 5%
  loyaltyGoldDiscountPercent?: number; // e.g. 10%
  loyaltyVipDiscountPercent?: number; // e.g. 15%
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  password?: string;
  workshopName: string;
  createdAt: string;
}

export interface Mechanic {
  id: string;
  name: string;
  phone: string;
  specialty: string;
  status: 'Active' | 'Inactive';
  defaultBonusPercent: number; // e.g. 15% dari jasa pengerjaan
  dailySalary: number; // gaji pokok harian e.g. 100000
  warrantyPenaltyAmount: number; // denda klaim garansi servis ulang e.g. 50000
  absencePenaltyAmount: number; // denda tidak masuk hari berikutnya e.g. 50000
  joinedAt: string;
}

export interface MechanicDeduction {
  id: string;
  mechanicId: string;
  mechanicName: string;
  serviceId?: string;
  vehiclePlate?: string;
  date: string;
  reason: string;
  type: 'Warranty_Complaint' | 'Absence' | 'Penalty';
  amount: number;
  isAbsentNextDay?: boolean;
}

export interface MechanicAttendance {
  id: string;
  mechanicId: string;
  date: string; // YYYY-MM-DD
  status: 'Present' | 'Absent' | 'Sick' | 'Leave';
  notes?: string;
}

export type CustomerTier = 'New' | 'Bronze' | 'Silver' | 'Gold' | 'VIP';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  totalServiceCount: number;
  totalSpent?: number;
  lastVisitDate?: string;
  loyaltyTier?: CustomerTier;
  notes?: string;
}

export interface Vehicle {
  id: string;
  customerId: string;
  plateNumber: string;
  model: string;
  brand: string;
}

export interface SparePart {
  id: string;
  sku?: string;            // Nomor Barang / Kode Part (e.g. "OLI-001", "REM-002")
  barcode?: string;        // Barcode / No. Seri (opsional)
  name: string;
  category: string;
  price: number;
  purchasePrice: number;
  stock: number;
  minStock: number;
  lastUpdated: string;
  supplierId?: string;

  // Letak Barang di Rak & Gudang
  rackCode?: string;       // Kode Rak (e.g. "Rak A", "Rak B", "Etalase 1")
  shelfLevel?: string;     // Tingkat/Ambalan (e.g. "Tingkat 1", "Tingkat 2", "Atas", "Bawah")
  binNumber?: string;      // Kotak/Slot/Bin (e.g. "Kotak 01", "Slot A", "Bin 12")
  rackLocation?: string;   // Ringkasan label lokasi (e.g. "Rak A - Tingkat 2 - Kotak 04")
  rackZone?: string;       // Area/Gudang (e.g. "Gudang Utama", "Toko Depan", "Gudang B")
  locationNotes?: string;  // Petunjuk posisi (e.g. "Dekat pintu kiri, susunan paling depan")
}

export interface WorkshopService {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  vehicleId: string;
  vehiclePlate: string;
  vehicleModel: string;
  kilometers: number;
  serviceType: string;
  complaint: string;
  diagnosis?: string;
  status: ServiceStatus;
  createdAt: string;
  partsUsed: Array<{ 
    partId: string; 
    name: string; 
    quantity: number; 
    priceAtTime: number 
  }>;
  laborFee: number;
  totalAmount: number;
  paymentStatus: 'Unpaid' | 'Paid';
  // Customer loyalty discount & promo tracking
  discountAmount?: number;
  discountReason?: string;
  // Mechanic assignment & bonus tracking
  mechanicId?: string;
  mechanicName?: string;
  mechanicBonusPercent?: number;
  mechanicBonusAmount?: number;
  // Warranty / repeat service complaint tracking
  hasWarrantyClaim?: boolean;
  warrantyClaimDate?: string;
  warrantyClaimReason?: string;
  isMechanicAbsentOnClaim?: boolean;
  warrantyDeductionAmount?: number;
}

export interface StockHistory {
  id: string;
  partId: string;
  partName: string;
  amount: number;
  type: 'In' | 'Out';
  reason: string;
  date: string;
}

export interface Expense {
  id: string;
  category: string;
  amount: number;
  note: string;
  date: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  address: string;
}

export interface PurchaseRecord {
  id: string;
  partId: string;
  supplierId: string;
  quantity: number;
  costPrice: number;
  date: string;
}
