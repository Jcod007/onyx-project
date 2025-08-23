import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CalendarView } from '@/components/Calendar/CalendarView';
import { CalendarHeader } from '@/components/Calendar/CalendarHeader';
import { MobileCalendarHeader } from '@/components/Calendar/MobileCalendarHeader';
import { CalendarDay, DayStudySession } from '@/types/Subject';
import { calendarRenderer } from '@/services/calendarRenderer';
import { timerSubjectLinkService } from '@/services/timerSubjectLinkService';
import { subjectService } from '@/services/subjectService';
import { syncEventBus } from '@/services/syncEventBus';
import { useTimerContext } from '@/contexts/TimerContext';
import { ActiveTimer } from '@/types/ActiveTimer';
import { Clock, BookOpen, CheckCircle2, TrendingUp, Calendar, RefreshCw, Target, Play, Timer, Pause, RotateCcw, Coffee } from 'lucide-react';
import { StudyTimeActions } from '@/components/StudyTimeActions';
import { formatMinutesToHours } from '@/utils/timeFormat';
import { calendarLogger } from '@/utils/logger';
import { storageService, STORAGE_KEYS } from '@/services/storageService';

// Fonction pour charger l'état initial depuis localStorage
const loadInitialState = () => {
  const defaultState = {
    viewMode: 'week' as const,
    currentDate: new Date(),
    savedDayViewDate: new Date(),
    savedWeekViewDate: new Date()
  };
  
  const savedState = storageService.load(STORAGE_KEYS.CALENDAR_VIEW_STATE, null);
  
  if (savedState) {
    try {
      const state = {
        viewMode: (savedState as any).viewMode || 'week',
        currentDate: (savedState as any).currentDate ? new Date((savedState as any).currentDate) : new Date(),
        savedDayViewDate: (savedState as any).savedDayViewDate ? new Date((savedState as any).savedDayViewDate) : new Date(),
        savedWeekViewDate: (savedState as any).savedWeekViewDate ? new Date((savedState as any).savedWeekViewDate) : new Date()
      };
      
      calendarLogger.calendar('État calendrier restauré:', { viewMode: state.viewMode, date: state.currentDate.toLocaleDateString() });
      
      return state;
    } catch (error) {
      calendarLogger.error('Erreur chargement état calendrier:', error);
      return defaultState;
    }
  }
  
  return defaultState;
};

