import React, {useState, useMemo, useEffect} from 'react';
import {motion, AnimatePresence} from 'motion/react';
import {
    User as UserIcon,
    Search,
    Car,
    Wrench,
    Package,
    X,
    Star,
    Crown,
    Sparkles,
    Tag,
    Gift,
    Check,
    Percent,
    MapPin,
    Hash
} from 'lucide-react';
import {WorkshopService, SparePart, Customer, Vehicle, Mechanic, CompanySettings} from '../types';
import {CurrencyInput} from './CurrencyInput';
import {getAIDiagnosis} from '../services/geminiService';
import {getCustomerLoyaltyStats} from '../utils/loyalty';
import {formatPartLocation} from '../utils/inventory';
import {Modal} from './Modal';
import {cn} from '../lib/utils';

interface POSFormProps {
    onSave: (s: WorkshopService) => void;
    parts: SparePart[];
    customers: Customer[];
    vehicles: Vehicle[];
    mechanics: Mechanic[];
    services?: WorkshopService[];
    settings?: CompanySettings;
    initialCustomer?: Customer | null;
    initialPromoPercent?: number | null;
    onAddCustomer: (c: Customer) => void;
    onAddVehicle: (v: Vehicle) => void;
    initialCart?: Array<{ partId: string; quantity: number }>;
    initialService?: WorkshopService | null;
}

