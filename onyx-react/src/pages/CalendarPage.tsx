import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarView } from '@/components/Calendar/CalendarView';
import { CalendarHeader } from '@/components/Calendar/CalendarHeader';
import { MobileCalendarHeader } from '@/components/Calendar/MobileCalendarHeader';
import { CalendarDay, DayStudySession } from '@/types/Subject';
import { calendarRenderer } from '@/services/calendarRenderer';
import { courseTimerLinkManager } from '@/services/courseTimerLinkManager';
import { useReactiveTimers } from '@/hooks/useReactiveTimers';
import { useTimerContext } from '@/contexts/TimerContext';
import { ActiveTimer } from '@/types/ActiveTimer';
import { Clock, BookOpen, CheckCircle2, TrendingUp, Calendar, RefreshCw, Target } from 'lucide-react';
import { formatMinutesToHours } from '@/utils/timeFormat';
import { subjectService } from '@/services/subjectService';
import { centralizedTimerService } from '@/services/centralizedTimerService';
import localforage from 'localforage';

export const CalendarPage: React.FC = () => {
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'day'>('week');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [weeklyStats, setWeeklyStats] = useState({
    totalPlannedTime: 0,
    plannedSessions: 0,
    subjectsCount: 0,
    averageSessionDuration: 0
  });
  
  const { ensureDataConsistency } = useReactiveTimers();
  const { startTimer, addTimer } = useTimerContext();
  const navigate = useNavigate();

  useEffect(() => {
    loadCalendarData();
  }, [currentDate, viewMode]);

  // S'abonner aux changements de liaisons
  useEffect(() => {
    const unsubscribe = courseTimerLinkManager.subscribe(() => {
      console.log('🔄 Changement de liaison détecté, rechargement calendrier');
      // Forcer un rechargement complet avec un léger délai pour s'assurer que les données sont sauvegardées
      setTimeout(() => {
        loadCalendarData(true);
      }, 100);
    });
    return unsubscribe;
  }, []);

  const loadCalendarData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      // Vérifier la cohérence des données
      await ensureDataConsistency();
      
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
      console.error('❌ Erreur chargement calendrier:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  const handleRefresh = () => {
    loadCalendarData(true);
  };


  /**
   * ▶️ LANCEMENT DE SESSION D'ÉTUDE
   * Lance une session avec la configuration appropriée (timer lié ou rapide)
   */
  const handleLaunchSession = async (session: DayStudySession) => {
    try {
      console.log(`▶️ Lancement session ${session.subject.name}`);
      
      const launchResult = await calendarRenderer.launchStudySession(session);
      
      if (launchResult.mode === 'linked' && launchResult.timer) {
        // Timer lié - lancer le timer existant ET rediriger vers la page des timers
        console.log(`🔗 Lancement timer lié: ${launchResult.timer.title}`);
        startTimer(launchResult.timer.id, launchResult.timer);
        
        console.log('🚀 Session timer lié lancée avec succès');
        
        // Rediriger vers la page des timers pour les timers liés
        navigate('/timers');
        
      } else {
        // Timer rapide/simple - créer et lancer UNIQUEMENT dans le widget (pas de redirection)
        console.log(`⚡ Lancement timer rapide pour ${session.subject.name}`);
        
        const quickTimer: ActiveTimer = {
          id: `quick_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          title: `${session.subject.name} - Session`,
          config: launchResult.timerConfig,
          isPomodoroMode: launchResult.timerConfig.shortBreakDuration > 0,
          createdAt: new Date(),
          lastUsed: new Date(),
          linkedSubject: session.subject
        };

        // Ajouter et lancer le timer temporaire - VISIBLE UNIQUEMENT dans le widget
        const addedTimer = await addTimer(quickTimer);
        startTimer(addedTimer.id, addedTimer);
        
        console.log('🚀 Session timer rapide lancée dans le widget');
        
        // PAS de redirection pour les timers rapides - reste sur la page calendrier
      }
      
    } catch (error) {
      console.error('❌ Erreur lancement session:', error);
      alert('❌ Erreur lors du lancement de la session. Vérifiez votre configuration.');
    }
  };

  /**
   * 🔗 GESTION DES LIAISONS COURS-TIMER
   */
  const handleLinkCourse = async (courseId: string, timerId: string) => {
    try {
      await courseTimerLinkManager.linkCourseToTimer(courseId, timerId);
      // Le rechargement se fait automatiquement via l'abonnement
    } catch (error) {
      console.error('❌ Erreur liaison cours-timer:', error);
    }
  };

  const handleUnlinkCourse = async (courseId: string) => {
    try {
      await courseTimerLinkManager.unlinkCourse(courseId);
      // Le rechargement se fait automatiquement via l'abonnement
    } catch (error) {
      console.error('❌ Erreur déliaison cours:', error);
    }
  };

  /**
   * 📅 NAVIGATION VERS VUE JOUR
   * Basculer vers la vue jour et changer la date
   */
  const handleDateClick = (date: Date) => {
    setCurrentDate(date);
    setViewMode('day');
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
          <p className="text-gray-600">Génération du calendrier...</p>
        </div>
      </div>
    );
  }

  // Obtenir les données du jour actuel pour la vue jour
  const todayData = calendarDays.find(day => 
    day.date.toDateString() === currentDate.toDateString()
  ) || {
    date: currentDate,
    isToday: currentDate.toDateString() === new Date().toDateString(),
    sessions: [],
    totalPlannedTime: 0
  };

  // Calculer les statistiques du jour
  const todayStats = {
    plannedTime: todayData.totalPlannedTime,
    studiedTime: todayData.sessions.reduce((sum, session) => sum + (session.subject.timeSpent / 60), 0),
    completedSessions: todayData.sessions.filter(session => session.subject.status === 'COMPLETED').length,
    totalSessions: todayData.sessions.length,
    progressPercentage: todayData.totalPlannedTime > 0 
      ? Math.min(100, Math.round((todayData.sessions.reduce((sum, session) => sum + (session.subject.timeSpent / 60), 0) / todayData.totalPlannedTime) * 100))
      : 0
  };


  return (
    <div className="space-y-6">
      {/* Header unifié pour les deux vues */}
      <div className="space-y-4">
        {/* Header desktop */}
        <CalendarHeader
          currentDate={currentDate}
          onDateChange={setCurrentDate}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onRefresh={handleRefresh}
          isLoading={loading || refreshing}
        />
        
        {/* Header mobile */}
        <MobileCalendarHeader
          currentDate={currentDate}
          onDateChange={setCurrentDate}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onRefresh={handleRefresh}
          isLoading={loading || refreshing}
        />
      </div>

      {viewMode === 'day' ? (
        // Vue jour complète avec toutes les fonctionnalités
        <>

          {/* 📊 Résumé de la journée uniforme */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-blue-50 rounded-lg shadow-sm">
                  <Clock className="text-blue-600" size={16} />
                </div>
                <div className="text-sm font-medium text-gray-700">Temps planifié</div>
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
                <div className="text-sm font-medium text-gray-700">Temps étudié</div>
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
                <div className="text-sm font-medium text-gray-700">Sessions terminées</div>
              </div>
              <div className="text-xl font-bold text-gray-900">
                {todayStats.completedSessions} / {todayStats.totalSessions}
              </div>
            </div>
          </div>

          {/* 📈 Barre de progression du jour uniforme */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-50 rounded-lg shadow-sm">
                  <Target size={16} className="text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Progression du jour</h3>
                  <p className="text-sm text-gray-700">
                    {todayStats.completedSessions} / {todayStats.totalSessions} sessions terminées
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-gray-900">
                  {todayStats.progressPercentage}%
                </span>
                <div className="text-sm text-gray-700">
                  {todayStats.progressPercentage >= 100 ? 'Objectif atteint !' : 'En cours'}
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
                <span>{formatMinutesToHours(Math.round(todayStats.studiedTime))} étudiées</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                <span>{formatMinutesToHours(Math.max(0, todayStats.plannedTime - Math.round(todayStats.studiedTime)))} restantes</span>
              </div>
            </div>
          </div>

          {/* 📚 Liste des sessions du jour uniforme */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <div className="p-1.5 bg-blue-50 rounded-lg shadow-sm">
                <BookOpen size={16} className="text-blue-600" />
              </div>
              Sessions d'aujourd'hui
            </h3>
            
            {todayData.sessions.length > 0 ? (
              <div className="space-y-4">
                {todayData.sessions.map((session) => {
                  const sessionProgress = session.subject.targetTime > 0 
                    ? Math.min(100, Math.round((session.subject.timeSpent / session.subject.targetTime) * 100))
                    : 0;
                  const studiedMinutes = Math.round(session.subject.timeSpent / 60);
                  const remainingMinutes = Math.max(0, session.plannedDuration - studiedMinutes);
                  
                  let statusColor = 'gray';
                  let statusText = 'En attente';
                  if (session.subject.status === 'IN_PROGRESS') {
                    statusColor = 'yellow';
                    statusText = 'En cours';
                  } else if (session.subject.status === 'COMPLETED') {
                    statusColor = 'green';
                    statusText = 'Terminé';
                  }
                  
                  return (
                    <div key={session.id} className="border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md hover:border-gray-300 transition-all duration-200">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="text-xl font-semibold text-gray-900">{session.subject.name}</h4>
                          <div className="flex items-center gap-4 mt-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              statusColor === 'green' ? 'bg-green-100 text-green-800' :
                              statusColor === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {statusText}
                            </span>
                            <span className="text-sm text-gray-600">{formatMinutesToHours(session.plannedDuration)} planifiées</span>
                            <span className="text-sm text-gray-600">{formatMinutesToHours(studiedMinutes)} étudiées</span>
                            <span className="text-sm text-gray-600">{formatMinutesToHours(remainingMinutes)} restantes</span>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleLaunchSession(session)}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg border border-blue-700 shadow-sm transition-all duration-200 flex items-center gap-2"
                        >
                          <Clock size={14} />
                          Démarrer la session
                        </button>
                      </div>
                      
                      {/* Barre de progression de la session */}
                      <div className="mt-4">
                        <div className="flex justify-between text-sm text-gray-600 mb-2">
                          <span>Progression</span>
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
                <h4 className="text-lg font-medium mb-2">Aucune session prévue aujourd'hui</h4>
                <p className="text-sm">Planifiez vos sessions d'étude pour cette journée</p>
              </div>
            )}
          </div>

          {/* 📌 Résumé uniforme */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-xl font-bold text-gray-900">{todayStats.totalSessions}</div>
                <div className="text-sm text-gray-700">sessions planifiées</div>
              </div>
              <div>
                <div className="text-xl font-bold text-gray-900">{formatMinutesToHours(todayStats.plannedTime)}</div>
                <div className="text-sm text-gray-700">planifiées</div>
              </div>
              <div>
                <div className="text-xl font-bold text-gray-900">{formatMinutesToHours(Math.round(todayStats.studiedTime))}</div>
                <div className="text-sm text-gray-700">étudiées</div>
              </div>
              <div>
                <div className="text-xl font-bold text-gray-900">{new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
                <div className="text-sm text-gray-700">dernière mise à jour</div>
              </div>
            </div>
          </div>
        </>
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
                <div className="text-sm font-medium text-gray-700 mb-1">Temps planifié</div>
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
                <div className="text-sm font-medium text-gray-700 mb-1">Sessions</div>
                <div className="text-xl font-bold text-gray-900">{weeklyStats.plannedSessions}</div>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-1.5 bg-purple-50 rounded-lg shadow-sm">
                    <BookOpen size={16} className="text-purple-600" />
                  </div>
                </div>
                <div className="text-sm font-medium text-gray-700 mb-1">Matières</div>
                <div className="text-xl font-bold text-gray-900">{weeklyStats.subjectsCount}</div>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-1.5 bg-orange-50 rounded-lg shadow-sm">
                    <TrendingUp size={16} className="text-orange-600" />
                  </div>
                </div>
                <div className="text-sm font-medium text-gray-700 mb-1">Durée moy.</div>
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
          />
        </>
      )}

    </div>
  );
};