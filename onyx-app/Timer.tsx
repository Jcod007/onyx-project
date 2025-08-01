import React, { useState, useEffect, useRef } from 'react';
import { TimerService, TimerData, TimerMode, TimerConfig } from './timerService';
import styles from './Timer.module.css';

interface TimerProps {
  config?: TimerConfig;
  className?: string;
  showModeButtons?: boolean;
  autoStart?: boolean;
  onSessionComplete?: (sessionCount: number) => void;
  onModeChange?: (mode: TimerMode) => void;
}

export const Timer: React.FC<TimerProps> = ({
  config,
  className = '',
  showModeButtons = true,
  autoStart = false,
  onSessionComplete,
  onModeChange
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
  }, [config, autoStart, onSessionComplete]);

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

  const getStateLabel = (state: string): string => {
    switch (state) {
      case 'idle': return 'Prêt';
      case 'running': return 'En cours';
      case 'paused': return 'En pause';
      case 'finished': return 'Terminé';
      default: return state;
    }
  };

  return (
    <div className={`${styles.timer} ${className}`}>
      {/* Header avec mode et statut */}
      <div className={styles.header}>
        <h2 className={styles.modeTitle}>
          {getModeLabel(timerData.mode)}
        </h2>
        <span className={`${styles.status} ${styles[timerData.state]}`}>
          {getStateLabel(timerData.state)}
        </span>
      </div>

      {/* Affichage du temps principal */}
      <div className={styles.timeDisplay}>
        <div className={styles.timeText}>
          {formatTime(timerData.timeRemaining)}
        </div>
        <div className={styles.progressBarContainer}>
          <div 
            className={styles.progressBar}
            style={{ width: `${getProgress()}%` }}
          />
        </div>
      </div>

      {/* Compteur de sessions */}
      <div className={styles.sessionCounter}>
        Sessions complétées: {timerData.sessionCount}
      </div>

      {/* Contrôles principaux */}
      <div className={styles.controls}>
        {timerData.state === 'idle' || timerData.state === 'finished' ? (
          <button 
            className={`${styles.button} ${styles.startButton}`}
            onClick={handleStart}
          >
            Démarrer
          </button>
        ) : timerData.state === 'running' ? (
          <button 
            className={`${styles.button} ${styles.pauseButton}`}
            onClick={handlePause}
          >
            Pause
          </button>
        ) : (
          <button 
            className={`${styles.button} ${styles.resumeButton}`}
            onClick={handleStart}
          >
            Reprendre
          </button>
        )}
        
        <button 
          className={`${styles.button} ${styles.stopButton}`}
          onClick={handleStop}
          disabled={timerData.state === 'idle'}
        >
          Arrêter
        </button>
        
        <button 
          className={`${styles.button} ${styles.resetButton}`}
          onClick={handleReset}
        >
          Reset
        </button>
      </div>

      {/* Boutons de mode */}
      {showModeButtons && (
        <div className={styles.modeButtons}>
          <button
            className={`${styles.modeButton} ${timerData.mode === 'work' ? styles.active : ''}`}
            onClick={() => handleModeChange('work')}
            disabled={timerData.state === 'running'}
          >
            Travail
          </button>
          <button
            className={`${styles.modeButton} ${timerData.mode === 'break' ? styles.active : ''}`}
            onClick={() => handleModeChange('break')}
            disabled={timerData.state === 'running'}
          >
            Pause
          </button>
          <button
            className={`${styles.modeButton} ${timerData.mode === 'longBreak' ? styles.active : ''}`}
            onClick={() => handleModeChange('longBreak')}
            disabled={timerData.state === 'running'}
          >
            Pause longue
          </button>
        </div>
      )}
    </div>
  );
};

// Version Tailwind (alternative)
export const TimerTailwind: React.FC<TimerProps> = ({
  config,
  className = '',
  showModeButtons = true,
  autoStart = false,
  onSessionComplete,
  onModeChange
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
    timerServiceRef.current = new TimerService(config);
    const service = timerServiceRef.current;

    service.onTick(setTimerData);
    service.onStateChanged(setTimerData);
    service.onFinished((data) => {
      setTimerData(data);
      if (data.mode === 'work') {
        onSessionComplete?.(data.sessionCount);
      }
    });

    setTimerData(service.getTimerData());

    if (autoStart) {
      service.start();
    }

    return () => {
      service.destroy();
    };
  }, [config, autoStart, onSessionComplete]);

  const handleStart = () => timerServiceRef.current?.start();
  const handlePause = () => timerServiceRef.current?.pause();
  const handleStop = () => timerServiceRef.current?.stop();
  const handleReset = () => timerServiceRef.current?.reset();
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

  return (
    <div className={`max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">
          {getModeLabel(timerData.mode)}
        </h2>
        <span className={`text-sm font-medium ${getStateColor(timerData.state)}`}>
          {timerData.state.toUpperCase()}
        </span>
      </div>

      {/* Time Display */}
      <div className="text-center mb-6">
        <div className="text-6xl font-mono font-bold text-gray-800 mb-4">
          {formatTime(timerData.timeRemaining)}
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-1000"
            style={{ width: `${getProgress()}%` }}
          />
        </div>
      </div>

      {/* Session Counter */}
      <div className="text-center text-gray-600 mb-6">
        Sessions complétées: {timerData.sessionCount}
      </div>

      {/* Controls */}
      <div className="flex justify-center space-x-2 mb-4">
        {timerData.state === 'idle' || timerData.state === 'finished' ? (
          <button 
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            onClick={handleStart}
          >
            Démarrer
          </button>
        ) : timerData.state === 'running' ? (
          <button 
            className="px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
            onClick={handlePause}
          >
            Pause
          </button>
        ) : (
          <button 
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            onClick={handleStart}
          >
            Reprendre
          </button>
        )}
        
        <button 
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
          onClick={handleStop}
          disabled={timerData.state === 'idle'}
        >
          Arrêter
        </button>
        
        <button 
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          onClick={handleReset}
        >
          Reset
        </button>
      </div>

      {/* Mode Buttons */}
      {showModeButtons && (
        <div className="flex justify-center space-x-1">
          {(['work', 'break', 'longBreak'] as TimerMode[]).map((mode) => (
            <button
              key={mode}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                timerData.mode === mode 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
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