export const POSForm: React.FC<POSFormProps> = ({
                                                    onSave,
                                                    parts,
                                                    customers,
                                                    vehicles,
                                                    mechanics,
                                                    services = [],
                                                    settings,
                                                    initialCustomer,
                                                    initialPromoPercent,
                                                    onAddCustomer,
                                                    onAddVehicle,
                                                    initialCart,
                                                    initialService
                                                }) => {
    const activeMechanics = useMemo(() => mechanics.filter(m => m.status === 'Active'), [mechanics]);
    const defaultMec = activeMechanics[0] || mechanics[0];

    const [formData, setFormData] = useState({
        customerId: initialService?.customerId || (initialCustomer ? initialCustomer.id : ''),
        customerName: initialService?.customerName || (initialCustomer ? initialCustomer.name : ''),
        customerPhone: initialService?.customerPhone || (initialCustomer ? initialCustomer.phone : ''),
        vehicleId: initialService?.vehicleId || '', vehiclePlate: initialService?.vehiclePlate || '', vehicleModel: initialService?.vehicleModel || '',
        km: initialService ? String(initialService.kilometers || '') : '', complaint: initialService?.complaint || '', laborFee: '0',
        type: initialService?.receiptType === 'SALE' ? 'Retail' as const : 'Service' as const,
        mechanicId: initialService?.mechanicId || (defaultMec ? defaultMec.id : ''), mechanicName: initialService?.mechanicName || (defaultMec ? defaultMec.name : ''), mechanicBonusPercent: initialService?.mechanicBonusPercent ?? (defaultMec ? defaultMec.defaultBonusPercent : 15),
        serviceWarrantyDurationDays: String(initialService?.serviceWarrantyDurationDays ?? settings?.defaultServiceWarrantyDays ?? 7), serviceWarrantyTerms: initialService?.serviceWarrantyTermsSnapshot || settings?.serviceWarrantyTerms || settings?.warrantyTerms || '', paymentStatus: initialService?.paymentStatus || 'Unpaid' as 'Unpaid' | 'Paid'
    });

    const [usedParts, setUsedParts] = useState<Array<{
        partId: string;
        name: string;
        quantity: number;
        priceAtTime: number;
        normalPriceAtTime?: number;
        wholesaleType?: 'percent' | 'nominal' | 'unit_price';
        wholesaleValue?: number;
        wholesaleUnitPrice?: number;
        purchasePriceAtTime?: number;
        hasProductWarranty?: boolean;
        warrantyDurationDays?: number;
        warrantyTerms?: string
    }>>(initialService?.partsUsed || []);
    const [wholesalePartId, setWholesalePartId] = useState<string | null>(null);
    const [itemWholesaleType, setItemWholesaleType] = useState<'percent' | 'nominal' | 'unit_price'>('percent');
    const [itemWholesaleValue, setItemWholesaleValue] = useState('');
    const [serviceItems, setServiceItems] = useState<Array<{ name: string; price: string }>>(initialService?.serviceItems?.length ? initialService.serviceItems.map(item => ({ name: item.name, price: String(item.price) })) : [{name: '', price: ''}]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [, setDiagnosis] = useState('');
    const [showPartPicker, setShowPartPicker] = useState(false);
    const [partSearchQuery, setPartSearchQuery] = useState('');
    const [showCustomerSearch, setShowCustomerSearch] = useState(false);
    const [showVehiclePicker, setShowVehiclePicker] = useState(false);
    const [customerSearchQuery, setCustomerSearchQuery] = useState('');

    // Customer Loyalty Discount & Promo States
    const [discountAmount, setDiscountAmount] = useState<number>(initialService?.discountAmount || 0);
    const [discountPercent, setDiscountPercent] = useState<number | null>(initialPromoPercent || null);
    const [discountReason, setDiscountReason] = useState<string>(
        initialService?.discountReason || (initialPromoPercent ? `Promo Pelanggan Setia (${initialPromoPercent}%)` : '')
    );
    const [showCustomDiscount, setShowCustomDiscount] = useState<boolean>(false);
    const [customDiscountValue, setCustomDiscountValue] = useState<string>('');
    const [customDiscountType, setCustomDiscountType] = useState<'percent' | 'nominal'>('nominal');
    const [isWholesaleOpen, setIsWholesaleOpen] = useState(false);
    const [wholesaleValue, setWholesaleValue] = useState('');
    const [wholesaleType, setWholesaleType] = useState<'percent' | 'nominal'>('percent');

    // Customer matching for Loyalty Tracking
    const matchedCustomer = useMemo(() => {
        if (formData.customerId) {
            return customers.find(c => c.id === formData.customerId);
        }
        if (formData.customerName) {
            return customers.find(c => c.name.toLowerCase().trim() === formData.customerName.toLowerCase().trim());
        }
        return null;
    }, [customers, formData.customerId, formData.customerName]);

    const loyaltyStats = useMemo(() => {
        if (!matchedCustomer) return null;
        return getCustomerLoyaltyStats(matchedCustomer, services, settings);
    }, [matchedCustomer, services, settings]);

    const filteredCustomers = useMemo(() => customers.filter(c =>
        c.name.toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
        c.phone.includes(customerSearchQuery)
    ), [customers, customerSearchQuery]);

    const filteredPickerParts = useMemo(() => {
        if (!partSearchQuery.trim()) return parts;
        const q = partSearchQuery.toLowerCase();
        return parts.filter(p =>
            p.name.toLowerCase().includes(q) ||
            (p.sku && p.sku.toLowerCase().includes(q)) ||
            (p.rackCode && p.rackCode.toLowerCase().includes(q)) ||
            (p.shelfLevel && p.shelfLevel.toLowerCase().includes(q)) ||
            (p.binNumber && p.binNumber.toLowerCase().includes(q)) ||
            p.category.toLowerCase().includes(q)
        );
    }, [parts, partSearchQuery]);

    useEffect(() => {
        if (!initialCart?.length) return;
        setFormData(prev => ({...prev, type: 'Retail'}));
        setUsedParts(initialCart.map(entry => {
            const part = parts.find(item => item.id === entry.partId);
            if (!part) return null;
            const quantity = Math.max(1, Math.min(entry.quantity, part.stock));
            return {
                partId: part.id,
                name: part.name,
                quantity,
                priceAtTime: part.price,
                normalPriceAtTime: part.price,
                purchasePriceAtTime: part.purchasePrice,
                hasProductWarranty: part.hasProductWarranty,
                warrantyDurationDays: part.warrantyDurationDays,
                warrantyTerms: part.warrantyTerms
            };
        }).filter(Boolean) as any);
    }, [initialCart, parts]);

    const changePartQuantity = (partId: string, nextQuantity: number) => {
        const available = parts.find(part => part.id === partId)?.stock || 0;
        if (nextQuantity < 1 || nextQuantity > available) return;
        setUsedParts(prev => prev.map(item => item.partId === partId ? {...item, quantity: nextQuantity} : item));
    };

    const filteredVehicles = useMemo(() => vehicles.filter(v => v.customerId === formData.customerId), [vehicles, formData.customerId]);

    const totalParts = usedParts.reduce((acc, p) => acc + (p.priceAtTime * p.quantity), 0);
    const laborFeeNum = formData.type === 'Service' ? serviceItems.reduce((total, item) => total + Number(item.price || 0), 0) : 0;
    const subtotal = totalParts + laborFeeNum;

    // Auto-calculate percentage discount if discountPercent is set
    useEffect(() => {
        if (discountPercent !== null && discountPercent > 0) {
            const calculated = Math.round((subtotal * discountPercent) / 100);
            setDiscountAmount(calculated);
        }
    }, [subtotal, discountPercent]);

    const grandTotal = Math.max(0, subtotal - (discountAmount || 0));
    const canSubmit = !!formData.customerName.trim() && (formData.type === 'Retail' || (!!formData.vehiclePlate.trim() && !!formData.vehicleModel.trim()));

    const handleSelectCustomer = (customer: Customer) => {
        setFormData(prev => ({
            ...prev,
            customerId: customer.id,
            customerName: customer.name,
            customerPhone: customer.phone,
            vehicleId: '',
            vehiclePlate: '',
            vehicleModel: ''
        }));

        // Check loyalty promo eligibility for newly selected customer
        const stats = getCustomerLoyaltyStats(customer, services, settings);
        if (stats.eligibleDiscountPercent > 0) {
            setDiscountPercent(stats.eligibleDiscountPercent);
            setDiscountReason(`Promo ${stats.tierLabel} (${stats.eligibleDiscountPercent}%)`);
        } else {
            setDiscountPercent(null);
            setDiscountAmount(0);
            setDiscountReason('');
        }

        setShowCustomerSearch(false);
    };

    const handleSelectVehicle = (vehicle: Vehicle) => {
        setFormData(prev => ({
            ...prev,
            vehicleId: vehicle.id,
            vehiclePlate: vehicle.plateNumber,
            vehicleModel: vehicle.model
        }));
        setShowVehiclePicker(false);
    };

    const addPart = (part: SparePart) => {
        setUsedParts(prev => {
            const existing = prev.find(p => p.partId === part.id);
            if (existing) {
                return prev.map(p => p.partId === part.id ? {...p, quantity: p.quantity + 1} : p);
            }
            return [...prev, {
                partId: part.id,
                name: `${part.name}${part.size ? ` (${part.variantName || 'Ukuran'}: ${part.size})` : ''}`,
                quantity: 1,
                priceAtTime: part.price,
                purchasePriceAtTime: part.purchasePrice,
                hasProductWarranty: part.hasProductWarranty,
                warrantyDurationDays: part.warrantyDurationDays,
                warrantyTerms: part.warrantyTerms
            }];
        });
        setShowPartPicker(false);
    };

    const applyItemWholesale = (partId: string) => {
        const value = Number(itemWholesaleValue);
        const item = usedParts.find(part => part.partId === partId);
        if (!item || !Number.isFinite(value) || value <= 0) return;
        const normal = item.normalPriceAtTime || item.priceAtTime;
        const unitPrice = itemWholesaleType === 'percent' ? normal * (1 - value / 100) : itemWholesaleType === 'nominal' ? normal - value : value;
        if ((itemWholesaleType === 'percent' && value > 100) || unitPrice < 0) return alert('Nilai harga grosir tidak valid.');
        setUsedParts(prev => prev.map(part => part.partId === partId ? {
            ...part,
            normalPriceAtTime: normal,
            priceAtTime: Math.round(unitPrice),
            wholesaleType: itemWholesaleType,
            wholesaleValue: value,
            wholesaleUnitPrice: Math.round(unitPrice)
        } : part));
        setWholesalePartId(null);
        setItemWholesaleValue('');
    };
    const clearItemWholesale = (partId: string) => setUsedParts(prev => prev.map(part => part.partId === partId ? {
        ...part,
        priceAtTime: part.normalPriceAtTime || part.priceAtTime,
        wholesaleType: undefined,
        wholesaleValue: undefined,
        wholesaleUnitPrice: undefined
    } : part));

    const handleApplyPromoPercent = (percent: number, reason: string) => {
        setDiscountPercent(percent);
        setDiscountReason(reason);
        setShowCustomDiscount(false);
    };

    const handleApplyNominalDiscount = (nominal: number, reason: string) => {
        setDiscountPercent(null);
        setDiscountAmount(nominal);
        setDiscountReason(reason);
        setShowCustomDiscount(false);
    };

    const handleApplyCustomDiscount = () => {
        const val = Number(customDiscountValue);
        if (isNaN(val) || val <= 0) return;

        if (customDiscountType === 'percent') {
            handleApplyPromoPercent(val, `Diskon Promo Kustom (${val}%)`);
        } else {
            handleApplyNominalDiscount(val, `Potongan Promo Rp ${val.toLocaleString()}`);
        }
    };

    const handleApplyWholesaleDiscount = () => {
        const value = Number(wholesaleValue);
        if (!Number.isFinite(value) || value <= 0) return;
        if (wholesaleType === 'percent') {
            if (value > 100) return alert('Potongan persentase maksimal 100%.');
            handleApplyPromoPercent(value, `Harga Grosir (${value}%)`);
        } else {
            if (value > subtotal) return alert('Potongan grosir tidak boleh melebihi subtotal.');
            handleApplyNominalDiscount(value, `Harga Grosir Rp ${value.toLocaleString('id-ID')}`);
        }
        setIsWholesaleOpen(false);
    };

    const handleClearDiscount = () => {
        setDiscountPercent(null);
        setDiscountAmount(0);
        setDiscountReason('');
        setShowCustomDiscount(false);
        setCustomDiscountValue('');
    };

    const handleAIDiagnosis = async () => {
        if (!formData.complaint || !formData.vehicleModel) return;
        setIsAnalyzing(true);
        try {
            const res = await getAIDiagnosis(formData.complaint, formData.vehicleModel);
            setDiagnosis(res);
        } catch {
            setDiagnosis("Recommend checking engine and sensors based on reported issues.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="space-y-6 pb-20">
            <div className="p-1 bg-slate-100 rounded-2xl flex gap-1">
                {(['Service', 'Retail'] as const).map((t) => (
                    <button
                        key={t}
                        onClick={() => {
                            setFormData(prev => ({...prev, type: t as any}));
                            handleClearDiscount();
                            setIsWholesaleOpen(false);
                            setWholesaleValue('');
                        }}
                        className={cn(
                            "flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                            formData.type === t ? "bg-white text-blue-600 shadow-sm" : "text-slate-400"
                        )}
                    >
                        {t === 'Service' ? 'Repair & Service' : 'Direct Sale'}
                    </button>
                ))}
            </div>

            <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm space-y-6">
                {/* Customer Selection & Loyalty Status Card */}
                <div className="space-y-4">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <UserIcon className="w-4 h-4 text-blue-600"/> Pelanggan
                    </h4>
                    <div className="flex gap-2">
                        <input
                            value={formData.customerName}
                            onChange={e => setFormData({...formData, customerName: e.target.value})}
                            placeholder="Nama Pelanggan / Guest"
                            className="flex-1 h-14 px-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none text-sm font-bold focus:border-blue-200 transition-all"
                        />
                        <button
                            onClick={() => setShowCustomerSearch(true)}
                            aria-label="Cari Pelanggan"
                            className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 hover:text-blue-600 transition-all"
                        >
                            <Search className="w-5 h-5"/>
                        </button>
                    </div>

                    {/* Real-time Loyalty Banner for Selected/Recognized Customer */}
                    {formData.type === 'Service' && loyaltyStats && (
                        <motion.div
                            initial={{opacity: 0, y: -5}}
                            animate={{opacity: 1, y: 0}}
                            className={`p-4 rounded-2xl border space-y-3 ${
                                loyaltyStats.totalVisits >= 3
                                    ? 'bg-amber-50/70 border-amber-200 text-amber-950'
                                    : 'bg-slate-50 border-slate-200 text-slate-800'
                            }`}
                        >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-2.5">
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black ${
                                        loyaltyStats.tier === 'VIP' ? 'bg-purple-600 text-white' :
                                            loyaltyStats.tier === 'Gold' ? 'bg-amber-500 text-white' :
                                                loyaltyStats.tier === 'Silver' ? 'bg-blue-600 text-white' :
                                                    'bg-slate-200 text-slate-700'
                                    }`}>
                                        {loyaltyStats.tier === 'VIP' ? <Crown className="w-4 h-4"/> :
                                            <Star className="w-4 h-4 fill-current"/>}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-black">{loyaltyStats.tierLabel}</span>
                                            <span
                                                className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-current">
                        {loyaltyStats.totalVisits}x Kunjungan Servis
                      </span>
                                        </div>
                                        <p className="text-[11px] text-slate-600 mt-0.5">
                                            Total
                                            Belanja: <strong>Rp {(loyaltyStats.totalSpent || 0).toLocaleString()}</strong>
                                        </p>
                                    </div>
                                </div>

                                {loyaltyStats.eligibleDiscountPercent > 0 && (
                                    <span
                                        className="px-3 py-1 bg-emerald-600 text-white rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm">
                    <Sparkles className="w-3 h-3"/> Berhak Diskon {loyaltyStats.eligibleDiscountPercent}%
                  </span>
                                )}
                            </div>

                            {/* Quick Loyalty Promo Action Buttons */}
                            <div className="pt-2 border-t border-current/10 space-y-2">
                                <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1">
                                    <Gift className="w-3.5 h-3.5 text-blue-600"/> Terapkan Diskon / Promo Pelanggan:
                                </p>

                                <div className="flex flex-wrap gap-2">
                                    {loyaltyStats.eligibleDiscountPercent > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => handleApplyPromoPercent(
                                                loyaltyStats.eligibleDiscountPercent,
                                                `Promo ${loyaltyStats.tierLabel} (${loyaltyStats.eligibleDiscountPercent}%)`
                                            )}
                                            className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                                                discountPercent === loyaltyStats.eligibleDiscountPercent
                                                    ? 'bg-emerald-600 text-white shadow-sm'
                                                    : 'bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-300'
                                            }`}
                                        >
                                            <Sparkles className="w-3 h-3"/>
                                            <span>Gunakan Promo {loyaltyStats.eligibleDiscountPercent}%</span>
                                        </button>
                                    )}

                                    <button
                                        type="button"
                                        onClick={() => handleApplyNominalDiscount(25000, 'Potongan Promo Spesial Rp 25.000')}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                                            discountAmount === 25000 && !discountPercent
                                                ? 'bg-blue-600 text-white shadow-sm'
                                                : 'bg-white hover:bg-blue-50 text-blue-700 border border-blue-200'
                                        }`}
                                    >
                                        Potongan Rp 25.000
                                    </button>

                                    {formData.type === 'Service' && laborFeeNum > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => handleApplyNominalDiscount(laborFeeNum, 'Gratis Biaya Jasa Servis')}
                                            className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                                                discountAmount === laborFeeNum && discountReason === 'Gratis Biaya Jasa Servis'
                                                    ? 'bg-purple-600 text-white shadow-sm'
                                                    : 'bg-white hover:bg-purple-50 text-purple-700 border border-purple-200'
                                            }`}
                                        >
                                            Gratis Biaya Jasa
                                        </button>
                                    )}

                                    <button
                                        type="button"
                                        onClick={() => setShowCustomDiscount(!showCustomDiscount)}
                                        className="px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-white hover:bg-slate-100 text-slate-700 border border-slate-200"
                                    >
                                        {showCustomDiscount ? 'Tutup Kustom' : 'Kustom...'}
                                    </button>
                                </div>

                                {/* Custom discount input field */}
                                {showCustomDiscount && (
                                    <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2.5 mt-2">
                                        <div className="flex items-center gap-2">
                                            <div className="flex bg-slate-100 p-0.5 rounded-lg text-[10px] font-bold">
                                                <button
                                                    type="button"
                                                    onClick={() => setCustomDiscountType('nominal')}
                                                    className={`px-2 py-1 rounded ${customDiscountType === 'nominal' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500'}`}
                                                >
                                                    Rupiah (Rp)
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setCustomDiscountType('percent')}
                                                    className={`px-2 py-1 rounded ${customDiscountType === 'percent' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500'}`}
                                                >
                                                    Persen (%)
                                                </button>
                                            </div>
                                            <input
                                                type="number"
                                                placeholder={customDiscountType === 'nominal' ? '50000' : '10'}
                                                value={customDiscountValue}
                                                onChange={e => setCustomDiscountValue(e.target.value)}
                                                className="flex-1 h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                                            />
                                            <button
                                                type="button"
                                                onClick={handleApplyCustomDiscount}
                                                className="px-3 h-9 bg-blue-600 text-white text-xs font-bold rounded-lg uppercase"
                                            >
                                                Terapkan
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </div>

                {false && formData.type === 'Retail' && (
                    <section className="mt-4 rounded-2xl border border-amber-200 bg-amber-50/60 p-4 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                            <div><p className="text-xs font-black text-amber-950">Harga Grosir</p><p
                                className="text-[10px] text-amber-800">Untuk pembelian jumlah besar. Potongan berlaku ke
                                seluruh barang pada transaksi ini.</p></div>
                            <button type="button" onClick={() => setIsWholesaleOpen(value => !value)}
                                    className="shrink-0 rounded-xl bg-amber-500 px-3 py-2 text-[10px] font-black text-white">{isWholesaleOpen ? 'Tutup' : 'Atur Harga Grosir'}</button>
                        </div>
                        {discountReason.startsWith('Harga Grosir') && <div
                            className="flex items-center justify-between rounded-xl bg-white px-3 py-2 text-[11px] font-bold text-amber-900">
                            <span>{discountReason}</span>
                            <button type="button" onClick={handleClearDiscount} className="text-rose-600">Hapus</button>
                        </div>}
                        {isWholesaleOpen && <div className="rounded-xl border border-amber-200 bg-white p-3 space-y-3">
                            <div className="grid grid-cols-2 gap-2">
                                <button type="button" onClick={() => setWholesaleType('percent')}
                                        className={`h-9 rounded-lg text-xs font-bold ${wholesaleType === 'percent' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-600'}`}>Potongan
                                    %
                                </button>
                                <button type="button" onClick={() => setWholesaleType('nominal')}
                                        className={`h-9 rounded-lg text-xs font-bold ${wholesaleType === 'nominal' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-600'}`}>Potongan
                                    Rp
                                </button>
                            </div>
                            <div className="flex gap-2"><input type="number" min="0"
                                                               max={wholesaleType === 'percent' ? 100 : subtotal}
                                                               placeholder={wholesaleType === 'percent' ? 'Contoh: 10' : 'Contoh: 50000'}
                                                               value={wholesaleValue}
                                                               onChange={e => setWholesaleValue(e.target.value)}
                                                               className="h-10 min-w-0 flex-1 rounded-xl border px-3 text-xs font-bold"/>
                                <button type="button" onClick={handleApplyWholesaleDiscount}
                                        className="h-10 rounded-xl bg-amber-600 px-4 text-xs font-black text-white">Terapkan
                                </button>
                            </div>
                            <p className="text-[10px] text-slate-500">Subtotal barang:
                                Rp {totalParts.toLocaleString('id-ID')}</p>
                        </div>}
                    </section>
                )}

                {formData.type === 'Service' && (
                    <motion.div initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} className="space-y-4">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Car className="w-4 h-4 text-blue-600"/> Kendaraan
                        </h4>
                        <div className="grid grid-cols-1 gap-3">
                            <div className="grid grid-cols-2 gap-2">
                                <input
                                    value={formData.vehiclePlate}
                                    onChange={e => setFormData({...formData, vehiclePlate: e.target.value})}
                                    placeholder="Plat Nomor"
                                    className="h-14 px-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none text-sm font-bold focus:border-blue-200 transition-all uppercase"
                                />
                                <input
                                    value={formData.vehicleModel}
                                    onChange={e => setFormData({...formData, vehicleModel: e.target.value})}
                                    placeholder="Model (e.g. Vario)"
                                    className="h-14 px-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none text-sm font-bold focus:border-blue-200 transition-all"
                                />
                            </div>
                            <button
                                onClick={() => setShowVehiclePicker(true)}
                                className="w-full py-2 text-[10px] font-black text-blue-600 uppercase tracking-widest hover:bg-blue-50 rounded-xl transition-all"
                            >
                                Cari Kendaraan Terdaftar
                            </button>

                            <div className="grid grid-cols-2 gap-3 mt-2">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Current
                                        KM</label>
                                    <input
                                        value={formData.km}
                                        onChange={e => setFormData({...formData, km: e.target.value})}
                                        type="number" placeholder="12500"
                                        className="w-full h-12 px-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none text-sm font-bold"
                                    />
                                </div>
                            </div>

                            <div className="p-3.5 bg-emerald-50/70 border border-emerald-100 rounded-2xl space-y-2.5">
                                <div className="flex items-center justify-between"><label
                                    className="text-[10px] font-black text-emerald-900 uppercase">Rincian Jasa
                                    Servis</label>
                                    <button type="button"
                                            onClick={() => setServiceItems(prev => [...prev, {name: '', price: ''}])}
                                            className="text-[10px] font-black text-emerald-700">+ Tambah Jasa
                                    </button>
                                </div>
                                {serviceItems.map((item, index) => <div key={index} className="flex gap-2"><input
                                    value={item.name}
                                    onChange={e => setServiceItems(prev => prev.map((v, i) => i === index ? {
                                        ...v,
                                        name: e.target.value
                                    } : v))} placeholder="Contoh: Servis Mesin"
                                    className="flex-1 h-10 px-3 bg-white border border-emerald-200 rounded-xl text-xs font-bold"/><CurrencyInput
                                    value={item.price}
                                    onValueChange={value => setServiceItems(prev => prev.map((v, i) => i === index ? {
                                        ...v,
                                        price: String(value)
                                    } : v))} placeholder="Harga"
                                    className="w-28 h-10 px-3 bg-white border border-emerald-200 rounded-xl text-xs font-bold"/>{serviceItems.length > 1 &&
                                    <button type="button"
                                            onClick={() => setServiceItems(prev => prev.filter((_, i) => i !== index))}
                                            className="text-rose-600 font-black px-1">×</button>}</div>)}
                                <div className="flex justify-between text-xs font-black text-emerald-800"><span>Total Jasa</span><span>Rp {laborFeeNum.toLocaleString()}</span>
                                </div>
                            </div>

                            {/* Pemilihan Mekanik & Konfigurasi Bonus */}
                            <div className="p-4 bg-blue-50/70 border border-blue-100 rounded-2xl space-y-3 mt-3">
                                <div className="flex items-center justify-between">
                                    <label
                                        className="text-[10px] font-black text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                                        <Wrench className="w-3.5 h-3.5 text-blue-600"/> Teknisi / Mekanik yang
                                        Mengerjakan
                                    </label>
                                    <span
                                        className="text-[9px] font-bold bg-white text-blue-600 px-2 py-0.5 rounded border border-blue-100 uppercase">
                    Dicatat Kasir/PIC
                  </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-bold text-slate-500 uppercase">Pilih
                                            Mekanik</label>
                                        <select
                                            value={formData.mechanicId}
                                            onChange={e => {
                                                const mId = e.target.value;
                                                const mec = mechanics.find(m => m.id === mId);
                                                setFormData(prev => ({
                                                    ...prev,
                                                    mechanicId: mId,
                                                    mechanicName: mec ? mec.name : '',
                                                    mechanicBonusPercent: mec ? mec.defaultBonusPercent : prev.mechanicBonusPercent
                                                }));
                                            }}
                                            className="w-full h-12 px-4 bg-white border border-blue-200 rounded-xl outline-none text-xs font-bold text-slate-800"
                                        >
                                            <option value="">-- Pilih Mekanik --</option>
                                            {mechanics.filter(m => m.status === 'Active').map(m => (
                                                <option key={m.id} value={m.id}>
                                                    {m.name} ({m.specialty}) - Bonus {m.defaultBonusPercent}%
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[9px] font-bold text-slate-500 uppercase">Persentase
                                            Bonus Transaksi (%)</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={formData.mechanicBonusPercent}
                                                onChange={e => setFormData(prev => ({
                                                    ...prev,
                                                    mechanicBonusPercent: Number(e.target.value)
                                                }))}
                                                className="w-full h-12 pl-4 pr-8 bg-white border border-blue-200 rounded-xl outline-none text-xs font-bold text-blue-700"
                                            />
                                            <span
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">%</span>
                                        </div>
                                    </div>
                                </div>

                                {formData.mechanicId && (
                                    <div
                                        className="flex items-center justify-between text-[11px] bg-white p-2.5 rounded-xl border border-blue-100">
                                        <span className="text-slate-600">Estimasi Bonus ({formData.mechanicBonusPercent}% dari jasa Rp {laborFeeNum.toLocaleString()}):</span>
                                        <span className="font-black text-emerald-600">
                      Rp {Math.round((laborFeeNum * (formData.mechanicBonusPercent || 0)) / 100).toLocaleString()}
                    </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}

                <div className="space-y-4 pt-2">
                    <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Package className="w-4 h-4 text-blue-600"/> Parts & Diagnosis
                        </h4>
                        {formData.type === 'Service' && (
                            <button
                                onClick={handleAIDiagnosis}
                                disabled={!formData.complaint || isAnalyzing}
                                className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-wider hover:bg-blue-100 transition-all disabled:opacity-50"
                            >
                                {isAnalyzing ? 'Analyzing...' : 'AI Engine'}
                            </button>
                        )}
                    </div>

                    <div className="space-y-3">
                        {formData.type === 'Service' && (
                            <textarea
                                value={formData.complaint}
                                onChange={e => setFormData({...formData, complaint: e.target.value})}
                                placeholder="Complaint or issues details..."
                                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none text-sm font-medium resize-none min-h-[100px]"
                            />
                        )}

                        <div
                            className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                            <span>Selected Parts ({usedParts.length})</span>
                            <button onClick={() => setShowPartPicker(true)} className="text-blue-600 font-black">+ Add
                                Part
                            </button>
                        </div>

                        <div className="space-y-2">
                            {usedParts.map(p => {
                                const partObj = parts.find(x => x.id === p.partId);
                                return (
                                    <div key={p.partId}
                                         className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl">
                                        <div className="flex-1 min-w-0 pr-2">
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                <p className="text-xs font-bold text-slate-800 truncate">{p.name}</p>
                                                {partObj?.sku && (
                                                    <span
                                                        className="text-[9px] font-mono font-bold bg-blue-50 text-blue-700 px-1.5 py-0.2 rounded border border-blue-100">
                            {partObj.sku}
                          </span>
                                                )}
                                            </div>
                                            <div className="flex flex-wrap items-center gap-2 mt-1">
                                                <p className="text-[10px] text-slate-400 font-bold uppercase">{p.quantity}x
                                                    • Rp {(p.priceAtTime || 0).toLocaleString()}</p>
                                                {partObj?.rackCode && (
                                                    <span
                                                        className="text-[10px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/60 flex items-center gap-1">
                            <MapPin className="w-2.5 h-2.5 text-amber-600"/>
                                                        {partObj.rackCode} {partObj.shelfLevel ? `• ${partObj.shelfLevel}` : ''} {partObj.binNumber ? `(${partObj.binNumber})` : ''}
                          </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="mt-4 flex items-center gap-4 border-t border-slate-100 pt-3">

                                            {/* Tombol Harga Grosir */}
                                            {formData.type === 'Retail' && !p.wholesaleType && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setWholesalePartId(p.partId);
                                                        setItemWholesaleValue('');
                                                    }}
                                                    className="shrink-0 rounded-lg border border-amber-200 bg-white px-2 py-1.5 text-[10px] font-black text-amber-700 transition-colors hover:bg-amber-100 hover:text-amber-900 active:scale-[0.98]"
                                                >
                                                    + Atur harga grosir produk ini
                                                </button>
                                            )}

                                            {/* Card pengaturan harga grosir */}
                                            {formData.type === 'Retail' && wholesalePartId === p.partId && (
                                                <div
                                                    className="ml-auto rounded-xl border border-amber-200 bg-amber-50 p-2 space-y-2">
                                                    <div className="grid grid-cols-3 gap-1.5">
                                                        <button
                                                            type="button"
                                                            onClick={() => setItemWholesaleType('percent')}
                                                            className={`h-8 rounded-lg px-3 text-[10px] font-black transition-colors ${
                                                                itemWholesaleType === 'percent'
                                                                    ? 'bg-amber-500 text-white shadow-sm'
                                                                    : 'bg-white text-slate-600 hover:bg-amber-100 hover:text-amber-900'
                                                            }`}
                                                        >
                                                            %
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() => setItemWholesaleType('nominal')}
                                                            className={`h-8 rounded-lg px-3 text-[10px] font-black transition-colors ${
                                                                itemWholesaleType === 'nominal'
                                                                    ? 'bg-amber-500 text-white shadow-sm'
                                                                    : 'bg-white text-slate-600 hover:bg-amber-100 hover:text-amber-900'
                                                            }`}
                                                        >
                                                            Pot. Rp
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() => setItemWholesaleType('unit_price')}
                                                            className={`h-8 rounded-lg px-3 text-[10px] font-black transition-colors ${
                                                                itemWholesaleType === 'unit_price'
                                                                    ? 'bg-amber-500 text-white shadow-sm'
                                                                    : 'bg-white text-slate-600 hover:bg-amber-100 hover:text-amber-900'
                                                            }`}
                                                        >
                                                            Harga Rp
                                                        </button>
                                                    </div>

                                                    <div className="flex items-center gap-1.5">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            value={itemWholesaleValue}
                                                            onChange={e => setItemWholesaleValue(e.target.value)}
                                                            placeholder={itemWholesaleType === 'percent' ? '10' : '50000'}
                                                            className="h-8 w-32 rounded-lg border px-2 text-[10px]"
                                                        />

                                                        <button
                                                            type="button"
                                                            onClick={() => applyItemWholesale(p.partId)}
                                                            className="h-8 rounded-lg bg-amber-600 px-3 text-[10px] font-bold text-white"
                                                        >
                                                            Terapkan
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() => setWholesalePartId(null)}
                                                            className="h-8 rounded-lg border bg-white px-3 text-[10px]"
                                                        >
                                                            Batal
                                                        </button>
                                                    </div>

                                                    <p className="text-[9px] text-slate-500">
                                                        Harga normal:
                                                        Rp {(p.normalPriceAtTime || p.priceAtTime).toLocaleString()} /
                                                        unit
                                                    </p>
                                                </div>
                                            )}

                                            {/* Spacer agar quantity tetap di kanan */}
                                            <div className={wholesalePartId === p.partId ? "w-2 shrink-0" : "flex-1"}/>

                                            {/* Quantity */}
                                            <div className="flex shrink-0 items-center gap-2">
                                                <button
                                                    type="button"
                                                    disabled={p.quantity <= 1}
                                                    onClick={() => changePartQuantity(p.partId, p.quantity - 1)}
                                                    className="h-7 w-7 rounded-lg border text-sm font-black disabled:opacity-30">−
                                                </button>

                                                <span
                                                    className="min-w-8 text-center text-xs font-black">{p.quantity}</span>

                                                <button
                                                    type="button"
                                                    disabled={
                                                        p.quantity >=
                                                        (parts.find(item => item.id === p.partId)?.stock || 0)
                                                    }
                                                    onClick={() => changePartQuantity(p.partId, p.quantity + 1)}
                                                    className="h-7 w-7 rounded-lg border text-sm font-black disabled:opacity-30"
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setUsedParts(prev => prev.filter(x => x.partId !== p.partId))}
                                            className="p-1 text-slate-400 hover:text-rose-500">
                                            <X className="w-4 h-4"/>
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {formData.type === 'Service' && (
                    <div className="mt-4 p-4 rounded-2xl border border-blue-100 bg-blue-50/50 space-y-3">
                        <p className="text-[10px] font-black text-blue-800 uppercase">Garansi Jasa untuk Transaksi
                            Ini</p>
                        <label className="block text-[10px] font-bold text-slate-600">Durasi (hari)<input type="number"
                                                                                                          min="0"
                                                                                                          value={formData.serviceWarrantyDurationDays}
                                                                                                          onChange={e => setFormData({
                                                                                                              ...formData,
                                                                                                              serviceWarrantyDurationDays: e.target.value
                                                                                                          })}
                                                                                                          className="mt-1 h-10 w-full rounded-xl border bg-white px-3 text-xs font-bold"/></label>
                        <label className="block text-[10px] font-bold text-slate-600">Ketentuan garansi<textarea
                            value={formData.serviceWarrantyTerms}
                            onChange={e => setFormData({...formData, serviceWarrantyTerms: e.target.value})}
                            className="mt-1 min-h-16 w-full rounded-xl border bg-white px-3 py-2 text-xs"/></label>
                    </div>
                )}

                <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-3"><p
                    className="mb-2 text-[10px] font-black uppercase text-slate-500">Status Pembayaran</p>
                    <div className="grid grid-cols-2 gap-2">
                        <button type="button" onClick={() => setFormData({...formData, paymentStatus: 'Paid'})}
                                className={`h-10 rounded-xl text-xs font-black ${formData.paymentStatus === 'Paid' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}>Lunas
                        </button>
                        <button type="button" onClick={() => setFormData({...formData, paymentStatus: 'Unpaid'})}
                                className={`h-10 rounded-xl text-xs font-black ${formData.paymentStatus === 'Unpaid' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-600'}`}>Belum
                            Lunas
                        </button>
                    </div>
                </div>

                {/* Bill Summary & Promo Calculation */}
                <div className="pt-4 space-y-4 bg-slate-50 -mx-6 px-6 py-6 border-t border-slate-100">
                    <div className="space-y-2 pb-2 border-b border-slate-200/60">
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-500 font-medium">Subtotal (Jasa & Sparepart)</span>
                            <span className="font-bold text-slate-800">Rp {subtotal.toLocaleString()}</span>
                        </div>

                        {discountAmount > 0 && (
                            <div className="flex justify-between items-center text-xs">
                <span className="text-emerald-700 font-black flex items-center gap-1">
                  <Tag className="w-3 h-3"/> {discountReason || 'Potongan Promo'}
                </span>
                                <div className="flex items-center gap-2">
                                    <span
                                        className="font-black text-emerald-600">- Rp {discountAmount.toLocaleString()}</span>
                                    <button
                                        type="button"
                                        onClick={handleClearDiscount}
                                        className="text-slate-400 hover:text-rose-600 p-0.5"
                                        title="Hapus Diskon"
                                    >
                                        <X className="w-3.5 h-3.5"/>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-between items-center">
                        <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Total Tagihan</span>
                            {discountAmount > 0 && (
                                <span
                                    className="text-[10px] font-bold text-emerald-600">Hemat Rp {discountAmount.toLocaleString()}</span>
                            )}
                        </div>
                        <span
                            className="text-2xl font-black text-blue-600">Rp {(grandTotal || 0).toLocaleString()}</span>
                    </div>

                    <button
                        disabled={!canSubmit}
                        onClick={() => onSave({
                            id: initialService?.id || `SRV-${Math.floor(Math.random() * 1000)}`,
                            customerId: formData.customerId,
                            customerName: formData.customerName,
                            customerPhone: formData.customerPhone || undefined,
                            vehicleId: formData.vehicleId,
                            vehiclePlate: formData.vehiclePlate || 'RETAIL',
                            vehicleModel: formData.vehicleModel || 'Direct Sale',
                            kilometers: Number(formData.km || 0),
                            complaint: formData.complaint,
                            status: initialService?.status || (formData.type === 'Retail' ? 'Done' : 'In Progress'),
                            createdAt: initialService?.createdAt || new Date().toISOString(),
                            partsUsed: usedParts,
                            serviceItems: formData.type === 'Retail' ? [] : serviceItems.map(item => ({
                                name: item.name.trim(),
                                price: Number(item.price || 0)
                            })).filter(item => item.name),
                            laborFee: formData.type === 'Retail' ? 0 : laborFeeNum,
                            totalAmount: grandTotal,
                            discountAmount: discountAmount > 0 ? discountAmount : undefined,
                            discountReason: discountAmount > 0 ? discountReason : undefined,
                            paymentStatus: formData.paymentStatus,
                            mechanicId: formData.type === 'Retail' ? undefined : (formData.mechanicId || undefined),
                            mechanicName: formData.type === 'Retail' ? undefined : (formData.mechanicName || undefined),
                            mechanicBonusPercent: formData.type === 'Retail' ? 0 : Number(formData.mechanicBonusPercent || 0),
                            mechanicBonusAmount: formData.type === 'Retail' ? 0 : Math.round((laborFeeNum * Number(formData.mechanicBonusPercent || 0)) / 100),
                            receiptType: formData.type === 'Retail' ? 'SALE' : 'SERVICE',
                            serviceWarrantyDurationDays: formData.type === 'Retail' ? 0 : Number(formData.serviceWarrantyDurationDays || 0),
                            serviceWarrantyTermsSnapshot: formData.type === 'Retail' ? undefined : formData.serviceWarrantyTerms
                            ,version: initialService?.version
                        })}
                        className="w-full h-16 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-blue-200 active:scale-95 transition-all disabled:grayscale disabled:opacity-50"
                    >
                        {initialService ? 'Simpan Perubahan Transaksi' : (formData.type === 'Retail' ? 'Complete Sale' : 'Submit Order')}
                    </button>
                </div>
            </div>

            {/* Part Picker with SKU & Warehouse Rack Locator */}
            <AnimatePresence>
                {showPartPicker && (
                    <Modal title="Pilih Sparepart & Cek Letak Rak" onClose={() => setShowPartPicker(false)}>
                        <div className="space-y-3">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
                                <input
                                    placeholder="Cari nama part, SKU (e.g. OLI-001), rak (e.g. Rak A)..."
                                    value={partSearchQuery}
                                    onChange={e => setPartSearchQuery(e.target.value)}
                                    className="w-full h-11 pl-11 pr-4 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs font-bold text-slate-800"
                                    autoFocus
                                />
                                {partSearchQuery && (
                                    <button
                                        onClick={() => setPartSearchQuery('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-bold"
                                    >
                                        Hapus
                                    </button>
                                )}
                            </div>

                            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                                {filteredPickerParts.map(part => {
                                    const loc = formatPartLocation(part);
                                    const isOutOfStock = part.stock <= 0;
                                    return (
                                        <button
                                            key={part.id}
                                            disabled={isOutOfStock}
                                            onClick={() => addPart(part)}
                                            className="w-full p-3 bg-slate-50 hover:bg-blue-50/70 border border-slate-100 hover:border-blue-200 rounded-2xl transition-all disabled:opacity-50 text-left flex items-start justify-between gap-3 group"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <p className="text-xs font-black text-slate-900 truncate">{part.name}</p>
                                                    {part.size && <span
                                                        className="text-[9px] font-black bg-violet-50 text-violet-700 px-1.5 py-0.5 rounded border border-violet-100">{part.variantName || 'Ukuran'}: {part.size}</span>}
                                                    {part.sku && (
                                                        <span
                                                            className="text-[9px] font-mono font-black bg-blue-50 text-blue-700 px-1.5 py-0.2 rounded border border-blue-100 flex items-center gap-0.5">
                                <Hash className="w-2.5 h-2.5"/>
                                                            {part.sku}
                              </span>
                                                    )}
                                                </div>

                                                <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span className="text-[10px] text-slate-500 font-bold uppercase">
                              {part.category} • Stok: <strong
                                className={part.stock <= part.minStock ? "text-rose-600" : "text-emerald-600"}>{part.stock} pcs</strong>
                            </span>

                                                    {/* Location Badge */}
                                                    <span
                                                        className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/80 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-amber-600 shrink-0"/>
                              <span>{loc}</span>
                            </span>
                                                </div>

                                                {part.locationNotes && (
                                                    <p className="text-[10px] text-slate-400 italic mt-0.5 truncate">
                                                        💡 {part.locationNotes}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="text-right shrink-0">
                                                <p className="text-xs font-black text-slate-900 font-mono">Rp {(part.price || 0).toLocaleString()}</p>
                                                <span
                                                    className="text-[9px] font-black text-blue-600 group-hover:underline mt-1 block">
                            + Tambah
                          </span>
                                            </div>
                                        </button>
                                    );
                                })}

                                {filteredPickerParts.length === 0 && (
                                    <div
                                        className="p-8 text-center text-xs font-bold text-slate-400 bg-slate-50 rounded-2xl">
                                        Tidak ada part yang cocok dengan "{partSearchQuery}".
                                    </div>
                                )}
                            </div>
                        </div>
                    </Modal>
                )}
            </AnimatePresence>

            {/* Customer Search with Loyalty Highlighting */}
            <AnimatePresence>
                {showCustomerSearch && (
                    <Modal title="Cari / Pilih Pelanggan" onClose={() => setShowCustomerSearch(false)}>
                        <div className="space-y-4">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
                                <input
                                    placeholder="Ketik nama atau no. telepon..."
                                    value={customerSearchQuery}
                                    onChange={e => setCustomerSearchQuery(e.target.value)}
                                    className="w-full h-12 pl-12 pr-4 bg-slate-50 border border-slate-100 rounded-xl outline-none text-sm font-bold"
                                />
                            </div>
                            <div className="max-h-60 overflow-y-auto space-y-2">
                                {filteredCustomers.map(c => {
                                    const stats = getCustomerLoyaltyStats(c, services, settings);
                                    const isFrequent = stats.totalVisits >= (settings?.loyaltySilverVisits ?? 3);

                                    return (
                                        <button
                                            key={c.id}
                                            onClick={() => handleSelectCustomer(c)}
                                            className={`w-full p-4 rounded-xl text-left transition-colors flex items-center justify-between ${
                                                isFrequent ? 'bg-amber-50/70 hover:bg-amber-100/70 border border-amber-200' : 'bg-slate-50 hover:bg-blue-50'
                                            }`}
                                        >
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm font-bold text-slate-900">{c.name}</p>
                                                    {isFrequent && (
                                                        <span
                                                            className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-amber-500 text-white flex items-center gap-0.5">
                                <Sparkles className="w-2.5 h-2.5"/> {stats.tierLabel}
                              </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-slate-400">{c.phone || 'Tanpa no. telepon'}</p>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-xs font-black text-blue-600">{stats.totalVisits}x Servis</span>
                                                {stats.eligibleDiscountPercent > 0 && (
                                                    <p className="text-[10px] font-bold text-emerald-600">Diskon {stats.eligibleDiscountPercent}%</p>
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                                {filteredCustomers.length === 0 && (
                                    <button
                                        onClick={() => {
                                            const newC = {
                                                id: 'CUST-' + Math.random(),
                                                name: customerSearchQuery,
                                                phone: '',
                                                totalServiceCount: 0
                                            };
                                            onAddCustomer(newC);
                                            handleSelectCustomer(newC);
                                        }}
                                        className="w-full p-4 border-2 border-dashed border-slate-100 rounded-xl text-center text-blue-600 font-bold text-xs"
                                    >
                                        + Tambah "{customerSearchQuery}" sebagai Pelanggan Baru
                                    </button>
                                )}
                            </div>
                        </div>
                    </Modal>
                )}
            </AnimatePresence>

            {/* Vehicle Picker */}
            <AnimatePresence>
                {showVehiclePicker && (
                    <Modal title="Select Vehicle" onClose={() => setShowVehiclePicker(false)}>
                        <div className="space-y-2">
                            {filteredVehicles.map(v => (
                                <button key={v.id} onClick={() => handleSelectVehicle(v)}
                                        className="w-full p-4 bg-slate-50 hover:bg-blue-50 rounded-xl text-left transition-colors">
                                    <p className="text-sm font-bold">{v.plateNumber}</p>
                                    <p className="text-xs text-slate-400 uppercase font-black">{v.model} • {v.brand}</p>
                                </button>
                            ))}
                            <button
                                onClick={() => {
                                    const plate = prompt('Enter Plate Number:');
                                    if (plate) {
                                        const newV = {
                                            id: 'VH-' + Math.random(),
                                            customerId: formData.customerId,
                                            plateNumber: plate,
                                            model: 'Yamaha NMAX',
                                            brand: 'Yamaha'
                                        };
                                        onAddVehicle(newV);
                                        handleSelectVehicle(newV);
                                    }
                                }}
                                className="w-full p-4 border-2 border-dashed border-slate-100 rounded-xl text-center text-blue-600 font-bold text-xs mt-2"
                            >
                                + Register New Vehicle
                            </button>
                        </div>
                    </Modal>
                )}
            </AnimatePresence>
        </div>
    );
};
