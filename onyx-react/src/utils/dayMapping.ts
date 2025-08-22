import { DayOfWeek } from '@/types/Subject';

/**
 * 📅 UTILITAIRES DE MAPPING DES JOURS
 * 
 * Centralise la logique de conversion entre les différents formats de jours
 * pour assurer la cohérence dans toute l'application.
 * 
 * Base: Date.getDay() - 0=Dimanche, 1=Lundi, ..., 6=Samedi
 */

// Mapping principal: Index JavaScript → DayOfWeek
export const JS_DAY_TO_DAY_OF_WEEK: Record<number, DayOfWeek> = {
  0: 'SUNDAY',
  1: 'MONDAY',
  2: 'TUESDAY',
  3: 'WEDNESDAY',
  4: 'THURSDAY',
  5: 'FRIDAY',
  6: 'SATURDAY'
};

// Mapping inverse: DayOfWeek → Index JavaScript  
export const DAY_OF_WEEK_TO_JS_DAY: Record<DayOfWeek, number> = {
  'SUNDAY': 0,
  'MONDAY': 1,
  'TUESDAY': 2,
  'WEDNESDAY': 3,
  'THURSDAY': 4,
  'FRIDAY': 5,
  'SATURDAY': 6
};

// Tableau ordonné pour itération
export const ORDERED_DAYS: DayOfWeek[] = [
  'SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'
];

// Labels français
export const DAY_LABELS_FR: Record<DayOfWeek, string> = {
  'MONDAY': 'Lundi',
  'TUESDAY': 'Mardi',
  'WEDNESDAY': 'Mercredi',
  'THURSDAY': 'Jeudi',
  'FRIDAY': 'Vendredi',
  'SATURDAY': 'Samedi',
  'SUNDAY': 'Dimanche'
};

// Labels courts pour l'interface
export const DAY_SHORT_LABELS_FR: Record<DayOfWeek, string> = {
  'MONDAY': 'L',
  'TUESDAY': 'M',
  'WEDNESDAY': 'M',
  'THURSDAY': 'J',
  'FRIDAY': 'V',
  'SATURDAY': 'S',
  'SUNDAY': 'D'
};

/**
 * Convertit une date en DayOfWeek
 */
export function dateToDay(date: Date): DayOfWeek {
  return JS_DAY_TO_DAY_OF_WEEK[date.getDay()];
}

/**
 * Convertit un DayOfWeek en index JavaScript (0-6)
 */
export function dayToJsIndex(day: DayOfWeek): number {
  return DAY_OF_WEEK_TO_JS_DAY[day];
}

/**
 * Convertit une liste d'indices JavaScript en DayOfWeek[]
 */
export function jsIndicesToDays(indices: number[]): DayOfWeek[] {
  return indices.map(index => JS_DAY_TO_DAY_OF_WEEK[index]).filter(Boolean);
}

/**
 * Convertit une liste de DayOfWeek en indices JavaScript
 */
export function daysToJsIndices(days: DayOfWeek[]): number[] {
  return days.map(day => DAY_OF_WEEK_TO_JS_DAY[day]);
}

/**
 * Configuration d'affichage pour les jours de la semaine dans l'interface
 */
export const WEEKDAY_DISPLAY_CONFIG = [
  { jsIndex: 1, day: 'MONDAY' as DayOfWeek, short: 'L', full: 'Lundi' },
  { jsIndex: 2, day: 'TUESDAY' as DayOfWeek, short: 'M', full: 'Mardi' },
  { jsIndex: 3, day: 'WEDNESDAY' as DayOfWeek, short: 'M', full: 'Mercredi' },
  { jsIndex: 4, day: 'THURSDAY' as DayOfWeek, short: 'J', full: 'Jeudi' },
  { jsIndex: 5, day: 'FRIDAY' as DayOfWeek, short: 'V', full: 'Vendredi' },
  { jsIndex: 6, day: 'SATURDAY' as DayOfWeek, short: 'S', full: 'Samedi' },
  { jsIndex: 0, day: 'SUNDAY' as DayOfWeek, short: 'D', full: 'Dimanche' }
];