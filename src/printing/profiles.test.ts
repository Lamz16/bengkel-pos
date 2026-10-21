import {test} from 'node:test';
import assert from 'node:assert/strict';
import {activeProfile, defaults, fromPrinter, loadPreferences, printerChanged, validProfile, savePreferences} from './profiles';
import {detectPrinters} from './companion';
const printer = {id: 'thermal', name: 'Thermal', driver: 'v1', paperMm: 80, printableMm: 72, leftMm: 4, rightMm: 4, papers: []};
const profile = fromPrinter(printer);
test('profiles are opt-in and PDF never uses physical corrections', () => {
    assert.equal(activeProfile(defaults()), undefined);
    const prefs = {...defaults(), enabled: true, selected: printer.id, profiles: [profile]};
    assert.equal(activeProfile(prefs), profile);
    assert.equal(activeProfile({...prefs, mode: 'pdf'}), undefined);
    assert.equal(activeProfile({...prefs, selected: 'missing'}), undefined);
});
test('invalid dimensions and corrupt/old/unavailable storage fall back', () => {
    for (const patch of [{contentMm: -1}, {leftMm: 90}, {offsetMm: 5}, {offsetMm: -5}, {fontScale: Infinity}, {paperMm: NaN}])
        assert.equal(validProfile({...profile, ...patch}), false);
    for (const raw of ['{', '{"version":0}', JSON.stringify({...defaults(), profiles: [{...profile, contentMm: -2}]})])
        assert.deepEqual(loadPreferences({getItem: () => raw}), defaults());
    assert.deepEqual(loadPreferences({getItem: () => {throw Error('denied');}}), defaults());
    const stored = {...defaults(), enabled: true, selected: printer.id, profiles: [profile]};
    assert.deepEqual(loadPreferences({getItem: () => JSON.stringify(stored)}), stored);
});
test('changed or missing printer requires review and does not mutate saved profile', () => {
    assert.equal(printerChanged(profile, [printer]), false);
    assert.equal(printerChanged(profile, [{...printer, driver: 'v2'}]), true);
    assert.equal(printerChanged(profile, []), true);
    assert.equal(profile.driver, 'v1');
});
test('companion success, unavailable, timeout and malformed response', async () => {
    const original = globalThis.fetch;
    try {
        globalThis.fetch = async () => new Response(JSON.stringify({version: 1, printers: [printer]}));
        assert.deepEqual(await detectPrinters(), [printer]);
        globalThis.fetch = async () => {throw Error('offline');};
        await assert.rejects(detectPrinters());
        globalThis.fetch = async (_url, options) => new Promise<Response>((_resolve, reject) => {
            options?.signal?.addEventListener('abort', () => reject(Error('timeout')), {once: true});
        });
        await assert.rejects(detectPrinters(10), /timeout/);
        globalThis.fetch = async () => new Response('{"version":1,"printers":[{}]}');
        await assert.rejects(detectPrinters());
    } finally {globalThis.fetch = original;}
});

test('storage write failures do not escape into the receipt flow', () => {
    assert.equal(savePreferences(defaults(), {setItem: () => {throw Error('quota');}}), false);
});
