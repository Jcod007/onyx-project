import { useState, useEffect, useCallback, useRef } from 'react';
import { TimerService, TimerData } from '@/services/timerService';
import { ActiveTimer } from '@/types/ActiveTimer';
import { TimerState } from '@/types/Timer';
import { playTimerFinishedSound, playBreakFinishedSound } from '@/utils/audioNotifications';

interface TimerExecutionState {
  state: TimerState;
  timeRemaining: number;
  progress: number;
  sessionCount: number;
  currentCycle: number;
}

interface UseTimerExecutionReturn {
  timersState: Map<string, TimerExecutionState>;
  startTimer: (timerId: string, timer: ActiveTimer) => void;
  pauseTimer: (timerId: string) => void;
  resetTimer: (timerId: string) => void;
  stopTimer: (timerId: string) => void;
  getTimerState: (timerId: string) => TimerExecutionState | null;
  cleanupTimer: (timerId: string) => void;
  updateRunningTimer: (timerId: string, timer: ActiveTimer) => void;
}

export const useTimerExecution = (
  onTimerFinish?: (timerId: string, timer: ActiveTimer, totalTime: number) => void,
  onSessionComplete?: (timerId: string, timer: ActiveTimer) => void
): UseTimerExecutionReturn => {
  const [timersState, setTimersState] = useState<Map<string, TimerExecutionState>>(new Map());
  const timerServices = useRef<Map<string, { service: TimerService; timer: ActiveTimer }>>(new Map());
  const timersData = useRef<Map<string, ActiveTimer>>(new Map());

  const updateTimerState = useCallback((timerId: string, data: TimerData) => {
    setTimersState(prev => {
      const newMap = new Map(prev);
      newMap.set(timerId, {
        state: data.state,
        timeRemaining: data.timeRemaining,
        progress: data.state === 'idle' ? 0 : ((data.totalTime - data.timeRemaining) / data.totalTime) * 100,
        sessionCount: data.sessionCount,
        currentCycle: data.currentCycle || 0
      });
      return newMap;
    });
  }, []);

  const startTimer = useCallback((timerId: string, timer: ActiveTimer) => {
    let timerService = timerServices.current.get(timerId)?.service;
    
    if (!timerService) {
      // Créer un nouveau service de timer
      timerService = new TimerService(
        timer.config,
        timer.isPomodoroMode || false,
        timer.maxCycles || 0
      );

      // Configurer les callbacks
      timerService.onStateChanged((data) => {
        updateTimerState(timerId, data);
      });

      timerService.onTick((data) => {
        updateTimerState(timerId, data);
      });

      timerService.onFinished((data) => {
        updateTimerState(timerId, data);
        
        // Jouer le son approprié selon le mode
        if (data.mode === 'work') {
          playTimerFinishedSound();
        } else if (data.mode === 'break') {
          playBreakFinishedSound();
        } else {
          // Pour les timers simples
          playTimerFinishedSound();
        }
        
        // Notifier la fin du timer
        if (onTimerFinish) {
          onTimerFinish(timerId, timer, data.totalTime);
        }

        // Si c'était une session de travail, notifier la completion
        if (data.mode === 'work' && onSessionComplete) {
          onSessionComplete(timerId, timer);
        }
      });

      timerService.onCycleComplete((data) => {
        updateTimerState(timerId, data);
        console.log(`Timer ${timerId}: Session Pomodoro complète après ${data.currentCycle} cycles`);
      });

      // Sauvegarder le service et les données du timer
      timerServices.current.set(timerId, { service: timerService, timer });
      timersData.current.set(timerId, timer);
    }

    // Démarrer le timer
    timerService.start();
  }, [updateTimerState, onTimerFinish, onSessionComplete]);

  const pauseTimer = useCallback((timerId: string) => {
    const timerService = timerServices.current.get(timerId)?.service;
    if (timerService) {
      timerService.pause();
    }
  }, []);

  const resetTimer = useCallback((timerId: string) => {
    const timerService = timerServices.current.get(timerId)?.service;
    if (timerService) {
      timerService.reset();
    }
  }, []);

  const stopTimer = useCallback((timerId: string) => {
    const timerService = timerServices.current.get(timerId)?.service;
    if (timerService) {
      timerService.stop();
    }
  }, []);

  const getTimerState = useCallback((timerId: string): TimerExecutionState | null => {
    return timersState.get(timerId) || null;
  }, [timersState]);

  // Nettoyage lors du démontage du composant
  useEffect(() => {
    return () => {
      // Nettoyer tous les services de timer
      timerServices.current.forEach(({ service }) => {
        service.destroy();
      });
      timerServices.current.clear();
      timersData.current.clear();
    };
  }, []);

  // Nettoyer les timers supprimés
  const cleanupTimer = useCallback((timerId: string) => {
    const timerData = timerServices.current.get(timerId);
    if (timerData) {
      timerData.service.destroy();
      timerServices.current.delete(timerId);
      timersData.current.delete(timerId);
      
      setTimersState(prev => {
        const newMap = new Map(prev);
        newMap.delete(timerId);
        return newMap;
      });
    }
  }, []);

  // Mettre à jour un timer en cours d'exécution avec une nouvelle configuration
  const updateRunningTimer = useCallback((timerId: string, timer: ActiveTimer) => {
    const currentTimerData = timerServices.current.get(timerId);
    const currentState = timersState.get(timerId);
    
    if (currentTimerData && currentState) {
      // Sauvegarder l'état actuel
      const wasRunning = currentState.state === 'running';
      
      // Détruire l'ancien service
      currentTimerData.service.destroy();
      timerServices.current.delete(timerId);
      
      // Créer un nouveau service avec la nouvelle configuration
      const newTimerService = new TimerService(
        timer.config,
        timer.isPomodoroMode || false,
        timer.maxCycles || 0
      );

      // Configurer les callbacks
      newTimerService.onStateChanged((data) => {
        updateTimerState(timerId, data);
      });

      newTimerService.onTick((data) => {
        updateTimerState(timerId, data);
      });

      newTimerService.onFinished((data) => {
        updateTimerState(timerId, data);
        
        // Jouer le son approprié selon le mode
        if (data.mode === 'work') {
          playTimerFinishedSound();
        } else if (data.mode === 'break') {
          playBreakFinishedSound();
        } else {
          playTimerFinishedSound();
        }
        
        // Notifier la fin du timer
        if (onTimerFinish) {
          onTimerFinish(timerId, timer, data.totalTime);
        }
      });

      newTimerService.onCycleComplete((data) => {
        updateTimerState(timerId, data);
        console.log(`Timer ${timerId}: Session Pomodoro complète après ${data.currentCycle} cycles`);
      });

      // Sauvegarder le nouveau service
      timerServices.current.set(timerId, { service: newTimerService, timer });
      timersData.current.set(timerId, timer);
      
      // Si le timer était en cours, le redémarrer
      if (wasRunning) {
        newTimerService.start();
      }
      
      console.log(`🔄 Timer ${timerId} mis à jour avec nouvelle configuration`);
    }
  }, [timersState, updateTimerState, onTimerFinish, onSessionComplete]);

  return {
    timersState,
    startTimer,
    pauseTimer,
    resetTimer,
    stopTimer,
    getTimerState,
    cleanupTimer,
    updateRunningTimer
  };
};