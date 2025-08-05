import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, BookOpen, Coffee, Clock } from 'lucide-react';
import { useTimerWidget } from '@/hooks/useTimerWidget';
import { formatDuration } from '@/utils/timeFormat';
import { useTheme } from '@/contexts/ThemeContext';
import { ActiveTimer } from '@/types/ActiveTimer';
import { TimerState } from '@/types/Timer';

interface ActiveTimerWidgetProps {
  className?: string;
}

const getPositionClasses = (position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'): string => {
  const baseClasses = 'fixed z-50 transition-all duration-300 ease-in-out';
  
  switch (position) {
    case 'bottom-right':
      return `${baseClasses} bottom-4 right-4`;
    case 'bottom-left':
      return `${baseClasses} bottom-4 left-4`;
    case 'top-right':
      return `${baseClasses} top-4 right-4`;
    case 'top-left':
      return `${baseClasses} top-4 left-4`;
    default:
      return `${baseClasses} bottom-4 right-4`;
  }
};

const ActiveTimerCard: React.FC<{
  timer: ActiveTimer;
  state: TimerState;
  timeRemaining: number;
  progress: number;
  onAction: (action: 'start' | 'pause' | 'reset') => void;
  isDark: boolean;
}> = ({ timer, state, timeRemaining, progress, onAction, isDark }) => {
  
  const getStateColor = () => {
    switch (state) {
      case 'running':
        return 'border-green-500 bg-green-50 dark:bg-green-900/20';
      case 'paused':
        return 'border-orange-500 bg-orange-50 dark:bg-orange-900/20';
      case 'finished':
        return 'border-purple-500 bg-purple-50 dark:bg-purple-900/20';
      default:
        return 'border-gray-300 bg-white dark:bg-gray-800';
    }
  };

  const getTimerIcon = () => {
    if (timer.isPomodoroMode) {
      return <Coffee size={16} className="text-red-500" />;
    }
    return <Clock size={16} className="text-blue-500" />;
  };

  return (
    <div className={`
      p-3 rounded-lg border-2 shadow-lg backdrop-blur-sm transition-all duration-300 min-w-64
      ${getStateColor()}
    `}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {getTimerIcon()}
          <span className={`text-sm font-medium truncate ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
            {timer.title}
          </span>
        </div>
        
        {timer.linkedSubject && (
          <div className={`
            flex items-center gap-1 px-2 py-1 rounded text-xs
            ${isDark ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-700'}
          `}>
            <BookOpen size={10} />
            <span className="max-w-20 truncate">{timer.linkedSubject.name}</span>
          </div>
        )}
      </div>

      {/* Temps principal */}
      <div className="text-center mb-3">
        <div className={`
          text-2xl font-mono font-bold
          ${state === 'running' ? 'text-green-600 dark:text-green-400' : ''}
          ${state === 'paused' ? 'text-orange-600 dark:text-orange-400' : ''}
          ${state === 'finished' ? 'text-purple-600 dark:text-purple-400' : ''}
        `}>
          {formatDuration(timeRemaining)}
        </div>
        
        {/* Info Pomodoro */}
        {timer.isPomodoroMode && timer.maxCycles && (
          <div className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Cycle {Math.min(timer.maxCycles, Math.floor(progress / 100) + 1)}/{timer.maxCycles}
          </div>
        )}
      </div>

      {/* Barre de progression */}
      <div className={`h-2 rounded-full overflow-hidden mb-3 ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
        <div 
          className={`
            h-full transition-all duration-1000 ease-out
            ${state === 'running' ? 'bg-green-500' : ''}
            ${state === 'paused' ? 'bg-orange-500' : ''}
            ${state === 'finished' ? 'bg-purple-500' : ''}
          `}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Contrôles */}
      <div className="flex items-center justify-center gap-2">
        {state === 'idle' || state === 'paused' ? (
          <button
            onClick={() => onAction('start')}
            className={`
              flex items-center justify-center p-2 rounded-full transition-colors
              ${isDark 
                ? 'hover:bg-green-800 text-green-400 hover:text-green-300' 
                : 'hover:bg-green-100 text-green-600 hover:text-green-700'
              }
            `}
            title="Démarrer"
          >
            <Play size={20} />
          </button>
        ) : (
          <button
            onClick={() => onAction('pause')}
            className={`
              flex items-center justify-center p-2 rounded-full transition-colors
              ${isDark 
                ? 'hover:bg-orange-800 text-orange-400 hover:text-orange-300' 
                : 'hover:bg-orange-100 text-orange-600 hover:text-orange-700'
              }
            `}
            title="Pause"
          >
            <Pause size={20} />
          </button>
        )}

        <button
          onClick={() => onAction('reset')}
          className={`
            flex items-center justify-center p-2 rounded-full transition-colors
            ${isDark 
              ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-300' 
              : 'hover:bg-gray-100 text-gray-600 hover:text-gray-700'
            }
          `}
          title="Réinitialiser"
        >
          <RotateCcw size={18} />
        </button>

        {/* Indicateur d'état */}
        <div className={`
          ml-2 w-3 h-3 rounded-full
          ${state === 'running' ? 'bg-green-500 animate-pulse' : ''}
          ${state === 'paused' ? 'bg-orange-500' : ''}
          ${state === 'finished' ? 'bg-purple-500 animate-bounce' : ''}
        `} />
      </div>
    </div>
  );
};

export const ActiveTimerWidget: React.FC<ActiveTimerWidgetProps> = ({ className = '' }) => {
  const { isDark } = useTheme();
  const {
    settings,
    visibleTimers,
    shouldShowWidget,
    handleTimerAction,
    getTimerState
  } = useTimerWidget();

  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  // Debug logging
  useEffect(() => {
    console.log('🎯 ActiveTimerWidget Debug:', {
      shouldShowWidget,
      visibleTimersCount: visibleTimers.length,
      visibleTimers: visibleTimers.map(t => ({
        id: t.id,
        title: t.title,
        state: getTimerState(t.id)?.state
      })),
      isVisible,
      shouldRender
    });
  }, [shouldShowWidget, visibleTimers, isVisible, shouldRender, getTimerState]);

  // Gestion de l'apparition/disparition avec animation
  useEffect(() => {
    if (shouldShowWidget && visibleTimers.length > 0) {
      console.log('✅ Affichage du widget');
      setShouldRender(true);
      // Petit délai pour permettre le rendu avant l'animation
      setTimeout(() => setIsVisible(true), 10);
    } else {
      console.log('❌ Masquage du widget');
      setIsVisible(false);
      // Attendre la fin de l'animation avant de supprimer du DOM
      setTimeout(() => setShouldRender(false), 300);
    }
  }, [shouldShowWidget, visibleTimers.length]);

  // Ne pas afficher si aucun timer actif
  if (!shouldRender) {
    return null;
  }

  const positionClasses = getPositionClasses(settings.position);

  return (
    <div className={`
      ${positionClasses} ${className}
      transform transition-all duration-300 ease-in-out
      ${isVisible 
        ? 'translate-y-0 opacity-100 scale-100' 
        : 'translate-y-4 opacity-0 scale-95'
      }
    `}>
      <div className="space-y-3">
        {visibleTimers.map((timer) => {
          const timerState = getTimerState(timer.id);
          return (
            <ActiveTimerCard
              key={timer.id}
              timer={timer}
              state={timerState?.state || 'idle'}
              timeRemaining={timerState?.timeRemaining || timer.config.workDuration}
              progress={timerState?.progress || 0}
              onAction={(action) => handleTimerAction(action, timer)}
              isDark={isDark}
            />
          );
        })}
        
        {/* Indicateur global si plusieurs timers */}
        {visibleTimers.length > 1 && (
          <div className={`
            text-center text-xs py-2 px-3 rounded-lg
            ${isDark ? 'bg-gray-800/80 text-gray-300' : 'bg-white/80 text-gray-600'}
            backdrop-blur-sm
          `}>
            {visibleTimers.length} timer{visibleTimers.length > 1 ? 's' : ''} actif{visibleTimers.length > 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  );
};