import { IStaffRepository } from './interfaces';
import { prisma, isDbConnected } from '../db/connection';
import { memoryStore } from '../db/memoryStore';
import { hashPassword } from '../auth';

export class StaffRepository implements IStaffRepository {
  async hasAnyUser(): Promise<boolean> {
    if (isDbConnected()) return (await prisma.user.count()) > 0;
    return memoryStore.users.length > 0;
  }

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
          workshopName: u.workshopName,
          createdAt: u.createdAt.toISOString ? u.createdAt.toISOString() : u.createdAt,
        }));
      } catch (err) {
        console.error('[StaffRepo] Prisma getAll error:', err);
      }
    }
    return memoryStore.staff;
  }

  async findByEmail(email: string): Promise<any | null> {
    if (isDbConnected()) {
      try {
        const u = await prisma.user.findFirst({
          where: { email: { equals: email, mode: 'insensitive' } }
        });
        if (u) {
          return {
            id: u.id,
            name: u.name,
            role: u.role,
            email: u.email,
            password: u.password,
            workshopName: u.workshopName,
            createdAt: u.createdAt.toISOString ? u.createdAt.toISOString() : u.createdAt,
          };
        }
      } catch (err) {
        console.error('[StaffRepo] findByEmail error:', err);
      }
    }
    const memUser = memoryStore.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    return memUser || null;
  }

  async createUser(data: { name: string; email: string; role: string; password?: string; workshopName?: string }): Promise<any> {
    const id = `USR-${Date.now().toString().slice(-4)}`;
    const userPassword = data.password || await hashPassword('akundemo');
    if (isDbConnected()) {
      try {
        const created = await prisma.user.create({
          data: {
            id,
            name: data.name,
            role: data.role || 'Owner',
            email: data.email,
            password: userPassword,
            workshopName: data.workshopName || 'BengkelPro Mandiri',
            status: 'Active',
            shifts: 'Pagi',
          }
        });
        const userObj = {
          id: created.id,
          name: created.name,
          role: (created.role as any) || 'Owner',
          email: created.email,
          password: created.password,
          workshopName: created.workshopName,
          createdAt: created.createdAt.toISOString ? created.createdAt.toISOString() : created.createdAt,
        };
        memoryStore.users.push(userObj as any);
        return userObj;
      } catch (err) {
        console.error('[StaffRepo] createUser error:', err);
      }
    }
    const userObj = { id, name: data.name, role: (data.role as any) || 'Owner', email: data.email, password: userPassword, workshopName: data.workshopName || 'BengkelPro Mandiri', createdAt: new Date().toISOString() };
    memoryStore.users.push(userObj as any);
    return userObj;
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
            password: await hashPassword(data.password || 'akundemo'),
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
