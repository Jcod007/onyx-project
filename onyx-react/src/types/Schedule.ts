export type DayOfWeek = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';

export interface TimeSlot {
  startTime: string; // Format HH:MM
  endTime: string;   // Format HH:MM
  subjectId?: string;
}

export interface DaySchedule {
  day: DayOfWeek;
  timeSlots: TimeSlot[];
}

export interface WeeklySchedule {
  id: string;
  name: string;
  days: DaySchedule[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateScheduleDto {
  name: string;
  days: Omit<DaySchedule, never>[];
}

export interface UpdateScheduleDto {
  name?: string;
  days?: DaySchedule[];
  isActive?: boolean;
}

export const DayLabels: Record<DayOfWeek, string> = {
  MONDAY: 'Lundi',
  TUESDAY: 'Mardi', 
  WEDNESDAY: 'Mercredi',
  THURSDAY: 'Jeudi',
  FRIDAY: 'Vendredi',
  SATURDAY: 'Samedi',
  SUNDAY: 'Dimanche'
};