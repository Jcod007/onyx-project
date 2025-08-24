/**
 * Hook personnalisé pour la gestion centralisée des temps d'étude
 * Élimine la duplication de logique entre SubjectConfigCard et SubjectConfigWizard
 */

import { useState, useEffect, useCallback } from 'react';
import { Subject } from '@/types/Subject';
import {
  createDefaultDailyTimes,
  distributeDailyTime,
  calculateWeeklyTotal,
  initializeSelectedDays,
  timeToMinutes,
  minutesToTime,
  updateDailyTimesForSimpleMode,
  DEFAULT_WEEKLY_TIME_MINUTES
} from '@/utils/subjectTimeUtils';
import { normalizeWeeklyGoal } from '@/utils/timeFormat';

interface UseSubjectTimeManagementProps {
  subject?: Subject;
  initialConfigMode?: 'simple' | 'advanced';
}

export function useSubjectTimeManagement({ 
  subject, 
  initialConfigMode = 'simple' 
}: UseSubjectTimeManagementProps = {}) {
  
  // États principaux - avec normalisation des données corrompues
  const [weeklyTimeMinutes, setWeeklyTimeMinutes] = useState(() => {
    const rawWeeklyGoal = subject?.weeklyTimeGoal || DEFAULT_WEEKLY_TIME_MINUTES;
    return normalizeWeeklyGoal(rawWeeklyGoal);
  });
  
  const [configMode, setConfigMode] = useState<'simple' | 'advanced'>(initialConfigMode);
  
  const [selectedDays, setSelectedDays] = useState<number[]>(() => 
    initializeSelectedDays(subject?.studyDays)
  );
  
  const [dailyTimes, setDailyTimes] = useState<Record<number, number>>(() => {
    const rawWeeklyGoal = subject?.weeklyTimeGoal || DEFAULT_WEEKLY_TIME_MINUTES;
    const normalizedGoal = normalizeWeeklyGoal(rawWeeklyGoal);
    return createDefaultDailyTimes(normalizedGoal, selectedDays);
  });
  
  // États pour l'interface globale
  const [globalHours, setGlobalHours] = useState(0);
  const [globalMinutes, setGlobalMinutes] = useState(0);
  const [globalSeconds, setGlobalSeconds] = useState(0);

  // Initialisation du temps global
  useEffect(() => {
    const { hours, minutes } = minutesToTime(weeklyTimeMinutes);
    setGlobalHours(hours);
    setGlobalMinutes(minutes);
    setGlobalSeconds(0);
  }, []); // Une seule fois au montage

  // Handler pour changement de temps global
  const handleGlobalTimeChange = useCallback((hours: number, minutes: number, seconds: number) => {
    setGlobalHours(hours);
    setGlobalMinutes(minutes);
    setGlobalSeconds(seconds);
    
    const totalMinutes = timeToMinutes(hours, minutes, seconds);
    setWeeklyTimeMinutes(totalMinutes);
    
    // Mise à jour automatique en mode simple
    const newDailyTimes = updateDailyTimesForSimpleMode(totalMinutes, selectedDays, configMode);
    if (newDailyTimes) {
      setDailyTimes(newDailyTimes);
    }
  }, [selectedDays, configMode]);

  // Handler pour changement de temps d'un jour spécifique
  const handleDayTimeChange = useCallback((dayId: number, minutes: number) => {
    const newDailyTimes = { ...dailyTimes, [dayId]: minutes };
    setDailyTimes(newDailyTimes);
    
    // Mise à jour du total hebdomadaire
    const newTotal = calculateWeeklyTotal(newDailyTimes);
    setWeeklyTimeMinutes(newTotal);
    
    // Mise à jour du temps global affiché
    const { hours, minutes: mins } = minutesToTime(newTotal);
    setGlobalHours(hours);
    setGlobalMinutes(mins);
    setGlobalSeconds(0);
  }, [dailyTimes]);

  // Handler pour changement des jours sélectionnés
  const handleSelectedDaysChange = useCallback((newSelectedDays: number[]) => {
    setSelectedDays(newSelectedDays);
    
    // Mise à jour automatique en mode simple
    const newDailyTimes = updateDailyTimesForSimpleMode(weeklyTimeMinutes, newSelectedDays, configMode);
    if (newDailyTimes) {
      setDailyTimes(newDailyTimes);
    }
  }, [weeklyTimeMinutes, configMode]);

  // Handler pour changement de mode de configuration
  const handleConfigModeChange = useCallback((newMode: 'simple' | 'advanced') => {
    setConfigMode(newMode);
    
    // Si passage en mode simple, redistribuer équitablement
    if (newMode === 'simple' && selectedDays.length > 0) {
      const newDailyTimes = distributeDailyTime(weeklyTimeMinutes, selectedDays);
      setDailyTimes(newDailyTimes);
    }
  }, [weeklyTimeMinutes, selectedDays]);

  // Calculs dérivés
  const activeDaysCount = Object.values(dailyTimes).filter(time => time > 0).length;
  const isValid = activeDaysCount > 0;

  // Reset vers les valeurs par défaut
  const resetToDefaults = useCallback(() => {
    const defaultDays = [1, 2, 3, 4, 5]; // Lundi à vendredi
    const defaultWeeklyTime = DEFAULT_WEEKLY_TIME_MINUTES;
    
    setSelectedDays(defaultDays);
    setWeeklyTimeMinutes(defaultWeeklyTime);
    setDailyTimes(createDefaultDailyTimes(defaultWeeklyTime, defaultDays));
    
    const { hours, minutes } = minutesToTime(defaultWeeklyTime);
    setGlobalHours(hours);
    setGlobalMinutes(minutes);
    setGlobalSeconds(0);
    
    setConfigMode('simple');
  }, []);

  // Synchronisation avec un Subject externe
  const syncWithSubject = useCallback((newSubject: Subject) => {
    const newSelectedDays = initializeSelectedDays(newSubject.studyDays);
    const rawWeeklyTime = newSubject.weeklyTimeGoal || DEFAULT_WEEKLY_TIME_MINUTES;
    const newWeeklyTime = normalizeWeeklyGoal(rawWeeklyTime);
    
    setSelectedDays(newSelectedDays);
    setWeeklyTimeMinutes(newWeeklyTime);
    setDailyTimes(createDefaultDailyTimes(newWeeklyTime, newSelectedDays));
    
    const { hours, minutes } = minutesToTime(newWeeklyTime);
    setGlobalHours(hours);
    setGlobalMinutes(minutes);
    setGlobalSeconds(0);
  }, []);

  return {
    // États
    weeklyTimeMinutes,
    configMode,
    selectedDays,
    dailyTimes,
    globalHours,
    globalMinutes,
    globalSeconds,
    
    // Handlers
    handleGlobalTimeChange,
    handleDayTimeChange,
    handleSelectedDaysChange,
    handleConfigModeChange,
    
    // Setters directs (pour compatibilité)
    setConfigMode,
    setWeeklyTimeMinutes,
    setSelectedDays,
    setDailyTimes,
    
    // Calculs
    activeDaysCount,
    isValid,
    totalWeeklyTime: calculateWeeklyTotal(dailyTimes),
    
    // Utilitaires
    resetToDefaults,
    syncWithSubject
  };
}