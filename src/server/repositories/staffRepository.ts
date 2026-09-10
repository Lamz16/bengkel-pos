import { IStaffRepository } from './interfaces';
import { prisma, isDbConnected } from '../db/connection';
import { memoryStore } from '../db/memoryStore';

export class StaffRepository implements IStaffRepository {
  async getAll(): Promise<any[]> {
    if (isDbConnected()) {
      try {
        const list = await prisma.user.findMany({
          orderBy: { createdAt: 'asc' }
        });
        return list.map(u => ({
          id: u.id,
          name: u.name,
          role: u.role,
          email: u.email,
          status: u.status,
          shifts: u.shifts,
        }));
      } catch (err) {
        console.error('[StaffRepo] Prisma getAll error:', err);
      }
    }
    return memoryStore.staff;
  }

  async create(data: any): Promise<any> {
    const id = `STF-${Date.now().toString().slice(-4)}`;
    if (isDbConnected()) {
      try {
        const created = await prisma.user.create({
          data: {
            id,
            name: data.name,
            role: data.role || 'Admin',
            email: data.email || `${id.toLowerCase()}@bengkelpro.com`,
            status: data.status || 'Active',
            shifts: data.shifts || 'Pagi',
          }
        });
        const userObj = {
          id: created.id,
          name: created.name,
          role: created.role,
          email: created.email,
          status: created.status,
          shifts: created.shifts,
        };
        memoryStore.staff.push(userObj);
        return userObj;
      } catch (err) {
        console.error('[StaffRepo] Prisma create error:', err);
      }
    }
    const userObj = { id, ...data };
    memoryStore.staff.push(userObj);
    return userObj;
  }
}
