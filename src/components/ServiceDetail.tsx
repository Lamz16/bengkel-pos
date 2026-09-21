import React, { useState } from 'react';
import { AlertTriangle, Wrench, MapPin, RotateCcw } from 'lucide-react';
import { WorkshopService, ServiceStatus, SparePart } from '../types';
import { cn } from '../lib/utils';
import { formatPartLocation } from '../utils/inventory';

interface ServiceDetailProps {
  service: WorkshopService;
  parts?: SparePart[];
  onUpdateStatus: (id: string, s: ServiceStatus) => void;
  onOpenWarrantyClaim?: (service: WorkshopService) => void;
  onProcessReturn?: (data: { serviceId: string; reason?: string; items: Array<{ partId: string; quantity: number }> }) => Promise<void>;
}

export const ServiceDetail: React.FC<ServiceDetailProps> = ({ 
  service, 
  parts = [],
  onUpdateStatus, 
  onOpenWarrantyClaim,
  onProcessReturn
}) => {
  const [returnMode, setReturnMode] = useState(false);
  const [returnReason, setReturnReason] = useState('');
  const [returnQty, setReturnQty] = useState<Record<string, number>>({});
  const [isReturning, setIsReturning] = useState(false);
  const calculatedBonus = service.mechanicBonusAmount !== undefined 
    ? service.mechanicBonusAmount 
    : Math.round(((service.laborFee || 0) * (service.mechanicBonusPercent || 0)) / 100);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-xl font-black text-slate-900">{service.vehicleModel}</h2>
          <p className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">{service.vehiclePlate}</p>
        </div>
        <span className={cn(
          "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
          service.status === 'Done' ? 'bg-emerald-100 text-emerald-700' :
          service.status === 'In Progress' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
        )}>
          {service.status}
        </span>
      </div>

      {/* Warranty Claim Alert if exists */}
      {service.hasWarrantyClaim && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-2">
          <div className="flex items-center gap-2 text-rose-800 font-black text-xs uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>Klaim Garansi / Servis Ulang Tercatat</span>
          </div>
          <p className="text-xs text-rose-950 font-medium italic">
            "{service.warrantyClaimReason}"
          </p>
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-rose-200/60 text-[10px]">
            <div>
              <span className="text-rose-600 block uppercase font-bold">Kehadiran H+1</span>
              <span className="font-black text-slate-800">
                {service.isMechanicAbsentOnClaim ? '⚠️ Mangkir / Tidak Masuk' : 'Hadir Bekerja'}
              </span>
            </div>
            <div>
              <span className="text-rose-600 block uppercase font-bold">Sanksi Potong Gaji</span>
              <span className="font-black text-rose-700">
                -Rp {(service.warrantyDeductionAmount || 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 bg-slate-50 rounded-2xl">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Pelanggan</p>
          <p className="text-xs font-black text-slate-700">{service.customerName}</p>
        </div>
        <div className="p-4 bg-slate-50 rounded-2xl">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Odometer</p>
          <p className="text-xs font-black text-slate-700">{service.kilometers.toLocaleString()} KM</p>
        </div>
      </div>

      {/* Mechanic Assigned & Commission Info */}
      <div className="p-4 bg-blue-50/70 border border-blue-100 rounded-2xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-xs">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Teknisi Penanggung Jawab</p>
            <p className="text-sm font-black text-slate-900">{service.mechanicName || 'Belum Ditetapkan'}</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-bold text-slate-400 uppercase block">Bonus Jasa ({service.mechanicBonusPercent || 0}%)</span>
          <span className="text-xs font-black text-emerald-600">+Rp {calculatedBonus.toLocaleString()}</span>
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Repair Summary</h4>
        <div className="p-4 bg-slate-50 rounded-2xl space-y-3">
          {service.partsUsed.map(p => {
            const matchedPart = parts.find(x => x.id === p.partId);
            const returnable = Math.max(0, p.quantity - (p.returnedQuantity || 0));
            return (
              <div key={p.partId} className="flex justify-between items-start text-xs gap-2">
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-slate-800">{p.name} (x{returnable}{p.returnedQuantity ? `, retur ${p.returnedQuantity}` : ''})</span>
                    {matchedPart?.sku && (
                      <span className="text-[9px] font-mono font-bold bg-blue-50 text-blue-700 px-1 py-0.2 rounded border border-blue-100">
                        {matchedPart.sku}
                      </span>
                    )}
                  </div>
                  {matchedPart?.rackCode && (
                    <p className="text-[10px] text-amber-800 font-bold mt-0.5 flex items-center gap-1">
                      <MapPin className="w-2.5 h-2.5 text-amber-600 shrink-0" />
                      <span>{formatPartLocation(matchedPart)}</span>
                    </p>
                  )}
                </div>
                <span className="font-black text-slate-900 shrink-0">Rp {((p.priceAtTime || 0) * (p.quantity || 0)).toLocaleString()}</span>
              </div>
            );
          })}
          <div className="flex justify-between text-xs pt-2 border-t border-slate-200">
            <span className="font-bold text-slate-600">Labor Fee</span>
            <span className="font-black text-slate-900 space-x-1">
              <span>Rp</span>
              <span>{(service.laborFee || 0).toLocaleString()}</span>
            </span>
          </div>
          <div className="flex justify-between text-sm pt-2 border-t-2 border-slate-200">
            <span className="font-black text-blue-600 uppercase tracking-widest">Total</span>
            <span className="font-black text-blue-600 space-x-1">
              <span>Rp</span>
              <span>{(service.totalAmount || 0).toLocaleString()}</span>
            </span>
          </div>
        </div>
      </div>

      {service.status === 'Done' && onProcessReturn && service.partsUsed.some(item => item.quantity > (item.returnedQuantity || 0)) && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 space-y-3">
          <button type="button" onClick={() => setReturnMode(value => !value)} className="w-full flex items-center justify-center gap-2 rounded-xl border border-amber-300 bg-white py-3 text-xs font-black text-amber-800 hover:bg-amber-100">
            <RotateCcw className="w-4 h-4" /> {returnMode ? 'Tutup Retur Barang' : 'Proses Retur Barang'}
          </button>
          {returnMode && <>
            <p className="text-[10px] text-amber-900">Pilih beberapa barang dan jumlahnya. Stok serta laba transaksi akan diperbarui otomatis.</p>
            {service.partsUsed.map(item => { const available = Math.max(0, item.quantity - (item.returnedQuantity || 0)); return available > 0 && <div key={item.partId} className="flex items-center justify-between gap-3 rounded-xl bg-white p-2.5 border border-amber-100"><span className="text-xs font-bold text-slate-800">{item.name}<small className="block text-slate-400">Maks. {available} pcs</small></span><input type="number" min="0" max={available} value={returnQty[item.partId] || ''} onChange={event => setReturnQty(prev => ({ ...prev, [item.partId]: Math.min(available, Math.max(0, Number(event.target.value || 0))) }))} className="h-9 w-20 rounded-lg border border-amber-200 px-2 text-xs font-bold" /></div> })}
            <input value={returnReason} onChange={event => setReturnReason(event.target.value)} placeholder="Alasan retur (opsional)" className="h-10 w-full rounded-xl border border-amber-200 bg-white px-3 text-xs" />
            <button type="button" disabled={isReturning} onClick={async () => { const items = Object.entries(returnQty).filter(([, quantity]) => quantity > 0).map(([partId, quantity]) => ({ partId, quantity })); if (!items.length) return alert('Masukkan jumlah barang yang diretur.'); setIsReturning(true); try { await onProcessReturn({ serviceId: service.id, reason: returnReason, items }); setReturnQty({}); setReturnReason(''); setReturnMode(false); } catch (error: any) { alert(error.message || 'Retur gagal diproses.'); } finally { setIsReturning(false); } }} className="w-full rounded-xl bg-amber-600 py-3 text-xs font-black text-white disabled:opacity-60">{isReturning ? 'Memproses...' : 'Simpan Retur & Kembalikan Stok'}</button>
          </>}
        </div>
      )}

      <div className="space-y-3">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Update Status</h4>
        <div className="grid grid-cols-3 gap-2">
          {(['In Progress', 'Ready', 'Done'] as ServiceStatus[]).map(s => (
            <button 
              key={s}
              onClick={() => onUpdateStatus(service.id, s)}
              className={cn(
                "py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all",
                service.status === s ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-400 border-slate-100 hover:border-slate-200"
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Button to file warranty claim / complaint if completed and not yet filed */}
      {service.status === 'Done' && !service.hasWarrantyClaim && onOpenWarrantyClaim && (
        <div className="pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => onOpenWarrantyClaim(service)}
            className="w-full py-3.5 px-4 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            Ajukan Klaim Garansi / Servis Ulang & Potong Gaji
          </button>
          <p className="text-[10px] text-slate-400 text-center mt-1.5 font-medium">
            Gunakan jika pelanggan komplain hasil servis kurang memuaskan & mekanik dievaluasi sanksi denda.
          </p>
        </div>
      )}
    </div>
  );
};
