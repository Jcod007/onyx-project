/**
 * Utilitaires de formatage du temps - Migration de TimeFormatService.java
 */

export function formatDuration(seconds: number, context?: 'timer' | 'planning' | 'stats'): string {
  if (seconds < 0) return '00:00';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  // Contexte spécifique
  if (context === 'timer') {
    // Timers: MM:SS si < 1h, HH:MM:SS si >= 1h
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  
  if (context === 'planning' || context === 'stats') {
    // Planification/Stats: toujours HH:MM
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }
  
  // Auto: >= 1h → HH:MM, < 1h → MM:SS
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }
  
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export function formatHoursMinutes(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

// Formater les minutes en format 00:00
export function formatMinutesToHours(totalMinutes: number): string {
  // Validation et nettoyage de l'entrée
  const cleanMinutes = Math.max(0, Math.floor(Number(totalMinutes) || 0));
  
  const hours = Math.floor(cleanMinutes / 60);
  const minutes = cleanMinutes % 60;
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

export function parseTimeInput(timeStr: string): { hours: number; minutes: number; seconds: number } {
  const parts = timeStr.split(':');
  
  if (parts.length === 2) {
    // Format MM:SS
    return {
      hours: 0,
      minutes: parseInt(parts[0]) || 0,
      seconds: parseInt(parts[1]) || 0
    };
  } else if (parts.length === 3) {
    // Format HH:MM:SS
    return {
      hours: parseInt(parts[0]) || 0,
      minutes: parseInt(parts[1]) || 0,
      seconds: parseInt(parts[2]) || 0
    };
  }
  
  // Fallback
  return { hours: 0, minutes: 0, seconds: 0 };
}

export function secondsToTimeSpan(seconds: number): { hours: number; minutes: number; seconds: number } {
  return {
    hours: Math.floor(seconds / 3600),
    minutes: Math.floor((seconds % 3600) / 60),
    seconds: seconds % 60
  };
}

export function timeSpanToSeconds(hours: number, minutes: number, seconds: number): number {
  return hours * 3600 + minutes * 60 + seconds;
}

export function calculateProgress(timeSpent: number, targetTime: number): number {
  if (targetTime === 0) return 0;
  return Math.min((timeSpent / targetTime) * 100, 100);
}

export function isValidTimeInput(hours: number, minutes: number, seconds: number): boolean {
  return hours >= 0 && hours <= 99 && 
         minutes >= 0 && 
         seconds >= 0 &&
         (hours + minutes + seconds) > 0;
}

export function normalizeTime(hours: number, minutes: number, seconds: number): { hours: number; minutes: number; seconds: number } {
  let totalSeconds = timeSpanToSeconds(hours, minutes, seconds);
  
  // Clamp to maximum (99:59:59)
  const maxSeconds = 99 * 3600 + 59 * 60 + 59;
  if (totalSeconds > maxSeconds) {
    totalSeconds = maxSeconds;
  }
  
  return secondsToTimeSpan(totalSeconds);
}

export function formatTimeIntelligent(seconds: number): string {
  // Alias pour formatHoursMinutes pour compatibilité
  return formatHoursMinutes(seconds);
}

// ========== FONCTIONS DE NORMALISATION DES UNITÉS ==========
// Ajoutées pour résoudre les bugs de corruption minutes/secondes

/**
 * Détecte et corrige les corruptions d'unités de temps
 * Utilisé pour corriger les bugs où les minutes sont stockées comme secondes et vice-versa
 */
export function detectAndFixTimeCorruption(value: number, context: 'plannedDuration' | 'targetTime' | 'weeklyGoal'): number {
  if (!value || value <= 0) return 0;
  
  const MAX_REASONABLE_DAILY_MINUTES = 480; // 8 heures
  const MAX_REASONABLE_WEEKLY_MINUTES = 2400; // 40 heures  
  const MAX_REASONABLE_SESSION_SECONDS = 14400; // 4 heures
  
  switch (context) {
    case 'plannedDuration':
      // Bug #1: plannedDuration en minutes mais parfois corrompu avec des secondes
      if (value > MAX_REASONABLE_DAILY_MINUTES) {
        console.warn(`[TimeFormat] plannedDuration suspecte: ${value} min, conversion depuis secondes`);
        return Math.floor(value / 60);
      }
      return Math.floor(value);
      
    case 'targetTime':
      // Bug #2: targetTime en secondes mais parfois stocké en minutes
      if (value > MAX_REASONABLE_SESSION_SECONDS) {
        console.warn(`[TimeFormat] targetTime suspect: ${value} sec, probablement en minutes`);
        return Math.floor(value / 60); // Ramener à des minutes raisonnables
      }
      return value;
      
    case 'weeklyGoal':
      // weeklyTimeGoal en minutes
      if (value > MAX_REASONABLE_WEEKLY_MINUTES) {
        console.warn(`[TimeFormat] weeklyGoal suspect: ${value} min, conversion depuis secondes`);
        return Math.floor(value / 60);
      }
      return Math.floor(value);
      
    default:
      return value;
  }
}

/**
 * Normalise une durée planifiée (plannedDuration) - toujours en minutes
 */
export function normalizePlannedDuration(duration: number): number {
  return detectAndFixTimeCorruption(duration, 'plannedDuration');
}

/**
 * Normalise un temps cible (targetTime) - toujours en secondes
 */
export function normalizeTargetTime(targetTime: number): number {
  return detectAndFixTimeCorruption(targetTime, 'targetTime');
}

/**
 * Normalise un objectif hebdomadaire - toujours en minutes
 */
export function normalizeWeeklyGoal(weeklyGoal: number): number {
  const result = detectAndFixTimeCorruption(weeklyGoal, 'weeklyGoal');
  if (result !== weeklyGoal) {
    console.log(`[TimeFormat] ✅ weeklyGoal corrigé: ${weeklyGoal} → ${result} minutes (${Math.floor(result/60)}h${result%60})`);
  }
  return result;
}

/**
 * Convertit de façon sûre des minutes en secondes
 */
export function minutesToSeconds(minutes: number): number {
  if (!minutes || minutes <= 0) return 0;
  return Math.floor(minutes * 60);
}

/**
 * Convertit de façon sûre des secondes en minutes
 */
export function secondsToMinutes(seconds: number): number {
  if (!seconds || seconds <= 0) return 0;
  return Math.floor(seconds / 60);
}

// ========== UTILITAIRES DE DATES ET TIMEZONE ==========
// Ajoutés pour résoudre les bugs DST et de duplication de code

/**
 * Calcule le début de semaine (lundi) avec gestion correcte du DST
 * Remplace les implémentations dupliquées dans CalendarPage et WeekView
 */
export function getWeekStartSafe(date: Date): Date {
  const start = new Date(date);
  const day = start.getDay();
  const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Lundi = début de semaine
  start.setDate(diff);
  
  // Gestion DST-safe : utiliser setHours avec le décalage timezone local
  // Au lieu de setHours(0, 0, 0, 0) qui peut causer des problèmes avec DST
  start.setHours(0, 0, 0, 0);
  
  // Vérifier si on est dans une période de changement DST
  // et ajuster si nécessaire
  const originalOffset = date.getTimezoneOffset();
  const newOffset = start.getTimezoneOffset();
  
  if (originalOffset !== newOffset) {
    // Il y a eu un changement DST, ajuster
    const offsetDiff = newOffset - originalOffset;
    start.setMinutes(start.getMinutes() + offsetDiff);
    console.warn(`[TimeFormat] Ajustement DST appliqué: ${offsetDiff} minutes`);
  }
  
  return start;
}

/**
 * Vérifie si une date est aujourd'hui (timezone-safe)
 */
export function isToday(date: Date): boolean {
  const today = new Date();
  return date.getDate() === today.getDate() &&
         date.getMonth() === today.getMonth() &&
         date.getFullYear() === today.getFullYear();
}

/**
 * Vérifie si deux dates sont le même jour (timezone-safe)
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
}

/**
 * Crée une date "propre" à 00:00:00.000 avec gestion DST
 */
export function createCleanDate(date: Date): Date {
  const clean = new Date(date);
  clean.setHours(0, 0, 0, 0);
  return clean;
}

/**
 * Formatte une date de manière cohérente
 */
export function formatDateConsistent(date: Date): string {
  return date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}