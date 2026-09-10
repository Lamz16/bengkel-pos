import { IVehicleRepository } from './interfaces';
import { Vehicle } from '../../types';
import { prisma, isDbConnected } from '../db/connection';
import { memoryStore } from '../db/memoryStore';

export class VehicleRepository implements IVehicleRepository {
  async getAll(): Promise<Vehicle[]> {
    if (isDbConnected()) {
      try {
        const list = await prisma.vehicle.findMany();
        return list.map(v => ({
          id: v.id,
          customerId: v.customerId,
          plateNumber: v.plateNumber,
          model: v.model,
          brand: v.brand,
        }));
      } catch (err) {
        console.error('[VehicleRepo] Prisma getAll error:', err);
      }
    }
    return memoryStore.vehicles;
  }

  async getByCustomerId(customerId: string): Promise<Vehicle[]> {
    if (isDbConnected()) {
      try {
        const list = await prisma.vehicle.findMany({ where: { customerId } });
        return list.map(v => ({
          id: v.id,
          customerId: v.customerId,
          plateNumber: v.plateNumber,
          model: v.model,
          brand: v.brand,
        }));
      } catch (err) {
        console.error('[VehicleRepo] Prisma getByCustomerId error:', err);
      }
    }
    return memoryStore.vehicles.filter(v => v.customerId === customerId);
  }

  async create(data: Omit<Vehicle, 'id'>): Promise<Vehicle> {
    const id = `VH-${Date.now().toString().slice(-4)}`;
    if (isDbConnected()) {
      try {
        const created = await prisma.vehicle.create({
          data: {
            id,
            customerId: data.customerId,
            plateNumber: data.plateNumber,
            model: data.model,
            brand: data.brand,
          }
        });
        const veh: Vehicle = {
          id: created.id,
          customerId: created.customerId,
          plateNumber: created.plateNumber,
          model: created.model,
          brand: created.brand,
        };
        memoryStore.vehicles.unshift(veh);
        return veh;
      } catch (err) {
        console.error('[VehicleRepo] Prisma create error:', err);
      }
    }
    const veh: Vehicle = { id, ...data };
    memoryStore.vehicles.unshift(veh);
    return veh;
  }

  async delete(id: string): Promise<boolean> {
    if (isDbConnected()) {
      try {
        await prisma.vehicle.delete({ where: { id } });
      } catch (err) {
        console.error('[VehicleRepo] Prisma delete error:', err);
      }
    }
    memoryStore.vehicles = memoryStore.vehicles.filter(v => v.id !== id);
    return true;
  }
}
