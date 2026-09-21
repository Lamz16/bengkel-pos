import { IMechanicRepository, IDeductionRepository, IAttendanceRepository } from './interfaces';
import { Mechanic, MechanicDeduction, MechanicAttendance } from '../../types';
import { prisma, isDbConnected } from '../db/connection';
import { memoryStore } from '../db/memoryStore';

export class MechanicRepository implements IMechanicRepository {
  async getAll(): Promise<Mechanic[]> {
    if (isDbConnected()) {
      try {
        const list = await prisma.mechanic.findMany({
          orderBy: { name: 'asc' }
        });
        return list.map(m => ({
          id: m.id,
          name: m.name,
          phone: m.phone,
          specialty: m.specialty,
          status: m.status as any,
          defaultBonusPercent: m.defaultBonusPercent,
          dailySalary: Number(m.dailySalary),
          warrantyPenaltyAmount: Number(m.warrantyPenaltyAmount),
          absencePenaltyAmount: Number(m.absencePenaltyAmount),
          joinedAt: m.joinedAt,
        }));
      } catch (err) {
        console.error('[MechanicRepo] Prisma getAll error:', err);
      }
    }
    return memoryStore.mechanics;
  }

  async getById(id: string): Promise<Mechanic | null> {
    if (isDbConnected()) {
      try {
        const m = await prisma.mechanic.findUnique({ where: { id } });
        if (m) {
          return {
            id: m.id,
            name: m.name,
            phone: m.phone,
            specialty: m.specialty,
            status: m.status as any,
            defaultBonusPercent: m.defaultBonusPercent,
            dailySalary: Number(m.dailySalary),
            warrantyPenaltyAmount: Number(m.warrantyPenaltyAmount),
            absencePenaltyAmount: Number(m.absencePenaltyAmount),
            joinedAt: m.joinedAt,
          };
        }
      } catch (err) {
        console.error('[MechanicRepo] Prisma getById error:', err);
      }
    }
    return memoryStore.mechanics.find(m => m.id === id) || null;
  }

  async create(data: Omit<Mechanic, 'id'>): Promise<Mechanic> {
    const id = `MEC-${Date.now().toString().slice(-4)}`;
    if (isDbConnected()) {
      try {
        const created = await prisma.mechanic.create({
          data: {
            id,
            name: data.name,
            phone: data.phone,
            specialty: data.specialty,
            status: data.status || 'Active',
            defaultBonusPercent: data.defaultBonusPercent || 15,
            dailySalary: data.dailySalary || 100000,
            warrantyPenaltyAmount: data.warrantyPenaltyAmount || 75000,
            absencePenaltyAmount: data.absencePenaltyAmount || 50000,
            joinedAt: data.joinedAt || new Date().toISOString().split('T')[0],
          }
        });
        const mec: Mechanic = {
          id: created.id,
          name: created.name,
          phone: created.phone,
          specialty: created.specialty,
          status: created.status as any,
          defaultBonusPercent: created.defaultBonusPercent,
          dailySalary: Number(created.dailySalary),
          warrantyPenaltyAmount: Number(created.warrantyPenaltyAmount),
          absencePenaltyAmount: Number(created.absencePenaltyAmount),
          joinedAt: created.joinedAt,
        };
        memoryStore.mechanics.push(mec);
        return mec;
      } catch (err) {
        console.error('[MechanicRepo] Prisma create error:', err);
      }
    }
    const mec: Mechanic = { id, ...data };
    memoryStore.mechanics.push(mec);
    return mec;
  }

  async update(id: string, data: Partial<Mechanic>): Promise<Mechanic | null> {
    if (isDbConnected()) {
      try {
        const updated = await prisma.mechanic.update({
          where: { id },
          data: {
            name: data.name,
            phone: data.phone,
            specialty: data.specialty,
            status: data.status,
            defaultBonusPercent: data.defaultBonusPercent,
            dailySalary: data.dailySalary,
            warrantyPenaltyAmount: data.warrantyPenaltyAmount,
            absencePenaltyAmount: data.absencePenaltyAmount,
          }
        });
        const mec: Mechanic = {
          id: updated.id,
          name: updated.name,
          phone: updated.phone,
          specialty: updated.specialty,
          status: updated.status as any,
          defaultBonusPercent: updated.defaultBonusPercent,
          dailySalary: Number(updated.dailySalary),
          warrantyPenaltyAmount: Number(updated.warrantyPenaltyAmount),
          absencePenaltyAmount: Number(updated.absencePenaltyAmount),
          joinedAt: updated.joinedAt,
        };
        const idx = memoryStore.mechanics.findIndex(m => m.id === id);
        if (idx !== -1) memoryStore.mechanics[idx] = mec;
        return mec;
      } catch (err) {
        console.error('[MechanicRepo] Prisma update error:', err);
      }
    }
    const idx = memoryStore.mechanics.findIndex(m => m.id === id);
    if (idx === -1) return null;
    memoryStore.mechanics[idx] = { ...memoryStore.mechanics[idx], ...data };
    return memoryStore.mechanics[idx];
  }

