import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedDatabase() {
  console.log('🌱 Memulai seeding database BengkelPro...');

  // 1. Settings
  await prisma.companySettings.upsert({
    where: { id: 'settings-default' },
    update: {},
    create: {
      id: 'settings-default',
      name: 'BengkelPro Mandiri',
      slogan: 'Solusi Perawatan & Servis Terpercaya',
      address: 'Jl. Otomotif Raya No. 123, Blok B4, Jakarta Selatan',
      phone: '0812-3456-7890',
      email: 'kontak@bengkelpro.com',
      operationalHours: 'Senin - Sabtu: 08:00 - 17:00 WIB',
      ownerName: 'Pemilik Bengkel',
      picName: 'Rian Herlambang',
      defaultMechanicBonusPercent: 15,
      defaultAbsencePenalty: 50000,
      defaultWarrantyPenalty: 75000,
      allowCustomBonusPerTransaction: true,
      receiptHeader: 'NOTA RESMI & RINCIAN SERVIS',
      footerNote: 'Barang yang sudah dibeli tidak dapat ditukar kecuali perjanjian. Terima kasih atas kepercayaan Anda merawat kendaraan bersama kami.',
      warrantyTerms: 'Garansi servis 7 hari atau 500 KM untuk pengerjaan perbaikan yang sama dengan menunjukkan nota ini.',
      showMechanicOnReceipt: true,
      showWarrantyOnReceipt: true,
      showOdometerOnReceipt: true,
      showCustomerPhoneOnReceipt: true,
      receiptContactHelp: 'WhatsApp CS: 0812-3456-7890',
      loyaltySilverVisits: 3,
      loyaltyGoldVisits: 6,
      loyaltyVipVisits: 10,
      loyaltySilverDiscountPercent: 5,
      loyaltyGoldDiscountPercent: 10,
      loyaltyVipDiscountPercent: 15,
    },
  });

  // 2. Users / Staff
  await prisma.user.upsert({
    where: { email: 'owner@bengkelpro.com' },
    update: {
      password: 'akundemo',
    },
    create: {
      id: 'USR-01',
      name: 'Pemilik Bengkel',
      role: 'Owner',
      email: 'owner@bengkelpro.com',
      password: 'akundemo',
      workshopName: 'BengkelPro Mandiri',
      status: 'Active',
      shifts: 'Pagi',
    },
  });

  await prisma.user.upsert({
    where: { email: 'admin@bengkelpro.com' },
    update: {
      password: 'akundemo',
    },
    create: {
      id: 'USR-02',
      name: 'Rian Herlambang',
      role: 'Admin',
      email: 'admin@bengkelpro.com',
      password: 'akundemo',
      workshopName: 'BengkelPro Mandiri',
      status: 'Active',
      shifts: 'Pagi',
    },
  });

  // 3. Supplier
  const supplier = await prisma.supplier.upsert({
    where: { id: 'SUP-1' },
    update: {},
    create: {
      id: 'SUP-1',
      name: 'Distributor Suku Cadang A',
      contact: '0812345678',
      address: 'Jl. Industri No. 10',
    },
  });

  // 4. Normalized inventory master data
  const categorySeeds = [
    ['cat-1', 'Oli', 'OLI'], ['cat-2', 'Rem', 'REM'], ['cat-3', 'Busi', 'BSI'],
    ['cat-4', 'Filter', 'FLT'], ['cat-5', 'Kelistrikan', 'ELK'], ['cat-6', 'Ban', 'BAN'],
    ['cat-7', 'Mesin', 'MSN'], ['cat-8', 'CVT', 'CVT'], ['cat-9', 'Suspensi', 'SUS'],
    ['cat-10', 'Aksesoris', 'AKS'], ['cat-11', 'Baut & Nut', 'BAU'],
  ] as const;
  const categories = await Promise.all(categorySeeds.map(([id, name, skuPrefix]) =>
    prisma.partCategory.upsert({ where: { name }, update: { skuPrefix }, create: { id, name, skuPrefix } })
  ));
  const categoryByName = Object.fromEntries(categories.map(category => [category.name, category]));

  const zoneSeeds = [
    ['zone-1', 'Gudang Utama'], ['zone-2', 'Gudang Belakang'],
    ['zone-3', 'Toko Kasir'], ['zone-4', 'Area Servis Luar'],
  ] as const;
  const zones = await Promise.all(zoneSeeds.map(([id, name]) =>
    prisma.warehouseZone.upsert({ where: { name }, update: {}, create: { id, name } })
  ));
  const zoneByName = Object.fromEntries(zones.map(zone => [zone.name, zone]));

  const rackSeeds = [
    ['rack-1', 'Rak A', 'Rak A - Oli & Pelumas', 'Gudang Utama'],
    ['rack-2', 'Rak B', 'Rak B - Sistem Pengereman', 'Gudang Utama'],
    ['rack-3', 'Rak C', 'Rak C - Filter & Busi', 'Gudang Utama'],
    ['rack-4', 'Rak D', 'Rak D - Kelistrikan & Aki', 'Gudang Utama'],
    ['rack-5', 'Rak E', 'Rak E - Ban & Roda', 'Gudang Belakang'],
    ['rack-6', 'Etalase Depan', 'Etalase Depan - Fast Moving', 'Toko Kasir'],
    ['rack-7', 'Gudang Belakang', 'Gudang Belakang - Stok Dus Besar', 'Gudang Belakang'],
  ] as const;
  const racks = await Promise.all(rackSeeds.map(([id, code, name, zoneName]) =>
    prisma.warehouseRack.upsert({
      where: { code }, update: { name, zoneId: zoneByName[zoneName].id },
      create: { id, code, name, zoneId: zoneByName[zoneName].id },
    })
  ));
  const rackByCode = Object.fromEntries(racks.map(rack => [rack.code, rack]));

  // 5. SpareParts
  const partsData = [
    { 
      id: 'P001', 
      sku: 'OLI-001',
      barcode: '899123450011',
      name: 'Oli Mesin 1L MPX2', 
      price: 95000, 
      purchasePrice: 75000, 
      stock: 24, 
      minStock: 10, 
      category: 'Oli', 
      rackCode: 'Rak A',
      shelfLevel: 'Tingkat 1 (Bawah)',
      binNumber: 'Kotak 01',
      rackZone: 'Gudang Utama',
      locationNotes: 'Deretan botol pelumas matic sebelah kiri',
      supplierId: supplier.id,
    },
    { 
      id: 'P002', 
      sku: 'REM-001',
      barcode: '899123450022',
      name: 'Kampas Rem Depan Cakram', 
      price: 150000, 
      purchasePrice: 110000, 
      stock: 8, 
      minStock: 5, 
      category: 'Rem', 
      rackCode: 'Rak B',
      shelfLevel: 'Tingkat 2 (Tengah)',
      binNumber: 'Kotak 03',
      rackZone: 'Gudang Utama',
      locationNotes: 'Dus merah sistem pengereman Vario/Beat',
    },
    { 
      id: 'P003', 
      sku: 'FLT-001',
      barcode: '899123450033',
      name: 'Filter Udara Vario 150', 
      price: 65000, 
      purchasePrice: 45000, 
      stock: 15, 
      minStock: 5, 
      category: 'Filter', 
      rackCode: 'Rak C',
      shelfLevel: 'Tingkat 3 (Atas)',
      binNumber: 'Kotak 02',
      rackZone: 'Gudang Utama',
      locationNotes: 'Kotak plastik transparan di ambalan atas',
      supplierId: supplier.id,
    },
    { 
      id: 'P004', 
      sku: 'BSI-001',
      barcode: '899123450044',
      name: 'Busi Iridium CPR9EAIX-9', 
      price: 45000, 
      purchasePrice: 30000, 
      stock: 3, 
      minStock: 10, 
      category: 'Busi', 
      rackCode: 'Etalase Depan',
      shelfLevel: 'Tingkat 1 (Etalase Kaca)',
      binNumber: 'Slot A-05',
      rackZone: 'Toko Kasir',
      locationNotes: 'Etalase kaca depan dekat monitor kasir',
    },
    { 
      id: 'P005', 
      sku: 'ELK-001',
      barcode: '899123450055',
      name: 'Aki Kering GS Astra GTZ-5S', 
      price: 850000, 
      purchasePrice: 720000, 
      stock: 5, 
      minStock: 2, 
      category: 'Kelistrikan', 
      rackCode: 'Rak D',
      shelfLevel: 'Tingkat 1 (Bawah)',
      binNumber: 'Palet 01',
      rackZone: 'Gudang Utama',
      locationNotes: 'Di lantai palet kayu aman dari kelembaban',
      supplierId: supplier.id,
    },
    { 
      id: 'P006', 
      sku: 'BAN-001',
      barcode: '899123450066',
      name: 'Ban Luar Tubeless 90/90-14 FDR', 
      price: 245000, 
      purchasePrice: 195000, 
      stock: 12, 
      minStock: 4, 
      category: 'Ban', 
      rackCode: 'Gudang Belakang',
      shelfLevel: 'Gantungan Ban Baris 1',
      binNumber: 'Hanger 04',
      rackZone: 'Gudang Belakang',
      locationNotes: 'Tergantung di pipa rak ban belakang',
    }
  ];

  for (const p of partsData) {
    const { category, rackCode, rackZone: _rackZone, ...partData } = p;
    await prisma.sparePart.upsert({
      where: { id: p.id },
      update: {},
      create: {
        ...partData,
        categoryId: categoryByName[category].id,
        rackId: rackByCode[rackCode].id,
      },
    });
  }

  // 6. Mechanics
  const mechanic1 = await prisma.mechanic.upsert({
    where: { id: 'MEC-1' },
    update: {},
    create: {
      id: 'MEC-1',
      name: 'Rudi Hermawan',
      phone: '081234567801',
      specialty: 'Mesin & CVT Matic',
      defaultBonusPercent: 15,
      dailySalary: 100000,
      warrantyPenaltyAmount: 75000,
      absencePenaltyAmount: 50000,
      joinedAt: '2024-01-10',
    },
  });

  const mechanic2 = await prisma.mechanic.upsert({
    where: { id: 'MEC-2' },
    update: {},
    create: {
      id: 'MEC-2',
      name: 'Agus Santoso',
      phone: '081234567802',
      specialty: 'Kelistrikan & Injeksi',
      defaultBonusPercent: 20,
      dailySalary: 110000,
      warrantyPenaltyAmount: 75000,
      absencePenaltyAmount: 50000,
      joinedAt: '2024-02-15',
    },
  });

  await prisma.mechanic.upsert({
    where: { id: 'MEC-3' },
    update: {},
    create: {
      id: 'MEC-3',
      name: 'Fajar Nugroho',
      phone: '081234567803',
      specialty: 'Kaki-kaki & Pengereman',
      defaultBonusPercent: 15,
      dailySalary: 95000,
      warrantyPenaltyAmount: 75000,
      absencePenaltyAmount: 50000,
      joinedAt: '2024-03-01',
    },
  });

  // 6. Customers & Vehicles
  const customerData = [
    { id: 'CUST-3', name: 'Hendra Wijaya', phone: '081398765432', totalServiceCount: 8, totalSpent: 1650000, loyaltyTier: 'VIP' },
    { id: 'CUST-1', name: 'Budi Santoso', phone: '08123456789', totalServiceCount: 5, totalSpent: 850000, loyaltyTier: 'Gold' },
    { id: 'CUST-4', name: 'Dewi Lestari', phone: '085712345678', totalServiceCount: 4, totalSpent: 620000, loyaltyTier: 'Silver' },
    { id: 'CUST-01', name: 'Andi Kusuma', phone: '082155667788', totalServiceCount: 3, totalSpent: 435000, loyaltyTier: 'Silver' },
    { id: 'CUST-2', name: 'Siti Aminah', phone: '08789012345', totalServiceCount: 1, totalSpent: 145000, loyaltyTier: 'Bronze' }
  ];

  for (const c of customerData) {
    await prisma.customer.upsert({
      where: { id: c.id },
      update: {},
      create: c,
    });
  }

  const vehiclesData = [
    { id: 'VH-1', customerId: 'CUST-1', plateNumber: 'B 1234 ABC', model: 'Honda Vario 160', brand: 'Honda' },
    { id: 'VH-2', customerId: 'CUST-2', plateNumber: 'D 5678 XYZ', model: 'Yamaha Fazzio', brand: 'Yamaha' },
    { id: 'VH-3', customerId: 'CUST-3', plateNumber: 'B 9999 VIP', model: 'Honda PCX 160', brand: 'Honda' },
    { id: 'VH-4', customerId: 'CUST-4', plateNumber: 'B 4321 DEF', model: 'Yamaha NMAX 155', brand: 'Yamaha' }
  ];

  for (const v of vehiclesData) {
    await prisma.vehicle.upsert({
      where: { id: v.id },
      update: {},
      create: v,
    });
  }

  // 7. Workshop Services
  await prisma.workshopService.upsert({
    where: { id: 'SRV-001' },
    update: {},
    create: {
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
      laborFee: 50000,
      totalAmount: 137750,
      paymentStatus: 'Paid',
      discountAmount: 7250,
      discountReason: 'Promo Pelanggan Setia VIP (5%)',
      mechanicId: mechanic1.id,
      mechanicName: mechanic1.name,
      mechanicBonusPercent: 15,
      mechanicBonusAmount: 7500,
      partsUsed: {
        create: [
          { partId: 'P001', name: 'Oli Mesin 1L MPX2', quantity: 1, priceAtTime: 95000 }
        ]
      }
    },
  });

  await prisma.workshopService.upsert({
    where: { id: 'SRV-002' },
    update: {},
    create: {
      id: 'SRV-002',
      customerId: 'CUST-1',
      customerName: 'Budi Santoso',
      customerPhone: '08123456789',
      vehicleId: 'VH-1',
      vehiclePlate: 'B 1234 ABC',
      vehicleModel: 'Honda Vario 160',
      kilometers: 8400,
      serviceType: 'Servis Rem',
      complaint: 'Ganti kampas depan bunyi berdecit',
      status: 'Ready',
      laborFee: 35000,
      totalAmount: 185000,
      paymentStatus: 'Unpaid',
      mechanicId: mechanic2.id,
      mechanicName: mechanic2.name,
      mechanicBonusPercent: 20,
      mechanicBonusAmount: 7000,
      partsUsed: {
        create: [
          { partId: 'P002', name: 'Kampas Rem Depan Cakram', quantity: 1, priceAtTime: 150000 }
        ]
      }
    },
  });

  // 8. Purchases & Expenses
  await prisma.purchaseRecord.upsert({
    where: { id: 'PR-1' },
    update: {},
    create: {
      id: 'PR-1',
      partId: 'P001',
      supplierId: supplier.id,
      quantity: 12,
      costPrice: 75000,
      date: new Date(Date.now() - 3600000 * 24 * 3),
    },
  });

  await prisma.expense.upsert({
    where: { id: 'EXP-1' },
    update: {},
    create: {
      id: 'EXP-1',
      category: 'Listrik & Air',
      amount: 450000,
      note: 'Tagihan listrik bengkel bulan berjalan',
      date: new Date(Date.now() - 3600000 * 24 * 5),
    },
  });

  console.log('✅ Seeding database BengkelPro selesai!');
}

// Only execute when run directly via CLI
if (process.argv[1] && process.argv[1].endsWith('seed.ts')) {
  seedDatabase()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
