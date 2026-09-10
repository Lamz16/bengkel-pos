import React, { useState, useMemo, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Wrench, 
  Package, 
  Users, 
  CreditCard as PaymentIcon, 
  Store, 
  Wallet, 
  TrendingUp, 
  UserCircle, 
  Settings, 
  Award,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  WorkshopService, 
  User, 
  UserRole, 
  CompanySettings, 
  SparePart, 
  ServiceStatus, 
  Customer, 
  Vehicle, 
  Expense, 
  Supplier, 
  PurchaseRecord, 
  Mechanic, 
  MechanicDeduction 
} from './types';
import { INITIAL_PARTS } from './constants';

// UI and Feature Components
import { Modal } from './components/Modal';
import { InvoiceModal } from './components/InvoiceModal';
import { AuthView } from './components/AuthView';
import { Sidebar, NavItem } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { POSForm } from './components/POSForm';
import { HistoryView } from './components/HistoryView';
import { ServiceDetail } from './components/ServiceDetail';
import { InventoryView } from './components/InventoryView';
import { CustomersView } from './components/CustomersView';
import { SupplierView } from './components/SupplierView';
import { ExpenseView } from './components/ExpenseView';
import { ReportsView } from './components/ReportsView';
import { StaffView } from './components/StaffView';
import { SettingsView } from './components/SettingsView';
import { MechanicsView } from './components/MechanicsView';
import { MechanicForm } from './components/MechanicForm';
import { WarrantyClaimModal } from './components/WarrantyClaimModal';
import { ManualDeductionForm } from './components/ManualDeductionForm';

// Modular Form Components
import { StaffForm } from './components/forms/StaffForm';
import { ExpenseForm } from './components/forms/ExpenseForm';
import { SupplierForm } from './components/forms/SupplierForm';
import { PartForm } from './components/forms/PartForm';
import { CustomerForm } from './components/forms/CustomerForm';
import { AddStockForm } from './components/forms/AddStockForm';
import { api } from './services/api';

