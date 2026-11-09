import assert from 'node:assert/strict';
import test from 'node:test';
import { DraftService } from './draftService';
import { memoryStore } from '../db/memoryStore';
import { User } from '../../types';

test('DraftService CRUD workflow in memory fallback', async () => {
  const service = new DraftService();
  memoryStore.drafts = [];

  const mockUser: User = {
    id: 'user-cashier-1',
    name: 'Budi Kasir',
    email: 'kasir@bengkel.local',
    role: 'Kasir',
    workshopName: 'BengkelPro',
    createdAt: new Date().toISOString(),
  };

  // 1. Create a draft
  const created = await service.create({
    receiptType: 'SERVICE',
    customerName: 'Ahmad Dahlan',
    customerPhone: '081234567890',
    vehiclePlate: 'B 1234 XYZ',
    vehicleModel: 'Honda Vario 160',
    kilometers: 12500,
    complaint: 'Tarikan berat dan ganti oli',
    laborFee: 35000,
    totalAmount: 115000,
    itemsPayload: {
      partsUsed: [
        {
          partId: 'part-oli-1',
          name: 'Oli MPX2 0.8L',
          quantity: 1,
          priceAtTime: 80000,
        },
      ],
      serviceItems: [
        {
          name: 'Jasa Servis Ringan',
          price: 35000,
        },
      ],
    },
  }, mockUser);

  assert.ok(created.id, 'Draft should have an ID');
  assert.ok(created.draftCode.startsWith('DFT-'), 'Draft code should start with DFT-');
  assert.equal(created.customerName, 'Ahmad Dahlan');
  assert.equal(created.totalAmount, 115000);
  assert.equal(created.createdByName, 'Budi Kasir');
  assert.equal(memoryStore.drafts.length, 1);

  // 2. List drafts
  const list = await service.list();
  assert.equal(list.length, 1);
  assert.equal(list[0].id, created.id);

  // 3. Get draft by ID
  const fetched = await service.get(created.id);
  assert.ok(fetched);
  assert.equal(fetched.draftCode, created.draftCode);

  // 4. Update draft
  const updated = await service.update(created.id, {
    complaint: 'Tarikan berat, ganti oli dan kampas rem',
    laborFee: 45000,
    totalAmount: 125000,
  });
  assert.equal(updated.laborFee, 45000);
  assert.equal(updated.totalAmount, 125000);
  assert.equal(updated.complaint, 'Tarikan berat, ganti oli dan kampas rem');

  // 5. Delete draft
  const deleted = await service.delete(created.id);
  assert.equal(deleted, true);
  assert.equal(memoryStore.drafts.length, 0);

  // 6. Get non-existent returns null
  const afterDelete = await service.get(created.id);
  assert.equal(afterDelete, null);
});
