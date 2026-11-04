import assert from 'node:assert/strict';
import test from 'node:test';
import { deleteUnusedPart, PartInUseError } from './deleteUnusedPart';

const initialPart = () => ({
  stock: 5, createdAt: new Date('2026-01-01'),
  stockHistories: [{ type: 'In', reason: 'Stok awal dari pemasok', amount: 5, date: new Date('2026-01-01') }],
  purchases: [{ id: 'PR-123-P1', quantity: 5 }],
  _count: { serviceItems: 0, returnItems: 0, distributorItems: 0, locationStocks: 0 },
});
function fixture(part: ReturnType<typeof initialPart>) {
  const calls: string[] = [];
  const tx = {
    $queryRaw: async () => { calls.push('lock'); },
    sparePart: { findUniqueOrThrow: async () => part, delete: async () => { calls.push('part'); } },
    purchaseRecord: { deleteMany: async () => { calls.push('purchase'); } },
    stockHistory: { deleteMany: async () => { calls.push('history'); } },
  };
  return { tx: tx as any, calls };
}
test('deletes a new part together with its initial stock records', async () => {
  const { tx, calls } = fixture(initialPart());
  await deleteUnusedPart(tx, 'P1');
  assert.deepEqual(calls, ['lock', 'purchase', 'history', 'part']);
});
test('allows an unused part created with zero stock', async () => {
  const part = initialPart(); part.stock = 0; part.stockHistories = []; part.purchases = [];
  await deleteUnusedPart(fixture(part).tx, 'P1');
});
for (const relation of ['serviceItems', 'returnItems', 'distributorItems', 'locationStocks'] as const) {
  test('protects ' + relation, async () => {
    const part = initialPart(); part._count[relation] = 1;
    const { tx, calls } = fixture(part);
    await assert.rejects(deleteUnusedPart(tx, 'P1'), PartInUseError);
    assert.deepEqual(calls, ['lock']);
  });
}
for (const scenario of ['restock', 'changed stock', 'extra purchase', 'unrecognized purchase', 'non-initial history']) {
  test('rejects ' + scenario + ' before deleting any records', async () => {
    const part = initialPart();
    if (scenario === 'restock') part.stockHistories.push({ ...part.stockHistories[0], reason: 'Pembelian dari pemasok' });
    if (scenario === 'changed stock') part.stock = 3;
    if (scenario === 'extra purchase') part.purchases.push({ id: 'PR-456', quantity: 2 });
    if (scenario === 'unrecognized purchase') part.purchases[0].id = 'PR-456';
    if (scenario === 'non-initial history') part.stockHistories[0].reason = 'Pembelian dari pemasok';
    const { tx, calls } = fixture(part);
    await assert.rejects(deleteUnusedPart(tx, 'P1'), PartInUseError);
    assert.deepEqual(calls, ['lock']);
  });
}

test('allows initial stock recorded after the part insert', async () => {
  const part = initialPart();
  part.stockHistories[0].date = new Date(part.createdAt.getTime() + 164);
  const { tx, calls } = fixture(part);
  await deleteUnusedPart(tx, 'P1');
  assert.deepEqual(calls, ['lock', 'purchase', 'history', 'part']);
});
