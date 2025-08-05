import React, { useState, useEffect } from 'react';
import { CalendarView } from '@/components/Calendar/CalendarView';
import { CalendarHeader } from '@/components/Calendar/CalendarHeader';
import { CalendarDay, DayStudySession } from '@/types/Subject';
import { calendarRenderer } from '@/services/calendarRenderer';
import { courseTimerLinkManager } from '@/services/courseTimerLinkManager';
import { useReactiveTimers } from '@/hooks/useReactiveTimers';
import { Clock, BookOpen, CheckCircle2, TrendingUp, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

export const CalendarPage: React.FC = () => {
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'day'>('week');
  const [loading, setLoading] = useState(true);
  const [weeklyStats, setWeeklyStats] = useState({
    totalPlannedTime: 0,
    plannedSessions: 0,
    subjectsCount: 0,
    averageSessionDuration: 0
  });
  
  const { ensureDataConsistency } = useReactiveTimers();

  useEffect(() => {
    loadCalendarData();
  }, [currentDate, viewMode]);

  // S'abonner aux changements de liaisons
  useEffect(() => {
    const unsubscribe = courseTimerLinkManager.subscribe(() => {
      console.log('🔄 Changement de liaison détecté, rechargement calendrier');
      loadCalendarData();
    });
    return unsubscribe;
  }, []);

  const loadCalendarData = async () => {
    try {
      setLoading(true);
      
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
    }
  };

  /**
   * ▶️ LANCEMENT DE SESSION D'ÉTUDE
   * Lance une session avec la configuration appropriée (timer lié ou rapide)
   */
  const handleLaunchSession = async (session: DayStudySession) => {
    try {
      console.log(`▶️ Lancement session ${session.subject.name}`);
      
      const launchResult = await calendarRenderer.launchStudySession(session);
      
      // TODO: Intégrer avec le composant Timer existant
      // Pour l'instant, on log les informations
      console.log('🎯 Configuration session:', {
        cours: session.subject.name,
        mode: launchResult.mode,
        config: launchResult.timerConfig,
        durée: session.plannedDuration + 'min'
      });

      // Simulation de démarrage (à remplacer par vraie intégration)
      alert(`🎯 Session démarrée !\n\nCours: ${session.subject.name}\nDurée: ${session.plannedDuration} min\nMode: ${launchResult.mode === 'linked' ? 'Timer lié' : 'Timer rapide'}`);
      
    } catch (error) {
      console.error('❌ Erreur lancement session:', error);
      alert('Erreur lors du lancement de la session');
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

  // Navigation entre les jours
  const navigateDay = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + (direction === 'next' ? 1 : -1));
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {viewMode === 'day' ? (
        // Vue jour complète avec toutes les fonctionnalités
        <>
          {/* 📆 Navigation et date */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 capitalize">
                  {formatDate(currentDate)}
                </h1>
                <p className="text-gray-600 mt-1">Planification de votre journée d'étude</p>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => navigateDay('prev')}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
                <button 
                  onClick={goToToday}
                  className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  Aujourd'hui
                </button>
                <button 
                  onClick={() => navigateDay('next')}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronRight size={20} />
                </button>
                <button 
                  onClick={() => setViewMode('week')}
                  className="ml-4 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Vue semaine
                </button>
              </div>
            </div>
          </div>

          {/* 📊 Résumé de la journée */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-2">
                <Clock className="text-blue-600" size={24} />
                <div className="text-sm font-medium text-blue-700">Temps planifié</div>
              </div>
              <div className="text-3xl font-bold text-blue-900">
                {todayStats.plannedTime} min
              </div>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="text-green-600" size={24} />
                <div className="text-sm font-medium text-green-700">Temps étudié</div>
              </div>
              <div className="text-3xl font-bold text-green-900">
                {Math.round(todayStats.studiedTime)} min
              </div>
            </div>
            
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle2 className="text-purple-600" size={24} />
                <div className="text-sm font-medium text-purple-700">Sessions terminées</div>
              </div>
              <div className="text-3xl font-bold text-purple-900">
                {todayStats.completedSessions} / {todayStats.totalSessions}
              </div>
            </div>
          </div>

          {/* 📈 Barre de progression du jour */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Progression du jour</h3>
              <span className="text-2xl font-bold text-blue-600">{todayStats.progressPercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 mb-3">
              <div 
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-4 rounded-full transition-all duration-500"
                style={{ width: `${todayStats.progressPercentage}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>{Math.round(todayStats.studiedTime)} min étudiées</span>
              <span>{Math.max(0, todayStats.plannedTime - Math.round(todayStats.studiedTime))} min restantes</span>
            </div>
          </div>

          {/* 📚 Liste des sessions du jour */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <BookOpen className="text-blue-600" size={20} />
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
                    <div key={session.id} className="border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-colors">
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
                            <span className="text-sm text-gray-600">{session.plannedDuration} min planifiées</span>
                            <span className="text-sm text-gray-600">{studiedMinutes} min étudiées</span>
                            <span className="text-sm text-gray-600">{remainingMinutes} min restantes</span>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleLaunchSession(session)}
                          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
                        >
                          <Clock size={16} />
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

          {/* 📌 Pied de page avec résumé */}
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div>
                <div className="text-2xl font-bold text-gray-900">{todayStats.totalSessions}</div>
                <div className="text-sm text-gray-600">sessions planifiées</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{todayStats.plannedTime} min</div>
                <div className="text-sm text-gray-600">planifiées</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{Math.round(todayStats.studiedTime)} min</div>
                <div className="text-sm text-gray-600">étudiées</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
                <div className="text-sm text-gray-600">dernière mise à jour</div>
              </div>
            </div>
          </div>
        </>
      ) : (
        // Vue semaine existante
        <>
          {/* Header du calendrier avec statistiques */}
          <div className="space-y-4">
            <CalendarHeader
              currentDate={currentDate}
              onDateChange={setCurrentDate}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
            />

            {/* Statistiques hebdomadaires */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="text-sm font-medium text-blue-700">Temps planifié</div>
                <div className="text-2xl font-bold text-blue-900">
                  {Math.floor(weeklyStats.totalPlannedTime / 60)}h{String(weeklyStats.totalPlannedTime % 60).padStart(2, '0')}
                </div>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="text-sm font-medium text-green-700">Sessions</div>
                <div className="text-2xl font-bold text-green-900">{weeklyStats.plannedSessions}</div>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="text-sm font-medium text-purple-700">Matières</div>
                <div className="text-2xl font-bold text-purple-900">{weeklyStats.subjectsCount}</div>
              </div>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="text-sm font-medium text-orange-700">Durée moy.</div>
                <div className="text-2xl font-bold text-orange-900">
                  {weeklyStats.averageSessionDuration > 0 ? Math.round(weeklyStats.averageSessionDuration) : 0}min
                </div>
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
          />
        </>
      )}

    </div>
  );
};