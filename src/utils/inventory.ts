import { SparePart, PartCategory, WarehouseRack, WarehouseZone } from '../types';

/**
 * Standard category code prefixes for automatic SKU generation.
 */
export const DEFAULT_PART_CATEGORIES: PartCategory[] = [
  { id: 'cat-1', name: 'Oli', skuPrefix: 'OLI', description: 'Pelumas mesin, oli samping, transmisi & shock' },
  { id: 'cat-2', name: 'Rem', skuPrefix: 'REM', description: 'Kampas rem, piringan disc, minyak rem & kaliper' },
  { id: 'cat-3', name: 'Busi', skuPrefix: 'BSI', description: 'Busi standar, iridium, cangkul & tempat busi' },
  { id: 'cat-4', name: 'Filter', skuPrefix: 'FLT', description: 'Filter udara, filter oli, filter bensin' },
  { id: 'cat-5', name: 'Kelistrikan', skuPrefix: 'ELK', description: 'Aki, kiproks, spul, bohlam lamp, kabel & skering' },
  { id: 'cat-6', name: 'Ban', skuPrefix: 'BAN', description: 'Ban luar, ban dalam, pentil & cairan anti bocor' },
  { id: 'cat-7', name: 'Mesin', skuPrefix: 'MSN', description: 'Piston, ring, klep, noken as & gasket kalter' },
  { id: 'cat-8', name: 'CVT', skuPrefix: 'CVT', description: 'V-belt, roller, mangkok ganda, per cvt' },
  { id: 'cat-9', name: 'Suspensi', skuPrefix: 'SUS', description: 'Shockbreaker, as shock, oli shock & bushing' },
  { id: 'cat-10', name: 'Aksesoris', skuPrefix: 'AKS', description: 'Spion, handgrip, cover, stiker & variasi' },
  { id: 'cat-11', name: 'Baut & Nut', skuPrefix: 'BAU', description: 'Baut body, baut mesin, mur & ring gasket' }
];

export const DEFAULT_WAREHOUSE_RACKS: WarehouseRack[] = [
  { id: 'rack-1', code: 'Rak A', name: 'Rak A - Oli & Pelumas', zone: 'Gudang Utama', description: 'Rak bagian depan khusus stok oli botolan & kaleng' },
  { id: 'rack-2', code: 'Rak B', name: 'Rak B - Sistem Pengereman', zone: 'Gudang Utama', description: 'Susunan kampas & disc brake matic/bebek' },
  { id: 'rack-3', code: 'Rak C', name: 'Rak C - Filter & Busi', zone: 'Gudang Utama', description: 'Filter udara & kotak busi berbagai tipe' },
  { id: 'rack-4', code: 'Rak D', name: 'Rak D - Kelistrikan & Aki', zone: 'Gudang Utama', description: 'Aki kering/basah, bohlam LED, kiproks' },
  { id: 'rack-5', code: 'Rak E', name: 'Rak E - Ban & Roda', zone: 'Gudang Belakang', description: 'Susunan ban luar tubeless & tube type' },
  { id: 'rack-6', code: 'Etalase Depan', name: 'Etalase Depan - Fast Moving', zone: 'Toko Kasir', description: 'Display barang laku cepat di area kasir' },
  { id: 'rack-7', code: 'Gudang Belakang', name: 'Gudang Belakang - Stok Dus Besar', zone: 'Gudang Belakang', description: 'Stok grosir & sparepart bodi/kardus besar' }
];

export const DEFAULT_WAREHOUSE_ZONES: WarehouseZone[] = [
  { id: 'zone-1', name: 'Gudang Utama', description: 'Area utama penyimpanan suku cadang cepat laku' },
  { id: 'zone-2', name: 'Gudang Belakang', description: 'Area penyimpanan stok dus besar, ban, & bodi' },
  { id: 'zone-3', name: 'Toko Kasir', description: 'Display etalase kaca & meja kasir depan' },
  { id: 'zone-4', name: 'Area Servis Luar', description: 'Rak perlengkapan bengkel pit luar' }
];

/**
 * LocalStorage Key Constants
 */
const STORAGE_CATEGORIES_KEY = 'bengkel_master_categories_v1';
const STORAGE_RACKS_KEY = 'bengkel_master_racks_v1';
const STORAGE_ZONES_KEY = 'bengkel_master_zones_v1';

