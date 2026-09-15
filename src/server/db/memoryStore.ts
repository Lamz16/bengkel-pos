import { INITIAL_PARTS } from '../../constants';
import { DEFAULT_PART_CATEGORIES, DEFAULT_WAREHOUSE_RACKS, DEFAULT_WAREHOUSE_ZONES } from '../../utils/inventory';
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
  User,
  DistributorInvoice,
  PartCategory,
  WarehouseRack,
  WarehouseZone
} from '../../types';

export interface MemoryStore {
  settings: CompanySettings;
  users: User[];
  customers: Customer[];
  vehicles: Vehicle[];
  parts: SparePart[];
  categories: PartCategory[];
  racks: WarehouseRack[];
  zones: WarehouseZone[];
  services: WorkshopService[];
  mechanics: Mechanic[];
  deductions: MechanicDeduction[];
  suppliers: Supplier[];
  purchases: PurchaseRecord[];
  expenses: Expense[];
  staff: Array<{ id: string; name: string; role: string; status: string; shifts?: string; email?: string }>;
  distributorInvoices?: DistributorInvoice[];
}

export const memoryStore: MemoryStore = {
  settings: {
    name: "BengkelPro Mandiri",
    logoUrl: undefined,
    slogan: "Solusi Perawatan & Servis Terpercaya",
    address: "Jl. Otomotif Raya No. 123, Blok B4, Jakarta Selatan",
    phone: "0812-3456-7890",
    email: "kontak@bengkelpro.com",
    operationalHours: "Senin - Sabtu: 08:00 - 17:00 WIB",
    ownerName: "Pemilik Bengkel",
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
      name: 'Pemilik Bengkel',
      role: 'Owner',
      email: 'owner@bengkelpro.com',
      password: '$2b$12$nTt2yiemzgd0PdZSJyXKU.UjszwhcrO2L6j115lJDc6.iL0nrY5wS',
      workshopName: 'BengkelPro Mandiri',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'USR-02',
      name: 'Rian Herlambang',
      role: 'Admin',
      email: 'admin@bengkelpro.com',
      password: '$2b$12$nTt2yiemzgd0PdZSJyXKU.UjszwhcrO2L6j115lJDc6.iL0nrY5wS',
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
  categories: DEFAULT_PART_CATEGORIES,
  racks: DEFAULT_WAREHOUSE_RACKS.map(r => ({
    ...r,
    zoneId: DEFAULT_WAREHOUSE_ZONES.find(z => z.name === r.zone)?.id,
  })),
  zones: DEFAULT_WAREHOUSE_ZONES,
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
  ],
  distributorInvoices: [
    {
      id: 'INV-DIST-101',
      invoiceNumber: 'INV-SUP-2026-001',
      supplierId: 'SUP-1',
      supplierName: 'PT Astra Otoparts (Distributor A)',
      branchName: 'Bengkel Pusat',
      branchType: 'Pusat',
      totalAmount: 3500000,
      paidAmount: 1000000,
      remainingAmount: 2500000,
      issueDate: new Date(Date.now() - 3600000 * 24 * 15).toISOString(),
      dueDate: new Date(Date.now() + 3600000 * 24 * 3).toISOString(), // 3 days from now
      status: 'Partial',
      paymentMethod: 'Transfer',
      notes: 'Nota Pembelian Kampas Rem & Oli Shell Helix. Tempo 30 Hari.',
      items: [
        { id: 'ITEM-1', partName: 'Oli MPX2 0.8L Matik', quantity: 20, unitPrice: 45000, totalPrice: 900000 },
        { id: 'ITEM-2', partName: 'Kampas Rem Depan Vario', quantity: 25, unitPrice: 50000, totalPrice: 1250000 },
        { id: 'ITEM-3', partName: 'V-Belt Kit NMax 155', quantity: 9, unitPrice: 150000, totalPrice: 1350000 }
      ],
      payments: [
        { id: 'PAY-1', invoiceId: 'INV-DIST-101', amount: 1000000, paymentDate: new Date(Date.now() - 3600000 * 24 * 5).toISOString(), paymentMethod: 'Transfer', referenceNo: 'TRX-882193', notes: 'DP Cicilan Pertama' }
      ]
    },
    {
      id: 'INV-DIST-102',
      invoiceNumber: 'INV-SUP-2026-002',
      supplierId: 'SUP-1',
      supplierName: 'Distributor Suku Cadang A',
      branchName: 'Cabang Bandung',
      branchType: 'Cabang',
      totalAmount: 1850000,
      paidAmount: 0,
      remainingAmount: 1850000,
      issueDate: new Date(Date.now() - 3600000 * 24 * 20).toISOString(),
      dueDate: new Date(Date.now() - 3600000 * 24 * 2).toISOString(), // 2 days overdue
      status: 'Overdue',
      paymentMethod: 'Giro',
      notes: 'Faktur Pengiriman Ban FDR & Tubeless Cabang Bandung.',
      items: [
        { id: 'ITEM-4', partName: 'Ban Tubeless 90/90-14 FDR', quantity: 10, unitPrice: 185000, totalPrice: 1850000 }
      ],
      payments: []
    },
    {
      id: 'INV-DIST-103',
      invoiceNumber: 'INV-SUP-2026-003',
      supplierId: 'SUP-1',
      supplierName: 'PT Castrol Indonesia',
      branchName: 'Bengkel Pusat',
      branchType: 'Pusat',
      totalAmount: 4200000,
      paidAmount: 4200000,
      remainingAmount: 0,
      issueDate: new Date(Date.now() - 3600000 * 24 * 30).toISOString(),
      dueDate: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
      status: 'Paid',
      paymentMethod: 'Transfer',
      notes: 'Lunas via Transfer BCA. Nota Pelumas Castrol Power1.',
      items: [
        { id: 'ITEM-5', partName: 'Castrol Power1 10W-40 1L', quantity: 60, unitPrice: 70000, totalPrice: 4200000 }
      ],
      payments: [
        { id: 'PAY-2', invoiceId: 'INV-DIST-103', amount: 4200000, paymentDate: new Date(Date.now() - 3600000 * 24 * 5).toISOString(), paymentMethod: 'Transfer', referenceNo: 'BCA-992102', notes: 'Pelunasan Nota Castrol' }
      ]
    },
    {
      id: 'INV-DIST-104',
      invoiceNumber: 'INV-SUP-2026-004',
      supplierId: 'SUP-1',
      supplierName: 'CV Jaya Akumulator',
      branchName: 'Cabang Surabaya',
      branchType: 'Cabang',
      totalAmount: 2600000,
      paidAmount: 0,
      remainingAmount: 2600000,
      issueDate: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
      dueDate: new Date(Date.now() + 3600000 * 24 * 12).toISOString(), // 12 days from now
      status: 'Unpaid',
      paymentMethod: 'Transfer',
      notes: 'Nota Aki GS Astra GTZ5S 15 Pcs.',
      items: [
        { id: 'ITEM-6', partName: 'Aki GS Astra GTZ5S', quantity: 13, unitPrice: 200000, totalPrice: 2600000 }
      ],
      payments: []
    }
  ]
};
