import { ISettingsRepository, IStaffRepository } from '../repositories/interfaces';
import { CompanySettings } from '../../types';

export class SettingsService {
  constructor(
    private settingsRepo: ISettingsRepository,
    private staffRepo: IStaffRepository
  ) {}

  async getSettings(): Promise<CompanySettings> {
    return this.settingsRepo.get();
  }

  async updateSettings(data: Partial<CompanySettings>): Promise<CompanySettings> {
    return this.settingsRepo.update(data);
  }

  async getStaff(): Promise<any[]> {
    return this.staffRepo.getAll();
  }

  async createStaff(data: any): Promise<any> {
    return this.staffRepo.create(data);
  }

  async getStaffById(id: string): Promise<any | null> {
    return this.staffRepo.getById(id);
  }

  async updateStaff(id: string, data: any): Promise<any | null> {
    return this.staffRepo.update(id, data);
  }

  async deleteStaff(id: string): Promise<boolean> {
    return this.staffRepo.delete(id);
  }

  async hasAnotherOwner(id: string): Promise<boolean> {
    return (await this.staffRepo.countOwners(id)) > 0;
  }
}
