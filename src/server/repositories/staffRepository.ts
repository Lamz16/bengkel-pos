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

  async getById(id: string): Promise<any | null> {
    if (isDbConnected()) {
      const user = await prisma.user.findUnique({ where: { id } });
      if (!user) return null;
      const { password: _password, ...safeUser } = user;
      return safeUser;
    }
    return memoryStore.staff.find(user => user.id === id) || null;
  }

  async countOwners(excludeId?: string): Promise<number> {
    if (isDbConnected()) {
      return prisma.user.count({ where: { role: 'Owner', ...(excludeId ? { id: { not: excludeId } } : {}) } });
    }
    return memoryStore.staff.filter(user => user.role === 'Owner' && user.id !== excludeId).length;
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

  async update(id: string, data: any): Promise<any | null> {
    const payload = {
      name: data.name,
      email: data.email,
      role: data.role,
      status: data.status,
      shifts: data.shifts,
      ...(data.password ? { password: await hashPassword(data.password) } : {}),
    };
    if (isDbConnected()) {
      const updated = await prisma.user.update({ where: { id }, data: payload });
      const { password: _password, ...safeUser } = updated;
      return safeUser;
    }
    const current = memoryStore.staff.find(user => user.id === id);
    if (!current) return null;
    const updated = { ...current, ...payload };
    memoryStore.staff = memoryStore.staff.map(user => user.id === id ? updated : user);
    memoryStore.users = memoryStore.users.map(user => user.id === id ? { ...user, ...payload } : user);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    if (isDbConnected()) {
      await prisma.user.delete({ where: { id } });
      return true;
    }
    const exists = memoryStore.staff.some(user => user.id === id);
    memoryStore.staff = memoryStore.staff.filter(user => user.id !== id);
    memoryStore.users = memoryStore.users.filter(user => user.id !== id);
    return exists;
  }
}