  async delete(id: string): Promise<boolean> {
    if (isDbConnected()) {
      try {
        await prisma.mechanic.delete({ where: { id } });
      } catch (err) {
        console.error('[MechanicRepo] Prisma delete error:', err);
      }
    }
    memoryStore.mechanics = memoryStore.mechanics.filter(m => m.id !== id);
    return true;
  }
}

export class DeductionRepository implements IDeductionRepository {
  async getAll(): Promise<MechanicDeduction[]> {
    if (isDbConnected()) {
      try {
        const list = await prisma.mechanicDeduction.findMany({
          orderBy: { date: 'desc' }
        });
        return list.map(d => ({
          id: d.id,
          mechanicId: d.mechanicId,
          mechanicName: d.mechanicName,
          serviceId: d.serviceId || undefined,
          vehiclePlate: d.vehiclePlate || undefined,
          date: d.date.toISOString(),
          reason: d.reason,
          type: d.type as any,
          amount: Number(d.amount),
          isAbsentNextDay: d.isAbsentNextDay,
        }));
      } catch (err) {
        console.error('[DeductionRepo] Prisma getAll error:', err);
      }
    }
    return memoryStore.deductions;
  }

  async create(data: Omit<MechanicDeduction, 'id'>): Promise<MechanicDeduction> {
    const id = `DED-${Date.now()}`;
    const dateObj = new Date(data.date || Date.now());

    if (isDbConnected()) {
      try {
        const created = await prisma.mechanicDeduction.create({
          data: {
            id,
            mechanicId: data.mechanicId,
            mechanicName: data.mechanicName,
            serviceId: data.serviceId,
            vehiclePlate: data.vehiclePlate,
            date: dateObj,
            reason: data.reason,
            type: data.type || 'Penalty',
            amount: data.amount,
            isAbsentNextDay: data.isAbsentNextDay || false,
          }
        });
        const ded: MechanicDeduction = {
          id: created.id,
          mechanicId: created.mechanicId,
          mechanicName: created.mechanicName,
          serviceId: created.serviceId || undefined,
          vehiclePlate: created.vehiclePlate || undefined,
          date: created.date.toISOString(),
          reason: created.reason,
          type: created.type as any,
          amount: Number(created.amount),
          isAbsentNextDay: created.isAbsentNextDay,
        };
        memoryStore.deductions.unshift(ded);
        return ded;
      } catch (err) {
        console.error('[DeductionRepo] Prisma create error:', err);
      }
    }
    const ded: MechanicDeduction = { id, ...data, date: dateObj.toISOString() };
    memoryStore.deductions.unshift(ded);
    return ded;
  }

  async delete(id: string): Promise<boolean> {
    if (isDbConnected()) {
      try {
        await prisma.mechanicDeduction.delete({ where: { id } });
      } catch (err) {
        console.error('[DeductionRepo] Prisma delete error:', err);
      }
    }
    memoryStore.deductions = memoryStore.deductions.filter(d => d.id !== id);
    return true;
  }
}

export class AttendanceRepository implements IAttendanceRepository {
  async getAll(): Promise<MechanicAttendance[]> {
    if (isDbConnected()) {
      try {
        const list = await prisma.mechanicAttendance.findMany({ orderBy: [{ date: 'desc' }, { mechanicId: 'asc' }] });
        return list.map(item => ({
          id: item.id,
          mechanicId: item.mechanicId,
          date: item.date,
          status: item.status as MechanicAttendance['status'],
          notes: item.notes || undefined,
        }));
      } catch (err) {
        console.error('[AttendanceRepo] Prisma getAll error:', err);
      }
    }
    return memoryStore.attendances;
  }

  async upsert(data: Omit<MechanicAttendance, 'id'>): Promise<MechanicAttendance> {
    const date = data.date.slice(0, 10);
    if (isDbConnected()) {
      try {
        const saved = await prisma.mechanicAttendance.upsert({
          where: { mechanicId_date: { mechanicId: data.mechanicId, date } },
          create: { mechanicId: data.mechanicId, date, status: data.status, notes: data.notes || null },
          update: { status: data.status, notes: data.notes || null },
        });
        const attendance: MechanicAttendance = {
          id: saved.id,
          mechanicId: saved.mechanicId,
          date: saved.date,
          status: saved.status as MechanicAttendance['status'],
          notes: saved.notes || undefined,
        };
        const index = memoryStore.attendances.findIndex(item => item.mechanicId === attendance.mechanicId && item.date === attendance.date);
        if (index >= 0) memoryStore.attendances[index] = attendance;
        else memoryStore.attendances.unshift(attendance);
        return attendance;
      } catch (err) {
        console.error('[AttendanceRepo] Prisma upsert error:', err);
      }
    }

    const index = memoryStore.attendances.findIndex(item => item.mechanicId === data.mechanicId && item.date === date);
    const attendance: MechanicAttendance = { id: index >= 0 ? memoryStore.attendances[index].id : `ATT-${Date.now()}-${data.mechanicId}`, ...data, date };
    if (index >= 0) memoryStore.attendances[index] = attendance;
    else memoryStore.attendances.unshift(attendance);
    return attendance;
  }
}
