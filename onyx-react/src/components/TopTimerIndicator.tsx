import React from 'react';
import { createPortal } from 'react-dom';
import { Clock, Coffee, Timer as TimerIcon } from 'lucide-react';
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

interface TopTimerIndicatorProps {
  timers: ActiveTimer[];
  getTimerState: (timerId: string) => TimerExecutionState | null;
  className?: string;
}

export const TopTimerIndicator: React.FC<TopTimerIndicatorProps> = ({ 
  timers, 
  getTimerState, 
  className = '' 
}) => {
  const { isDark } = useTheme();

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

  // Ne pas afficher si aucun timer actif
  if (activeTimers.length === 0) {
    return null;
  }

  // Prendre le timer le plus urgent (premier dans la liste triée)
  const urgentTimer = activeTimers[0];
  const urgentState = getTimerState(urgentTimer.id);
  
  if (!urgentState) return null;

  const getTimerIcon = (timer: ActiveTimer) => {
    if (timer.isPomodoroMode) {
      return <Coffee size={12} className="text-red-500" />;
    }
    return <TimerIcon size={12} className="text-blue-500" />;
  };

  const getStateColor = (state: TimerState) => {
    switch (state) {
      case 'running':
        return 'text-green-600 dark:text-green-400';
      case 'paused':
        return 'text-orange-600 dark:text-orange-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const indicatorContent = (
    <div className={`
      fixed top-0 left-1/2 transform -translate-x-1/2 z-40
      transition-all duration-500 ease-in-out
      ${className}
    `}>
      <div className={`
        flex items-center gap-2 px-3 py-1 rounded-b-lg shadow-sm
        ${isDark 
          ? 'bg-gray-800/95 text-gray-200 border border-gray-700' 
          : 'bg-white/95 text-gray-800 border border-gray-200'
        }
        backdrop-blur-sm transition-all duration-300
        hover:shadow-md hover:scale-105
      `}>
        {/* Indicateur d'état */}
        <div className={`
          w-2 h-2 rounded-full
          ${urgentState.state === 'running' ? 'bg-green-500 animate-pulse' : 'bg-orange-500'}
        `} />
        
        {/* Icône du timer */}
        {getTimerIcon(urgentTimer)}
        
        {/* Temps restant */}
        <span className={`
          text-sm font-mono font-medium
          ${getStateColor(urgentState.state)}
        `}>
          {formatDuration(urgentState.timeRemaining, 'timer')}
        </span>
        
        {/* Nom du timer (tronqué) */}
        <span className={`
          text-xs truncate max-w-20
          ${isDark ? 'text-gray-400' : 'text-gray-500'}
        `}>
          {urgentTimer.title}
        </span>
        
        {/* Indicateur si plusieurs timers */}
        {activeTimers.length > 1 && (
          <div className={`
            flex items-center gap-1 px-1.5 py-0.5 rounded text-xs
            ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}
          `}>
            <Clock size={10} />
            <span>+{activeTimers.length - 1}</span>
          </div>
        )}
      </div>
    </div>
  );

  // Utiliser un portail pour s'assurer que l'indicateur est rendu au niveau racine
  return createPortal(indicatorContent, document.body);
};