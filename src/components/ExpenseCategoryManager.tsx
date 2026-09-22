import React, { useState } from 'react';
import { Edit2, Plus, Tag, Trash2 } from 'lucide-react';
import { ExpenseCategory } from '../types';

interface Props {
  categories: ExpenseCategory[];
  onCreate: (data: Omit<ExpenseCategory, 'id'>) => Promise<void>;
  onUpdate: (id: string, data: Partial<ExpenseCategory>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onClose: () => void;
}

export const ExpenseCategoryManager: React.FC<Props> = ({ categories, onCreate, onUpdate, onDelete, onClose }) => {
  const [editing, setEditing] = useState<ExpenseCategory | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const openForm = (category?: ExpenseCategory) => {
    setEditing(category || { id: '', name: '', description: '' });
    setName(category?.name || '');
    setDescription(category?.description || '');
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !editing) return;
    try {
      setSaving(true);
      if (editing.id) await onUpdate(editing.id, { name: name.trim(), description: description.trim() || undefined });
      else await onCreate({ name: name.trim(), description: description.trim() || undefined });
      setEditing(null);
    } catch (error: any) { alert(error.message || 'Kategori pengeluaran gagal disimpan.'); } finally { setSaving(false); }
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-500">Kategori yang dihapus tidak mengubah nama kategori pada riwayat pengeluaran lama.</p>
      {editing ? (
        <form onSubmit={save} className="p-4 rounded-2xl border border-blue-100 bg-blue-50 space-y-3">
          <input autoFocus value={name} onChange={event => setName(event.target.value)} placeholder="Nama kategori, mis. Transportasi" className="w-full h-11 px-3 rounded-xl border border-blue-200 bg-white text-xs font-bold outline-none" />
          <input value={description} onChange={event => setDescription(event.target.value)} placeholder="Keterangan opsional" className="w-full h-11 px-3 rounded-xl border border-blue-200 bg-white text-xs" />
          <div className="flex gap-2"><button type="button" onClick={() => setEditing(null)} className="flex-1 h-10 rounded-xl bg-white text-xs font-bold text-slate-600">Batal</button><button disabled={saving || !name.trim()} className="flex-1 h-10 rounded-xl bg-blue-600 text-xs font-black text-white disabled:opacity-60">{saving ? 'Menyimpan...' : 'Simpan Kategori'}</button></div>
        </form>
      ) : <button onClick={() => openForm()} className="w-full h-11 rounded-xl border-2 border-dashed border-blue-200 text-blue-700 text-xs font-black uppercase tracking-wider hover:bg-blue-50"><Plus className="inline w-4 h-4 mr-1" /> Tambah Kategori</button>}
      <div className="space-y-2 max-h-[45vh] overflow-y-auto pr-1">
        {categories.map(category => <div key={category.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-white"><div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center"><Tag className="w-4 h-4" /></div><div className="min-w-0 flex-1"><p className="text-xs font-black text-slate-900">{category.name}</p>{category.description && <p className="text-[10px] text-slate-500 truncate">{category.description}</p>}</div><button onClick={() => openForm(category)} className="p-2 text-slate-400 hover:text-blue-600"><Edit2 className="w-4 h-4" /></button><button onClick={async () => { if (confirm(`Hapus kategori "${category.name}"?`)) await onDelete(category.id); }} className="p-2 text-slate-400 hover:text-rose-600"><Trash2 className="w-4 h-4" /></button></div>)}
      </div>
      <button onClick={onClose} className="w-full h-11 rounded-xl bg-slate-100 text-xs font-black text-slate-700">Selesai</button>
    </div>
  );
};
