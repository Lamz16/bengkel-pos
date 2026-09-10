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
}
