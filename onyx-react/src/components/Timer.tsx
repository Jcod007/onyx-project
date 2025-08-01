import React, { useState, useEffect, useRef } from 'react';
import { TimerService, TimerData, TimerMode, TimerConfig } from '@/services/timerService';
import { Play, Pause, Square, RotateCcw } from 'lucide-react';

interface TimerProps {
  config?: TimerConfig;
  title?: string;
  className?: string;
  showModeButtons?: boolean;
  autoStart?: boolean;
  onSessionComplete?: (sessionCount: number) => void;
  onModeChange?: (mode: TimerMode) => void;
  onTimerFinish?: (totalTime: number) => void;
}

export const Timer: React.FC<TimerProps> = ({
  config,
  title,
  className = '',
  showModeButtons = true,
  autoStart = false,
  onSessionComplete,
  onModeChange,
  onTimerFinish
}) => {
  const [timerData, setTimerData] = useState<TimerData>({
    timeRemaining: 0,
    totalTime: 0,
    state: 'idle',
    mode: 'work',
    sessionCount: 0
  });
  
  const timerServiceRef = useRef<TimerService | null>(null);

  useEffect(() => {
    // Initialiser le service
    timerServiceRef.current = new TimerService(config);
    const service = timerServiceRef.current;

    // Configurer les callbacks
    service.onTick(setTimerData);
    service.onStateChanged(setTimerData);
    service.onFinished((data) => {
      setTimerData(data);
      if (data.mode === 'work') {
        onSessionComplete?.(data.sessionCount);
      }
      onTimerFinish?.(data.totalTime - data.timeRemaining);
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
  }, [config, autoStart, onSessionComplete, onTimerFinish]);

  const handleStart = () => {
    timerServiceRef.current?.start();
  };

  const handlePause = () => {
    timerServiceRef.current?.pause();
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

  return (
    <div className={`w-full max-w-2xl mx-auto p-4 bg-white rounded-lg shadow-md border-2 ${getModeColor(timerData.mode)} ${className}`}>
      {/* Header */}
      <div className="flex flex-col items-center mb-4 relative">
        {title && (
          <h2 className="text-lg font-bold text-gray-800 mb-2 pr-20">
            {title}
          </h2>
        )}
        <div className="flex items-center justify-between w-full">
          <span className="text-sm font-medium text-gray-600">
            {getModeLabel(timerData.mode)}
          </span>
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${getStateColor(timerData.state)} bg-gray-100 relative z-0`}>
            {timerData.state.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Time Display */}
      <div className="text-center mb-4">
        <div className={`text-4xl font-mono font-bold text-gray-800 mb-3 ${timerData.state === 'running' ? 'timer-pulse' : ''}`}>
          {formatTime(timerData.timeRemaining)}
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div 
            className="h-full rounded-full transition-all duration-1000 bg-gradient-to-r from-blue-500 to-blue-600"
            style={{ width: `${getProgress()}%` }}
          />
        </div>
      </div>

      {/* Session Counter */}
      <div className="text-center text-gray-600 mb-4">
        <span className="text-xs">Sessions:</span>
        <span className="ml-1 text-sm font-semibold text-blue-600">{timerData.sessionCount}</span>
      </div>

      {/* Controls */}
      <div className="flex justify-center flex-wrap gap-2 mb-4 px-2">
        {timerData.state === 'finished' ? (
          // Quand le timer est terminé, afficher seulement Reset
          <button 
            className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
            onClick={handleReset}
          >
            <RotateCcw size={16} />
            Nouveau cycle
          </button>
        ) : timerData.state === 'running' ? (
          // Quand le timer tourne, afficher seulement Arrêter
          <button 
            className="flex items-center gap-1.5 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm"
            onClick={handleStop}
          >
            <Square size={16} />
            Arrêter
          </button>
        ) : (
          // Quand le timer est idle ou en pause, afficher Démarrer/Reprendre et Reset
          <>
            <button 
              className="flex items-center gap-1.5 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
              onClick={handleStart}
            >
              <Play size={16} />
              {timerData.state === 'paused' ? 'Reprendre' : 'Démarrer'}
            </button>
            
            {timerData.state === 'paused' && (
              <button 
                className="flex items-center gap-1.5 px-3 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium text-sm"
                onClick={handleReset}
              >
                <RotateCcw size={16} />
                Reset
              </button>
            )}
          </>
        )}
      </div>

      {/* Mode Buttons */}
      {showModeButtons && (
        <div className="flex justify-center gap-1 p-1 bg-gray-100 rounded-lg mx-2">
          {(['work', 'break', 'longBreak'] as TimerMode[]).map((mode) => (
            <button
              key={mode}
              className={`flex-1 px-2 py-2 text-xs rounded-md transition-all font-medium min-w-0 ${
                timerData.mode === mode 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              } ${timerData.state === 'running' ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => handleModeChange(mode)}
              disabled={timerData.state === 'running'}
            >
              <span className="truncate block">{getModeLabel(mode)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};