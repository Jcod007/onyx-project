import React, { useState, useEffect, useRef } from 'react';
import { TimerService, TimerData, TimerMode, TimerConfig } from '@/services/timerService';
import { Play, Pause, Square, RotateCcw } from 'lucide-react';

interface TimerProps {
  config?: TimerConfig;
  className?: string;
  showModeButtons?: boolean;
  autoStart?: boolean;
  onSessionComplete?: (sessionCount: number) => void;
  onModeChange?: (mode: TimerMode) => void;
  onTimerFinish?: (totalTime: number) => void;
}

export const Timer: React.FC<TimerProps> = ({
  config,
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
    <div className={`max-w-md mx-auto p-6 bg-white rounded-xl shadow-lg border-2 ${getModeColor(timerData.mode)} ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">
          {getModeLabel(timerData.mode)}
        </h2>
        <span className={`text-sm font-medium px-3 py-1 rounded-full ${getStateColor(timerData.state)} bg-gray-100`}>
          {timerData.state.toUpperCase()}
        </span>
      </div>

      {/* Time Display */}
      <div className="text-center mb-6">
        <div className={`text-6xl font-mono font-bold text-gray-800 mb-4 ${timerData.state === 'running' ? 'timer-pulse' : ''}`}>
          {formatTime(timerData.timeRemaining)}
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div 
            className="h-full rounded-full transition-all duration-1000 bg-gradient-to-r from-blue-500 to-blue-600"
            style={{ width: `${getProgress()}%` }}
          />
        </div>
      </div>

      {/* Session Counter */}
      <div className="text-center text-gray-600 mb-6">
        <span className="text-sm">Sessions complétées:</span>
        <span className="ml-2 text-lg font-semibold text-blue-600">{timerData.sessionCount}</span>
      </div>

      {/* Controls */}
      <div className="flex justify-center space-x-3 mb-4">
        {timerData.state === 'idle' || timerData.state === 'finished' ? (
          <button 
            className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            onClick={handleStart}
          >
            <Play size={20} />
            Démarrer
          </button>
        ) : timerData.state === 'running' ? (
          <button 
            className="flex items-center gap-2 px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-medium"
            onClick={handlePause}
          >
            <Pause size={20} />
            Pause
          </button>
        ) : (
          <button 
            className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            onClick={handleStart}
          >
            <Play size={20} />
            Reprendre
          </button>
        )}
        
        <button 
          className="flex items-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          onClick={handleStop}
          disabled={timerData.state === 'idle'}
        >
          <Square size={18} />
          Arrêter
        </button>
        
        <button 
          className="flex items-center gap-2 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
          onClick={handleReset}
        >
          <RotateCcw size={18} />
          Reset
        </button>
      </div>

      {/* Mode Buttons */}
      {showModeButtons && (
        <div className="flex justify-center space-x-1 p-1 bg-gray-100 rounded-lg">
          {(['work', 'break', 'longBreak'] as TimerMode[]).map((mode) => (
            <button
              key={mode}
              className={`flex-1 px-3 py-2 text-sm rounded-md transition-all font-medium ${
                timerData.mode === mode 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              } ${timerData.state === 'running' ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => handleModeChange(mode)}
              disabled={timerData.state === 'running'}
            >
              {getModeLabel(mode)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};