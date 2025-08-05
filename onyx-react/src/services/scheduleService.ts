import { WeeklySchedule, CreateScheduleDto, UpdateScheduleDto, DayOfWeek } from '@/types/Schedule';

class ScheduleService {
  private readonly STORAGE_KEY = 'onyx_schedules';

  private getSchedules(): WeeklySchedule[] {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (!saved) return [];
      
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error('Erreur lecture schedules:', error);
      return [];
    }
  }

  private saveSchedules(schedules: WeeklySchedule[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(schedules));
    } catch (error) {
      console.error('Erreur sauvegarde schedules:', error);
    }
  }

  async getAllSchedules(): Promise<WeeklySchedule[]> {
    return this.getSchedules();
  }

  async getSchedule(id: string): Promise<WeeklySchedule | null> {
    const schedules = this.getSchedules();
    return schedules.find(s => s.id === id) || null;
  }

  async getActiveSchedule(): Promise<WeeklySchedule | null> {
    const schedules = this.getSchedules();
    return schedules.find(s => s.isActive) || null;
  }

  async createSchedule(dto: CreateScheduleDto): Promise<WeeklySchedule> {
    const schedules = this.getSchedules();
    
    const newSchedule: WeeklySchedule = {
      id: crypto.randomUUID(),
      name: dto.name,
      days: dto.days,
      isActive: schedules.length === 0, // Premier schedule = actif par défaut
      createdAt: new Date(),
      updatedAt: new Date()
    };

    schedules.push(newSchedule);
    this.saveSchedules(schedules);
    
    return newSchedule;
  }

  async updateSchedule(id: string, dto: UpdateScheduleDto): Promise<WeeklySchedule | null> {
    const schedules = this.getSchedules();
    const index = schedules.findIndex(s => s.id === id);
    
    if (index === -1) return null;

    // Si on active ce schedule, désactiver les autres
    if (dto.isActive) {
      schedules.forEach(s => s.isActive = false);
    }

    const updatedSchedule: WeeklySchedule = {
      ...schedules[index],
      ...dto,
      updatedAt: new Date()
    };

    schedules[index] = updatedSchedule;
    this.saveSchedules(schedules);
    
    return updatedSchedule;
  }

  async deleteSchedule(id: string): Promise<boolean> {
    const schedules = this.getSchedules();
    const filteredSchedules = schedules.filter(s => s.id !== id);
    
    if (filteredSchedules.length === schedules.length) {
      return false; // Schedule non trouvé
    }

    this.saveSchedules(filteredSchedules);
    return true;
  }

  async setActiveSchedule(id: string): Promise<boolean> {
    const schedules = this.getSchedules();
    let found = false;

    schedules.forEach(s => {
      if (s.id === id) {
        s.isActive = true;
        found = true;
      } else {
        s.isActive = false;
      }
    });

    if (found) {
      this.saveSchedules(schedules);
    }

    return found;
  }

  getDaySchedule(_scheduleId: string, _day: DayOfWeek): Promise<any> {
    // Implementation stub
    return Promise.resolve(null);
  }
}

export const scheduleService = new ScheduleService();