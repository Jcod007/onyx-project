/**
 * 🔧 TimerNormalizer
 * 
 * Utilitaire centralisé pour la normalisation des timers
 * Remplace la logique dupliquée dans centralizedTimerService et TimerContext
 */

import { ActiveTimer } from '@/types/ActiveTimer';
import { timerLogger } from '@/utils/logger';

/**
 * Normalise un timer en s'assurant que les dates sont des objets Date valides
 */
export const normalizeTimer = (timer: ActiveTimer): ActiveTimer => {
  timerLogger.debug('🔧 Normalisation timer:', timer.id);
  
  try {
    const normalized = {
      ...timer,
      createdAt: normalizeDate(timer.createdAt, 'createdAt'),
      lastUsed: normalizeDate(timer.lastUsed, 'lastUsed')
    };
    
    timerLogger.debug('✅ Timer normalisé:', normalized.id);
    
    return normalized;
  } catch (error) {
    timerLogger.error('❌ Erreur normalisation timer:', timer.id);
    
    // Fallback avec dates par défaut
    return {
      ...timer,
      createdAt: new Date(),
      lastUsed: new Date()
    };
  }
};

/**
 * Normalise une date en s'assurant qu'elle est valide
 */
const normalizeDate = (dateValue: any, fieldName: string): Date => {
  // Si c'est déjà une Date valide
  if (dateValue instanceof Date && !isNaN(dateValue.getTime())) {
    return dateValue;
  }
  
  // Essayer de convertir depuis string/number
  try {
    const converted = new Date(dateValue);
    if (!isNaN(converted.getTime())) {
      return converted;
    }
  } catch (error) {
    timerLogger.warn(`⚠️ Impossible de convertir ${fieldName}`);
  }
  
  // Fallback : date actuelle
  timerLogger.warn(`⚠️ Utilisation date par défaut pour ${fieldName}`);
  return new Date();
};

/**
 * Normalise un tableau de timers
 */
export const normalizeTimers = (timers: ActiveTimer[]): ActiveTimer[] => {
  if (!Array.isArray(timers)) {
    timerLogger.error('❌ Données timers invalides, tableau attendu:', typeof timers);
    return [];
  }
  
  return timers.map(timer => {
    try {
      return normalizeTimer(timer);
    } catch (error) {
      timerLogger.error('❌ Erreur normalisation timer dans tableau:', timer?.id);
      return null;
    }
  }).filter((timer): timer is ActiveTimer => timer !== null);
};

/**
 * Valide qu'un timer a une structure correcte
 */
export const validateTimer = (timer: any): timer is ActiveTimer => {
  if (!timer || typeof timer !== 'object') {
    return false;
  }
  
  const requiredFields = ['id', 'title', 'config', 'createdAt', 'lastUsed'];
  for (const field of requiredFields) {
    if (!(field in timer)) {
      timerLogger.warn(`⚠️ Champ manquant dans timer: ${field}`);
      return false;
    }
  }
  
  // Vérifier la structure du config
  if (!timer.config || typeof timer.config !== 'object' || typeof timer.config.workDuration !== 'number') {
    timerLogger.warn('⚠️ Configuration timer invalide:', timer.config);
    return false;
  }
  
  return true;
};

/**
 * Nettoie et valide un tableau de timers
 */
export const cleanAndValidateTimers = (timers: any[]): ActiveTimer[] => {
  if (!Array.isArray(timers)) {
    timerLogger.error('❌ Données timers non-array:', typeof timers);
    return [];
  }
  
  const validTimers = timers.filter(validateTimer);
  const normalizedTimers = normalizeTimers(validTimers);
  
  if (normalizedTimers.length !== timers.length) {
    timerLogger.warn(`⚠️ ${timers.length - normalizedTimers.length} timer(s) invalide(s) supprimé(s)`);
  }
  
  return normalizedTimers;
};