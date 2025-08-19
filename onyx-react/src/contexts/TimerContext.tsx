import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { ActiveTimer } from '@/types/ActiveTimer';
import { TimerState } from '@/types/Timer';
import { useTimerExecution } from '@/hooks/useTimerExecution';
import { subjectService } from '@/services/subjectService';
import { SimpleActiveTimerWidget } from '@/components/SimpleActiveTimerWidget';
import { TopTimerIndicator } from '@/components/TopTimerIndicator';
import { useReactiveTimers } from '@/hooks/useReactiveTimers';
import { requestNotificationPermission } from '@/utils/audioNotifications';

interface TimerExecutionState {
  state: TimerState;
  timeRemaining: number;
  progress: number;
  sessionCount: number;
  currentCycle: number;
}

interface TimerContextType {
  timers: ActiveTimer[];
  startTimer: (timerId: string, timer: ActiveTimer) => void;
  pauseTimer: (timerId: string) => void;
  resetTimer: (timerId: string) => void;
  getTimerState: (timerId: string) => TimerExecutionState | null;
  cleanupTimer: (timerId: string) => void;
  setTimers: (timers: ActiveTimer[]) => void;
  // Fonctions de gestion des timers
  addTimer: (timer: Omit<ActiveTimer, 'id' | 'createdAt' | 'lastUsed'>) => Promise<ActiveTimer>;
  updateTimer: (id: string, updates: Partial<Omit<ActiveTimer, 'id' | 'createdAt'>>) => Promise<void>;
  removeTimer: (id: string) => Promise<void>;
  timerCounter: number;
  setTimerCounter: (counter: number | ((prev: number) => number)) => void;
  updateRunningTimer: (timerId: string, timer: ActiveTimer) => void;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

export const useTimerContext = () => {
  const context = useContext(TimerContext);
  if (context === undefined) {
    throw new Error('useTimerContext must be used within a TimerProvider');
  }
  return context;
};

interface TimerProviderProps {
  children: ReactNode;
}

export const TimerProvider: React.FC<TimerProviderProps> = ({ children }) => {
  // Utiliser useReactiveTimers pour charger automatiquement les timers sauvegardés
  const { 
    timers: persistedTimers, 
    addTimer, 
    updateTimer, 
    removeTimer, 
    timerCounter, 
    setTimerCounter 
  } = useReactiveTimers();
  const [timers, setTimers] = useState<ActiveTimer[]>([]);

  // Synchroniser avec les timers persistés au chargement - éviter les re-rendus inutiles
  useEffect(() => {
    console.log('🔄 TimerProvider - Synchronisation avec timers persistés:', persistedTimers.length);
    // Vérifier si les timers ont vraiment changé avant de mettre à jour
    setTimers(prevTimers => {
      if (JSON.stringify(prevTimers) === JSON.stringify(persistedTimers)) {
        console.log('🔄 TimerProvider - Pas de changement, pas de mise à jour');
        return prevTimers;
      }
      console.log('🔄 TimerProvider - Mise à jour des timers');
      return persistedTimers;
    });
  }, [persistedTimers]);

  // Demander la permission pour les notifications au chargement
  useEffect(() => {
    requestNotificationPermission().then(granted => {
      if (granted) {
        console.log('✅ Permission de notification accordée');
      } else {
        console.log('❌ Permission de notification refusée');
      }
    });
  }, []);

  const {
    startTimer,
    pauseTimer,
    resetTimer,
    getTimerState,
    cleanupTimer,
    updateRunningTimer
  } = useTimerExecution(
    // onTimerFinish callback
    useCallback(async (_timerId: string, timer: ActiveTimer, totalTime: number) => {
      if (timer.linkedSubject) {
        try {
          await subjectService.addStudyTime(timer.linkedSubject.id, totalTime);
        } catch (error) {
          console.error('Erreur lors de l\'ajout du temps d\'étude:', error);
        }
      }
    }, []),
    // onSessionComplete callback
    useCallback(async (_timerId: string, timer: ActiveTimer) => {
      if (timer.linkedSubject) {
        try {
          await subjectService.addStudyTime(
            timer.linkedSubject.id, 
            timer.config.workDuration
          );
        } catch (error) {
          console.error('Erreur lors de l\'ajout du temps d\'étude:', error);
        }
      }
    }, [])
  );

  const handleTimerAction = useCallback((action: 'start' | 'pause' | 'reset', timer: ActiveTimer) => {
    switch (action) {
      case 'start':
        startTimer(timer.id, timer);
        break;
      case 'pause':
        pauseTimer(timer.id);
        break;
      case 'reset':
        resetTimer(timer.id);
        break;
    }
  }, [startTimer, pauseTimer, resetTimer]);

  // Wrapper pour setTimers qui met à jour à la fois l'état local et persisté
  const updateTimers = useCallback((newTimers: ActiveTimer[]) => {
    console.log('🔄 TimerProvider - Mise à jour des timers:', newTimers.length);
    setTimers(newTimers);
  }, []);

  // Wrapper pour updateTimer qui met à jour aussi les timers en cours
  const updateTimerWithSync = useCallback(async (id: string, updates: Partial<Omit<ActiveTimer, 'id' | 'createdAt'>>) => {
    // Mettre à jour dans le storage
    await updateTimer(id, updates);
    
    // Si le timer est en cours d'exécution, le mettre à jour aussi
    const timerState = getTimerState(id);
    if (timerState && (timerState.state === 'running' || timerState.state === 'paused')) {
      const updatedTimer = timers.find(t => t.id === id);
      if (updatedTimer) {
        // Créer le timer avec les mises à jour appliquées
        const mergedTimer = { ...updatedTimer, ...updates, lastUsed: new Date() };
        updateRunningTimer(id, mergedTimer);
        console.log(`🔄 Timer en cours ${id} synchronisé avec nouvelles modifications`);
      }
    }
  }, [updateTimer, getTimerState, timers, updateRunningTimer]);

  const value: TimerContextType = {
    timers,
    startTimer,
    pauseTimer,
    resetTimer,
    getTimerState,
    cleanupTimer,
    setTimers: updateTimers,
    // Exposer les fonctions de gestion des timers
    addTimer,
    updateTimer: updateTimerWithSync,
    removeTimer,
    timerCounter,
    setTimerCounter,
    updateRunningTimer
  };

  return (
    <TimerContext.Provider value={value}>
      {children}
      {/* Indicateur discret en haut de page */}
      <TopTimerIndicator
        timers={timers}
        getTimerState={getTimerState}
      />
      {/* Widget global - s'affiche sur toutes les pages */}
      <SimpleActiveTimerWidget
        timers={timers}
        getTimerState={getTimerState}
        onTimerAction={handleTimerAction}
      />
    </TimerContext.Provider>
  );
};