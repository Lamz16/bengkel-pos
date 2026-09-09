import { SparePart } from '../types';

/**
 * Standard category code prefixes for automatic SKU generation.
 */
const CATEGORY_SKU_PREFIX: Record<string, string> = {
  Oli: 'OLI',
  Rem: 'REM',
  Busi: 'BSI',
  Filter: 'FLT',
  Kelistrikan: 'ELK',
  Ban: 'BAN',
  Mesin: 'MSN',
  CVT: 'CVT',
  Suspensi: 'SUS',
  Baut: 'BAU',
  Aksesoris: 'AKS'
};

/**
 * Generates a clean, sequential SKU for a spare part.
 * Example: "OLI-001", "REM-003", "PRT-015"
 */
export function generatePartSKU(category: string, existingParts: SparePart[]): string {
  const prefix = CATEGORY_SKU_PREFIX[category] || 
    (category.trim().length >= 3 ? category.trim().slice(0, 3).toUpperCase() : 'PRT');

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
