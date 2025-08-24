import React, { useState, useEffect } from 'react';
import { CalendarDay } from '@/types/Subject';
import { BookOpen, Clock, Target, TrendingUp } from 'lucide-react';
import { formatMinutesToHours, getWeekStartSafe } from '@/utils/timeFormat';
import { dailyTimeService } from '@/services/dailyTimeService';
import { useTranslation } from 'react-i18next';

interface WeekViewProps {
  calendarDays: CalendarDay[];
  currentDate: Date;
  onDateClick?: (date: Date) => void;
  getSubjectTimeForDate?: (subjectId: string, date: Date) => number;
}

export const WeekView: React.FC<WeekViewProps> = ({
  calendarDays,
  currentDate,
  onDateClick
}) => {
  const { t } = useTranslation();
  const [hoveredSession, setHoveredSession] = useState<string | null>(null);
  const [dailyTimes, setDailyTimes] = useState<Map<string, number>>(new Map());
  const [loadingTimes, setLoadingTimes] = useState(true);
  const dayNames = [
    t('calendar.days.mon', 'Lun'),
    t('calendar.days.tue', 'Mar'), 
    t('calendar.days.wed', 'Mer'),
    t('calendar.days.thu', 'Jeu'),
    t('calendar.days.fri', 'Ven'),
    t('calendar.days.sat', 'Sam'),
    t('calendar.days.sun', 'Dim')
  ];
  
  // Utiliser la fonction centralisée avec gestion DST
  const weekStart = getWeekStartSafe(currentDate);

  // 📊 Charger les temps quotidiens pour toutes les sessions
  useEffect(() => {
    const loadDailyTimes = async () => {
      const newDailyTimes = new Map<string, number>();
      
      for (const calendarDay of calendarDays) {
        for (const session of calendarDay.sessions) {
          const key = `${session.subject.id}-${calendarDay.date.toDateString()}`;
          try {
            const timeSpent = await dailyTimeService.getTimeSpentForDate(
              session.subject.id, 
              calendarDay.date
            );
            newDailyTimes.set(key, timeSpent);
          } catch (error) {
            console.error(`Erreur chargement temps quotidien pour ${key}:`, error);
            newDailyTimes.set(key, 0);
          }
        }
      }
      
      setDailyTimes(newDailyTimes);
      setLoadingTimes(false);
      console.log('📊 [WeekView] Temps quotidiens chargés:', Object.fromEntries(newDailyTimes));
    };

    loadDailyTimes();
    
    // S'abonner aux changements du service quotidien
    const unsubscribe = dailyTimeService.subscribe(() => {
      console.log('🔄 [WeekView] Rechargement des temps quotidiens...');
      setLoadingTimes(true);
      loadDailyTimes();
    });

    return unsubscribe;
  }, [calendarDays]);
  const weekDays: Array<{date: Date; data: CalendarDay}> = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + i);
    weekDays.push({
      date: day,
      data: calendarDays.find(cd => cd.date.toDateString() === day.toDateString()) || {
        date: day,
        isToday: day.toDateString() === new Date().toDateString(),
        sessions: [],
        totalPlannedTime: 0
      }
    });
  }

  // Calculer la hauteur adaptative basée sur le nombre maximum de sessions par jour
  const getGridHeight = () => {
    const maxSessionsPerDay = Math.max(...weekDays.map((day: {date: Date; data: CalendarDay}) => day.data.sessions.length), 1);
    
    if (maxSessionsPerDay <= 1) return 'min-h-[200px]';
    if (maxSessionsPerDay <= 2) return 'min-h-[300px]';
    if (maxSessionsPerDay <= 3) return 'min-h-[400px]';
    if (maxSessionsPerDay <= 4) return 'min-h-[500px]';
    if (maxSessionsPerDay <= 5) return 'min-h-[600px]';
    return 'min-h-[700px]';
  };

  // const today = createCleanDate(new Date()); // Unused for now

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
      {/* En-tête des jours uniforme */}
      <div className="grid grid-cols-7 border-b border-gray-200 bg-white">
        {weekDays.map((dayInfo, index) => {
          const isToday = dayInfo.data.isToday;
          const isWeekend = index >= 5;
          const totalSessions = dayInfo.data.sessions.length;
          const totalTime = dayInfo.data.totalPlannedTime;
          
          return (
            <div
              key={dayInfo.date.toISOString()}
              onClick={() => onDateClick?.(dayInfo.date)}
              className={`p-4 text-center border-r border-gray-200 last:border-r-0 transition-all duration-200 cursor-pointer ${
                isToday 
                  ? 'bg-blue-50 border-blue-200 hover:bg-blue-100' 
                  : isWeekend 
                  ? 'bg-gray-50 hover:bg-gray-100'
                  : 'hover:bg-gray-100'
              }`}
            >
              <div className={`text-xs font-medium mb-1 ${
                isToday ? 'text-blue-700' : 'text-gray-700'
              }`}>
                {dayNames[index]}
              </div>
              <div className={`text-xl font-bold mb-2 ${
                isToday ? 'text-blue-600' : 'text-gray-900'
              }`}>
                {dayInfo.date.getDate()}
              </div>
              
              {/* Indicateurs rapides uniformes */}
              <div className="flex items-center justify-center gap-1 text-xs">
                {totalSessions > 0 && (
                  <span className={`px-2 py-1 rounded-full border ${
                    isToday 
                      ? 'bg-blue-100 text-blue-700 border-blue-200' 
                      : 'bg-white text-gray-700 border-gray-200'
                  }`}>
                    {totalSessions} session{totalSessions > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              
              {totalTime > 0 && (
                <div className={`text-xs mt-1 font-medium ${
                  isToday ? 'text-blue-600' : 'text-gray-700'
                }`}>
                  {formatMinutesToHours(totalTime)}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Grille des sessions adaptative */}
      <div className={`grid grid-cols-7 ${getGridHeight()}`}>
        {weekDays.map((dayInfo, dayIndex) => {
          const isToday = dayInfo.data.isToday;
          const isWeekend = dayIndex >= 5;
          
          return (
            <div
              key={dayInfo.date.toISOString()}
              className={`p-2 border-r border-gray-200 last:border-r-0 transition-all duration-200 ${
                isToday 
                  ? 'bg-blue-50/50' 
                  : isWeekend 
                  ? 'bg-gray-50'
                  : 'hover:bg-gray-50'
              }`}
            >
              <div className="space-y-2 h-full">
                {dayInfo.data.sessions.map((session) => {
                  const isHovered = hoveredSession === `${dayInfo.date.toISOString()}-${session.id}`;
                  const sessionKey = `${dayInfo.date.toISOString()}-${session.id}`;
                  // 🎯 NOUVEAU: Utiliser le temps quotidien de la journée spécifique
                  const dailyKey = `${session.subject.id}-${dayInfo.date.toDateString()}`;
                  const dailyTimeSeconds = dailyTimes.get(dailyKey) || 0;
                  const dailyTimeMinutes = Math.round(dailyTimeSeconds / 60);
                  
                  // 🎯 CORRECTION: Vérifier si c'est un jour d'étude planifié
                  const dayOfWeek = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'][dayInfo.date.getDay()];
                  const isPlannedStudyDay = session.subject.studyDays?.includes(dayOfWeek as any) || false;
                  
                  // Calculer l'objectif quotidien basé sur l'objectif hebdomadaire
                  const weeklyGoalMinutes = (session.subject.weeklyTimeGoal && session.subject.weeklyTimeGoal > 0) 
                    ? session.subject.weeklyTimeGoal 
                    : 240; // 4h par défaut
                  const studyDaysCount = session.subject.studyDays?.length || 3;
                  const dailyGoalMinutes = isPlannedStudyDay ? Math.round(weeklyGoalMinutes / studyDaysCount) : 0;
                  
                  // Progression basée sur l'objectif quotidien
                  const progress = dailyGoalMinutes > 0 ? (dailyTimeMinutes / dailyGoalMinutes) * 100 : 
                                  dailyTimeMinutes > 0 ? 100 : 0; // Si pas de jour planifié mais temps ajouté = 100%
                  
                  if (!loadingTimes) {
                    console.log(`📅 [WeekView] Progression QUOTIDIENNE "${session.subject.name}" (${dayInfo.date.toDateString()}):`, {
                      dayOfWeek,
                      isPlannedStudyDay,
                      dailyTimeMinutes,
                      dailyGoalMinutes,
                      progressCalculation: `${dailyTimeMinutes}/${dailyGoalMinutes} = ${Math.round(progress)}%`,
                      studyDaysCount,
                      studyDays: session.subject.studyDays,
                      hasData: dailyTimes.has(dailyKey)
                    });
                  }
                  const isCompleted = progress >= 100;
                  
                  return (
                    <div 
                      key={session.id} 
                      className={`group relative bg-white border border-gray-200 rounded-lg p-2 text-sm transition-all duration-200 cursor-pointer shadow-sm ${
                        isHovered 
                          ? 'border-blue-300 shadow-md transform scale-105 z-10' 
                          : isCompleted
                          ? 'border-green-200 bg-green-50'
                          : 'hover:border-gray-300 hover:shadow-md'
                      }`}
                      onMouseEnter={() => setHoveredSession(sessionKey)}
                      onMouseLeave={() => setHoveredSession(null)}
                    >
                      {/* Barre de progression */}
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gray-100 rounded-t-lg overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-500 ${
                            isCompleted ? 'bg-green-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                      
                      <div className="mt-2">
                        <div className="font-medium text-gray-900 mb-1 truncate text-xs" title={session.subject.name}>
                          {session.subject.name}
                        </div>
                        
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs text-gray-600 flex items-center gap-1">
                            <Target size={10} />
                            {isPlannedStudyDay ? 
                              `${t('calendar.objective', 'Objectif')}: ${formatMinutesToHours(dailyGoalMinutes)}` : 
                              t('calendar.freeDay', 'Jour libre')
                            }
                          </span>
                          {loadingTimes ? (
                            <span className="text-xs px-1 py-0.5 rounded-full bg-gray-100 text-gray-500">
                              ⏳ {t('common.loading', 'Chargement...')}
                            </span>
                          ) : dailyTimeMinutes > 0 ? (
                            <span className={`text-xs px-1 py-0.5 rounded-full ${
                              isCompleted 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                              ✅ {formatMinutesToHours(dailyTimeMinutes)}
                            </span>
                          ) : (
                            <span className="text-xs px-1 py-0.5 rounded-full bg-gray-100 text-gray-400">
                              0min
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Tooltip au hover */}
                      {isHovered && (
                        <div className="absolute -top-2 -right-2 bg-gray-900 text-white text-xs px-2 py-1 rounded-full shadow-lg z-20">
                          {Math.round(progress)}%
                        </div>
                      )}
                    </div>
                  );
                })}
                
                {/* Indicateur jour vide amélioré */}
                {dayInfo.data.sessions.length === 0 && (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <div className="text-center py-8">
                      <Clock size={20} className="mx-auto mb-2 opacity-50" />
                      <span className="text-xs">Repos</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Résumé de la semaine uniforme */}
      <div className="border-t border-gray-200 p-4 bg-white">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <div className="p-1.5 bg-blue-50 rounded-lg shadow-sm">
            <BookOpen size={16} className="text-blue-600" />
          </div>
          {t('weekView.weekSummary', 'Résumé de la semaine')}
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between mb-2">
              <div className="p-1.5 bg-blue-50 rounded-lg shadow-sm">
                <Target size={16} className="text-blue-600" />
              </div>
            </div>
            <div className="text-sm font-medium text-gray-700 mb-1">{t('weekView.sessions', 'Sessions')}</div>
            <div className="text-xl font-bold text-gray-900">
              {calendarDays.reduce((sum, day) => sum + day.sessions.length, 0)}
            </div>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between mb-2">
              <div className="p-1.5 bg-green-50 rounded-lg shadow-sm">
                <Clock size={16} className="text-green-600" />
              </div>
            </div>
            <div className="text-sm font-medium text-gray-700 mb-1">{t('weekView.plannedTime', 'Temps planifié')}</div>
            <div className="text-xl font-bold text-gray-900">
              {formatMinutesToHours(calendarDays.reduce((sum, day) => sum + day.totalPlannedTime, 0))}
            </div>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between mb-2">
              <div className="p-1.5 bg-purple-50 rounded-lg shadow-sm">
                <BookOpen size={16} className="text-purple-600" />
              </div>
            </div>
            <div className="text-sm font-medium text-gray-700 mb-1">{t('weekView.subjects', 'Matières')}</div>
            <div className="text-xl font-bold text-gray-900">
              {new Set(calendarDays.flatMap(day => day.sessions.map(s => s.subjectId))).size}
            </div>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between mb-2">
              <div className="p-1.5 bg-orange-50 rounded-lg shadow-sm">
                <TrendingUp size={16} className="text-orange-600" />
              </div>
            </div>
            <div className="text-sm font-medium text-gray-700 mb-1">{t('weekView.avgDuration', 'Durée moy.')}</div>
            <div className="text-xl font-bold text-gray-900">
              {formatMinutesToHours(
                calendarDays.reduce((sum, day) => sum + day.sessions.length, 0) > 0 
                  ? Math.round(calendarDays.reduce((sum, day) => sum + day.totalPlannedTime, 0) / calendarDays.reduce((sum, day) => sum + day.sessions.length, 0))
                  : 0
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};