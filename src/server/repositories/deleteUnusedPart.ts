import { Prisma } from '@prisma/client';

export class PartInUseError extends Error {}

// Run inside a serializable transaction. The row lock also serializes stock writes.
export async function deleteUnusedPart(tx: Prisma.TransactionClient, id: string): Promise<void> {
  await tx.$queryRaw`SELECT id FROM "SparePart" WHERE id = ${id} FOR UPDATE`;
  const part = await tx.sparePart.findUniqueOrThrow({
    where: { id },
    include: { stockHistories: true, purchases: true, _count: { select: {
      serviceItems: true, returnItems: true, distributorItems: true, locationStocks: true,
    } } },
  });
  if (part._count.serviceItems || part._count.returnItems || part._count.distributorItems || part._count.locationStocks) {
    throw new PartInUseError('Barang tidak dapat dihapus karena sudah digunakan dalam transaksi, retur, nota distributor, atau penempatan stok.');
  }
  const histories = part.stockHistories;
  // Separate inserts may have different timestamps even within the same transaction.
  // Identify initial stock by its dedicated reason and matching purchase identity instead.
  const initial = histories.length === 1 && histories[0].type === 'In'
    && ['Stok awal dari pemasok', 'Stok awal saat membuat part'].includes(histories[0].reason)
    && histories[0].amount > 0
    && histories[0].amount === part.stock;
  if (histories.length > 0 && !initial || histories.length === 0 && part.stock !== 0) {
    throw new PartInUseError('Barang tidak dapat dihapus karena stok sudah berubah atau memiliki pergerakan stok lanjutan.');
  }
  const purchases = part.purchases;
  const initialPurchase = initial && purchases.length === 1
    && purchases[0].id.endsWith('-' + id)
    && /^PR-[0-9]+$/.test(purchases[0].id.slice(0, -(id.length + 1)))
    && purchases[0].quantity === histories[0].amount;
  if (purchases.length > 0 && !initialPurchase) {
    throw new PartInUseError('Barang tidak dapat dihapus karena memiliki pembelian lanjutan atau catatan pembelian yang bukan stok awal.');
  }
  await tx.purchaseRecord.deleteMany({ where: { partId: id } });
  await tx.stockHistory.deleteMany({ where: { partId: id } });
  await tx.sparePart.delete({ where: { id } });
}
