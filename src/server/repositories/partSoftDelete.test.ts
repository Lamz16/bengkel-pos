import assert from 'node:assert/strict';
import test from 'node:test';
import { PartRepository } from './partRepository';
import { memoryStore } from '../db/memoryStore';
import { SparePart } from '../../types';

test('PartRepository.delete performs soft delete by setting isActive to false', async () => {
  const repo = new PartRepository();
  const testPart: SparePart = {
    id: 'test-soft-del-1',
    name: 'Oli Mesin Matic',
    category: 'Oli',
    price: 65000,
    purchasePrice: 45000,
    stock: 10,
    minStock: 2,
    lastUpdated: new Date().toISOString(),
    isActive: true,
  };

  memoryStore.parts = [testPart];

  const result = await repo.delete('test-soft-del-1');
  assert.equal(result, true);

  const found = memoryStore.parts.find(p => p.id === 'test-soft-del-1');
  assert.ok(found);
  assert.equal(found.isActive, false);

  // Restore via update
  const restored = await repo.update('test-soft-del-1', { isActive: true });
  assert.ok(restored);
  assert.equal(restored.isActive, true);

  // Cleanup
  memoryStore.parts = [];
});
