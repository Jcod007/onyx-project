import React, { useState, useEffect, useRef } from 'react';
import { TimerService, TimerData, TimerMode, TimerConfig } from '@/services/timerService';
import { Subject } from '@/types/Subject';
import { Play, Pause, RotateCcw, Volume2, VolumeX, BookOpen, Clock } from 'lucide-react';
import { useTimerSounds } from '@/hooks/useTimerSounds';

interface TimerProps {
  id: string;
  duration?: number; // en secondes (optionnel, utilise config si fourni)
  linkedCourse?: string;
  title?: string;
  config?: TimerConfig;
  className?: string;
  showModeButtons?: boolean;
  autoStart?: boolean;
  isPomodoroMode?: boolean;
  maxCycles?: number;
  enableSounds?: boolean;
  linkedSubject?: Subject | null;
  onSessionComplete?: (sessionCount: number) => void;
  onModeChange?: (mode: TimerMode) => void;
  onTimerFinish?: (totalTime: number) => void;
  onCycleComplete?: () => void;
}

export const Timer: React.FC<TimerProps> = ({
  id,
  linkedCourse,
  title,
  config,
  className = '',
  autoStart = false,
  isPomodoroMode = false,
  maxCycles = 0,
  enableSounds = true,
  linkedSubject,
  onSessionComplete,
  onModeChange,
  onTimerFinish,
  onCycleComplete
}) => {
  const [timerData, setTimerData] = useState<TimerData>({
    timeRemaining: 0,
    totalTime: 0,
    state: 'idle',
    mode: 'work',
    sessionCount: 0
  });
  const [soundEnabled, setSoundEnabled] = useState(enableSounds);
  
  const timerServiceRef = useRef<TimerService | null>(null);
  const { playWorkEndSound, playBreakEndSound } = useTimerSounds(soundEnabled);

  useEffect(() => {
    // Initialiser le service
    timerServiceRef.current = new TimerService(config, isPomodoroMode, maxCycles);
    const service = timerServiceRef.current;

    // Configurer les callbacks
    service.onTick(setTimerData);
    service.onStateChanged(setTimerData);
    service.onFinished((data) => {
      setTimerData(data);
      if (data.mode === 'work') {
        onSessionComplete?.(data.sessionCount);
        playSound('work');
      } else {
        playSound('break');
      }
      onTimerFinish?.(data.totalTime - data.timeRemaining);
    });

    service.onModeChange((data) => {
      setTimerData(data);
      onModeChange?.(data.mode);
    });

    service.onCycleComplete((data) => {
      setTimerData(data);
      onCycleComplete?.();
    });

    // État initial
    setTimerData(service.getTimerData());

    // Auto-démarrage si demandé
    if (autoStart) {
      service.start();
    }

    // Cleanup
    return () => {
      service.destroy();
    };
  }, [config, autoStart, isPomodoroMode, maxCycles, onSessionComplete, onTimerFinish, onModeChange, onCycleComplete]);

  const playSound = (type: 'work' | 'break') => {
    if (!soundEnabled) return;
    
    if (type === 'work') {
      playWorkEndSound();
    } else {
      playBreakEndSound();
    }
  };

  const handleStart = () => {
    timerServiceRef.current?.start();
  };


  const handleStop = () => {
    timerServiceRef.current?.stop();
  };

  const handleReset = () => {
    timerServiceRef.current?.reset();
  };

  const formatTime = (seconds: number): string => {
    return timerServiceRef.current?.formatTime(seconds) || '00:00';
  };

  const getProgress = (): number => {
    return timerServiceRef.current?.getProgress() || 0;
  };

  // Obtenir les couleurs selon l'état
  const getStateInfo = (state: string) => {
    switch (state) {
      case 'running':
        return { color: 'bg-green-100 text-green-800', label: 'EN COURS', borderColor: 'border-green-200' };
      case 'paused':
        return { color: 'bg-orange-100 text-orange-800', label: 'PAUSE', borderColor: 'border-orange-200' };
      case 'finished':
        return { color: 'bg-purple-100 text-purple-800', label: 'TERMINÉ', borderColor: 'border-purple-200' };
      default:
        return { color: 'bg-gray-100 text-gray-800', label: 'IDLE', borderColor: 'border-gray-200' };
    }
  };

  const stateInfo = getStateInfo(timerData.state);
  const displayTitle = title || `Timer ${id}`;

  return (
    <div className={`w-full max-w-md mx-auto p-6 bg-white rounded-xl shadow-lg border-2 ${stateInfo.borderColor} ${className}`}>
      {/* Header avec titre et état */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">
          {displayTitle}
        </h2>
        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${stateInfo.color}`}>
          {stateInfo.label}
        </span>
      </div>

      {/* Affichage du temps principal */}
      <div className="text-center mb-6">
        <div className={`text-6xl font-mono font-bold text-gray-900 mb-4 ${timerData.state === 'running' ? 'timer-pulse' : ''}`}>
          {formatTime(timerData.timeRemaining)}
        </div>
        
        {/* Barre de progression */}
        <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
          <div 
            className={`h-full rounded-full transition-all duration-1000 ${
              timerData.state === 'running' ? 'bg-gradient-to-r from-green-500 to-green-600' :
              timerData.state === 'paused' ? 'bg-gradient-to-r from-orange-500 to-orange-600' :
              timerData.state === 'finished' ? 'bg-gradient-to-r from-purple-500 to-purple-600' :
              'bg-gradient-to-r from-gray-400 to-gray-500'
            }`}
            style={{ width: `${getProgress()}%` }}
          />
        </div>
        
        <div className="text-xs text-gray-500">
          {Math.round(getProgress())}% complété
        </div>
      </div>

      {/* Cours lié */}
      {(linkedCourse || linkedSubject) && (
        <div className="flex items-center justify-center gap-2 mb-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <BookOpen size={16} className="text-blue-600" />
          <span className="text-sm font-medium text-blue-900">Timer lié :</span>
          <span className="text-sm font-bold text-blue-900">
            {linkedCourse || linkedSubject?.name || 'Cours'}
          </span>
        </div>
      )}

      {/* Bouton principal */}
      <div className="mb-6">
        {timerData.state === 'finished' ? (
          <button 
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold text-lg shadow-lg"
            onClick={(e) => {
              e.stopPropagation();
              handleReset();
            }}
          >
            <RotateCcw size={20} />
            Recommencer
          </button>
        ) : timerData.state === 'running' ? (
          <div className="flex gap-3">
            <button 
              className="flex-1 flex items-center justify-center gap-2 px-4 py-4 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors font-semibold shadow-lg"
              onClick={(e) => {
                e.stopPropagation();
                handleStop();
              }}
            >
              <Pause size={18} />
              Pause
            </button>
            <button 
              className="px-4 py-4 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-colors shadow-lg"
              onClick={(e) => {
                e.stopPropagation();
                handleReset();
              }}
              title="Reset"
            >
              <RotateCcw size={18} />
            </button>
          </div>
        ) : timerData.state === 'paused' ? (
          <div className="flex gap-3">
            <button 
              className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-semibold text-lg shadow-lg"
              onClick={(e) => {
                e.stopPropagation();
                handleStart();
              }}
            >
              <Play size={20} />
              Reprendre
            </button>
            <button 
              className="px-4 py-4 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-colors shadow-lg"
              onClick={(e) => {
                e.stopPropagation();
                handleReset();
              }}
              title="Reset"
            >
              <RotateCcw size={18} />
            </button>
          </div>
        ) : (
          <button 
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-semibold text-lg shadow-lg"
            onClick={(e) => {
              e.stopPropagation();
              handleStart();
            }}
          >
            <Play size={20} />
            Démarrer
          </button>
        )}
      </div>

      {/* Contrôles secondaires */}
      <div className="flex items-center justify-between">
        {/* Bouton son */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSoundEnabled(!soundEnabled);
          }}
          className={`p-3 rounded-xl transition-colors ${
            soundEnabled 
              ? 'text-blue-600 bg-blue-100 hover:bg-blue-200' 
              : 'text-gray-400 bg-gray-100 hover:bg-gray-200'
          }`}
          title={soundEnabled ? 'Désactiver les sons' : 'Activer les sons'}
        >
          {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
        </button>

        {/* Informations de session */}
        <div className="text-center">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock size={14} />
            <span>Sessions: <span className="font-semibold text-blue-600">{timerData.sessionCount}</span></span>
          </div>
          {isPomodoroMode && maxCycles > 0 && (
            <div className="text-xs text-gray-500 mt-1">
              Cycles: {(timerData as any).currentCycle || 0}/{maxCycles}
            </div>
          )}
        </div>

        {/* Indicateur Pomodoro */}
        {isPomodoroMode && (
          <div className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
            Pomodoro
          </div>
        )}
        
        {!isPomodoroMode && <div className="w-12"></div>} {/* Spacer */}
      </div>
    </div>
  );
};