export const CalendarPage: React.FC = () => {
  const { t } = useTranslation();
  const initialState = loadInitialState();
  
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [currentDate, setCurrentDate] = useState(initialState.currentDate);
  const [viewMode, setViewMode] = useState<'week' | 'day'>(initialState.viewMode);
  // Sauvegarder les dates pour chaque vue
  const [savedDayViewDate, setSavedDayViewDate] = useState(initialState.savedDayViewDate);
  const [savedWeekViewDate, setSavedWeekViewDate] = useState(initialState.savedWeekViewDate);
  const [persistentState, setPersistentState] = useState({
    selectedSessions: new Set<string>(),
    hoveredSession: null as string | null,
    expandedSessions: new Set<string>()
  });
  // État persistant pour la vue jour
  const [dayViewState, setDayViewState] = useState({
    scrollPosition: 0,
    expandedSessions: new Set<string>(),
    selectedSession: null as string | null
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [weeklyStats, setWeeklyStats] = useState({
    totalPlannedTime: 0,
    plannedSessions: 0,
    subjectsCount: 0,
    averageSessionDuration: 0
  });
  
  const { timers, startTimer, addTimer, pauseTimer, resetTimer, getTimerState, removeTimer } = useTimerContext();
  const navigate = useNavigate();

  // Charger les états persistants supplémentaires
  useEffect(() => {
    const savedState = storageService.load(STORAGE_KEYS.CALENDAR_VIEW_STATE, null);
    if (savedState) {
      try {
        const parsed = savedState;
        
        // Restaurer l'état persistant si disponible
        if ((parsed as any).persistentState) {
          setPersistentState({
            selectedSessions: new Set((parsed as any).persistentState.selectedSessions || []),
            hoveredSession: (parsed as any).persistentState.hoveredSession,
            expandedSessions: new Set((parsed as any).persistentState.expandedSessions || [])
          });
        }
        
        // Restaurer l'état de la vue jour si disponible
        if ((parsed as any).dayViewState) {
          setDayViewState({
            scrollPosition: (parsed as any).dayViewState.scrollPosition || 0,
            expandedSessions: new Set((parsed as any).dayViewState.expandedSessions || []),
            selectedSession: (parsed as any).dayViewState.selectedSession
          });
        }
      } catch (error) {
        calendarLogger.error('Erreur lors du chargement de l\'état persistant:', error);
      }
    }
    
  }, []);

  // Fonction de sauvegarde centralisée
  const saveState = useCallback(() => {
    try {
      const stateToSave = {
        savedDayViewDate: savedDayViewDate.toISOString(),
        savedWeekViewDate: savedWeekViewDate.toISOString(),
        viewMode,
        currentDate: currentDate.toISOString(),
        persistentState: {
          selectedSessions: Array.from(persistentState.selectedSessions),
          hoveredSession: persistentState.hoveredSession,
          expandedSessions: Array.from(persistentState.expandedSessions)
        },
        dayViewState: {
          scrollPosition: dayViewState.scrollPosition,
          expandedSessions: Array.from(dayViewState.expandedSessions),
          selectedSession: dayViewState.selectedSession
        },
        timestamp: new Date().toISOString()
      };
      storageService.save(STORAGE_KEYS.CALENDAR_VIEW_STATE, stateToSave);
      calendarLogger.debug('État calendrier sauvegardé');
    } catch (error) {
      calendarLogger.error('Erreur lors de la sauvegarde:', error);
    }
  }, [savedDayViewDate, savedWeekViewDate, viewMode, currentDate, persistentState, dayViewState]);

  // Sauvegarde immédiate pour les événements critiques
  const saveStateImmediate = useCallback(() => {
    calendarLogger.debug('Sauvegarde immédiate déclenchée');
    saveState();
  }, [saveState]);

  // Sauvegarder l'état à chaque changement (avec debounce)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      saveState();
    }, 500); // Débounce de 500ms
    
    return () => clearTimeout(timeoutId);
  }, [saveState]);

  useEffect(() => {
    loadCalendarData();
  }, [currentDate, viewMode]);

  // S'abonner aux changements du subjectService pour la réactivité
  useEffect(() => {
    const unsubscribe = subjectService.subscribe(() => {
      console.log('🔄 SubjectService changé - rechargement calendrier');
      loadCalendarData(true);
    });

    return unsubscribe;
  }, []);
  
  // Sauvegarder l'état quand on quitte la page avec guards de nettoyage
  useEffect(() => {
    let isComponentMounted = true;
    
    const handleBeforeUnload = () => {
      if (isComponentMounted) {
        saveStateImmediate(); // Sauvegarde immédiate pour événements critiques
      }
    };

    const handleVisibilityChange = () => {
      if (isComponentMounted && document.visibilityState === 'hidden') {
        saveStateImmediate(); // Sauvegarde immédiate pour événements critiques
      }
    };

    const handlePageHide = () => {
      if (isComponentMounted) {
        saveStateImmediate(); // Sauvegarde immédiate pour événements critiques
      }
    };

    // Écouteurs pour sauvegarder avant de quitter
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      // Marquer le composant comme non monté
      isComponentMounted = false;
      
      // Sauvegarde finale quand le composant est démonté
      try {
        saveStateImmediate();
      } catch (error) {
        calendarLogger.error('Erreur lors de la sauvegarde finale:', error);
      }
      
      // Nettoyer les écouteurs de manière sécurisée
      try {
        window.removeEventListener('beforeunload', handleBeforeUnload);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('pagehide', handlePageHide);
      } catch (error) {
        calendarLogger.error('Erreur lors du nettoyage des listeners:', error);
      }
    };
  }, [saveStateImmediate]);

  // ✅ S'abonner au bus synchrone pour synchronisation inter-pages
  useEffect(() => {
    const unsubscribeSyncBus = syncEventBus.on('linkage:changed', () => {
      calendarLogger.info('🔄 Synchronisation immédiate calendrier depuis autre page');
      saveStateImmediate();
      // ✅ Exécution asynchrone sans bloquer le bus synchrone
      Promise.resolve().then(() => {
        loadCalendarData(true);
      });
    });
    
    return unsubscribeSyncBus;
  }, [saveStateImmediate]);

  // S'abonner aux changements de liaisons avec guard de nettoyage
  useEffect(() => {
    let isSubscribed = true;
    
    const unsubscribe = timerSubjectLinkService.subscribe(() => {
      if (isSubscribed) {
        calendarLogger.loading('Changement de liaison détecté, rechargement calendrier');
        // Sauvegarde immédiate avant rechargement
        saveStateImmediate();
        // ✅ Rechargement immédiat (pas de délai)
        loadCalendarData(true);
      }
    });
    
    return () => {
      isSubscribed = false;
      try {
        unsubscribe();
      } catch (error) {
        calendarLogger.error('Erreur lors du désabonnement des liaisons:', error);
      }
    };
  }, [saveStateImmediate]);

  // Forcer rafraîchissement quand l'état des timers change
  useEffect(() => {
    // Surveiller les changements d'état des timers pour mettre à jour l'affichage des boutons
    // Le re-render sera déclenché automatiquement par le changement de timers et getTimerState
  }, [timers, getTimerState]);

  const loadCalendarData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      // Vérifier la cohérence des données
      // Cohérence des données assurée par TimerContext
      
      // Calculer la période à charger selon le mode de vue
      const { startDate, endDate } = getCalendarPeriod(currentDate, viewMode);
      
      // Générer les jours du calendrier
      const days = await calendarRenderer.generateCalendarDays(startDate, endDate);
      setCalendarDays(days);
      
      // Calculer les statistiques hebdomadaires
      const weekStart = getWeekStart(currentDate);
      const stats = await calendarRenderer.getWeeklyStats(weekStart);
      setWeeklyStats(stats);
      
      
      console.log('📅 Calendrier généré:', {
        période: `${startDate.toLocaleDateString()} → ${endDate.toLocaleDateString()}`,
        jours: days.length,
        sessionsTotal: days.reduce((sum, day) => sum + day.sessions.length, 0),
        tempsTotal: `${stats.totalPlannedTime}min`
      });
      
    } catch (error) {
      calendarLogger.error('Erreur chargement calendrier:', error);
      // Afficher un état d'erreur à l'utilisateur
      setCalendarDays([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  const handleRefresh = () => {
    loadCalendarData(true);
  };


  /**
   * 🎨 OBTENIR LES INFOS DU BOUTON DE SESSION
   * Retourne l'icône, le texte et la couleur du bouton selon l'état du timer
   */
  const getSessionButtonInfo = (session: DayStudySession) => {
    const isLinkedTimer = session.timerType === 'linked';
    
    const ephemeralTimer = timers.find(t => 
      t.isEphemeral && 
      t.linkedSubject?.id === session.subject.id
    );
    
    let timerInfo = null;
    let buttonIcon = <Play size={14} />;
    let buttonText = t('common.start');
    let buttonColor = 'bg-blue-600 hover:bg-blue-700 border-blue-700';
    let isTimerRunning = false;
    let action: 'start' | 'pause' | 'reset' | null = null;
    
    // PRIORITÉ 1: Vérifier d'abord s'il y a un timer éphémère actif
    if (ephemeralTimer) {
      const timerState = getTimerState(ephemeralTimer.id);
      timerInfo = ephemeralTimer;
      
      if (timerState) {
        // Timer éphémère avec état disponible
        isTimerRunning = timerState.state === 'running' || timerState.state === 'paused';
        
        // Déterminer l'icône selon le type de timer éphémère
        const isPomodoro = session.timerType === 'quick' && 
                          session.timerConfig && 
                          typeof session.timerConfig === 'object' && 
                          'type' in session.timerConfig && 
                          session.timerConfig.type === 'pomodoro';
        const defaultIcon = isPomodoro ? <Coffee size={14} /> : <Clock size={14} />;
        
        if (timerState.state === 'running') {
          buttonIcon = <Pause size={14} />;
          buttonText = t('calendar.pauseTimer');
          buttonColor = 'bg-red-600 hover:bg-red-700 border-red-700';
          action = 'pause';
        } else if (timerState.state === 'paused') {
          buttonIcon = defaultIcon;
          buttonText = t('calendar.resumeTimer');
          buttonColor = 'bg-blue-600 hover:bg-blue-700 border-blue-700';
          action = 'start';
        } else if (timerState.state === 'idle') {
          // Timer en état idle après reset - permettre de redémarrer
          buttonIcon = defaultIcon;
          buttonText = t('calendar.startTimer');
          buttonColor = 'bg-blue-600 hover:bg-blue-700 border-blue-700';
          action = 'start';
        } else {
          // État inconnu, permettre de redémarrer
          buttonIcon = defaultIcon;
          buttonText = t('calendar.resumeTimer');
          buttonColor = 'bg-blue-600 hover:bg-blue-700 border-blue-700';
          action = 'start';
        }
      } else {
        // Timer éphémère existe mais pas d'état (pas encore démarré ou arrêté)
        const isPomodoro = session.timerType === 'quick' && 
                          session.timerConfig && 
                          typeof session.timerConfig === 'object' && 
                          'type' in session.timerConfig && 
                          session.timerConfig.type === 'pomodoro';
        buttonIcon = isPomodoro ? <Coffee size={14} /> : <Clock size={14} />;
        buttonText = t('calendar.resumeTimer');
        buttonColor = 'bg-blue-600 hover:bg-blue-700 border-blue-700';
        action = 'start';
      }
    }
    // PRIORITÉ 2: Timer lié persistant (seulement si pas de timer éphémère ACTIF)
    else if (isLinkedTimer && session.timerConfig && typeof session.timerConfig === 'object' && 'timerId' in session.timerConfig) {
      // Timer lié - vérifier l'état d'exécution du timer persistant
      const linkedTimerId = session.timerConfig.timerId;
      const linkedTimerState = getTimerState(linkedTimerId);
      const linkedTimer = timers.find(t => t.id === linkedTimerId);
      
      if (linkedTimer) {
        timerInfo = linkedTimer;
      }
      
      if (linkedTimerState) {
        // Timer lié avec état disponible - adapter le bouton selon l'état
        isTimerRunning = linkedTimerState.state === 'running' || linkedTimerState.state === 'paused';
        
        if (linkedTimerState.state === 'running') {
          buttonIcon = <Pause size={14} />;
          buttonText = t('calendar.pauseTimer');
          buttonColor = 'bg-orange-600 hover:bg-orange-700 border-orange-700';
          action = 'pause';
        } else if (linkedTimerState.state === 'paused') {
          buttonIcon = <Play size={14} />;
          buttonText = t('calendar.resumeTimer');
          buttonColor = 'bg-green-600 hover:bg-green-700 border-green-700';
          action = 'start';
        } else {
          // Timer lié en état idle ou finished
          buttonIcon = <Timer size={14} />;
          buttonText = t('calendar.startTimer');
          buttonColor = 'bg-green-600 hover:bg-green-700 border-green-700';
          action = 'start';
        }
      } else {
        // Timer lié sans état d'exécution
        buttonIcon = <Timer size={14} />;
        buttonText = t('calendar.startTimer');
        buttonColor = 'bg-green-600 hover:bg-green-700 border-green-700';
        action = 'start';
      }
    } 
    // PRIORITÉ 3: Démarrer - pas de timer en cours
    else {
      buttonIcon = <Clock size={14} />;
      buttonText = t('calendar.startTimer');
      buttonColor = 'bg-purple-600 hover:bg-purple-700 border-purple-700';
      action = 'start';
    }
    
    // Déterminer si on doit afficher le bouton Reset secondaire
    let showResetButton = false;
    if (ephemeralTimer) {
      const currentTimerState = getTimerState(ephemeralTimer.id);
      showResetButton = !!(currentTimerState && (currentTimerState.state === 'running' || currentTimerState.state === 'paused'));
    } else if (isLinkedTimer && session.timerConfig && typeof session.timerConfig === 'object' && 'timerId' in session.timerConfig) {
      // Bouton reset pour timer lié aussi
      const linkedTimerState = getTimerState(session.timerConfig.timerId);
      showResetButton = !!(linkedTimerState && (linkedTimerState.state === 'running' || linkedTimerState.state === 'paused'));
    }
    
    return { buttonIcon, buttonText, buttonColor, isTimerRunning, timerInfo, action, showResetButton };
  };

  /**
   * ▶️ LANCEMENT DE SESSION D'ÉTUDE
   * Lance une session avec la configuration appropriée (timer lié ou rapide)
   */
  const handleLaunchSession = async (session: DayStudySession) => {
    try {
      console.log(`▶️ Lancement session ${session.subject.name}`);
      
      // Vérifier s'il existe un timer éphémère pour ce cours
      const existingEphemeralTimer = timers.find(t => 
        t.isEphemeral && 
        t.linkedSubject?.id === session.subject.id
      );
      
      // Si un timer éphémère existe déjà, le supprimer d'abord
      if (existingEphemeralTimer) {
        console.log(`🗑️ Suppression de l'ancien timer éphémère: ${existingEphemeralTimer.title}`);
        await removeTimer(existingEphemeralTimer.id);
      }
      
      const launchResult = await calendarRenderer.launchStudySession(session);
      
      if (launchResult.mode === 'linked' && launchResult.timer) {
        // Timer lié - vérifier qu'il n'y a pas de conflit avec un timer éphémère
        console.log(`🔗 Lancement timer lié: ${launchResult.timer.title}`);
        
        // S'assurer qu'aucun timer éphémère n'interfère
        const conflictingEphemeral = timers.find(t => 
          t.isEphemeral && t.linkedSubject?.id === session.subject.id
        );
        if (conflictingEphemeral) {
          console.log(`🗑️ Suppression timer éphémère en conflit: ${conflictingEphemeral.title}`);
          await removeTimer(conflictingEphemeral.id);
        }
        
        startTimer(launchResult.timer.id, launchResult.timer);
        console.log('🚀 Session timer lié lancée avec succès');
        
        // Rediriger vers la page des timers pour les timers liés
        navigate('/timers');
        
      } else {
        // Timer rapide/simple - créer un timer éphémère UNIQUEMENT dans le calendrier
        console.log(`⚡ Lancement timer rapide éphémère pour ${session.subject.name}`);
        
        const quickTimer: ActiveTimer = {
          id: `quick_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          title: `${session.subject.name}`,
          config: launchResult.timerConfig,
          isPomodoroMode: launchResult.timerConfig.shortBreakDuration > 0,
          createdAt: new Date(),
          lastUsed: new Date(),
          linkedSubject: session.subject,
          isEphemeral: true // Marquer comme éphémère
        };

        // Ajouter et lancer le timer temporaire - VISIBLE UNIQUEMENT dans le widget
        const addedTimer = await addTimer(quickTimer);
        startTimer(addedTimer.id, addedTimer);
        
        console.log('🚀 Session timer rapide lancée dans le widget');
        
        // PAS de redirection pour les timers rapides - reste sur la page calendrier
      }
      
    } catch (error) {
      console.error('❌ Erreur lancement session:', error);
      // TODO: Remplacer alert par une notification toast plus élégante
      alert(`❌ Erreur lors du lancement de la session: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  };

  /**
   * ⏸️ GESTION DES ACTIONS TIMER ÉPHÉMÈRE
   * Gère les actions pause, reset et start pour les timers éphémères
   */
  const handleEphemeralTimerAction = async (_session: DayStudySession, action: 'start' | 'pause' | 'reset', ephemeralTimer?: ActiveTimer) => {
    try {
      if (!ephemeralTimer) {
        console.error('❌ Timer éphémère introuvable');
        return;
      }

      switch (action) {
        case 'pause':
          pauseTimer(ephemeralTimer.id);
          break;
          
        case 'reset':
          console.log(`🔄 Reset timer éphémère: ${ephemeralTimer.id}`);
          resetTimer(ephemeralTimer.id);
          break;
          
        case 'start':
          // Vérifier l'état du timer éphémère avant de le démarrer
          const ephemeralTimerState = getTimerState(ephemeralTimer.id);
          if (ephemeralTimerState && ephemeralTimerState.state === 'finished') {
            // Timer terminé - d'abord le reset puis le démarrer
            console.log('🔄 Timer éphémère terminé détecté, reset puis démarrage depuis calendrier');
            resetTimer(ephemeralTimer.id);
            // Attendre un peu pour que le reset soit effectif
            setTimeout(() => {
              startTimer(ephemeralTimer.id, ephemeralTimer);
            }, 50);
          } else {
            // Timer en état normal - démarrage direct
            startTimer(ephemeralTimer.id, ephemeralTimer);
          }
          break;
          
        default:
          console.warn(`⚠️ Action inconnue: ${action}`);
      }
      
    } catch (error) {
      console.error('❌ Erreur action timer éphémère:', error);
    }
  };

  /**
   * 🔗 GESTION DES LIAISONS COURS-TIMER
   */
  const handleLinkCourse = async (courseId: string, timerId: string) => {
    try {
      await timerSubjectLinkService.linkCourseToTimer(courseId, timerId);
      // Le rechargement se fait automatiquement via l'abonnement
    } catch (error) {
      console.error('❌ Erreur liaison cours-timer:', error);
      alert(`❌ Erreur lors de la liaison: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  };

  const handleUnlinkCourse = async (courseId: string) => {
    try {
      await timerSubjectLinkService.unlinkCourse(courseId);
      // Le rechargement se fait automatiquement via l'abonnement
    } catch (error) {
      console.error('❌ Erreur déliaison cours:', error);
      alert(`❌ Erreur lors de la déliaison: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  };

  /**
   * 📅 NAVIGATION VERS VUE JOUR
   * Basculer vers la vue jour et changer la date
   */
  const handleDateClick = (date: Date) => {
    // Sauvegarder la date actuelle de la vue semaine avant de changer
    setSavedWeekViewDate(currentDate);
    setCurrentDate(date);
    setSavedDayViewDate(date);
    setViewMode('day');
    // Sauvegarde immédiate
    setTimeout(saveState, 100);
  };

  /**
   * 🔄 GESTION DU CHANGEMENT DE VUE
   * Sauvegarde et restaure les dates selon la vue
   */
  const handleViewModeChange = (mode: 'week' | 'day') => {
    if (mode === 'day') {
      // Sauvegarder la date de la vue semaine et restaurer la date de la vue jour
      setSavedWeekViewDate(currentDate);
      setCurrentDate(savedDayViewDate);
    } else if (mode === 'week') {
      // Sauvegarder la date de la vue jour et restaurer la date de la vue semaine
      setSavedDayViewDate(currentDate);
      setCurrentDate(savedWeekViewDate);
    }
    setViewMode(mode);
    // Sauvegarde immédiate
    setTimeout(saveState, 100);
  };

  /**
   * 📅 GESTION DU CHANGEMENT DE DATE
   * Met à jour la date sauvegardée pour la vue actuelle
   */
  const handleDateChange = (date: Date) => {
    setCurrentDate(date);
    // Sauvegarder la nouvelle date pour la vue actuelle
    if (viewMode === 'day') {
      setSavedDayViewDate(date);
    } else {
      setSavedWeekViewDate(date);
    }
    // Sauvegarde immédiate
    setTimeout(saveState, 100);
  };

  /**
   * Fonctions utilitaires pour les calculs de période
   */
  const getCalendarPeriod = (date: Date, mode: 'week' | 'day') => {
    if (mode === 'day') {
      return {
        startDate: new Date(date),
        endDate: new Date(date)
      };
    } else {
      const startDate = getWeekStart(date);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      return { startDate, endDate };
    }
  };

  const getWeekStart = (date: Date) => {
    const start = new Date(date);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Lundi = début de semaine
    start.setDate(diff);
    start.setHours(0, 0, 0, 0);
    return start;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('calendar.generateCalendar')}</p>
        </div>
      </div>
    );
  }

  // Obtenir les données du jour actuel pour la vue jour avec garde de sécurité
  const todayData = calendarDays.find(day => 
    day && day.date && day.date.toDateString() === currentDate.toDateString()
  ) || {
    date: currentDate,
    isToday: currentDate.toDateString() === new Date().toDateString(),
    sessions: [],
    totalPlannedTime: 0
  };

  // Calculer les statistiques du jour
  const todayStats = {
    plannedTime: todayData.totalPlannedTime,
    studiedTime: todayData.sessions.reduce((sum, session) => sum + ((session.subject?.timeSpent || 0) / 60), 0),
    completedSessions: todayData.sessions.filter(session => session.subject?.status === 'COMPLETED').length,
    totalSessions: todayData.sessions.length,
    progressPercentage: todayData.totalPlannedTime > 0 
      ? Math.min(100, Math.round((todayData.sessions.reduce((sum, session) => sum + ((session.subject?.timeSpent || 0) / 60), 0) / (todayData.totalPlannedTime || 1)) * 100))
      : 0
  };


  return (
    <div className="space-y-6">
      {/* Header unifié pour les deux vues */}
      <div className="space-y-4">
        {/* Header desktop */}
        <CalendarHeader
          currentDate={currentDate}
          onDateChange={handleDateChange}
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
          onRefresh={handleRefresh}
          isLoading={loading || refreshing}
        />
        
        {/* Header mobile */}
        <MobileCalendarHeader
          currentDate={currentDate}
          onDateChange={handleDateChange}
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
          onRefresh={handleRefresh}
          isLoading={loading || refreshing}
        />
      </div>

      {viewMode === 'day' ? (
        // Vue jour complète avec toutes les fonctionnalités
        <div 
          onScroll={(e) => {
            const scrollPos = (e.target as HTMLDivElement).scrollTop;
            setDayViewState(prev => ({ ...prev, scrollPosition: scrollPos }));
          }}
        >

          {/* 📊 Résumé de la journée uniforme */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-blue-50 rounded-lg shadow-sm">
                  <Clock className="text-blue-600" size={16} />
                </div>
                <div className="text-sm font-medium text-gray-700">{t('calendar.plannedTime')}</div>
              </div>
              <div className="text-xl font-bold text-gray-900">
                {formatMinutesToHours(todayStats.plannedTime)}
              </div>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-green-50 rounded-lg shadow-sm">
                  <TrendingUp className="text-green-600" size={16} />
                </div>
                <div className="text-sm font-medium text-gray-700">{t('calendar.studiedTime')}</div>
              </div>
              <div className="text-xl font-bold text-gray-900">
                {formatMinutesToHours(Math.round(todayStats.studiedTime))}
              </div>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-purple-50 rounded-lg shadow-sm">
                  <CheckCircle2 className="text-purple-600" size={16} />
                </div>
                <div className="text-sm font-medium text-gray-700">{t('calendar.completedSessions')}</div>
              </div>
              <div className="text-xl font-bold text-gray-900">
                {todayStats.completedSessions} / {todayStats.totalSessions}
              </div>
            </div>
          </div>

          {/* 📈 Barre de progression du jour uniforme */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm mt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-50 rounded-lg shadow-sm">
                  <Target size={16} className="text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{t('calendar.dayProgress')}</h3>
                  <p className="text-sm text-gray-700">
                    {todayStats.completedSessions} / {todayStats.totalSessions} {t('calendar.completedSessions').toLowerCase()}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-gray-900">
                  {todayStats.progressPercentage}%
                </span>
                <div className="text-sm text-gray-700">
                  {todayStats.progressPercentage >= 100 ? t('calendar.objectiveReached') : t('calendar.ongoing')}
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="w-full bg-gray-200 rounded-full h-4 mb-3 overflow-hidden">
                <div 
                  className={`h-4 rounded-full transition-all duration-700 ease-out ${
                    todayStats.progressPercentage >= 100 
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 animate-pulse' 
                      : 'bg-gradient-to-r from-blue-500 via-purple-500 to-blue-600'
                  }`}
                  style={{ width: `${Math.min(todayStats.progressPercentage, 100)}%` }}
                >
                  <div className="h-full bg-gradient-to-t from-black/10 to-white/20 rounded-full"></div>
                </div>
              </div>
              
              {/* Indicateur de progression */}
              {todayStats.progressPercentage > 5 && (
                <div 
                  className="absolute top-0.5 text-white text-xs font-medium px-1.5 py-0.5 rounded-full bg-black/20 backdrop-blur-sm"
                  style={{ left: `${Math.min(todayStats.progressPercentage - 8, 85)}%` }}
                >
                  {todayStats.progressPercentage}%
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-gray-700">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>{formatMinutesToHours(Math.round(todayStats.studiedTime))} {t('calendar.studied')}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                <span>{formatMinutesToHours(Math.max(0, todayStats.plannedTime - Math.round(todayStats.studiedTime)))} {t('calendar.remaining')}</span>
              </div>
            </div>
          </div>

          {/* 📚 Liste des sessions du jour uniforme */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <div className="p-1.5 bg-blue-50 rounded-lg shadow-sm">
                <BookOpen size={16} className="text-blue-600" />
              </div>
              {t('calendar.todaySessions')}
            </h3>
            
            {todayData.sessions.length > 0 ? (
              <div className="space-y-4">
                {todayData.sessions.map((session) => {
                  const sessionProgress = (session.subject?.targetTime || 0) > 0 
                    ? Math.min(100, Math.round(((session.subject?.timeSpent || 0) / (session.subject?.targetTime || 1)) * 100))
                    : 0;
                  const studiedMinutes = Math.round((session.subject?.timeSpent || 0) / 60);
                  const remainingMinutes = Math.max(0, (session.plannedDuration || 0) - studiedMinutes);
                  
                  let statusColor = 'gray';
                  let statusText = t('calendar.pending');
                  if (session.subject?.status === 'IN_PROGRESS') {
                    statusColor = 'yellow';
                    statusText = t('calendar.inProgress');
                  } else if (session.subject?.status === 'COMPLETED') {
                    statusColor = 'green';
                    statusText = t('calendar.completed');
                  }
                  
                  // Obtenir les infos du bouton selon l'état du timer
                  const { buttonIcon, buttonText, buttonColor, isTimerRunning, action, showResetButton } = getSessionButtonInfo(session);
                  
                  // Récupérer le timer éphémère séparément pour les actions
                  const ephemeralTimer = timers.find(t => 
                    t.isEphemeral && 
                    t.linkedSubject?.id === session.subject.id
                  );
                  
                  return (
                    <div key={session.id} className="border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md hover:border-gray-300 transition-all duration-200">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="text-xl font-semibold text-gray-900">{session.subject?.name || t('subjects.title')}</h4>
                          <div className="flex items-center gap-4 mt-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              statusColor === 'green' ? 'bg-green-100 text-green-800' :
                              statusColor === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {statusText}
                            </span>
                            <span className="text-sm text-gray-600">{formatMinutesToHours(session.plannedDuration)} {t('calendar.planned')}</span>
                            <span className="text-sm text-gray-600">{formatMinutesToHours(studiedMinutes)} {t('calendar.studied')}</span>
                            <span className="text-sm text-gray-600">{formatMinutesToHours(remainingMinutes)} {t('calendar.remaining')}</span>
                            {ephemeralTimer && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                                ⚡ {t('calendar.ephemeralTimer')}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {/* Actions de gestion du temps d'étude */}
                          <StudyTimeActions
                            subject={session.subject}
                            onSuccess={() => {
                              // Recharger les données du calendrier après modification
                              loadCalendarData(true);
                            }}
                            className="mr-2"
                          />
                          
                          <button 
                            onClick={() => {
                              // GESTION DES ACTIONS selon le type de timer
                              if (ephemeralTimer) {
                                // Timer éphémère - gestion locale dans le calendrier
                                const timerState = getTimerState(ephemeralTimer.id);
                                
                                if (timerState?.state === 'idle' && action === 'start') {
                                  handleLaunchSession(session); // Recréer un nouveau timer
                                } else if (action === 'start' || action === 'pause' || action === 'reset') {
                                  handleEphemeralTimerAction(session, action, ephemeralTimer);
                                }
                              } else if (session.timerType === 'linked' && session.timerConfig && typeof session.timerConfig === 'object' && 'timerId' in session.timerConfig) {
                                // Timer lié - gestion des actions pause/resume ou redirection
                                const linkedTimerId = session.timerConfig.timerId;
                                const linkedTimer = timers.find(t => t.id === linkedTimerId);
                                
                                if (linkedTimer && (action === 'pause' || action === 'start')) {
                                  // Actions pause/resume sur timer lié
                                  if (action === 'pause') {
                                    pauseTimer(linkedTimerId);
                                  } else if (action === 'start') {
                                    // Vérifier l'état du timer avant de le démarrer
                                    const timerState = getTimerState(linkedTimerId);
                                    if (timerState && timerState.state === 'finished') {
                                      // Timer terminé - d'abord le reset puis le démarrer
                                      console.log('🔄 Timer terminé détecté, reset puis démarrage depuis calendrier');
                                      resetTimer(linkedTimerId);
                                      // Attendre un peu pour que le reset soit effectif
                                      setTimeout(() => {
                                        startTimer(linkedTimerId, linkedTimer);
                                      }, 50);
                                    } else {
                                      // Timer en état normal - démarrage direct
                                      startTimer(linkedTimerId, linkedTimer);
                                    }
                                  }
                                } else {
                                  // Démarrer nouveau timer lié ou rediriger vers page timers
                                  handleLaunchSession(session);
                                }
                              } else if (action === 'start') {
                                // Nouveau timer à créer (timer rapide)
                                handleLaunchSession(session);
                              } else if (isTimerRunning) {
                                // Fallback: rediriger vers la page des timers
                                navigate('/timers');
                              }
                            }}
                            className={`px-4 py-2 ${buttonColor} text-white text-sm font-medium rounded-lg border shadow-sm transition-all duration-200 flex items-center gap-2`}
                            title={
                              action === 'pause' ? t('common.pause') :
                              action === 'start' && isTimerRunning ? t('common.resume') :
                              isTimerRunning ? t('calendar.seeTimer') : t('calendar.startSession')
                            }
                          >
                            {buttonIcon}
                            {buttonText}
                          </button>
                          
                          {/* Bouton Reset secondaire - visible quand le timer est actif */}
                          {showResetButton && (
                            <button
                              onClick={() => {
                                if (ephemeralTimer) {
                                  handleEphemeralTimerAction(session, 'reset', ephemeralTimer);
                                } else if (session.timerType === 'linked' && session.timerConfig && typeof session.timerConfig === 'object' && 'timerId' in session.timerConfig) {
                                  // Reset pour timer lié
                                  const linkedTimerId = session.timerConfig.timerId;
                                  resetTimer(linkedTimerId);
                                }
                              }}
                              className="px-3 py-2 bg-gray-600 hover:bg-gray-700 border-gray-700 text-white text-sm font-medium rounded-lg border shadow-sm transition-all duration-200 flex items-center gap-1"
                              title={t('common.reset')}
                            >
                              <RotateCcw size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                      
                      {/* Barre de progression de la session */}
                      <div className="mt-4">
                        <div className="flex justify-between text-sm text-gray-600 mb-2">
                          <span>{t('calendar.sessionProgress')}</span>
                          <span>{sessionProgress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${
                              statusColor === 'green' ? 'bg-green-500' :
                              statusColor === 'yellow' ? 'bg-yellow-500' :
                              'bg-gray-400'
                            }`}
                            style={{ width: `${sessionProgress}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Calendar size={48} className="mx-auto mb-4 opacity-50" />
                <h4 className="text-lg font-medium mb-2">{t('calendar.noSession')}</h4>
                <p className="text-sm">{t('calendar.noSession')}</p>
              </div>
            )}
          </div>

          {/* 📌 Résumé uniforme */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm mt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-xl font-bold text-gray-900">{todayStats.totalSessions}</div>
                <div className="text-sm text-gray-700">{t('calendar.plannedSessions')}</div>
              </div>
              <div>
                <div className="text-xl font-bold text-gray-900">{formatMinutesToHours(todayStats.plannedTime)}</div>
                <div className="text-sm text-gray-700">{t('calendar.planned')}</div>
              </div>
              <div>
                <div className="text-xl font-bold text-gray-900">{formatMinutesToHours(Math.round(todayStats.studiedTime))}</div>
                <div className="text-sm text-gray-700">{t('calendar.studied')}</div>
              </div>
              <div>
                <div className="text-xl font-bold text-gray-900">{new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
                <div className="text-sm text-gray-700">{t('calendar.lastUpdate')}</div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Vue semaine existante
        <>
          {/* Statistiques hebdomadaires uniformes */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-1.5 bg-blue-50 rounded-lg shadow-sm">
                    <Clock size={16} className="text-blue-600" />
                  </div>
                  {refreshing && <RefreshCw size={14} className="animate-spin text-blue-600" />}
                </div>
                <div className="text-sm font-medium text-gray-700 mb-1">{t('calendar.weeklyStats.plannedTime')}</div>
                <div className="text-xl font-bold text-gray-900">
                  {formatMinutesToHours(weeklyStats.totalPlannedTime)}
                </div>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-1.5 bg-green-50 rounded-lg shadow-sm">
                    <Target size={16} className="text-green-600" />
                  </div>
                </div>
                <div className="text-sm font-medium text-gray-700 mb-1">{t('calendar.weeklyStats.sessions')}</div>
                <div className="text-xl font-bold text-gray-900">{weeklyStats.plannedSessions}</div>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-1.5 bg-purple-50 rounded-lg shadow-sm">
                    <BookOpen size={16} className="text-purple-600" />
                  </div>
                </div>
                <div className="text-sm font-medium text-gray-700 mb-1">{t('calendar.weeklyStats.subjects')}</div>
                <div className="text-xl font-bold text-gray-900">{weeklyStats.subjectsCount}</div>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-1.5 bg-orange-50 rounded-lg shadow-sm">
                    <TrendingUp size={16} className="text-orange-600" />
                  </div>
                </div>
                <div className="text-sm font-medium text-gray-700 mb-1">{t('calendar.weeklyStats.averageDuration')}</div>
                <div className="text-xl font-bold text-gray-900">
                  {formatMinutesToHours(weeklyStats.averageSessionDuration > 0 ? Math.round(weeklyStats.averageSessionDuration) : 0)}
                </div>
              </div>
            </div>

          {/* Vue principale du calendrier */}
          <CalendarView
            calendarDays={calendarDays}
            currentDate={currentDate}
            viewMode={viewMode}
            onLaunchSession={handleLaunchSession}
            onLinkCourse={handleLinkCourse}
            onUnlinkCourse={handleUnlinkCourse}
            onDateClick={handleDateClick}
            getSessionButtonInfo={getSessionButtonInfo}
            navigate={navigate}
            persistentState={persistentState}
            onPersistentStateChange={setPersistentState}
          />
        </>
      )}

    </div>
  );
};