import {test} from 'node:test';
import assert from 'node:assert/strict';
import {calibratedPdf} from './layout';
import {fromPrinter} from './profiles';
test('calibrated PDF uses physical paper width and retains all long-roll slices without a printer', async () => {
    const prior = globalThis.document;
    const draws: number[] = [];
    const png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGP4//8/AAX+Av4N70a4AAAAAElFTkSuQmCC';
    globalThis.document = {createElement: () => ({width: 0, height: 0,
        getContext: () => ({drawImage: (...args: unknown[]) => draws.push(args[4] as number)}),
        toDataURL: () => png,
    })} as unknown as Document;
    try {
        const profile = fromPrinter({id: 'test', name: 'Test', driver: 'Test', paperMm: 80, printableMm: 72, leftMm: 4, rightMm: 4, papers: []});
        const pdf = calibratedPdf({width: 720, height: 60000} as HTMLCanvasElement, profile);
        const text = await pdf.text();
        assert.match(text, /\/Count 2/);
        assert.equal(draws.reduce((a, b) => a + b, 0), 60000);
        assert.match(text, /\/MediaBox \[0 0 226\.77/);
    } finally {globalThis.document = prior;}
});
