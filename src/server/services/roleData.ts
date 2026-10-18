import { SparePart, WorkshopService } from '../../types';

/** Shapes allowed in an operational cashier session. Never mutate the source. */
export function cashierPart(part: SparePart) {
  const { purchasePrice, supplierId, rackId, rackCode, rackLocation, rackZone, shelfLevel, binNumber, locationNotes, ...safe } = part;
  return safe;
}

export function cashierService(service: WorkshopService) {
  const safe: any = { ...service };
  delete safe.mechanicBonusPercent;
  delete safe.mechanicBonusAmount;
  delete safe.warrantyDeductionAmount;
  delete safe.createdByRoleSnapshot;
  safe.partsUsed = (service.partsUsed || []).map((item: any) => {
    const { purchasePriceAtTime, normalPriceAtTime, wholesaleType, wholesaleValue, wholesaleUnitPrice, ...part } = item;
    return part;
  });
  return safe;
}

function cashierCustomer(customer: any) {
  const { totalSpent, totalServiceCount, lastVisitDate, ...safe } = customer;
  return safe;
}

export function cashierBootstrap(data: any, userId: string) {
  return {
    customers: data.customers.map(cashierCustomer),
    vehicles: data.vehicles,
    parts: data.parts.map(cashierPart),
    services: data.services.filter((service: WorkshopService) => service.createdByUserId === userId).map(cashierService),
    servicesPagination: { ...data.servicesPagination, total: data.services.filter((service: WorkshopService) => service.createdByUserId === userId).length, totalPages: 1 },
    mechanics: data.mechanics.map(({ id, name, specialty, status }: any) => ({ id, name, specialty, status })),
    postgresConnected: data.postgresConnected,
  };
}
