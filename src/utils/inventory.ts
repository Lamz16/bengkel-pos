import { SparePart, PartCategory, WarehouseRack, WarehouseZone } from '../types';

/**
 * Standard category code prefixes for automatic SKU generation.
 */
// Master data is supplied exclusively by the active API/database.  Keeping
// these empty preserves the distinction between an empty database and a
// populated one; they must never become sample-data fallbacks.
export const DEFAULT_PART_CATEGORIES: PartCategory[] = [];

export const DEFAULT_WAREHOUSE_RACKS: WarehouseRack[] = [];

export const DEFAULT_WAREHOUSE_ZONES: WarehouseZone[] = [];

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
      if (Array.isArray(parsed)) return parsed;
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
      if (Array.isArray(parsed)) return parsed;
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
      if (Array.isArray(parsed)) return parsed;
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
export const DEFAULT_RACK_LIST: Array<{ code: string; name: string; zone: string }> = [];

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