export function getStoredCategories(): PartCategory[] {
  try {
    const raw = localStorage.getItem(STORAGE_CATEGORIES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.warn('Error reading stored categories:', err);
  }
  return DEFAULT_PART_CATEGORIES;
}

export function saveStoredCategories(categories: PartCategory[]) {
  try {
    localStorage.setItem(STORAGE_CATEGORIES_KEY, JSON.stringify(categories));
  } catch (err) {
    console.error('Error saving categories:', err);
  }
}

export function getStoredRacks(): WarehouseRack[] {
  try {
    const raw = localStorage.getItem(STORAGE_RACKS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.warn('Error reading stored racks:', err);
  }
  return DEFAULT_WAREHOUSE_RACKS;
}

export function saveStoredRacks(racks: WarehouseRack[]) {
  try {
    localStorage.setItem(STORAGE_RACKS_KEY, JSON.stringify(racks));
  } catch (err) {
    console.error('Error saving racks:', err);
  }
}

export function getStoredZones(): WarehouseZone[] {
  try {
    const raw = localStorage.getItem(STORAGE_ZONES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.warn('Error reading stored zones:', err);
  }
  return DEFAULT_WAREHOUSE_ZONES;
}

export function saveStoredZones(zones: WarehouseZone[]) {
  try {
    localStorage.setItem(STORAGE_ZONES_KEY, JSON.stringify(zones));
  } catch (err) {
    console.error('Error saving zones:', err);
  }
}

/**
 * Generates a clean, sequential SKU for a spare part.
 * Example: "OLI-001", "REM-003", "PRT-015"
 */
export function generatePartSKU(category: string, existingParts: SparePart[], categoriesList?: PartCategory[]): string {
  let prefix = 'PRT';
  if (categoriesList) {
    const matched = categoriesList.find(c => c.name.toLowerCase() === category.toLowerCase());
    if (matched && matched.skuPrefix) {
      prefix = matched.skuPrefix.toUpperCase();
    }
  }
  
  if (prefix === 'PRT') {
    const matchedDefault = DEFAULT_PART_CATEGORIES.find(c => c.name.toLowerCase() === category.toLowerCase());
    if (matchedDefault && matchedDefault.skuPrefix) {
      prefix = matchedDefault.skuPrefix.toUpperCase();
    } else if (category.trim().length >= 3) {
      prefix = category.trim().slice(0, 3).toUpperCase();
    }
  }

  // Find all existing SKUs with this prefix
  const regex = new RegExp(`^${prefix}-(\\d+)$`, 'i');
  let maxNumber = 0;

  existingParts.forEach(p => {
    if (p.sku) {
      const match = p.sku.match(regex);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        if (num > maxNumber) maxNumber = num;
      }
    }
  });

  const nextNumber = maxNumber + 1;
  const padded = nextNumber.toString().padStart(3, '0');
  return `${prefix}-${padded}`;
}

/**
 * Formats a clean, readable rack location string.
 * Example: "Rak A • Tingkat 2 (Kotak 03)"
 */
export function formatPartLocation(part: SparePart): string {
  if (part.rackCode) {
    const elements: string[] = [part.rackCode];
    if (part.shelfLevel) elements.push(part.shelfLevel);
    if (part.binNumber) elements.push(`(${part.binNumber})`);
    return elements.join(' • ');
  }

  if (part.rackLocation && part.rackLocation.trim() !== '') {
    return part.rackLocation.trim();
  }

  return 'Belum Ditentukan';
}

/**
 * Standard preset warehouse racks available in the workshop.
 */
export const DEFAULT_RACK_LIST = [
  { code: 'Rak A', name: 'Rak A - Oli & Pelumas', zone: 'Gudang Utama' },
  { code: 'Rak B', name: 'Rak B - Sistem Pengereman', zone: 'Gudang Utama' },
  { code: 'Rak C', name: 'Rak C - Filter & Busi', zone: 'Gudang Utama' },
  { code: 'Rak D', name: 'Rak D - Kelistrikan & Aki', zone: 'Gudang Utama' },
  { code: 'Rak E', name: 'Rak E - Ban & Roda', zone: 'Gudang Belakang' },
  { code: 'Etalase Depan', name: 'Etalase Depan - Fast Moving', zone: 'Toko Kasir' },
  { code: 'Gudang Belakang', name: 'Gudang Belakang - Stok Dus Besar', zone: 'Gudang Belakang' }
];

export interface RackGroupSummary {
  rackCode: string;
  itemCount: number;
  totalUnits: number;
  lowStockCount: number;
  parts: SparePart[];
}

/**
 * Groups and summarizes spare parts by their rack location.
 */
export function groupPartsByRack(parts: SparePart[]): RackGroupSummary[] {
  const map = new Map<string, SparePart[]>();

  parts.forEach(part => {
    const rack = part.rackCode?.trim() || 'Tanpa Rak';
    const list = map.get(rack) || [];
    list.push(part);
    map.set(rack, list);
  });

  const result: RackGroupSummary[] = [];

  map.forEach((partList, rackCode) => {
    const itemCount = partList.length;
    const totalUnits = partList.reduce((acc, p) => acc + (p.stock || 0), 0);
    const lowStockCount = partList.filter(p => p.stock <= p.minStock).length;

    result.push({
      rackCode,
      itemCount,
      totalUnits,
      lowStockCount,
      parts: partList
    });
  });

  // Sort by rack name, keeping 'Tanpa Rak' at the end
  return result.sort((a, b) => {
    if (a.rackCode === 'Tanpa Rak') return 1;
    if (b.rackCode === 'Tanpa Rak') return -1;
    return a.rackCode.localeCompare(b.rackCode);
  });
}
