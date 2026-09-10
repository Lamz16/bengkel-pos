import { INITIAL_PARTS } from '../../constants';
import { 
  CompanySettings, 
  SparePart, 
  Customer, 
  Vehicle, 
  WorkshopService, 
  Mechanic, 
  MechanicDeduction, 
  Supplier, 
  PurchaseRecord, 
  Expense,
  User
} from '../../types';

export interface MemoryStore {
  settings: CompanySettings;
  users: User[];
  customers: Customer[];
  vehicles: Vehicle[];
  parts: SparePart[];
  services: WorkshopService[];
  mechanics: Mechanic[];
  deductions: MechanicDeduction[];
  suppliers: Supplier[];
  purchases: PurchaseRecord[];
  expenses: Expense[];
  staff: Array<{ id: string; name: string; role: string; status: string; shifts?: string; email?: string }>;
}

export const memoryStore: MemoryStore = {
  settings: {
    name: "BengkelPro Mandiri",
    slogan: "Solusi Perawatan & Servis Terpercaya",
    address: "Jl. Otomotif Raya No. 123, Blok B4, Jakarta Selatan",
    phone: "0812-3456-7890",
    email: "kontak@bengkelpro.com",
    operationalHours: "Senin - Sabtu: 08:00 - 17:00 WIB",
    ownerName: "Bambang Sutrisno",
    picName: "Rian Herlambang",
    defaultMechanicBonusPercent: 15,
    defaultAbsencePenalty: 50000,
    defaultWarrantyPenalty: 75000,
    allowCustomBonusPerTransaction: true,
    receiptHeader: "NOTA RESMI & RINCIAN SERVIS",
    footerNote: "Barang yang sudah dibeli tidak dapat ditukar kecuali perjanjian. Terima kasih atas kepercayaan Anda merawat kendaraan bersama kami.",
    warrantyTerms: "Garansi servis 7 hari atau 500 KM untuk pengerjaan perbaikan yang sama dengan menunjukkan nota ini.",
    showMechanicOnReceipt: true,
    showWarrantyOnReceipt: true,
    showOdometerOnReceipt: true,
    showCustomerPhoneOnReceipt: true,
    receiptContactHelp: "WhatsApp CS: 0812-3456-7890",
    loyaltySilverVisits: 3,
    loyaltyGoldVisits: 6,
    loyaltyVipVisits: 10,
    loyaltySilverDiscountPercent: 5,
    loyaltyGoldDiscountPercent: 10,
    loyaltyVipDiscountPercent: 15
  },
  users: [
    {
      id: 'USR-01',
      name: 'Bambang Sutrisno',
      role: 'Owner',
      email: 'owner@bengkelpro.com',
      workshopName: 'BengkelPro Mandiri',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'USR-02',
      name: 'Rian Herlambang',
      role: 'Admin',
      email: 'admin@bengkelpro.com',
      workshopName: 'BengkelPro Mandiri',
      createdAt: new Date().toISOString(),
    }
  ],
  customers: [
    { id: 'CUST-3', name: 'Hendra Wijaya', phone: '081398765432', totalServiceCount: 8, totalSpent: 1650000, loyaltyTier: 'VIP' },
    { id: 'CUST-1', name: 'Budi Santoso', phone: '08123456789', totalServiceCount: 5, totalSpent: 850000, loyaltyTier: 'Gold' },
    { id: 'CUST-4', name: 'Dewi Lestari', phone: '085712345678', totalServiceCount: 4, totalSpent: 620000, loyaltyTier: 'Silver' },
    { id: 'CUST-01', name: 'Andi Kusuma', phone: '082155667788', totalServiceCount: 3, totalSpent: 435000, loyaltyTier: 'Silver' },
    { id: 'CUST-2', name: 'Siti Aminah', phone: '08789012345', totalServiceCount: 1, totalSpent: 145000, loyaltyTier: 'Bronze' }
  ],
  vehicles: [
    { id: 'VH-1', customerId: 'CUST-1', plateNumber: 'B 1234 ABC', model: 'Honda Vario 160', brand: 'Honda' },
    { id: 'VH-2', customerId: 'CUST-2', plateNumber: 'D 5678 XYZ', model: 'Yamaha Fazzio', brand: 'Yamaha' },
    { id: 'VH-3', customerId: 'CUST-3', plateNumber: 'B 9999 VIP', model: 'Honda PCX 160', brand: 'Honda' },
    { id: 'VH-4', customerId: 'CUST-4', plateNumber: 'B 4321 DEF', model: 'Yamaha NMAX 155', brand: 'Yamaha' }
  ],
  parts: INITIAL_PARTS.map((p, index) => index % 2 === 0 ? { ...p, supplierId: 'SUP-1' } : p),
  services: [
    {
      id: 'SRV-001',
      customerId: 'CUST-3',
      customerName: 'Hendra Wijaya',
      customerPhone: '081398765432',
      vehicleId: 'VH-3',
      vehiclePlate: 'B 9999 VIP',
      vehicleModel: 'Honda PCX 160',
      kilometers: 12500,
      serviceType: 'Servis Rutin + Oli',
      complaint: 'Tarikan berat & getar di CVT',
      diagnosis: 'CVT kotor dan oli mesin sudah encer',
      status: 'Done',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      partsUsed: [{ partId: 'P001', name: 'Oli Mesin 1L MPX2', quantity: 1, priceAtTime: 95000 }],
      laborFee: 50000,
      totalAmount: 137750,
      discountAmount: 7250,
      discountReason: 'Promo Pelanggan Setia VIP (5%)',
      paymentStatus: 'Paid',
      mechanicId: 'MEC-1',
      mechanicName: 'Rudi Hermawan',
      mechanicBonusPercent: 15,
      mechanicBonusAmount: 7500
    },
    {
      id: 'SRV-002',
      customerId: 'CUST-1',
      customerName: 'Budi Santoso',
      vehicleId: 'VH-1',
      vehiclePlate: 'B 1234 ABC',
      vehicleModel: 'Honda Vario 160',
      kilometers: 8400,
      serviceType: 'Servis Rem',
      complaint: 'Ganti kampas depan bunyi berdecit',
      status: 'Ready',
      createdAt: new Date().toISOString(),
      partsUsed: [{ partId: 'P002', name: 'Kampas Rem Depan Cakram', quantity: 1, priceAtTime: 150000 }],
      laborFee: 35000,
      totalAmount: 185000,
      paymentStatus: 'Unpaid',
      mechanicId: 'MEC-2',
      mechanicName: 'Agus Santoso',
      mechanicBonusPercent: 20,
      mechanicBonusAmount: 7000
    }
  ],
  mechanics: [
    {
      id: 'MEC-1',
      name: 'Rudi Hermawan',
      phone: '081234567801',
      specialty: 'Mesin & CVT Matic',
      defaultBonusPercent: 15,
      dailySalary: 100000,
      warrantyPenaltyAmount: 75000,
      absencePenaltyAmount: 50000,
      joinedAt: '2024-01-10',
      status: 'Active'
    },
    {
      id: 'MEC-2',
      name: 'Agus Santoso',
      phone: '081234567802',
      specialty: 'Kelistrikan & Injeksi',
      defaultBonusPercent: 20,
      dailySalary: 110000,
      warrantyPenaltyAmount: 75000,
      absencePenaltyAmount: 50000,
      joinedAt: '2024-02-15',
      status: 'Active'
    },
    {
      id: 'MEC-3',
      name: 'Fajar Nugroho',
      phone: '081234567803',
      specialty: 'Kaki-kaki & Pengereman',
      defaultBonusPercent: 15,
      dailySalary: 95000,
      warrantyPenaltyAmount: 75000,
      absencePenaltyAmount: 50000,
      joinedAt: '2024-03-01',
      status: 'Active'
    }
  ],
  deductions: [],
  suppliers: [
    { id: 'SUP-1', name: 'Distributor Suku Cadang A', contact: '0812345678', address: 'Jl. Industri No. 10' }
  ],
  purchases: [
    {
      id: 'PR-1',
      partId: 'P001',
      supplierId: 'SUP-1',
      quantity: 12,
      costPrice: 75000,
      date: new Date(Date.now() - 3600000 * 24 * 3).toISOString()
    },
    {
      id: 'PR-2',
      partId: 'P003',
      supplierId: 'SUP-1',
      quantity: 10,
      costPrice: 45000,
      date: new Date(Date.now() - 3600000 * 12).toISOString()
    }
  ],
  expenses: [],
  staff: [
    { id: 'STF-1', name: 'Rian Herlambang', role: 'Admin', status: 'Active', shifts: 'Pagi', email: 'rian@bengkelpro.com' },
    { id: 'STF-2', name: 'Budi Hartono', role: 'Admin', status: 'Active', shifts: 'Sore', email: 'budi@bengkelpro.com' }
  ]
};
