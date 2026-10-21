import React, {useState} from 'react';
import {PrintPreferences, PrintProfile, PrinterCapability, defaults, fromPrinter, printerChanged, savePreferences, validProfile} from './profiles';
import {detectPrinters} from './companion';
import {printCalibration} from './layout';
export function PrintProfileSettings({value, onChange}: {value: PrintPreferences; onChange: (p: PrintPreferences) => void}) {
    const [draft, setDraft] = useState<PrintProfile>(() => value.profiles.find(p => p.id === value.selected) || {
        version: 1, id: 'manual', name: 'Printer manual', driver: 'manual', paperMm: 80, contentMm: 72,
        leftMm: 4, rightMm: 4, offsetMm: 0, fontScale: 1,
    });
    const [status, setStatus] = useState('Pendamping belum diperiksa.');
    const [busy, setBusy] = useState(false);
    const [printers, setPrinters] = useState<PrinterCapability[]>([]);
    const [detected, setDetected] = useState(false);
    const detect = async () => {
        setBusy(true); setStatus('Mendeteksi printer…');
        try {
            const found = await detectPrinters(); setPrinters(found); setDetected(true);
            const changed = value.profiles.some(p => p.driver !== 'manual' && printerChanged(p, found));
            setStatus(changed ? 'Printer/driver berubah. Periksa ulang profil; profil lama tetap tersimpan.' : `Pendamping terhubung · ${found.length} printer.`);
        } catch { setStatus('Pendamping tidak tersedia / timeout. Cetak browser tetap dapat digunakan.'); }
        finally { setBusy(false); }
    };
    const save = () => {
        const next: PrintPreferences = {...value, enabled: true, mode: 'thermal', selected: draft.id,
            profiles: [...value.profiles.filter(p => p.id !== draft.id), draft]};
        if (savePreferences(next)) { onChange(next); setStatus('Profil tersimpan pada browser/perangkat ini.'); }
        else { onChange(defaults()); setStatus('Penyimpanan lokal gagal. Menggunakan cetak bawaan.'); }
    };
    const change = (next: PrintPreferences) => {
        if (savePreferences(next)) onChange(next);
        else { onChange(defaults()); setStatus('Penyimpanan gagal. Menggunakan bawaan.'); }
    };
    return <details className="px-6 py-2 border-t text-xs max-h-64 overflow-y-auto shrink-0 text-slate-700">
        <summary className="cursor-pointer font-bold">Pengaturan lanjutan cetak B/W</summary>
        <div className="space-y-3 py-3">
            <label className="flex gap-2"><input type="checkbox" checked={value.enabled} onChange={e => change({...value, enabled: e.target.checked})}/>Aktifkan profil printer</label>
            <p>{status}</p>
            <div className="flex flex-wrap gap-3"><button disabled={busy} onClick={detect}>Deteksi ulang</button>
                <button onClick={() => change({...value, mode: 'pdf'})}>Lanjutkan lewat browser</button></div>
            <label className="block">Profil tersimpan<select className="w-full border p-2" value={value.selected} onChange={e => {
                const p = value.profiles.find(p => p.id === e.target.value); if (p) setDraft(p); change({...value, selected: p?.id || ''});
            }}><option value="">Bawaan / belum ada profil</option>{value.profiles.map(p => <option key={p.id} value={p.id}>{p.name} · {p.driver}</option>)}</select></label>
            {detected && <label className="block">Hasil deteksi (pilih untuk meninjau ulang)<select className="w-full border p-2" value="" onChange={e => {
                const p = printers.find(p => p.id === e.target.value); if (p) setDraft(fromPrinter(p));
            }}><option value="">Pilih printer secara eksplisit</option>{printers.map(p => <option key={p.id} value={p.id}>{p.name} · {p.driver}</option>)}</select></label>}
            <button onClick={() => setDraft({...draft, id: `manual-${Date.now()}`, name: 'Printer manual', driver: 'manual', detected: undefined})}>Buat profil manual</button>
            <label className="block">Nama profil<input className="w-full border p-2" value={draft.name} onChange={e => setDraft({...draft, name: e.target.value})}/></label>
            <div className="grid grid-cols-2 gap-2">{([
                ['paperMm', 'Lebar kertas (mm)'], ['contentMm', 'Lebar area isi (mm)'], ['leftMm', 'Margin kiri (mm)'],
                ['rightMm', 'Margin kanan (mm)'], ['offsetMm', 'Koreksi horizontal (mm)'], ['fontScale', 'Skala huruf (0,8–1,5)'],
            ] as const).map(([key, label]) => <label key={key}>{label}<input type="number" step="0.1" className="w-full border p-2" value={draft[key]} onChange={e => setDraft({...draft, [key]: e.target.value === '' ? NaN : Number(e.target.value)})}/></label>)}</div>
            {draft.detected && <p>Driver: {draft.driver}. Kertas tersedia: {draft.detected.papers.map(p => `${p.name} (${p.widthMm} mm)`).join(', ')}. Deteksi memakai kertas default driver; pilih kertas driver yang benar lalu deteksi ulang.</p>}
            {!validProfile(draft) && <p role="alert">Lebar isi minimal 25 mm; margin + isi harus muat di kertas. Koreksi harus tetap di dalam margin.</p>}
            <div className="flex flex-wrap gap-3"><button disabled={!validProfile(draft)} onClick={() => {try {printCalibration(draft);} catch (e) {setStatus(String(e));}}}>Cetak uji</button>
                <button disabled={!validProfile(draft)} onClick={save}>Simpan profil</button>
                <button onClick={() => change({...value, enabled: false, mode: 'thermal'})}>Kembali ke pengaturan bawaan</button></div>
            <p>Profil lama tetap disimpan. Pilih printer yang sama di dialog browser: aplikasi tidak memilih printer otomatis. Atur ukuran kertas, skala 100%, dan margin dialog sesuai driver. Dialog terbuka/ditutup bukan bukti cetak fisik berhasil. Tinggi PDF mengikuti isi; driver dapat membaginya ke beberapa halaman.</p>
        </div>
    </details>;
}
