import React, { useState, useEffect, useRef } from 'react';
import { TimerService, TimerData, TimerMode, TimerConfig } from '@/services/timerService';
import { Play, Square, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { useTimerSounds } from '@/hooks/useTimerSounds';

interface TimerProps {
  config?: TimerConfig;
  title?: string;
  className?: string;
  showModeButtons?: boolean;
  autoStart?: boolean;
  isPomodoroMode?: boolean;
  maxCycles?: number;
  enableSounds?: boolean;
  onSessionComplete?: (sessionCount: number) => void;
  onModeChange?: (mode: TimerMode) => void;
  onTimerFinish?: (totalTime: number) => void;
  onCycleComplete?: () => void;
}

export const Timer: React.FC<TimerProps> = ({
  config,
  title,
  className = '',
  showModeButtons = true,
  autoStart = false,
  isPomodoroMode = false,
  maxCycles = 0,
  enableSounds = true,
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

  const handleModeChange = (mode: TimerMode) => {
    timerServiceRef.current?.switchMode(mode);
    onModeChange?.(mode);
  };

  const formatTime = (seconds: number): string => {
    return timerServiceRef.current?.formatTime(seconds) || '00:00';
  };

  const getProgress = (): number => {
    return timerServiceRef.current?.getProgress() || 0;
  };

  const getModeLabel = (mode: TimerMode): string => {
    switch (mode) {
      case 'work': return 'Travail';
      case 'break': return 'Pause';
      case 'longBreak': return 'P. Longue';
    }
  };

  const getFullModeLabel = (mode: TimerMode): string => {
    switch (mode) {
      case 'work': return 'Travail';
      case 'break': return 'Pause courte';
      case 'longBreak': return 'Pause longue';
    }
  };

  const getStateColor = (state: string): string => {
    switch (state) {
      case 'running': return 'text-green-600';
      case 'paused': return 'text-yellow-600';
      case 'finished': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const getModeColor = (mode: TimerMode): string => {
    switch (mode) {
      case 'work': return 'border-blue-500 bg-blue-50';
      case 'break': return 'border-green-500 bg-green-50';
      case 'longBreak': return 'border-purple-500 bg-purple-50';
    }
  };

  const getProgressColor = (mode: TimerMode): string => {
    switch (mode) {
      case 'work': return 'from-blue-500 to-blue-600';
      case 'break': return 'from-green-500 to-green-600';
      case 'longBreak': return 'from-purple-500 to-purple-600';
    }
  };

  return (
    <div className={`w-full max-w-2xl mx-auto p-4 bg-white rounded-lg shadow-md border-2 ${getModeColor(timerData.mode)} ${className}`}>
      {/* Header */}
      <div className="mb-4 relative">
        {title && (
          <h2 className="text-lg font-bold text-gray-800 mb-3 text-left pr-20">
            {title}
          </h2>
        )}
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-600">
              {getFullModeLabel(timerData.mode)}
            </span>
            {isPomodoroMode && (
              <span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded-full font-medium">
                Pomodoro
              </span>
            )}
          </div>
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${getStateColor(timerData.state)} bg-gray-100 relative z-0`}>
            {timerData.state.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Time Display */}
      <div className="text-center mb-6 py-6">
        <div className={`text-5xl font-mono font-bold text-gray-800 mb-4 ${timerData.state === 'running' ? 'timer-pulse' : ''}`}>
          {formatTime(timerData.timeRemaining)}
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-1000 bg-gradient-to-r ${getProgressColor(timerData.mode)}`}
            style={{ width: `${getProgress()}%` }}
          />
        </div>
      </div>

      {/* Session Counter & Cycle Info */}
      <div className="text-center text-gray-600 mb-4 space-y-1">
        <div>
          <span className="text-xs">Sessions:</span>
          <span className="ml-1 text-sm font-semibold text-blue-600">{timerData.sessionCount}</span>
        </div>
        {isPomodoroMode && maxCycles > 0 && (
          <div>
            <span className="text-xs">Cycles:</span>
            <span className="ml-1 text-sm font-semibold text-purple-600">
              {(timerData as any).currentCycle || 0}/{maxCycles}
            </span>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex justify-center flex-wrap gap-3 mb-4 px-2">
        {timerData.state === 'finished' ? (
          // État terminé : seul Reset est visible
          <button 
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            onClick={(e) => {
              e.stopPropagation();
              handleReset();
            }}
          >
            <RotateCcw size={18} />
            Reset
          </button>
        ) : timerData.state === 'running' ? (
          // État en cours : Arrêter + Reset
          <>
            <button 
              className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              onClick={(e) => {
                e.stopPropagation();
                handleStop();
              }}
            >
              <Square size={18} />
              Arrêter
            </button>
            <button 
              className="flex items-center gap-2 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
              onClick={(e) => {
                e.stopPropagation();
                handleReset();
              }}
            >
              <RotateCcw size={18} />
              Reset
            </button>
          </>
        ) : timerData.state === 'paused' ? (
          // État en pause : Reprendre + Reset
          <>
            <button 
              className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              onClick={(e) => {
                e.stopPropagation();
                handleStart();
              }}
            >
              <Play size={18} />
              Reprendre
            </button>
            <button 
              className="flex items-center gap-2 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
              onClick={(e) => {
                e.stopPropagation();
                handleReset();
              }}
            >
              <RotateCcw size={18} />
              Reset
            </button>
          </>
        ) : (
          // État initial : seulement Démarrer
          <button 
            className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            onClick={(e) => {
              e.stopPropagation();
              handleStart();
            }}
          >
            <Play size={18} />
            Démarrer
          </button>
        )}
      </div>

      {/* Sound Toggle & Mode Buttons */}
      <div className="px-2">
        <div className="flex items-center justify-between gap-2 mb-3">
          {/* Sound Toggle */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSoundEnabled(!soundEnabled);
            }}
            className={`p-2 rounded-lg transition-colors flex-shrink-0 ${
              soundEnabled 
                ? 'text-blue-600 bg-blue-100 hover:bg-blue-200' 
                : 'text-gray-400 bg-gray-100 hover:bg-gray-200'
            }`}
            title={soundEnabled ? 'Désactiver les sons' : 'Activer les sons'}
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>

          {/* Pomodoro Info */}
          {isPomodoroMode && (
            <div className="flex-1 text-center min-w-0">
              <div className="text-xs text-gray-500 font-medium truncate">
                Mode Pomodoro actif
              </div>
              {maxCycles > 0 && (timerData as any).currentCycle >= maxCycles && (
                <div className="text-xs text-green-600 font-semibold truncate">
                  Session terminée ! 🎉
                </div>
              )}
            </div>
          )}

          {/* Spacer when not in Pomodoro mode */}
          {!isPomodoroMode && <div className="flex-1"></div>}
        </div>

        {/* Mode Buttons */}
        {showModeButtons && !isPomodoroMode && (
          <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
            {(['work', 'break', 'longBreak'] as TimerMode[]).map((mode) => (
              <button
                key={mode}
                className={`flex-1 px-1 py-2 text-xs rounded-md transition-all font-medium min-w-0 ${
                  timerData.mode === mode 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                } ${timerData.state === 'running' ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleModeChange(mode);
                }}
                disabled={timerData.state === 'running'}
              >
                <span className="truncate block">{getModeLabel(mode)}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};