import { useState, useEffect, useCallback, useRef } from 'react';
import { TimerService, TimerData } from '@/services/timerService';
import { ActiveTimer } from '@/types/ActiveTimer';
import { TimerState } from '@/types/Timer';
import { playTimerFinishedSound, playBreakFinishedSound } from '@/utils/audioNotifications';
import { timerLogger } from '@/utils/logger';

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
  const operationLock = useRef<Map<string, boolean>>(new Map());

  // Utilitaire pour les opérations atomiques
  const executeAtomicOperation = useCallback(async <T>(
    timerId: string,
    operation: () => Promise<T> | T,
    operationName: string
  ): Promise<T | null> => {
    if (operationLock.current.get(timerId)) {
      console.warn(`⚠️ Opération ${operationName} ignorée pour timer ${timerId} - opération en cours`);
      return null;
    }

    try {
      operationLock.current.set(timerId, true);
      console.log(`🔒 Début opération atomique: ${operationName} pour timer ${timerId}`);
      
      const result = await operation();
      
      console.log(`✅ Opération atomique réussie: ${operationName} pour timer ${timerId}`);
      return result;
    } catch (error) {
      console.error(`❌ Erreur opération atomique ${operationName} pour timer ${timerId}:`, error);
      throw error;
    } finally {
      operationLock.current.delete(timerId);
    }
  }, []);

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
    executeAtomicOperation(
      timerId,
      () => {
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
      },
      'startTimer'
    ).catch(error => {
      console.error(`Erreur démarrage timer ${timerId}:`, error);
    });
  }, [executeAtomicOperation, updateTimerState, onTimerFinish, onSessionComplete]);

  const pauseTimer = useCallback((timerId: string) => {
    executeAtomicOperation(
      timerId,
      () => {
        const timerService = timerServices.current.get(timerId)?.service;
        if (timerService) {
          timerService.pause();
        } else {
          console.warn(`Timer service introuvable pour pause: ${timerId}`);
        }
      },
      'pauseTimer'
    ).catch(error => {
      console.error(`Erreur pause timer ${timerId}:`, error);
    });
  }, [executeAtomicOperation]);

  const resetTimer = useCallback((timerId: string) => {
    executeAtomicOperation(
      timerId,
      () => {
        console.log(`🔄 useTimerExecution.resetTimer appelé pour: ${timerId}`);
        console.log(`📋 Services disponibles:`, Array.from(timerServices.current.keys()));
        const timerService = timerServices.current.get(timerId)?.service;
        if (timerService) {
          console.log(`✅ Timer service trouvé, appel de reset()`);
          timerService.reset();
          console.log(`🔄 Reset terminé`);
        } else {
          console.log(`❌ Timer service introuvable pour: ${timerId}`);
          console.log(`📋 Services disponibles:`, Array.from(timerServices.current.keys()));
        }
      },
      'resetTimer'
    ).catch(error => {
      console.error(`Erreur reset timer ${timerId}:`, error);
    });
  }, [executeAtomicOperation]);

  const stopTimer = useCallback((timerId: string) => {
    executeAtomicOperation(
      timerId,
      () => {
        const timerService = timerServices.current.get(timerId)?.service;
        if (timerService) {
          timerService.stop();
        } else {
          console.warn(`Timer service introuvable pour stop: ${timerId}`);
        }
      },
      'stopTimer'
    ).catch(error => {
      console.error(`Erreur stop timer ${timerId}:`, error);
    });
  }, [executeAtomicOperation]);

  const getTimerState = useCallback((timerId: string): TimerExecutionState | null => {
    return timersState.get(timerId) || null;
  }, [timersState]);

  // Nettoyage lors du démontage du composant avec gestion des locks
  useEffect(() => {
    return () => {
      console.log('🧹 useTimerExecution - Nettoyage lors du démontage du composant');
      console.log(`📊 Nombre de services actifs avant nettoyage: ${timerServices.current.size}`);
      
      // Nettoyer tous les services de timer
      timerServices.current.forEach(({ service }, timerId) => {
        console.log(`🧹 Nettoyage du timer service: ${timerId}`);
        try {
          service.destroy();
        } catch (error) {
          console.error(`⚠️ Erreur lors du nettoyage du timer ${timerId}:`, error);
        }
      });
      
      // Vider toutes les collections
      timerServices.current.clear();
      timersData.current.clear();
      operationLock.current.clear();
      
      console.log('✅ useTimerExecution - Nettoyage terminé');
    };
  }, []);

  // Nettoyer les timers supprimés avec opération atomique
  const cleanupTimer = useCallback((timerId: string) => {
    executeAtomicOperation(
      timerId,
      () => {
        console.log(`🧹 cleanupTimer appelé pour: ${timerId}`);
        
        const timerData = timerServices.current.get(timerId);
        if (timerData) {
          console.log(`🗑️ Suppression du service timer: ${timerId}`);
          try {
            timerData.service.destroy();
          } catch (error) {
            console.error(`⚠️ Erreur lors de la destruction du timer ${timerId}:`, error);
          }
          
          // Supprimer des collections
          timerServices.current.delete(timerId);
          timersData.current.delete(timerId);
          operationLock.current.delete(timerId);
          
          // Supprimer de l'état
          setTimersState(prev => {
            const newMap = new Map(prev);
            newMap.delete(timerId);
            return newMap;
          });
          
          console.log(`✅ Timer ${timerId} nettoyé avec succès`);
        } else {
          console.log(`⚠️ Timer ${timerId} déjà supprimé ou inexistant`);
        }
      },
      'cleanupTimer'
    ).catch(error => {
      console.error(`Erreur cleanup timer ${timerId}:`, error);
    });
  }, [executeAtomicOperation]);

  // Mettre à jour un timer en cours d'exécution avec une nouvelle configuration (opération atomique)
  const updateRunningTimer = useCallback((timerId: string, timer: ActiveTimer) => {
    executeAtomicOperation(
      timerId,
      () => {
        const currentTimerData = timerServices.current.get(timerId);
        const currentState = timersState.get(timerId);
        
        if (currentTimerData && currentState) {
          // Sauvegarder l'état actuel
          const wasRunning = currentState.state === 'running';
          
          // Détruire l'ancien service proprement
          console.log(`🧹 updateRunningTimer - Destruction de l'ancien service pour: ${timerId}`);
          try {
            currentTimerData.service.destroy();
          } catch (error) {
            console.error(`⚠️ Erreur lors de la destruction de l'ancien timer ${timerId}:`, error);
          }
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
        } else {
          console.warn(`Impossible de mettre à jour le timer ${timerId} - données introuvables`);
        }
      },
      'updateRunningTimer'
    ).catch(error => {
      console.error(`Erreur mise à jour timer en cours ${timerId}:`, error);
    });
  }, [executeAtomicOperation, timersState, updateTimerState, onTimerFinish, onSessionComplete]);

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