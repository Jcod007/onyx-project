import React, { useState, useEffect, useCallback } from 'react';
import { ModernTimerCard } from '@/components/ModernTimerCard';
import { TimerConfigDialog } from '@/components/TimerConfigDialog';
import { TimerConfig } from '@/services/timerService';
import { Subject } from '@/types/Subject';
import { useTimerContext } from '@/contexts/TimerContext';
import { ActiveTimer } from '@/types/ActiveTimer';
import { integratedTimerService } from '@/services/integratedTimerService';
import { soundConfig } from '@/utils/soundConfig';
import { Plus, Settings, Volume2, VolumeX } from 'lucide-react';
import { storageService, STORAGE_KEYS, getSessionKey } from '@/services/storageService';

export const TimersPage: React.FC = () => {
  // Utiliser uniquement le contexte global - source unique de vérité
  const {
    timers,
    startTimer,
    pauseTimer,
    resetTimer,
    getTimerState,
    cleanupTimer,
    // Fonctions de gestion des timers
    addTimer,
    updateTimer,
    removeTimer
  } = useTimerContext();
  
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [editingTimer, setEditingTimer] = useState<ActiveTimer | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    // Charger la préférence de son depuis storageService
    return storageService.load(STORAGE_KEYS.SOUND_ENABLED, true);
  });
  const [completedSessions, setCompletedSessions] = useState(() => {
    // Charger le compteur de sessions du jour depuis storageService
    const sessionKey = getSessionKey();
    return storageService.load(sessionKey, 0);
  });

  // Note: La synchronisation est maintenant automatique via TimerProvider
  // Plus besoin de synchroniser manuellement

  // Effet pour sauvegarder la préférence de son
  useEffect(() => {
    soundConfig.enabled = soundEnabled;
  }, [soundEnabled]);

  // Effet pour sauvegarder le compteur de sessions
  useEffect(() => {
    const sessionKey = getSessionKey();
    storageService.save(sessionKey, completedSessions);
  }, [completedSessions]);

  // Effet pour écouter les fins de timer et incrémenter le compteur
  useEffect(() => {
    // Fonction pour vérifier les timers terminés
    const checkCompletedTimers = () => {
      timers.forEach(timer => {
        const state = getTimerState(timer.id);
        if (state && state.state === 'finished') {
          // Marquer comme comptabilisé pour éviter les doublons
          if (!timer.id.includes('_counted_')) {
            setCompletedSessions(prev => prev + 1);
            // Note: En production, il faudrait un meilleur système pour éviter les doublons
          }
        }
      });
    };

    // Vérifier toutes les secondes
    const interval = setInterval(checkCompletedTimers, 1000);
    return () => clearInterval(interval);
  }, [timers, getTimerState]);

  // Fonction pour réinitialiser le compteur quotidien
  const resetDailyCounter = useCallback(() => {
    const today = new Date().toDateString();
    const lastReset = storageService.load(STORAGE_KEYS.LAST_RESET, '');
    if (lastReset !== today) {
      setCompletedSessions(0);
      storageService.save(STORAGE_KEYS.LAST_RESET, today);
    }
  }, []);

  // Vérifier si on doit réinitialiser le compteur au chargement
  useEffect(() => {
    resetDailyCounter();
    
    // Nettoyage du localStorage corrompu au premier chargement
    const cleanupCorruptedData = () => {
      try {
        const saved = storageService.load(STORAGE_KEYS.ACTIVE_TIMERS, null);
        if (saved && Array.isArray(saved)) {
          // Vérifier si les données sont corrompues
          const hasCorruptedDates = (saved as any[]).some((timer: any) => 
            timer.lastUsed && typeof timer.lastUsed === 'string' && isNaN(new Date(timer.lastUsed).getTime())
          );
          if (hasCorruptedDates) {
            console.log('🧹 Nettoyage des données corrompues...');
            storageService.remove(STORAGE_KEYS.ACTIVE_TIMERS);
            storageService.remove(STORAGE_KEYS.TIMER_SYNC_METADATA);
          }
        }
      } catch (error) {
        console.error('Erreur lors du nettoyage:', error);
        storageService.remove(STORAGE_KEYS.ACTIVE_TIMERS);
        storageService.remove(STORAGE_KEYS.TIMER_SYNC_METADATA);
      }
    };
    
    cleanupCorruptedData();
  }, [resetDailyCounter]);

  const handleCreateTimer = () => {
    console.log('➕ Création d\'un nouveau timer');
    setEditingTimer(null); // S'assurer qu'on n'est pas en mode édition
    setShowConfigDialog(true);
  };

  const handleTimerConfigConfirm = async (config: {
    name?: string;
    hours: number;
    minutes: number;
    seconds: number;
    timerType: string;
    linkedSubject?: Subject;
    mode?: 'simple' | 'pomodoro';
    pomodoroConfig?: {
      workDuration: number;
      breakDuration: number;
      longBreakDuration: number;
      cycles: number;
    };
  }) => {
    let timerConfig: TimerConfig;
    let isPomodoroMode = false;
    let maxCycles = 0;

    if (config.mode === 'pomodoro' && config.pomodoroConfig) {
      timerConfig = {
        workDuration: config.pomodoroConfig.workDuration,
        shortBreakDuration: config.pomodoroConfig.breakDuration,
        longBreakDuration: config.pomodoroConfig.longBreakDuration,
        longBreakInterval: 4
      };
      isPomodoroMode = true;
      maxCycles = config.pomodoroConfig.cycles;
    } else {
      timerConfig = {
        workDuration: config.hours * 3600 + config.minutes * 60 + config.seconds,
        shortBreakDuration: 300,
        longBreakDuration: 900,
        longBreakInterval: 4
      };
    }

    // Gérer la liaison avec un cours (relation 1:1 avec toggle)
    let finalLinkedSubject = config.linkedSubject;
    
    if (config.linkedSubject) {
      // Vérifier s'il y a déjà un timer lié à ce cours
      const existingTimerForCourse = timers.find(t => 
        t.linkedSubject && t.linkedSubject.id === config.linkedSubject!.id
      );
      
      if (existingTimerForCourse) {
        // Toggle : délier l'ancien timer de ce cours
        console.log(`🔄 Toggle: déliaison timer "${existingTimerForCourse.title}" du cours "${config.linkedSubject.name}"`);
        await updateTimer(existingTimerForCourse.id, { linkedSubject: undefined });
        
        // Si c'est le même timer qu'on essaie de lier, ne pas le re-lier (toggle off)
        if (existingTimerForCourse.id !== editingTimer?.id) {
          console.log(`✅ Nouveau timer sera lié au cours "${config.linkedSubject.name}"`);
        } else {
          console.log(`❌ Toggle off: timer ne sera pas re-lié au même cours`);
          finalLinkedSubject = undefined;
        }
      }
    }

    // Calculer le prochain numéro de timer disponible
    const getNextTimerNumber = () => {
      const timerNumbers = timers
        .map(t => {
          const match = t.title.match(/^Timer (\d+)$/);
          return match ? parseInt(match[1]) : 0;
        })
        .filter(n => n > 0);
      
      return timerNumbers.length > 0 ? Math.max(...timerNumbers) + 1 : 1;
    };

    const nextNumber = getNextTimerNumber();
    const timerTitle = config.name || `Timer ${nextNumber}`;
    
    // Créer le nouveau timer avec la liaison finale
    await addTimer({
      title: timerTitle,
      config: timerConfig,
      linkedSubject: finalLinkedSubject,
      isPomodoroMode,
      maxCycles
    });
    
    setShowConfigDialog(false);
    
    console.log(`✅ Timer "${timerTitle}" créé${finalLinkedSubject ? ` et lié au cours "${finalLinkedSubject.name}"` : ''}`);
  };



  const handleRemoveTimer = async (timerId: string) => {
    console.log('🗑️ Tentative de suppression du timer:', timerId);
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce timer ?')) {
      try {
        // Arrêter et nettoyer le timer s'il est en cours d'exécution
        const timerState = getTimerState(timerId);
        if (timerState && (timerState.state === 'running' || timerState.state === 'paused')) {
          cleanupTimer(timerId);
        }
        
        // Trouver le timer pour vérifier s'il a un cours lié
        const timer = timers.find(t => t.id === timerId);
        
        if (timer?.linkedSubject) {
          // Utiliser integratedTimerService pour gérer la conversion du cours en timer rapide
          await integratedTimerService.handleTimerDeletion(timerId);
        } else {
          // Supprimer directement le timer s'il n'est pas lié
          await removeTimer(timerId);
        }
        
        console.log(`✅ Timer supprimé${timer?.linkedSubject ? ' et cours converti en timer rapide' : ''}`);
      } catch (error) {
        console.error('Erreur lors de la suppression du timer:', error);
        alert('Erreur lors de la suppression du timer');
      }
    }
  };

  const editTimer = (timer: ActiveTimer) => {
    console.log('🔧 Édition du timer:', timer.id, timer.title);
    setEditingTimer(timer);
    setShowConfigDialog(true);
  };

  const handleEditTimerConfirm = async (config: {
    name?: string;
    hours: number;
    minutes: number;
    seconds: number;
    timerType: string;
    linkedSubject?: Subject;
    mode?: 'simple' | 'pomodoro';
    pomodoroConfig?: {
      workDuration: number;
      breakDuration: number;
      longBreakDuration: number;
      cycles: number;
    };
  }) => {
    if (!editingTimer) return;

    // Vérifier si le timer est en cours d'exécution
    const timerState = getTimerState(editingTimer.id);
    if (timerState && timerState.state === 'running') {
      // Arrêter le timer avant modification
      cleanupTimer(editingTimer.id);
    }

    let timerConfig: TimerConfig;
    let isPomodoroMode = false;
    let maxCycles = 0;

    if (config.mode === 'pomodoro' && config.pomodoroConfig) {
      timerConfig = {
        workDuration: config.pomodoroConfig.workDuration,
        shortBreakDuration: config.pomodoroConfig.breakDuration,
        longBreakDuration: config.pomodoroConfig.longBreakDuration,
        longBreakInterval: 4
      };
      isPomodoroMode = true;
      maxCycles = config.pomodoroConfig.cycles;
    } else {
      timerConfig = {
        workDuration: config.hours * 3600 + config.minutes * 60 + config.seconds,
        shortBreakDuration: 300,
        longBreakDuration: 900,
        longBreakInterval: 4
      };
    }

    // Gérer la liaison avec un cours (relation 1:1 avec toggle) lors de l'édition
    let finalLinkedSubject = config.linkedSubject;
    
    if (config.linkedSubject) {
      // Vérifier s'il y a déjà un AUTRE timer lié à ce cours (pas le timer actuel)
      const existingTimerForCourse = timers.find(t => 
        t.linkedSubject && 
        t.linkedSubject.id === config.linkedSubject!.id &&
        t.id !== editingTimer.id  // Exclure le timer qu'on est en train d'éditer
      );
      
      if (existingTimerForCourse) {
        // Toggle : délier l'ancien timer de ce cours
        console.log(`🔄 Toggle: déliaison timer "${existingTimerForCourse.title}" du cours "${config.linkedSubject.name}"`);
        await updateTimer(existingTimerForCourse.id, { linkedSubject: undefined });
      }
      
      // Si le timer était déjà lié au même cours, on peut le garder lié ou le délier selon l'intention
      if (editingTimer.linkedSubject?.id === config.linkedSubject.id) {
        console.log(`🔄 Timer "${editingTimer.title}" reste lié au cours "${config.linkedSubject.name}"`);
      } else {
        console.log(`✅ Timer "${editingTimer.title}" sera lié au cours "${config.linkedSubject.name}"`);
      }
    } else if (editingTimer.linkedSubject) {
      // Si on retire la liaison d'un cours
      console.log(`🔓 Timer "${editingTimer.title}" délié du cours "${editingTimer.linkedSubject.name}"`);
    }

    // Si pas de nom fourni et que c'est un timer par défaut, garder ou générer un nouveau nom
    let timerTitle = config.name;
    if (!timerTitle) {
      // Si le timer a déjà un nom personnalisé, le garder
      if (!editingTimer.title.match(/^Timer \d+$/)) {
        timerTitle = editingTimer.title;
      } else {
        // Si c'est un nom par défaut, on peut le mettre à jour si nécessaire
        timerTitle = editingTimer.title;
      }
    }
    
    await updateTimer(editingTimer.id, {
      title: timerTitle,
      config: timerConfig,
      linkedSubject: finalLinkedSubject,
      isPomodoroMode,
      maxCycles
    });

    setShowConfigDialog(false);
    setEditingTimer(null);
    
    console.log(`✅ Timer "${timerTitle}" mis à jour${finalLinkedSubject ? ` et lié au cours "${finalLinkedSubject.name}"` : ''}`);
  };


  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Minuteurs</h1>
          <p className="text-gray-600">
            Créez et gérez vos sessions de travail Pomodoro
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-3 rounded-lg border transition-colors ${
              soundEnabled 
                ? 'bg-blue-50 border-blue-200 text-blue-600' 
                : 'bg-gray-50 border-gray-200 text-gray-400'
            }`}
            title={soundEnabled ? 'Désactiver le son' : 'Activer le son'}
          >
            {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </button>
          
          <button
            onClick={handleCreateTimer}
            className="flex items-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Plus size={20} />
            Nouveau timer
          </button>
        </div>
      </div>


      {/* Statistics */}
      {completedSessions > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Settings size={20} className="text-green-600" />
            </div>
            <div>
              <h3 className="font-medium text-green-900">
                Sessions terminées aujourd'hui
              </h3>
              <p className="text-green-700">
                {completedSessions} session{completedSessions > 1 ? 's' : ''} de travail complétée{completedSessions > 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Timers Grid - Utilisation des nouvelles cartes modernes */}
      {timers.filter(t => !t.isEphemeral).length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
          {timers.filter(t => !t.isEphemeral).map((timer) => {
            const timerState = getTimerState(timer.id);
            return (
              <ModernTimerCard
                key={timer.id}
                id={timer.id}
                title={timer.title}
                duration={timer.config.workDuration}
                state={timerState?.state || 'idle'}
                timeRemaining={timerState?.timeRemaining || timer.config.workDuration}
                linkedSubject={timer.linkedSubject}
                isPomodoroMode={timer.isPomodoroMode || false}
                sessionCount={timerState?.sessionCount || 0}
                maxCycles={timer.maxCycles}
                progress={timerState?.progress || 0}
                onStart={() => {
                  const currentState = getTimerState(timer.id);
                  
                  // Empêcher le lancement multiple si le timer est déjà en cours
                  if (currentState && (currentState.state === 'running' || currentState.state === 'paused')) {
                    console.log('Timer already running or paused, ignoring start request');
                    return;
                  }
                  
                  console.log('Starting timer:', timer.id);
                  startTimer(timer.id, timer);
                }}
                onPause={() => {
                  console.log('Pausing timer:', timer.id);
                  pauseTimer(timer.id);
                }}
                onReset={() => {
                  console.log('Resetting timer:', timer.id);
                  resetTimer(timer.id);
                }}
                onEdit={() => editTimer(timer)}
                onDelete={() => handleRemoveTimer(timer.id)}
                onLinkSubject={() => {
                  // La liaison se fait via le dialog d'édition
                  editTimer(timer);
                }}
              />
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-16">
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
            <Plus size={32} className="text-blue-600" />
          </div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">
            Aucun timer actif
          </h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Créez votre premier timer pour commencer une session de travail concentré avec la technique Pomodoro ou un timer simple
          </p>
          <button
            onClick={handleCreateTimer}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
          >
            <Plus size={20} />
            Créer un timer
          </button>
        </div>
      )}

      {/* Tips */}
      <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-6 shadow-lg">
        <h3 className="font-semibold text-yellow-900 mb-4 flex items-center gap-2">
          <div className="w-6 h-6 bg-yellow-200 rounded-full flex items-center justify-center">
            💡
          </div>
          Conseils d'utilisation
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3 text-sm text-yellow-800">
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
              <span>Utilisez la technique Pomodoro : 00h25 de travail, 00h05 de pause</span>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
              <span>Liez vos timers à des matières pour suivre automatiquement vos progrès</span>
            </div>
          </div>
          <div className="space-y-3 text-sm text-yellow-800">
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
              <span>Prenez une pause longue (00h15) toutes les 4 sessions</span>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
              <span>Éliminez les distractions pendant vos sessions de travail</span>
            </div>
          </div>
        </div>
      </div>

      {/* Timer Configuration Dialog */}
      <TimerConfigDialog
        isOpen={showConfigDialog}
        onClose={() => {
          setShowConfigDialog(false);
          setEditingTimer(null);
        }}
        onConfirm={editingTimer ? handleEditTimerConfirm : handleTimerConfigConfirm}
        defaultDuration={editingTimer ? {
          hours: Math.floor(editingTimer.config.workDuration / 3600),
          minutes: Math.floor((editingTimer.config.workDuration % 3600) / 60),
          seconds: editingTimer.config.workDuration % 60
        } : { hours: 0, minutes: 25, seconds: 0 }}
        defaultName={editingTimer?.title}
        preselectedSubject={editingTimer?.linkedSubject}
        isEditMode={!!editingTimer}
        editingTimerData={editingTimer ? {
          id: editingTimer.id,
          mode: editingTimer.isPomodoroMode ? 'pomodoro' : 'simple',
          isPomodoroMode: editingTimer.isPomodoroMode || false,
          pomodoroConfig: editingTimer.isPomodoroMode ? {
            workDuration: editingTimer.config.workDuration,
            breakDuration: editingTimer.config.shortBreakDuration,
            longBreakDuration: editingTimer.config.longBreakDuration,
            cycles: editingTimer.maxCycles || 4
          } : undefined
        } : undefined}
        existingTimers={timers.filter(t => !t.isEphemeral).map(t => ({
          id: t.id,
          title: t.title,
          linkedSubject: t.linkedSubject
        }))}
      />

    </div>
  );
};