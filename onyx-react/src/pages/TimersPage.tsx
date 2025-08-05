import React, { useState, useCallback } from 'react';
import { Timer } from '@/components/Timer';
import { ModernTimerCard } from '@/components/ModernTimerCard';
import { TimerConfigDialog } from '@/components/TimerConfigDialog';
import { DailySummary } from '@/components/DailySummary';
import { TimerConfig, TimerMode } from '@/services/timerService';
import { Subject } from '@/types/Subject';
import { subjectService } from '@/services/subjectService';
import { useReactiveTimers } from '@/hooks/useReactiveTimers';
import { ActiveTimer } from '@/types/ActiveTimer';
import { Plus, Settings, Volume2, VolumeX, Edit3, Trash2, BarChart3 } from 'lucide-react';

export const TimersPage: React.FC = () => {
  const {
    timers,
    timerCounter,
    setTimerCounter,
    addTimer,
    updateTimer,
    removeTimer: removeTimerFromStorage,
    updateTimerLastUsed
  } = useReactiveTimers();
  
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [editingTimer, setEditingTimer] = useState<ActiveTimer | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [showDailySummary, setShowDailySummary] = useState(false);

  const handleCreateTimer = () => {
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

    addTimer({
      title: config.name || `Timer ${timerCounter}`,
      config: timerConfig,
      linkedSubject: config.linkedSubject,
      isPomodoroMode,
      maxCycles
    });
    
    setTimerCounter(prev => prev + 1);
    setShowConfigDialog(false);
  };

  const handleSessionComplete = useCallback(async (timerId: string) => {
    setCompletedSessions(prev => prev + 1);
    updateTimerLastUsed(timerId);
    
    // Trouver le timer correspondant pour ajouter le temps à la matière
    const timer = timers.find(t => t.id === timerId);
    if (timer?.linkedSubject) {
      try {
        await subjectService.addStudyTime(
          timer.linkedSubject.id, 
          timer.config.workDuration
        );
      } catch (error) {
        console.error('Erreur lors de l\'ajout du temps d\'étude:', error);
      }
    }

    // Jouer un son si activé
    if (soundEnabled) {
      playNotificationSound();
    }
  }, [timers, soundEnabled, updateTimerLastUsed]);

  const handleTimerFinish = useCallback(async (totalTime: number, timerId: string) => {
    updateTimerLastUsed(timerId);
    const timer = timers.find(t => t.id === timerId);
    if (timer?.linkedSubject) {
      try {
        await subjectService.addStudyTime(timer.linkedSubject.id, totalTime);
      } catch (error) {
        console.error('Erreur lors de l\'ajout du temps d\'étude:', error);
      }
    }
  }, [timers, updateTimerLastUsed]);

  const handleModeChange = (mode: TimerMode, timerId: string) => {
    updateTimerLastUsed(timerId);
    console.log(`Timer ${timerId} switched to ${mode}`);
  };

  const handleRemoveTimer = (timerId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce timer ?')) {
      removeTimerFromStorage(timerId);
    }
  };

  const editTimer = (timer: ActiveTimer) => {
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

    updateTimer(editingTimer.id, {
      title: config.name || editingTimer.title,
      config: timerConfig,
      linkedSubject: config.linkedSubject,
      isPomodoroMode,
      maxCycles
    });

    setShowConfigDialog(false);
    setEditingTimer(null);
  };

  const playNotificationSound = () => {
    // Utiliser l'API Audio Web pour jouer un son
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
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
            onClick={() => setShowDailySummary(!showDailySummary)}
            className={`p-3 rounded-lg border transition-colors ${
              showDailySummary 
                ? 'bg-purple-50 border-purple-200 text-purple-600' 
                : 'bg-gray-50 border-gray-200 text-gray-400'
            }`}
            title={showDailySummary ? 'Masquer le résumé' : 'Afficher le résumé journalier'}
          >
            <BarChart3 size={20} />
          </button>
          
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

      {/* Daily Summary */}
      {showDailySummary && (
        <DailySummary
          sessions={[
            // Exemple de données - à remplacer par de vraies données
            {
              id: '1',
              subject: { id: '1', name: 'Mathématiques', targetTime: 7200, defaultTimerDuration: 1500, studiedTime: 3600, status: 'IN_PROGRESS', createdAt: new Date(), updatedAt: new Date() },
              plannedDuration: 3600,
              studiedTime: 1800,
              isCompleted: false,
              progress: 50
            },
            {
              id: '2', 
              subject: { id: '2', name: 'Histoire', targetTime: 3600, defaultTimerDuration: 1500, studiedTime: 3600, status: 'COMPLETED', createdAt: new Date(), updatedAt: new Date() },
              plannedDuration: 3600,
              studiedTime: 3600,
              isCompleted: true,
              progress: 100
            }
          ]}
          onStartSession={(sessionId) => {
            console.log('Starting session:', sessionId);
          }}
        />
      )}

      {/* Statistics */}
      {completedSessions > 0 && !showDailySummary && (
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
      {timers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
          {timers.map((timer) => (
            <ModernTimerCard
              key={timer.id}
              id={timer.id}
              title={timer.title}
              duration={timer.config.workDuration}
              state="idle" // TODO: Connecter avec l'état réel du timer
              timeRemaining={timer.config.workDuration}
              linkedSubject={timer.linkedSubject}
              isPomodoroMode={timer.isPomodoroMode || false}
              sessionCount={0} // TODO: Connecter avec les données réelles
              maxCycles={timer.maxCycles}
              progress={0} // TODO: Calculer la progression réelle
              onStart={() => {
                console.log('Starting timer:', timer.id);
                // TODO: Implémenter le démarrage
              }}
              onPause={() => {
                console.log('Pausing timer:', timer.id);
                // TODO: Implémenter la pause
              }}
              onReset={() => {
                console.log('Resetting timer:', timer.id);
                // TODO: Implémenter le reset
              }}
              onEdit={() => editTimer(timer)}
              onDelete={() => handleRemoveTimer(timer.id)}
              onLinkSubject={() => {
                console.log('Link subject for timer:', timer.id);
                // TODO: Implémenter la liaison avec un sujet
              }}
            />
          ))}
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
              <span>Utilisez la technique Pomodoro : 25 min de travail, 5 min de pause</span>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
              <span>Liez vos timers à des matières pour suivre automatiquement vos progrès</span>
            </div>
          </div>
          <div className="space-y-3 text-sm text-yellow-800">
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
              <span>Prenez une pause longue (15 min) toutes les 4 sessions</span>
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
      />
    </div>
  );
};