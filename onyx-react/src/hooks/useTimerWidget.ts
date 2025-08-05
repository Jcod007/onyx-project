import { useState, useCallback, useEffect, useMemo } from 'react';
import { useReactiveTimers } from './useReactiveTimers';
import { useTimerExecution } from './useTimerExecution';
import { subjectService } from '@/services/subjectService';
import { ActiveTimer } from '@/types/ActiveTimer';

export type WidgetPosition = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';

interface WidgetSettings {
  position: WidgetPosition;
  state: 'collapsed' | 'expanded';
  maxVisible: number;
  activeOnly: boolean;
  autoCollapse: boolean;
  soundEnabled: boolean;
}

const DEFAULT_SETTINGS: WidgetSettings = {
  position: 'bottom-right',
  state: 'collapsed',
  maxVisible: 5,
  activeOnly: true,
  autoCollapse: false,
  soundEnabled: true
};

export const useTimerWidget = () => {
  const { timers } = useReactiveTimers();
  const [settings, setSettings] = useState<WidgetSettings>(() => {
    const saved = localStorage.getItem('onyx_widget_settings');
    return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
  });

  const [isDragging, setIsDragging] = useState(false);
  const [, setDragOffset] = useState({ x: 0, y: 0 });
  const [, forceUpdate] = useState({});

  // Son de notification
  const playNotificationSound = useCallback(() => {
    try {
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
    } catch (error) {
      console.warn('Impossible de jouer le son de notification:', error);
    }
  }, []);

  const {
    startTimer,
    pauseTimer,
    resetTimer,
    getTimerState,
  } = useTimerExecution(
    useCallback(async (_timerId: string, timer: ActiveTimer, totalTime: number) => {
      // onTimerFinish - jouer un son et ajouter le temps d'étude
      if (settings.soundEnabled) {
        playNotificationSound();
      }
      if (timer.linkedSubject) {
        try {
          await subjectService.addStudyTime(timer.linkedSubject.id, totalTime);
        } catch (error) {
          console.error('Erreur lors de l\'ajout du temps d\'étude:', error);
        }
      }
    }, [settings.soundEnabled]),
    useCallback(async (_timerId: string, timer: ActiveTimer) => {
      // onSessionComplete - jouer un son et ajouter le temps d'étude
      if (settings.soundEnabled) {
        playNotificationSound();
      }
      if (timer.linkedSubject) {
        try {
          await subjectService.addStudyTime(
            timer.linkedSubject.id, 
            timer.config.workDuration
          );
        } catch (error) {
          console.error('Erreur lors de l\'ajout du temps d\'étude:', error);
        }
      }
    }, [settings.soundEnabled])
  );

  // Mémoriser le calcul des timers actifs pour éviter les re-calculs inutiles
  const { visibleTimers, shouldShowWidget } = useMemo(() => {
    // Filtrer UNIQUEMENT les timers actifs (running ou paused)
    // Exclure explicitement les timers finished ou idle
    const active = timers.filter(timer => {
      const state = getTimerState(timer.id);
      const isActive = state && (state.state === 'running' || state.state === 'paused');
      console.log(`🔍 Timer ${timer.title}:`, {
        id: timer.id,
        state: state?.state || 'no-state',
        isActive
      });
      return isActive;
    });

    const visible = active.slice(0, settings.maxVisible);
    const shouldShow = active.length > 0;

    console.log('📊 useTimerWidget State:', {
      totalTimers: timers.length,
      activeTimers: active.length,
      visibleTimers: visible.length,
      shouldShowWidget: shouldShow,
      maxVisible: settings.maxVisible
    });

    return {
      visibleTimers: visible,
      shouldShowWidget: shouldShow
    };
  }, [timers, getTimerState, settings.maxVisible]);

  // Compter les timers actifs de manière optimisée
  const { activeTimersCount, runningTimersCount } = useMemo(() => {
    let activeCount = 0;
    let runningCount = 0;
    
    for (const timer of timers) {
      const state = getTimerState(timer.id);
      if (state) {
        if (state.state === 'running' || state.state === 'paused') {
          activeCount++;
        }
        if (state.state === 'running') {
          runningCount++;
        }
      }
    }
    
    return { activeTimersCount: activeCount, runningTimersCount: runningCount };
  }, [timers, getTimerState]);

  // Sauvegarder les paramètres
  const updateSettings = useCallback((newSettings: Partial<WidgetSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    localStorage.setItem('onyx_widget_settings', JSON.stringify(updated));
  }, [settings]);

  // Synchronisation temps réel - force la mise à jour chaque seconde si des timers actifs
  useEffect(() => {
    if (activeTimersCount === 0) return;

    const interval = setInterval(() => {
      forceUpdate({});
    }, 1000);

    return () => clearInterval(interval);
  }, [activeTimersCount]);

  // Auto-expand quand un timer démarre, auto-collapse quand tous s'arrêtent
  useEffect(() => {
    if (runningTimersCount > 0 && settings.state === 'collapsed') {
      updateSettings({ state: 'expanded' });
    } else if (activeTimersCount === 0 && settings.state === 'expanded') {
      updateSettings({ state: 'collapsed' });
    }
  }, [runningTimersCount, activeTimersCount, settings.state, updateSettings]);

  // Actions du widget
  const toggleState = useCallback(() => {
    const newState = settings.state === 'collapsed' ? 'expanded' : 'collapsed';
    updateSettings({ state: newState });
  }, [settings.state, updateSettings]);

  const handleTimerAction = useCallback((action: 'start' | 'pause' | 'reset', timer: ActiveTimer) => {
    switch (action) {
      case 'start':
        startTimer(timer.id, timer);
        break;
      case 'pause':
        pauseTimer(timer.id);
        break;
      case 'reset':
        resetTimer(timer.id);
        break;
    }
  }, [startTimer, pauseTimer, resetTimer]);

  // Drag & Drop
  const handleDragStart = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  }, []);

  const handleDragEnd = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    
    setIsDragging(false);
    
    // Déterminer la nouvelle position basée sur les coordonnées
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    
    let newPosition: WidgetPosition;
    
    if (clientX < innerWidth / 2) {
      newPosition = clientY < innerHeight / 2 ? 'top-left' : 'bottom-left';
    } else {
      newPosition = clientY < innerHeight / 2 ? 'top-right' : 'bottom-right';
    }
    
    updateSettings({ position: newPosition });
  }, [isDragging, updateSettings]);

  return {
    // État
    settings,
    visibleTimers,
    activeTimersCount,
    runningTimersCount,
    isDragging,
    shouldShowWidget,

    // Actions
    updateSettings,
    toggleState,
    handleTimerAction,
    getTimerState,

    // Drag & Drop
    handleDragStart,
    handleDragEnd,

    // Utilitaires
    playNotificationSound
  };
};