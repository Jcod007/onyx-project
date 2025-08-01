import React, { useState, useCallback } from 'react';
import { Timer } from '@/components/Timer';
import { TimerConfigDialog } from '@/components/TimerConfigDialog';
import { TimerConfig, TimerMode } from '@/services/timerService';
import { Subject } from '@/types/Subject';
import { subjectService } from '@/services/subjectService';
import { Plus, Settings, Volume2, VolumeX } from 'lucide-react';

interface ActiveTimer {
  id: string;
  config: TimerConfig;
  linkedSubject?: Subject;
}

export const TimersPage: React.FC = () => {
  const [timers, setTimers] = useState<ActiveTimer[]>([]);
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [completedSessions, setCompletedSessions] = useState(0);

  const handleCreateTimer = () => {
    setShowConfigDialog(true);
  };

  const handleTimerConfigConfirm = async (config: {
    hours: number;
    minutes: number;
    seconds: number;
    timerType: string;
    linkedSubject?: Subject;
  }) => {
    const timerConfig: TimerConfig = {
      workDuration: config.hours * 3600 + config.minutes * 60 + config.seconds,
      shortBreakDuration: 300, // 5 minutes par défaut
      longBreakDuration: 900,  // 15 minutes par défaut
      longBreakInterval: 4
    };

    const newTimer: ActiveTimer = {
      id: crypto.randomUUID(),
      config: timerConfig,
      linkedSubject: config.linkedSubject
    };

    setTimers(prev => [...prev, newTimer]);
    setShowConfigDialog(false);
  };

  const handleSessionComplete = useCallback(async (timerId: string) => {
    setCompletedSessions(prev => prev + 1);
    
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
  }, [timers, soundEnabled]);

  const handleTimerFinish = useCallback(async (totalTime: number, timerId: string) => {
    const timer = timers.find(t => t.id === timerId);
    if (timer?.linkedSubject) {
      try {
        await subjectService.addStudyTime(timer.linkedSubject.id, totalTime);
      } catch (error) {
        console.error('Erreur lors de l\'ajout du temps d\'étude:', error);
      }
    }
  }, [timers]);

  const handleModeChange = (mode: TimerMode, timerId: string) => {
    console.log(`Timer ${timerId} switched to ${mode}`);
  };

  const removeTimer = (timerId: string) => {
    setTimers(prev => prev.filter(t => t.id !== timerId));
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

      {/* Timers Grid */}
      {timers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {timers.map((timer) => (
            <div key={timer.id} className="relative">
              <Timer
                config={timer.config}
                onSessionComplete={() => handleSessionComplete(timer.id)}
                onModeChange={(mode) => handleModeChange(mode, timer.id)}
                onTimerFinish={(totalTime) => handleTimerFinish(totalTime, timer.id)}
                showModeButtons={true}
              />
              
              {/* Timer Info */}
              {timer.linkedSubject && (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-700">
                    <span className="font-medium">Matière:</span> {timer.linkedSubject.name}
                  </p>
                </div>
              )}
              
              {/* Remove Button */}
              <button
                onClick={() => removeTimer(timer.id)}
                className="absolute top-2 right-2 p-2 bg-red-100 text-red-600 rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-200 transition-all"
                title="Supprimer ce timer"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-16">
          <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
            <Plus size={32} className="text-gray-400" />
          </div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">
            Aucun timer actif
          </h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Créez votre premier timer pour commencer une session de travail concentré
          </p>
          <button
            onClick={handleCreateTimer}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Plus size={20} />
            Créer un timer
          </button>
        </div>
      )}

      {/* Tips */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h3 className="font-medium text-yellow-900 mb-3">
          💡 Conseils d'utilisation
        </h3>
        <ul className="space-y-2 text-sm text-yellow-800">
          <li>• Utilisez la technique Pomodoro : 25 min de travail, 5 min de pause</li>
          <li>• Liez vos timers à des matières pour suivre automatiquement vos progrès</li>
          <li>• Prenez une pause longue (15 min) toutes les 4 sessions</li>
          <li>• Éliminez les distractions pendant vos sessions de travail</li>
        </ul>
      </div>

      {/* Timer Configuration Dialog */}
      <TimerConfigDialog
        isOpen={showConfigDialog}
        onClose={() => setShowConfigDialog(false)}
        onConfirm={handleTimerConfigConfirm}
        defaultDuration={{ hours: 0, minutes: 25, seconds: 0 }}
      />
    </div>
  );
};