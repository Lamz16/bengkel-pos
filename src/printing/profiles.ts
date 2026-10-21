export interface PrinterCapability {
    id: string; name: string; driver: string;
    paperMm: number; printableMm: number; leftMm: number; rightMm: number;
    papers: {name: string; widthMm: number; heightMm: number}[];
}
export interface PrintProfile {
    version: 1; id: string; name: string; driver: string;
    paperMm: number; contentMm: number; leftMm: number; rightMm: number;
    offsetMm: number; fontScale: number; detected?: PrinterCapability;
}
export interface PrintPreferences {version: 1; enabled: boolean; mode: 'thermal' | 'pdf'; selected: string; profiles: PrintProfile[]}
export const defaults = (): PrintPreferences => ({version: 1, enabled: false, mode: 'thermal', selected: '', profiles: []});
const key = 'bengkelpro.bw-print.v1';
function validDetection(p: PrinterCapability): boolean {
    return !!p && typeof p.id === 'string' && typeof p.name === 'string' && typeof p.driver === 'string'
        && Array.isArray(p.papers) && p.papers.every(paper => !!paper && typeof paper.name === 'string'
            && Number.isFinite(paper.widthMm) && Number.isFinite(paper.heightMm))
        && [p.paperMm, p.printableMm, p.leftMm, p.rightMm].every(Number.isFinite);
}
export function validProfile(p: PrintProfile): boolean {
    return !!p && p.version === 1 && typeof p.id === 'string' && !!p.id && typeof p.name === 'string' && typeof p.driver === 'string'
        && [p.paperMm, p.contentMm, p.leftMm, p.rightMm, p.offsetMm, p.fontScale].every(Number.isFinite)
        && (!p.detected || validDetection(p.detected))
        && p.paperMm >= 40 && p.paperMm <= 300 && p.contentMm >= 25
        && p.leftMm >= 0 && p.rightMm >= 0 && p.fontScale >= 0.8 && p.fontScale <= 1.5
        && p.leftMm + p.offsetMm >= 0 && p.rightMm - p.offsetMm >= 0
        && p.leftMm + p.contentMm + p.rightMm <= p.paperMm + 0.01;
}
export function loadPreferences(storage?: Pick<Storage, 'getItem'>): PrintPreferences {
    try {
        const value = JSON.parse((storage || localStorage).getItem(key) || 'null');
        if (!value || value.version !== 1 || typeof value.enabled !== 'boolean' || !['thermal', 'pdf'].includes(value.mode)
            || typeof value.selected !== 'string' || !Array.isArray(value.profiles) || !value.profiles.every(validProfile)) return defaults();
        return value;
    } catch { return defaults(); }
}
export function savePreferences(p: PrintPreferences, storage?: Pick<Storage, 'setItem'>): boolean {
    try { (storage || localStorage).setItem(key, JSON.stringify(p)); return true; } catch { return false; }
}
export function activeProfile(p: PrintPreferences): PrintProfile | undefined {
    return p.enabled && p.mode === 'thermal' ? p.profiles.find(profile => profile.id === p.selected && validProfile(profile)) : undefined;
}
export function fromPrinter(p: PrinterCapability): PrintProfile {
    return {version: 1, id: p.id, name: p.name, driver: p.driver, paperMm: p.paperMm,
        contentMm: p.printableMm, leftMm: p.leftMm, rightMm: p.rightMm, offsetMm: 0, fontScale: 1, detected: p};
}
export function printerChanged(profile: PrintProfile, printers: PrinterCapability[]): boolean {
    const current = printers.find(p => p.id === profile.id);
    return !current || current.driver !== profile.driver || (!!profile.detected &&
        JSON.stringify(current) !== JSON.stringify(profile.detected));
}
