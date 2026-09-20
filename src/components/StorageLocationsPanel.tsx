import React, { useEffect, useMemo, useState } from 'react';
import { Boxes, Plus, MapPin, PackageOpen, Pencil, Trash2 } from 'lucide-react';
import { StorageLocation, StorageLocationType, WarehouseZone } from '../types';
import { api } from '../services/api';

export const StorageLocationsPanel: React.FC<{ zones: WarehouseZone[] }> = ({ zones }) => {
  const [locations, setLocations] = useState<StorageLocation[]>([]);
  const [mode, setMode] = useState<'rack' | 'nonRack'>('rack');
  const [loading, setLoading] = useState(false);
  const [rack, setRack] = useState({ code: '', name: '', zoneId: zones[0]?.id || '', levelCount: 3, slotsPerLevel: 5, description: '', positionNote: '' });
  const [nonRack, setNonRack] = useState({ code: '', name: '', zoneId: zones[0]?.id || '', type: 'CARTON' as StorageLocationType, positionNote: '', description: '' });

  const load = async () => {
    try { setLocations(await api.getStorageLocations()); } catch { setLocations([]); }
  };

  useEffect(() => { load(); }, []);

  const byRack = useMemo(() => locations
    .filter(item => item.type === 'RACK_SLOT')
    .reduce<Record<string, StorageLocation[]>>((groups, item) => {
      const key = item.rackId || item.code.split('-').slice(0, 2).join('-');
      (groups[key] ||= []).push(item);
      return groups;
    }, {}), [locations]);

  const nonRackLocations = locations.filter(item => item.type !== 'RACK_SLOT');

  const createRack = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      await api.createRackLayout(rack);
      setRack({ ...rack, code: '', name: '', description: '', positionNote: '' });
      await load();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const createNonRack = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      await api.createNonRackLocation(nonRack);
      setNonRack({ ...nonRack, code: '', name: '', positionNote: '', description: '' });
      await load();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const editRack = async (rackId: string, location: StorageLocation) => {
    const name = window.prompt('Nama rak', location.rackName || location.code.split('-').slice(0, 2).join('-'));
    if (name === null) return;
    const description = window.prompt('Deskripsi rak', location.description || '');
    if (description === null) return;
    const positionNote = window.prompt('Penunjuk posisi fisik rak', location.positionNote || '');
    if (positionNote === null) return;

    setLoading(true);
    try {
      await api.updateRackLayout(rackId, { name, description, positionNote });
      await load();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteRack = async (rackId: string, label: string) => {
    if (!window.confirm(`Hapus peta rak "${label}" beserta seluruh tingkat dan slotnya? Tindakan ini tidak dapat dibatalkan.`)) return;
    setLoading(true);
    try {
      await api.deleteRackLayout(rackId);
      await load();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const editNonRack = async (location: StorageLocation) => {
    const name = window.prompt('Nama lokasi', location.name || location.code);
    if (name === null) return;
    const description = window.prompt('Catatan/deskripsi lokasi', location.description || '');
    if (description === null) return;
    const positionNote = window.prompt('Penunjuk posisi fisik', location.positionNote || '');
    if (positionNote === null) return;

    setLoading(true);
    try {
      await api.updateNonRackLocation(location.id, { name, description, positionNote });
      await load();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteNonRack = async (location: StorageLocation) => {
    if (!window.confirm(`Hapus lokasi "${location.code}"? Tindakan ini tidak dapat dibatalkan.`)) return;
    setLoading(true);
    try {
      await api.deleteNonRackLocation(location.id);
      await load();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const iconButton = 'inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:border-amber-300 hover:text-amber-700 disabled:opacity-50';

  return <div className="space-y-4">
    <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
      <button onClick={() => setMode('rack')} className={`py-2 rounded-lg text-xs font-black ${mode === 'rack' ? 'bg-white text-amber-700' : 'text-slate-500'}`}>Generator Rak</button>
      <button onClick={() => setMode('nonRack')} className={`py-2 rounded-lg text-xs font-black ${mode === 'nonRack' ? 'bg-white text-blue-700' : 'text-slate-500'}`}>Lokasi Non-Rak</button>
    </div>

    {mode === 'rack' ? (
      <form onSubmit={createRack} className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-3">
        <h4 className="text-xs font-black text-amber-950 uppercase">Buat Peta Rak Otomatis</h4>
        <div className="grid grid-cols-2 gap-2">
          <input required placeholder="Kode: RAK-01" value={rack.code} onChange={e => setRack({ ...rack, code: e.target.value.toUpperCase() })} className="h-10 px-3 rounded-xl border text-xs font-bold" />
          <input placeholder="Nama rak" value={rack.name} onChange={e => setRack({ ...rack, name: e.target.value })} className="h-10 px-3 rounded-xl border text-xs font-bold" />
          <select required value={rack.zoneId} onChange={e => setRack({ ...rack, zoneId: e.target.value })} className="h-10 px-3 rounded-xl border text-xs font-bold col-span-2">
            {zones.map(zone => <option key={zone.id} value={zone.id}>{zone.name}</option>)}
          </select>
          <label className="text-[10px] font-bold">Jumlah tingkat
            <input type="number" min="1" max="26" value={rack.levelCount} onChange={e => setRack({ ...rack, levelCount: Number(e.target.value) })} className="mt-1 h-9 w-full px-2 rounded-lg border" />
          </label>
          <label className="text-[10px] font-bold">Slot per tingkat
            <input type="number" min="1" max="99" value={rack.slotsPerLevel} onChange={e => setRack({ ...rack, slotsPerLevel: Number(e.target.value) })} className="mt-1 h-9 w-full px-2 rounded-lg border" />
          </label>
        </div>
        <textarea
          placeholder="Catatan/deskripsi rak, contoh: Rak oli matic; sisi kanan dekat pintu gudang"
          value={rack.description}
          onChange={e => setRack({ ...rack, description: e.target.value })}
          className="w-full min-h-20 px-3 py-2 rounded-xl border text-xs"
        />
        <p className="text-[10px] text-amber-800">Sistem akan membuat: {rack.code || 'RAK-01'}-A-01 sampai {rack.code || 'RAK-01'}-{String.fromCharCode(64 + Math.min(rack.levelCount || 1, 26))}-{String(rack.slotsPerLevel || 1).padStart(2, '0')}.</p>
        <button disabled={loading} className="w-full h-10 bg-amber-500 text-white rounded-xl text-xs font-black"><Plus className="w-4 h-4 inline mr-1" /> Buat Rak & Slot</button>
      </form>
    ) : (
      <form onSubmit={createNonRack} className="p-4 bg-blue-50 border border-blue-200 rounded-2xl space-y-3">
        <h4 className="text-xs font-black text-blue-950 uppercase">Tambah Kardus / Lokasi Lain</h4>
        <div className="grid grid-cols-2 gap-2">
          <select value={nonRack.type} onChange={e => setNonRack({ ...nonRack, type: e.target.value as StorageLocationType })} className="h-10 px-3 rounded-xl border text-xs font-bold">
            <option value="CARTON">Kardus</option><option value="DISPLAY">Etalase</option><option value="TEMPORARY">Sementara</option>
          </select>
          <input required placeholder="Kode: KDS-01" value={nonRack.code} onChange={e => setNonRack({ ...nonRack, code: e.target.value.toUpperCase() })} className="h-10 px-3 rounded-xl border text-xs font-bold" />
          <select required value={nonRack.zoneId} onChange={e => setNonRack({ ...nonRack, zoneId: e.target.value })} className="h-10 px-3 rounded-xl border text-xs font-bold col-span-2">
            {zones.map(zone => <option key={zone.id} value={zone.id}>{zone.name}</option>)}
          </select>
          <input placeholder="Posisi fisik, contoh: Samping RAK-01" value={nonRack.positionNote} onChange={e => setNonRack({ ...nonRack, positionNote: e.target.value })} className="h-10 px-3 rounded-xl border text-xs col-span-2" />
          <textarea placeholder="Catatan/deskripsi, contoh: Kardus cadangan oli, tumpukan bawah" value={nonRack.description} onChange={e => setNonRack({ ...nonRack, description: e.target.value })} className="min-h-16 px-3 py-2 rounded-xl border text-xs col-span-2" />
        </div>
        <button disabled={loading} className="w-full h-10 bg-blue-600 text-white rounded-xl text-xs font-black">Simpan Lokasi</button>
      </form>
    )}

    <div className="space-y-3">
      {Object.entries(byRack).map(([rackId, slots]) => {
        const first = slots[0];
        const label = first?.rackName || first?.code.split('-').slice(0, 2).join('-') || 'Rak';
        return <div key={rackId} className="p-4 rounded-2xl border border-slate-200">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex gap-2 items-center">
              <Boxes className="w-4 h-4 text-amber-600" />
              <div><b className="text-xs">{label}</b>{first?.description && <p className="text-[10px] text-slate-500 mt-0.5">{first.description}</p>}</div>
            </div>
            <div className="flex gap-1">
              <button type="button" aria-label={`Edit ${label}`} title="Edit rak" disabled={loading} onClick={() => editRack(rackId, first)} className={iconButton}><Pencil className="w-3.5 h-3.5" /></button>
              <button type="button" aria-label={`Hapus ${label}`} title="Hapus rak" disabled={loading} onClick={() => deleteRack(rackId, label)} className={iconButton + ' hover:border-red-300 hover:text-red-600'}><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </div>
          {first?.positionNote && <p className="text-[10px] text-slate-400 mb-3 flex gap-1"><MapPin className="w-3 h-3" />{first.positionNote}</p>}
          {Object.entries(slots.reduce<Record<string, StorageLocation[]>>((groups, slot) => {
            (groups[slot.levelCode || 'A'] ||= []).push(slot);
            return groups;
          }, {})).map(([level, slotsInLevel]) => (
            <div key={level} className="flex items-center gap-2 mb-2">
              <b className="w-5 text-xs text-slate-500">{level}</b>
              <div className="grid grid-cols-5 gap-1 flex-1">
                {slotsInLevel.map(slot => <div key={slot.id} title={slot.code} className={`rounded-lg border p-2 text-center text-[9px] font-black ${slot.stockCount ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>{slot.slotCode}</div>)}
              </div>
            </div>
          ))}
        </div>;
      })}
    </div>

    {nonRackLocations.length > 0 && (
      <div className="p-4 rounded-2xl border border-slate-200">
        <h4 className="text-xs font-black mb-2 flex gap-2"><PackageOpen className="w-4 h-4 text-blue-600" /> Lokasi Non-Rak</h4>
        {nonRackLocations.map(location => (
          <div key={location.id} className="flex justify-between gap-3 py-2 text-xs border-b last:border-0">
            <div>
              <b>{location.code}</b> · {location.type}
              {location.description && <p className="text-[10px] text-slate-500 mt-0.5">{location.description}</p>}
              <span className="text-[10px] text-slate-400 flex gap-1 mt-0.5"><MapPin className="w-3 h-3" /> {location.positionNote || 'Tanpa penunjuk'}</span>
            </div>
            <div className="flex gap-1 shrink-0">
              <button type="button" aria-label={`Edit ${location.code}`} title="Edit lokasi" disabled={loading} onClick={() => editNonRack(location)} className={iconButton}><Pencil className="w-3.5 h-3.5" /></button>
              <button type="button" aria-label={`Hapus ${location.code}`} title="Hapus lokasi" disabled={loading} onClick={() => deleteNonRack(location)} className={iconButton + ' hover:border-red-300 hover:text-red-600'}><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>;
};