export default function AppLayout() {
  const [currentUser, setCurrentUser] = useState<User | null>({
    id: 'USR-01',
    name: 'Bambang Sutrisno',
    role: 'Owner',
    email: 'owner@bengkelpro.com',
    workshopName: 'BengkelPro Mandiri',
    createdAt: new Date().toISOString(),
  });

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [showPOSForm, setShowPOSForm] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Business Data States
  const [suppliers, setSuppliers] = useState<Supplier[]>([
    { id: 'SUP-1', name: 'Distributor Suku Cadang A', contact: '0812345678', address: 'Jl. Industri No. 10' }
  ]);
  const [parts, setParts] = useState<SparePart[]>(() => 
    INITIAL_PARTS.map((p, index) => index % 2 === 0 ? { ...p, supplierId: 'SUP-1' } : p)
  );
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([
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
  ]);
  const [customers, setCustomers] = useState<Customer[]>([
    { id: 'CUST-3', name: 'Hendra Wijaya', phone: '081398765432', totalServiceCount: 8, totalSpent: 1650000, loyaltyTier: 'VIP' },
    { id: 'CUST-1', name: 'Budi Santoso', phone: '08123456789', totalServiceCount: 5, totalSpent: 850000, loyaltyTier: 'Gold' },
    { id: 'CUST-4', name: 'Dewi Lestari', phone: '085712345678', totalServiceCount: 4, totalSpent: 620000, loyaltyTier: 'Silver' },
    { id: 'CUST-01', name: 'Andi Kusuma', phone: '082155667788', totalServiceCount: 3, totalSpent: 435000, loyaltyTier: 'Silver' },
    { id: 'CUST-2', name: 'Siti Aminah', phone: '08789012345', totalServiceCount: 1, totalSpent: 145000, loyaltyTier: 'Bronze' }
  ]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([
    { id: 'VH-1', customerId: 'CUST-1', plateNumber: 'B 1234 ABC', model: 'Honda Vario 160', brand: 'Honda' },
    { id: 'VH-2', customerId: 'CUST-2', plateNumber: 'D 5678 XYZ', model: 'Yamaha Fazzio', brand: 'Yamaha' },
    { id: 'VH-3', customerId: 'CUST-3', plateNumber: 'B 9999 VIP', model: 'Honda PCX 160', brand: 'Honda' },
    { id: 'VH-4', customerId: 'CUST-4', plateNumber: 'B 4321 DEF', model: 'Yamaha NMAX 155', brand: 'Yamaha' }
  ]);
  const [staff, setStaff] = useState<any[]>([
    { id: 'STF-1', name: 'Rian Herlambang', role: 'Admin', status: 'Active', shifts: 'Pagi' },
    { id: 'STF-2', name: 'Budi Hartono', role: 'Admin', status: 'Active', shifts: 'Sore' },
  ]);

  // Mechanics, Deductions, and Commissions
  const [mechanics, setMechanics] = useState<Mechanic[]>([
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
      dailySalary: 120000,
      warrantyPenaltyAmount: 80000,
      absencePenaltyAmount: 50000,
      joinedAt: '2024-02-15',
      status: 'Active'
    },
    {
      id: 'MEC-3',
      name: 'Dedi Pratama',
      phone: '081234567803',
      specialty: 'Kaki-kaki & Pengereman',
      defaultBonusPercent: 15,
      dailySalary: 95000,
      warrantyPenaltyAmount: 60000,
      absencePenaltyAmount: 40000,
      joinedAt: '2024-03-01',
      status: 'Active'
    }
  ]);

  const [deductions, setDeductions] = useState<MechanicDeduction[]>([
    {
      id: 'DED-1',
      mechanicId: 'MEC-1',
      mechanicName: 'Rudi Hermawan',
      amount: 125000,
      reason: 'Komplain CVT Bergetar ulang + Tidak masuk hari H+1',
      date: new Date(Date.now() - 3600000 * 48).toISOString(),
      type: 'Warranty_Complaint',
      serviceId: 'SRV-001',
      vehiclePlate: 'B 1234 ABC',
      isAbsentNextDay: true
    }
  ]);

  const [services, setServices] = useState<WorkshopService[]>([
    {
      id: 'SRV-001',
      customerId: 'CUST-01',
      customerName: 'Andi Kusuma',
      vehicleId: 'VH-1',
      vehiclePlate: 'B 1234 ABC',
      vehicleModel: 'Honda Vario 150',
      kilometers: 12500,
      serviceType: 'Ganti Oli',
      complaint: 'Suara kasar di bagian CVT',
      status: 'In Progress',
      createdAt: new Date().toISOString(),
      partsUsed: [{ partId: 'P001', name: 'Oli Mesin 1L', quantity: 1, priceAtTime: 95000 }],
      laborFee: 50000,
      totalAmount: 145000,
      paymentStatus: 'Paid',
      mechanicId: 'MEC-1',
      mechanicName: 'Rudi Hermawan',
      mechanicBonusPercent: 15,
      mechanicBonusAmount: 7500
    },
    {
      id: 'SRV-002',
      customerId: 'CUST-02',
      customerName: 'Budi Santoso',
      vehicleId: 'VH-2',
      vehiclePlate: 'D 9999 XYZ',
      vehicleModel: 'Yamaha NMAX',
      kilometers: 8400,
      serviceType: 'Servis Rem',
      complaint: 'Ganti kampas depan',
      status: 'Ready',
      createdAt: new Date().toISOString(),
      partsUsed: [{ partId: 'P002', name: 'Kampas Rem Depan', quantity: 1, priceAtTime: 150000 }],
      laborFee: 35000,
      totalAmount: 185000,
      paymentStatus: 'Unpaid',
      mechanicId: 'MEC-2',
      mechanicName: 'Agus Santoso',
      mechanicBonusPercent: 20,
      mechanicBonusAmount: 7000
    }
  ]);

  // Company Settings
  const [companySettings, setCompanySettings] = useState<CompanySettings>({
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
    receiptContactHelp: "WhatsApp CS: 0812-3456-7890"
  });

  // Active Modals & Form Dialog States
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [editingPart, setEditingPart] = useState<SparePart | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editingStaff, setEditingStaff] = useState<any | null>(null);
  const [editingMechanic, setEditingMechanic] = useState<Mechanic | null>(null);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [warrantyModalService, setWarrantyModalService] = useState<WorkshopService | null>(null);
  const [showMechanicModal, setShowMechanicModal] = useState(false);
  const [showManualDeduction, setShowManualDeduction] = useState(false);
  const [manualDeductionMechanic, setManualDeductionMechanic] = useState<Mechanic | null>(null);
  const [showAddStock, setShowAddStock] = useState(false);
  const [posInitialCustomer, setPosInitialCustomer] = useState<Customer | null>(null);
  const [posInitialPromoPercent, setPosInitialPromoPercent] = useState<number | null>(null);

  // Navigation Items Definition
  const navItems: NavItem[] = useMemo(() => [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['Owner', 'Admin'] },
    { id: 'pos', label: 'Transaksi', icon: PaymentIcon, roles: ['Owner', 'Admin'] },
    { id: 'pos_history', label: 'Antrean', icon: Wrench, roles: ['Owner', 'Admin'] },
    { id: 'mechanics', label: 'Mekanik & Gaji', icon: Award, roles: ['Owner', 'Admin'] },
    { id: 'customers', label: 'Pelanggan', icon: Users, roles: ['Owner', 'Admin'] },
    { id: 'inventory', label: 'Stok Barang', icon: Package, roles: ['Owner', 'Admin'] },
    { id: 'suppliers', label: 'Pemasok', icon: Store, roles: ['Owner'] },
    { id: 'expenses', label: 'Pengeluaran', icon: Wallet, roles: ['Owner'] },
    { id: 'reports', label: 'Laporan', icon: TrendingUp, roles: ['Owner'] },
    { id: 'staff', label: 'Pengguna', icon: UserCircle, roles: ['Owner'] },
    { id: 'settings', label: 'Pengaturan', icon: Settings, roles: ['Owner', 'Admin'] },
  ], []);

  const filteredNavItems = useMemo(() => {
    if (!currentUser) return [];
    return navItems.filter(item => item.roles.includes(currentUser.role));
  }, [currentUser, navItems]);

  const [postgresConnected, setPostgresConnected] = useState(false);

  // Sync data with PostgreSQL / Prisma backend on mount
  useEffect(() => {
    let isMounted = true;
    async function loadBootstrap() {
      try {
        const data = await api.getBootstrap();
        if (!isMounted) return;
        if (data.settings) setCompanySettings(data.settings);
        if (data.customers && data.customers.length > 0) setCustomers(data.customers);
        if (data.vehicles && data.vehicles.length > 0) setVehicles(data.vehicles);
        if (data.parts && data.parts.length > 0) setParts(data.parts);
        if (data.services && data.services.length > 0) setServices(data.services);
        if (data.mechanics && data.mechanics.length > 0) setMechanics(data.mechanics);
        if (data.deductions) setDeductions(data.deductions);
        if (data.suppliers && data.suppliers.length > 0) setSuppliers(data.suppliers);
        if (data.purchases && data.purchases.length > 0) setPurchases(data.purchases);
        if (data.expenses && data.expenses.length > 0) setExpenses(data.expenses);
        if (data.staff && data.staff.length > 0) setStaff(data.staff);
        setPostgresConnected(data.postgresConnected);
      } catch (err) {
        console.warn('Backend bootstrap fallback to local initial state:', err);
      }
    }
    loadBootstrap();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    if (currentUser) {
      const allowed = filteredNavItems.map(i => i.id);
      if (!allowed.includes(activeTab)) {
        setActiveTab(allowed[0] || 'dashboard');
      }
    }
  }, [currentUser, filteredNavItems, activeTab]);

  // Action Handlers connected to PostgreSQL & Prisma API
  const handleApplyWarrantyClaim = async (data: {
    serviceId: string;
    reason: string;
    isAbsent: boolean;
    deductionAmount: number;
  }) => {
    try {
      const updatedSrv = await api.applyWarrantyClaim(data);
      setServices(prev => prev.map(s => s.id === data.serviceId ? updatedSrv : s));
      const [updatedServices, updatedDeductions] = await Promise.all([
        api.getServices(),
        api.getDeductions()
      ]);
      setServices(updatedServices);
      setDeductions(updatedDeductions);
    } catch (err) {
      console.error('Error applying warranty claim:', err);
      // Fallback local update
      const srv = services.find(s => s.id === data.serviceId);
      const mec = mechanics.find(m => m.id === srv?.mechanicId);
      setServices(prev => prev.map(s => {
        if (s.id === data.serviceId) {
          return {
            ...s,
            hasWarrantyClaim: true,
            warrantyClaimDate: new Date().toISOString(),
            warrantyClaimReason: data.reason,
            isMechanicAbsentOnClaim: data.isAbsent,
            warrantyDeductionAmount: data.deductionAmount,
            status: 'In Progress' as ServiceStatus
          };
        }
        return s;
      }));

      if (mec) {
        const newDeduction: MechanicDeduction = {
          id: `DED-${Date.now()}`,
          mechanicId: mec.id,
          mechanicName: mec.name,
          serviceId: data.serviceId,
          vehiclePlate: srv?.vehiclePlate,
          date: new Date().toISOString(),
          reason: `Klaim Garansi Servis (${data.reason})${data.isAbsent ? ' + Denda Mangkir H+1' : ''}`,
          type: 'Warranty_Complaint',
          amount: data.deductionAmount,
          isAbsentNextDay: data.isAbsent
        };
        setDeductions(prev => [newDeduction, ...prev]);
      }
    }

    setWarrantyModalService(null);
  };

  const handleNewService = async (service: WorkshopService) => {
    try {
      const savedService = await api.createService(service);
      setServices(prev => [savedService, ...prev]);
      const [updatedParts, updatedCustomers] = await Promise.all([
        api.getParts(),
        api.getCustomers()
      ]);
      setParts(updatedParts);
      setCustomers(updatedCustomers);
      setShowPOSForm(false);
      setSelectedInvoiceId(savedService.id);
      setActiveTab('pos');
    } catch (err) {
      console.error('Error saving service to backend:', err);
      // Local fallback
      setParts(prev => {
        const newParts = [...prev];
        service.partsUsed.forEach(used => {
          const idx = newParts.findIndex(p => p.id === used.partId);
          if (idx !== -1) {
            newParts[idx] = { ...newParts[idx], stock: Math.max(0, newParts[idx].stock - used.quantity) };
          }
        });
        return newParts;
      });
      setServices(prev => [service, ...prev]);
      setShowPOSForm(false);
      setSelectedInvoiceId(service.id);
      setActiveTab('pos');
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: ServiceStatus) => {
    setServices(prev => prev.map(s => s.id === id ? { ...s, status: newStatus } : s));
    setSelectedServiceId(null);
    try {
      await api.updateServiceStatus(id, newStatus);
    } catch (err) {
      console.error('Error updating status in backend:', err);
    }
  };

  const handleAddStock = async (partId: string, amount: number, supplierId: string, costPrice: number) => {
    try {
      const updatedPart = await api.addPartStock(partId, amount, supplierId, costPrice);
      setParts(prev => prev.map(p => p.id === partId ? updatedPart : p));
      const [updatedPurchases, updatedExpenses] = await Promise.all([
        api.getPurchases(),
        api.getExpenses()
      ]);
      setPurchases(updatedPurchases);
      setExpenses(updatedExpenses);
    } catch (err) {
      console.error('Error adding stock to backend:', err);
      // Local fallback
      setParts(prev => prev.map(p => {
        if (p.id === partId) {
          return { 
            ...p, 
            stock: p.stock + amount,
            supplierId: supplierId || p.supplierId,
            purchasePrice: costPrice > 0 ? costPrice : p.purchasePrice
          };
        }
        return p;
      }));
    }
    setShowAddStock(false);
  };

  const handleDeletePart = async (id: string) => {
    setParts(prev => prev.filter(x => x.id !== id));
    try {
      await api.deletePart(id);
    } catch (err) {
      console.error('Failed to delete part:', err);
    }
  };

  const handleSavePart = async (p: SparePart) => {
    if (editingPart && editingPart.name) {
      setParts(prev => prev.map(x => x.id === p.id ? p : x));
      try {
        const updated = await api.updatePart(p.id, p);
        setParts(prev => prev.map(x => x.id === p.id ? updated : x));
      } catch (err) {
        console.error('Failed to update part:', err);
      }
    } else {
      try {
        const created = await api.createPart(p);
        setParts(prev => [created, ...prev]);
      } catch (err) {
        console.error('Failed to create part:', err);
        setParts(prev => [p, ...prev]);
      }
    }
    setEditingPart(null);
  };

  const handleDeleteCustomer = async (id: string) => {
    setCustomers(prev => prev.filter(x => x.id !== id));
    try {
      await api.deleteCustomer(id);
    } catch (err) {
      console.error('Failed to delete customer:', err);
    }
  };

  const handleSaveCustomer = async (c: Customer) => {
    if (editingCustomer && editingCustomer.name) {
      setCustomers(prev => prev.map(x => x.id === c.id ? c : x));
      try {
        const updated = await api.updateCustomer(c.id, c);
        setCustomers(prev => prev.map(x => x.id === c.id ? updated : x));
      } catch (err) {
        console.error('Failed to update customer:', err);
      }
    } else {
      try {
        const created = await api.createCustomer(c);
        setCustomers(prev => [created, ...prev]);
      } catch (err) {
        console.error('Failed to create customer:', err);
        setCustomers(prev => [c, ...prev]);
      }
    }
    setEditingCustomer(null);
  };

  const handleAddVehicle = async (v: Vehicle) => {
    setVehicles(prev => [v, ...prev]);
    try {
      await api.createVehicle(v);
    } catch (err) {
      console.error('Failed to add vehicle:', err);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    setExpenses(prev => prev.filter(x => x.id !== id));
    try {
      await api.deleteExpense(id);
    } catch (err) {
      console.error('Failed to delete expense:', err);
    }
  };

  const handleSaveExpense = async (e: Expense) => {
    try {
      const created = await api.createExpense(e);
      setExpenses(prev => [created, ...prev]);
    } catch (err) {
      console.error('Failed to create expense:', err);
      setExpenses(prev => [e, ...prev]);
    }
    setEditingExpense(null);
  };

  const handleDeleteSupplier = async (id: string) => {
    setSuppliers(prev => prev.filter(x => x.id !== id));
    try {
      await api.deleteSupplier(id);
    } catch (err) {
      console.error('Failed to delete supplier:', err);
    }
  };

  const handleSaveSupplier = async (s: Supplier) => {
    if (editingSupplier && editingSupplier.name) {
      setSuppliers(prev => prev.map(x => x.id === s.id ? s : x));
      try {
        const updated = await api.updateSupplier(s.id, s);
        setSuppliers(prev => prev.map(x => x.id === s.id ? updated : x));
      } catch (err) {
        console.error('Failed to update supplier:', err);
      }
    } else {
      try {
        const created = await api.createSupplier(s);
        setSuppliers(prev => [created, ...prev]);
      } catch (err) {
        console.error('Failed to create supplier:', err);
        setSuppliers(prev => [s, ...prev]);
      }
    }
    setEditingSupplier(null);
  };

  const handleDeleteMechanic = async (id: string) => {
    setMechanics(prev => prev.filter(m => m.id !== id));
    try {
      await api.deleteMechanic(id);
    } catch (err) {
      console.error('Failed to delete mechanic:', err);
    }
  };

  const handleSaveMechanic = async (m: Mechanic) => {
    if (editingMechanic) {
      setMechanics(prev => prev.map(item => item.id === m.id ? m : item));
      try {
        const updated = await api.updateMechanic(m.id, m);
        setMechanics(prev => prev.map(item => item.id === m.id ? updated : item));
      } catch (err) {
        console.error('Failed to update mechanic:', err);
      }
    } else {
      try {
        const created = await api.createMechanic(m);
        setMechanics(prev => [...prev, created]);
      } catch (err) {
        console.error('Failed to create mechanic:', err);
        setMechanics(prev => [...prev, m]);
      }
    }
    setShowMechanicModal(false);
    setEditingMechanic(null);
  };

  const handleDeleteDeduction = async (id: string) => {
    setDeductions(prev => prev.filter(d => d.id !== id));
    try {
      await api.deleteDeduction(id);
    } catch (err) {
      console.error('Failed to delete deduction:', err);
    }
  };

  const handleSaveManualDeduction = async (ded: MechanicDeduction) => {
    setDeductions(prev => [ded, ...prev]);
    setShowManualDeduction(false);
    setManualDeductionMechanic(null);
    try {
      await api.createDeduction(ded);
    } catch (err) {
      console.error('Failed to save deduction to backend:', err);
    }
  };

  const handleSaveStaff = async (stf: any) => {
    try {
      const created = await api.createStaff(stf);
      setStaff(prev => [created, ...prev]);
    } catch (err) {
      console.error('Failed to create staff:', err);
      setStaff(prev => [stf, ...prev]);
    }
    setEditingStaff(null);
  };

  const handleUpdateSettings = async (newSettings: CompanySettings) => {
    setCompanySettings(newSettings);
    try {
      await api.updateSettings(newSettings);
    } catch (err) {
      console.error('Failed to save settings:', err);
    }
  };

  const selectedService = useMemo(() => 
    services.find(s => s.id === selectedServiceId), 
  [services, selectedServiceId]);

  if (!currentUser) {
    return <AuthView onLogin={setCurrentUser} />;
  }

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden font-sans text-slate-900 selection:bg-blue-100">
      {/* Sidebar Navigation */}
      <Sidebar 
        navItems={filteredNavItems}
        activeTab={activeTab}
        showPOSForm={showPOSForm}
        currentUser={currentUser}
        isMobileOpen={isSidebarOpen}
        onSelectTab={(tabId) => {
          setActiveTab(tabId);
          setShowPOSForm(false);
        }}
        onCloseMobile={() => setIsSidebarOpen(false)}
        onLogout={() => setCurrentUser(null)}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Top Header */}
        <Header 
          activeTab={activeTab}
          showPOSForm={showPOSForm}
          currentUser={currentUser}
          dbStatus={{ connected: postgresConnected, orm: 'prisma' }}
          onOpenMobileMenu={() => setIsSidebarOpen(true)}
          onClosePOSForm={() => setShowPOSForm(false)}
          onOpenPOSForm={() => setShowPOSForm(true)}
          onSwitchRole={(nextRole) => {
            setCurrentUser({
              ...currentUser,
              role: nextRole,
              name: nextRole === 'Owner' ? 'Bambang Sutrisno' : 'Rian Herlambang'
            });
          }}
        />

        {/* Scrollable Viewport */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-10 custom-scrollbar bg-slate-50/50">
          <AnimatePresence mode="wait">
            {!showPOSForm && activeTab === 'dashboard' && (
              <motion.div key="dashboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <DashboardView 
                  services={services} 
                  parts={parts} 
                  user={currentUser} 
                  onPrint={setSelectedInvoiceId} 
                />
              </motion.div>
            )}

            {!showPOSForm && activeTab === 'pos' && (
              <motion.div key="pos-list" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                  <div>
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Orders</h3>
                    <p className="text-sm font-bold text-slate-900">{services.filter(s => s.status !== 'Done').length} In Progress</p>
                  </div>
                  {(currentUser.role === 'Owner' || currentUser.role === 'Admin') && (
                    <button 
                      onClick={() => setShowPOSForm(true)} 
                      className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-100"
                    >
                      New Transaction
                    </button>
                  )}
                </div>
                <HistoryView 
                  services={services} 
                  onSelect={setSelectedServiceId} 
                  onPrint={setSelectedInvoiceId} 
                />
              </motion.div>
            )}

            {!showPOSForm && activeTab === 'pos_history' && (
              <motion.div key="pos-history" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm mb-2">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Daftar Kerja Mekanik</h3>
                  <p className="text-sm font-bold text-slate-900">{services.filter(s => s.status !== 'Done').length} Kendaraan Menunggu</p>
                </div>
                <HistoryView 
                  services={services} 
                  onSelect={setSelectedServiceId} 
                  onPrint={setSelectedInvoiceId}
                  initialFilter="In Progress" 
                />
              </motion.div>
            )}

            {showPOSForm && (
              <motion.div key="pos-form" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}>
                <div className="flex items-center gap-3 mb-6">
                  <button 
                    onClick={() => {
                      setShowPOSForm(false);
                      setPosInitialCustomer(null);
                      setPosInitialPromoPercent(null);
                    }} 
                    aria-label="Tutup Form POS"
                    className="p-2 bg-white rounded-xl border border-slate-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <h2 className="text-xl font-black text-slate-900">New Transaction</h2>
                </div>
                <POSForm 
                  onSave={(service) => {
                    handleNewService(service);
                    setPosInitialCustomer(null);
                    setPosInitialPromoPercent(null);
                  }} 
                  parts={parts} 
                  customers={customers}
                  vehicles={vehicles}
                  mechanics={mechanics}
                  services={services}
                  settings={companySettings}
                  initialCustomer={posInitialCustomer}
                  initialPromoPercent={posInitialPromoPercent}
                  onAddCustomer={handleSaveCustomer}
                  onAddVehicle={handleAddVehicle}
                />
              </motion.div>
            )}

            {activeTab === 'mechanics' && !showPOSForm && (
              <motion.div key="mechanics" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <MechanicsView 
                  mechanics={mechanics}
                  services={services}
                  deductions={deductions}
                  onAddMechanic={() => { setEditingMechanic(null); setShowMechanicModal(true); }}
                  onEditMechanic={(m) => { setEditingMechanic(m); setShowMechanicModal(true); }}
                  onDeleteMechanic={handleDeleteMechanic}
                  onOpenWarrantyClaim={(srv) => setWarrantyModalService(srv)}
                  onOpenManualDeduction={(m) => { setManualDeductionMechanic(m); setShowManualDeduction(true); }}
                  onDeleteDeduction={handleDeleteDeduction}
                />
              </motion.div>
            )}

            {activeTab === 'inventory' && !showPOSForm && (
              <motion.div key="inventory" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <InventoryView 
                  parts={parts} 
                  suppliers={suppliers}
                  purchases={purchases}
                  onAdd={() => setEditingPart({} as SparePart)}
                  onAddStock={() => setShowAddStock(true)}
                  onEdit={(p) => setEditingPart(p)}
                  onDelete={handleDeletePart}
                />
              </motion.div>
            )}

            {activeTab === 'customers' && !showPOSForm && (
              <motion.div key="customers" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <CustomersView 
                  customers={customers}
                  services={services}
                  settings={companySettings}
                  onAdd={() => setEditingCustomer({} as Customer)}
                  onEdit={(c) => setEditingCustomer(c)}
                  onDelete={handleDeleteCustomer}
                  onSelectCustomerForPOS={(cust, promoPct) => {
                    setPosInitialCustomer(cust);
                    setPosInitialPromoPercent(promoPct || null);
                    setShowPOSForm(true);
                  }}
                />
              </motion.div>
            )}

            {activeTab === 'staff' && !showPOSForm && (
              <motion.div key="staff" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <StaffView 
                  staff={staff}
                  onAdd={() => setEditingStaff({})}
                  onEdit={(s) => setEditingStaff(s)}
                  onDelete={(id) => setStaff(prev => prev.filter(x => x.id !== id))}
                  onGoToMechanics={() => setActiveTab('mechanics')}
                />
              </motion.div>
            )}

            {activeTab === 'expenses' && !showPOSForm && (
              <motion.div key="expenses" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <ExpenseView 
                  expenses={expenses}
                  onAdd={() => setEditingExpense({} as Expense)}
                  onDelete={handleDeleteExpense}
                />
              </motion.div>
            )}

            {activeTab === 'suppliers' && !showPOSForm && (
              <motion.div key="suppliers" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <SupplierView 
                  suppliers={suppliers}
                  onAdd={() => setEditingSupplier({} as Supplier)}
                  onEdit={(s) => setEditingSupplier(s)}
                  onDelete={handleDeleteSupplier}
                />
              </motion.div>
            )}

            {activeTab === 'reports' && !showPOSForm && (
              <motion.div key="reports" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <ReportsView services={services} expenses={expenses} />
              </motion.div>
            )}

            {activeTab === 'settings' && (currentUser.role === 'Owner' || currentUser.role === 'Admin') && !showPOSForm && (
              <motion.div key="settings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <SettingsView 
                  settings={companySettings} 
                  mechanics={mechanics}
                  currentUserRole={currentUser.role}
                  onUpdateSettings={handleUpdateSettings}
                  onBatchUpdateMechanicBonus={(newPercent) => {
                    setMechanics(prev => prev.map(m => ({ ...m, defaultBonusPercent: newPercent })));
                    setCompanySettings(prev => ({ ...prev, defaultMechanicBonusPercent: newPercent }));
                  }}
                  onSwitchRole={(newRole) => {
                    setCurrentUser({
                      ...currentUser,
                      role: newRole,
                      name: newRole === 'Owner' ? 'Bambang Sutrisno' : 'Rian Herlambang'
                    });
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Modal Overlays */}
        <AnimatePresence>
          {selectedService && (
            <Modal title="Detail Servis Kendaraan" onClose={() => setSelectedServiceId(null)}>
              <ServiceDetail 
                service={selectedService} 
                parts={parts}
                onUpdateStatus={handleUpdateStatus} 
                onOpenWarrantyClaim={(srv) => {
                  setSelectedServiceId(null);
                  setWarrantyModalService(srv);
                }}
              />
            </Modal>
          )}

          {warrantyModalService && (
            <Modal title="Klaim Garansi Servis & Denda Mekanik" onClose={() => setWarrantyModalService(null)}>
              <WarrantyClaimModal 
                service={warrantyModalService}
                mechanics={mechanics}
                onCancel={() => setWarrantyModalService(null)}
                onConfirm={handleApplyWarrantyClaim}
              />
            </Modal>
          )}

          {showMechanicModal && (
            <Modal 
              title={editingMechanic ? "Edit Data Mekanik" : "Tambah Mekanik Baru"} 
              onClose={() => { setShowMechanicModal(false); setEditingMechanic(null); }}
            >
              <MechanicForm 
                mechanic={editingMechanic || undefined}
                onSave={handleSaveMechanic}
                onCancel={() => { setShowMechanicModal(false); setEditingMechanic(null); }}
              />
            </Modal>
          )}

          {showManualDeduction && (
            <Modal 
              title="Input Sanksi / Potongan Gaji" 
              onClose={() => { setShowManualDeduction(false); setManualDeductionMechanic(null); }}
            >
              <ManualDeductionForm 
                mechanics={mechanics}
                preselectedMechanicId={manualDeductionMechanic?.id}
                onSave={handleSaveManualDeduction}
                onCancel={() => { setShowManualDeduction(false); setManualDeductionMechanic(null); }}
              />
            </Modal>
          )}

          {showAddStock && (
            <Modal title="Tambah Stok Barang" onClose={() => setShowAddStock(false)}>
              <AddStockForm 
                parts={parts} 
                suppliers={suppliers}
                onSave={handleAddStock} 
              />
            </Modal>
          )}

          {editingPart && (
            <Modal title={editingPart.name ? "Edit Part & Lokasi Rak" : "Tambah Part & Atur Lokasi Rak"} onClose={() => setEditingPart(null)}>
              <PartForm 
                part={editingPart.name ? editingPart : undefined} 
                suppliers={suppliers}
                existingParts={parts}
                onSave={handleSavePart}
                onCancel={() => setEditingPart(null)}
              />
            </Modal>
          )}

          {editingCustomer && (
            <Modal title={editingCustomer.name ? "Edit Pelanggan" : "Tambah Pelanggan Baru"} onClose={() => setEditingCustomer(null)}>
              <CustomerForm 
                customer={editingCustomer.name ? editingCustomer : undefined} 
                onSave={handleSaveCustomer}
                onCancel={() => setEditingCustomer(null)}
              />
            </Modal>
          )}
          
          {editingExpense && (
            <Modal title={editingExpense.category ? "Catat Pengeluaran" : "Pengeluaran Baru"} onClose={() => setEditingExpense(null)}>
              <ExpenseForm 
                expense={editingExpense.amount ? editingExpense : undefined} 
                onSave={handleSaveExpense}
                onCancel={() => setEditingExpense(null)}
              />
            </Modal>
          )}

          {editingSupplier && (
            <Modal title={editingSupplier.name ? "Edit Supplier" : "Tambah Supplier Baru"} onClose={() => setEditingSupplier(null)}>
              <SupplierForm 
                supplier={editingSupplier.name ? editingSupplier : undefined} 
                onSave={handleSaveSupplier}
                onCancel={() => setEditingSupplier(null)}
              />
            </Modal>
          )}

          {editingStaff && (
            <Modal title={editingStaff.name ? "Edit Karyawan" : "Tambah Karyawan Baru"} onClose={() => setEditingStaff(null)}>
              <StaffForm 
                staff={editingStaff.name ? editingStaff : undefined} 
                onSave={handleSaveStaff}
                onCancel={() => setEditingStaff(null)}
              />
            </Modal>
          )}

          {selectedInvoiceId && (
            <InvoiceModal 
              service={services.find(s => s.id === selectedInvoiceId)}
              settings={companySettings}
              onClose={() => setSelectedInvoiceId(null)}
            />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
