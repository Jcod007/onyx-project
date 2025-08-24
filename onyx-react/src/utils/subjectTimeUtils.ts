/**
 * Utilitaires centralisés pour la gestion des temps des matières
 * Élimine les duplications entre SubjectConfigCard et SubjectConfigWizard
 */

import { DayOfWeek } from '@/types/Subject';

// Constantes centralisées
export const DAY_MAPPING: Record<string, number> = {
  'MONDAY': 1,
  'TUESDAY': 2, 
  'WEDNESDAY': 3,
  'THURSDAY': 4,
  'FRIDAY': 5,
  'SATURDAY': 6,
  'SUNDAY': 0
} as const;

export const REVERSE_DAY_MAPPING: Record<number, DayOfWeek> = {
  1: 'MONDAY',
  2: 'TUESDAY',
  3: 'WEDNESDAY', 
  4: 'THURSDAY',
  5: 'FRIDAY',
  6: 'SATURDAY',
  0: 'SUNDAY'
} as const;

export const DEFAULT_WEEKLY_TIME_MINUTES = 240; // 4h par semaine
export const DEFAULT_WORK_DAYS = [1, 2, 3, 4, 5]; // Lundi à vendredi

/**
 * Crée un objet dailyTimes vide (tous les jours à 0)
 */
export function createEmptyDailyTimes(): Record<number, number> {
  return {
    1: 0, // Lundi
    2: 0, // Mardi
    3: 0, // Mercredi
    4: 0, // Jeudi
    5: 0, // Vendredi
    6: 0, // Samedi
    0: 0  // Dimanche
  };
}

/**
 * Distribue un temps total équitablement sur les jours sélectionnés
 */
export function distributeDailyTime(
  totalMinutes: number, 
  selectedDays: number[]
): Record<number, number> {
  if (selectedDays.length === 0 || totalMinutes <= 0) {
    return createEmptyDailyTimes();
  }

  const dailyTime = Math.round(totalMinutes / selectedDays.length);
  const newDailyTimes = createEmptyDailyTimes();
  
  selectedDays.forEach(dayId => {
    newDailyTimes[dayId] = dailyTime;
  });
  
  return newDailyTimes;
}

/**
 * Calcule le temps total hebdomadaire à partir des temps quotidiens
 */
export function calculateWeeklyTotal(dailyTimes: Record<number, number>): number {
  return Object.values(dailyTimes).reduce((sum, time) => sum + time, 0);
}

/**
 * Convertit un tableau de DayOfWeek en tableau de nombres
 */
export function convertDayOfWeekToNumbers(studyDays: DayOfWeek[]): number[] {
  return studyDays
    .map(day => DAY_MAPPING[day])
    .filter((id): id is number => id !== undefined);
}

/**
 * Convertit un tableau de nombres en tableau de DayOfWeek
 */
export function convertNumbersToDayOfWeek(dayIds: number[]): DayOfWeek[] {
  return dayIds
    .map(id => REVERSE_DAY_MAPPING[id])
    .filter((day): day is DayOfWeek => day !== undefined);
}

/**
 * Crée les temps quotidiens par défaut à partir d'un objectif hebdomadaire
 */
export function createDefaultDailyTimes(
  weeklyTimeGoal: number = DEFAULT_WEEKLY_TIME_MINUTES,
  workDays: number[] = DEFAULT_WORK_DAYS
): Record<number, number> {
  if (workDays.length === 0) {
    return createEmptyDailyTimes();
  }

  const defaultDailyTime = Math.round(weeklyTimeGoal / workDays.length);
  const dailyTimes = createEmptyDailyTimes();
  
  workDays.forEach(dayId => {
    dailyTimes[dayId] = defaultDailyTime;
  });
  
  return dailyTimes;
}

/**
 * Convertit des heures, minutes, secondes en minutes totales
 */
export function timeToMinutes(hours: number, minutes: number, seconds: number = 0): number {
  return hours * 60 + minutes + Math.round(seconds / 60);
}

/**
 * Convertit des minutes en heures et minutes
 */
export function minutesToTime(totalMinutes: number): { hours: number; minutes: number } {
  return {
    hours: Math.floor(totalMinutes / 60),
    minutes: totalMinutes % 60
  };
}

/**
 * Calcule la répartition moyenne par jour pour l'affichage
 */
export function calculateDailyAverage(weeklyTimeMinutes: number, selectedDays: number[]): number {
  if (selectedDays.length === 0) return 0;
  return Math.round(weeklyTimeMinutes / selectedDays.length);
}

/**
 * Valide qu'un temps quotidien est raisonnable
 */
export function isValidDailyTime(minutes: number): boolean {
  return minutes >= 0 && minutes <= 480; // Max 8h par jour
}

/**
 * Valide qu'un temps hebdomadaire est raisonnable
 */
export function isValidWeeklyTime(minutes: number): boolean {
  return minutes >= 0 && minutes <= 2400; // Max 40h par semaine
}

/**
 * Compte le nombre de jours actifs (avec temps > 0)
 */
export function countActiveDays(dailyTimes: Record<number, number>): number {
  return Object.values(dailyTimes).filter(time => time > 0).length;
}

/**
 * Initialise selectedDays à partir des studyDays d'un Subject
 */
export function initializeSelectedDays(studyDays?: DayOfWeek[]): number[] {
  if (studyDays?.length) {
    return convertDayOfWeekToNumbers(studyDays);
  }
  return DEFAULT_WORK_DAYS; // Lundi à vendredi par défaut
}

/**
 * Crée les props par défaut pour un nouveau Subject
 */
export function createDefaultSubjectTimeConfig() {
  return {
    weeklyTimeMinutes: DEFAULT_WEEKLY_TIME_MINUTES,
    selectedDays: DEFAULT_WORK_DAYS,
    dailyTimes: createDefaultDailyTimes(),
    globalTime: minutesToTime(DEFAULT_WEEKLY_TIME_MINUTES)
  };
}

/**
 * Met à jour les temps quotidiens quand le mode ou les jours changent
 */
export function updateDailyTimesForSimpleMode(
  weeklyTimeMinutes: number,
  selectedDays: number[],
  configMode: 'simple' | 'advanced'
): Record<number, number> | null {
  if (configMode !== 'simple' || selectedDays.length === 0 || weeklyTimeMinutes <= 0) {
    return null;
  }
  
  return distributeDailyTime(weeklyTimeMinutes, selectedDays);
}