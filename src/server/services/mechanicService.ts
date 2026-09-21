import { IMechanicRepository, IDeductionRepository, IAttendanceRepository } from '../repositories/interfaces';
import { Mechanic, MechanicDeduction, MechanicAttendance } from '../../types';

export class MechanicService {
  constructor(
    private mechanicRepo: IMechanicRepository,
    private deductionRepo: IDeductionRepository,
    private attendanceRepo: IAttendanceRepository,
  ) {}

  async getMechanics(): Promise<Mechanic[]> {
    return this.mechanicRepo.getAll();
  }

  async getMechanicById(id: string): Promise<Mechanic | null> {
    return this.mechanicRepo.getById(id);
  }

  async createMechanic(data: Omit<Mechanic, 'id'>): Promise<Mechanic> {
    return this.mechanicRepo.create(data);
  }

  async updateMechanic(id: string, data: Partial<Mechanic>): Promise<Mechanic | null> {
    return this.mechanicRepo.update(id, data);
  }

  async deleteMechanic(id: string): Promise<boolean> {
    return this.mechanicRepo.delete(id);
  }

  async getDeductions(): Promise<MechanicDeduction[]> {
    return this.deductionRepo.getAll();
  }

  async createDeduction(data: Omit<MechanicDeduction, 'id'>): Promise<MechanicDeduction> {
    return this.deductionRepo.create(data);
  }

  async deleteDeduction(id: string): Promise<boolean> {
    return this.deductionRepo.delete(id);
  }

  async getAttendances(): Promise<MechanicAttendance[]> {
    return this.attendanceRepo.getAll();
  }

  async saveAttendance(data: Omit<MechanicAttendance, 'id'>): Promise<MechanicAttendance> {
    return this.attendanceRepo.upsert(data);
  }
}
