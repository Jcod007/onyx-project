import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Play, Pause, RotateCcw, BookOpen, Coffee, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { formatDuration } from '@/utils/timeFormat';
import { useTheme } from '@/contexts/ThemeContext';
import { ActiveTimer } from '@/types/ActiveTimer';
import { TimerState } from '@/types/Timer';

interface TimerExecutionState {
  state: TimerState;
  timeRemaining: number;
  progress: number;
  sessionCount: number;
  currentCycle: number;
}

interface SimpleActiveTimerWidgetProps {
  timers: ActiveTimer[];
  getTimerState: (timerId: string) => TimerExecutionState | null;
  onTimerAction: (action: 'start' | 'pause' | 'reset', timer: ActiveTimer) => void;
  className?: string;
}

const getPositionClasses = (): string => {
  return 'fixed bottom-4 right-4 z-[9999]';
};

const CompactTimerCard: React.FC<{
  timer: ActiveTimer;
  state: TimerState;
  timeRemaining: number;
  progress: number;
  onAction: (action: 'start' | 'pause' | 'reset') => void;
  isDark: boolean;
  isExpanded?: boolean;
}> = ({ timer, state, timeRemaining, progress, onAction, isDark, isExpanded = true }) => {
  
  const getStateColor = () => {
    switch (state) {
      case 'running':
        return 'border-l-green-500 bg-white dark:bg-white';
      case 'paused':
        return 'border-l-orange-500 bg-white dark:bg-white';
      case 'finished':
        return 'border-l-purple-500 bg-white dark:bg-white';
      default:
        return 'border-l-gray-300 bg-white dark:bg-white';
    }
  };

  const getTimerIcon = () => {
    // Détecter si c'est un timer Pomodoro selon plusieurs critères
    const isPomodoro = timer.isPomodoroMode || 
                      (timer.config?.longBreakInterval && timer.config.longBreakInterval > 1) ||
                      (timer.config?.shortBreakDuration && timer.config.shortBreakDuration > 0);
    
    if (isPomodoro) {
      return <Coffee size={12} className="text-red-500" />;
    }
    return <Clock size={12} className="text-blue-500" />;
  };

  if (!isExpanded) {
    // Version minimale - juste un indicateur
    return (
      <div className={`
        flex items-center gap-2 px-2 py-1 rounded border-l-2
        ${getStateColor()}
      `}>
        {getTimerIcon()}
        <span className={`text-xs font-mono ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
          {formatDuration(timeRemaining)}
        </span>
        <div className={`w-2 h-2 rounded-full ${state === 'running' ? 'bg-green-500 animate-pulse' : 
          state === 'paused' ? 'bg-orange-500' : 'bg-gray-400'}`} />
      </div>
    );
  }

  return (
    <div className={`
      p-2 rounded border-l-4 shadow-sm transition-all duration-300 min-w-52
      ${getStateColor()}
    `}>
      {/* Header compact */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1 flex-1 min-w-0">
          {getTimerIcon()}
          <span className={`text-xs font-medium truncate ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
            {timer.title}
          </span>
        </div>
        
        {timer.linkedSubject && (
          <div className={`
            flex items-center gap-1 px-1 py-0.5 rounded text-xs
            ${isDark ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-700'}
          `}>
            <BookOpen size={8} />
            <span className="max-w-16 truncate text-xs">{timer.linkedSubject.name}</span>
          </div>
        )}
      </div>

      {/* Temps et contrôles sur la même ligne */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <div className={`
            text-lg font-mono font-bold
            ${state === 'running' ? 'text-green-600 dark:text-green-400' : ''}
            ${state === 'paused' ? 'text-orange-600 dark:text-orange-400' : ''}
            ${state === 'finished' ? 'text-purple-600 dark:text-purple-400' : ''}
            ${state === 'idle' ? (isDark ? 'text-gray-300' : 'text-gray-600') : ''}
          `}>
            {formatDuration(timeRemaining)}
          </div>
          
          {/* Info Pomodoro */}
          {timer.isPomodoroMode && timer.maxCycles && (
            <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {Math.min(timer.maxCycles, Math.floor(progress / 100) + 1)}/{timer.maxCycles}
            </div>
          )}
        </div>

        {/* Contrôles compacts */}
        <div className="flex items-center gap-1">
          {state === 'idle' || state === 'paused' ? (
            <button
              onClick={() => onAction('start')}
              className={`
                flex items-center justify-center p-1.5 rounded-full transition-colors
                ${isDark 
                  ? 'hover:bg-green-800 text-green-400 hover:text-green-300' 
                  : 'hover:bg-green-100 text-green-600 hover:text-green-700'
                }
              `}
              title="Démarrer"
            >
              <Play size={14} />
            </button>
          ) : (
            <button
              onClick={() => onAction('pause')}
              className={`
                flex items-center justify-center p-1.5 rounded-full transition-colors
                ${isDark 
                  ? 'hover:bg-orange-800 text-orange-400 hover:text-orange-300' 
                  : 'hover:bg-orange-100 text-orange-600 hover:text-orange-700'
                }
              `}
              title="Pause"
            >
              <Pause size={14} />
            </button>
          )}

          <button
            onClick={() => onAction('reset')}
            className={`
              flex items-center justify-center p-1.5 rounded-full transition-colors
              ${isDark 
                ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-300' 
                : 'hover:bg-gray-100 text-gray-600 hover:text-gray-700'
              }
            `}
            title="Réinitialiser"
          >
            <RotateCcw size={12} />
          </button>
        </div>
      </div>

      {/* Barre de progression compacte */}
      <div className={`h-1 rounded-full overflow-hidden mt-2 ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
        <div 
          className={`
            h-full transition-all duration-1000 ease-out
            ${state === 'running' ? 'bg-green-500' : ''}
            ${state === 'paused' ? 'bg-orange-500' : ''}
            ${state === 'finished' ? 'bg-purple-500' : ''}
            ${state === 'idle' ? 'bg-gray-400' : ''}
          `}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export const SimpleActiveTimerWidget: React.FC<SimpleActiveTimerWidgetProps> = ({ 
  timers, 
  getTimerState, 
  onTimerAction, 
  className = '' 
}) => {
  const { isDark } = useTheme();
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Filtrer et trier les timers actifs par temps restant (le plus proche de la fin en premier)
  const activeTimers = timers
    .filter(timer => {
      const state = getTimerState(timer.id);
      return state && (state.state === 'running' || state.state === 'paused');
    })
    .sort((a, b) => {
      const stateA = getTimerState(a.id);
      const stateB = getTimerState(b.id);
      if (!stateA || !stateB) return 0;
      
      // Priorité aux timers running
      if (stateA.state === 'running' && stateB.state !== 'running') return -1;
      if (stateB.state === 'running' && stateA.state !== 'running') return 1;
      
      // Ensuite par temps restant (plus court en premier)
      return stateA.timeRemaining - stateB.timeRemaining;
    });

  // Gestion de l'apparition/disparition avec animation
  useEffect(() => {
    if (activeTimers.length > 0) {
      setShouldRender(true);
      setTimeout(() => setIsVisible(true), 10);
    } else {
      setIsVisible(false);
      setTimeout(() => setShouldRender(false), 300);
    }
  }, [activeTimers.length]);


  // Ne pas afficher si aucun timer actif
  if (!shouldRender) {
    return null;
  }

  const positionClasses = getPositionClasses();

  const widgetContent = (
    <div 
      className={`
        ${positionClasses} ${className}
        transform transition-all duration-300 ease-in-out
        ${isVisible 
          ? 'translate-y-0 opacity-100 scale-100' 
          : 'translate-y-4 opacity-0 scale-95'
        }
      `}
      style={{
        position: 'fixed',
        bottom: '16px',
        right: '16px',
        zIndex: 9999,
        top: 'auto',
        left: 'auto',
        // Position fixée pour le widget - fond transparent
      }}
    >
      {/* En-tête du widget avec bouton de réduction */}
      <div className={`
        flex items-center justify-between px-2 py-1 rounded-t
        bg-white text-gray-600 shadow-sm
      `}>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full bg-green-500 ${activeTimers.some(t => getTimerState(t.id)?.state === 'running') ? 'animate-pulse' : ''}`} />
          <span className="text-xs font-medium">
            {activeTimers.length} timer{activeTimers.length > 1 ? 's' : ''}
          </span>
          {activeTimers.length > 3 && !isCollapsed && (
            <span className="text-xs text-gray-500 bg-gray-100 px-1 rounded">
              {activeTimers.length - 3}+ ↓
            </span>
          )}
        </div>
        
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`
            p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors
          `}
          title={isCollapsed ? "Agrandir" : "Réduire"}
        >
          {isCollapsed ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
      </div>

      {/* Contenu des timers avec scroll - Affichage du bas vers le haut */}
      <div className={`
        gap-1 transition-all duration-300 flex flex-col mt-2
        ${isCollapsed 
          ? 'max-h-20 overflow-hidden' 
          : activeTimers.length <= 3 
            ? 'max-h-72'  // Hauteur adaptative pour 1-3 timers
            : 'h-72 overflow-y-auto'  // Hauteur fixe seulement pour 4+ timers
        }
      `}>
        {activeTimers.map((timer) => {
          const timerState = getTimerState(timer.id);
          
          // En mode réduit, afficher tous les timers mais en version minimale
          // Supprimé la limitation à 2 timers
          
          return (
            <CompactTimerCard
              key={timer.id}
              timer={timer}
              state={timerState?.state || 'idle'}
              timeRemaining={timerState?.timeRemaining || timer.config.workDuration}
              progress={timerState?.progress || 0}
              onAction={(action) => onTimerAction(action, timer)}
              isDark={isDark}
              isExpanded={!isCollapsed}
            />
          );
        })}
      </div>
    </div>
  );

  // Utiliser un portail pour s'assurer que le widget est rendu au niveau racine
  // Créer ou utiliser un conteneur spécifique pour les widgets
  let widgetContainer = document.getElementById('widget-container');
  if (!widgetContainer) {
    widgetContainer = document.createElement('div');
    widgetContainer.id = 'widget-container';
    widgetContainer.style.position = 'fixed';
    widgetContainer.style.top = '0';
    widgetContainer.style.left = '0';
    widgetContainer.style.width = '100vw';
    widgetContainer.style.height = '100vh';
    widgetContainer.style.pointerEvents = 'none';
    widgetContainer.style.zIndex = '9998';
    document.body.appendChild(widgetContainer);
  }
  
  return createPortal(
    <div style={{ pointerEvents: 'auto' }}>
      {widgetContent}
    </div>, 
    widgetContainer
  );
};