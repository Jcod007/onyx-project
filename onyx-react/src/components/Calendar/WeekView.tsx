import React, { useState } from 'react';
import { CalendarDay, DayStudySession } from '@/types/Subject';
import { BookOpen, Clock, Play, Target, TrendingUp } from 'lucide-react';
import { formatMinutesToHours } from '@/utils/timeFormat';

interface WeekViewProps {
  calendarDays: CalendarDay[];
  currentDate: Date;
  onLaunchSession: (session: DayStudySession) => void;
  onLinkCourse?: (courseId: string, timerId: string) => void;
  onUnlinkCourse?: (courseId: string) => void;
  onDateClick?: (date: Date) => void;
}

export const WeekView: React.FC<WeekViewProps> = ({
  calendarDays,
  currentDate,
  onLaunchSession,
  onDateClick
}) => {
  const [hoveredSession, setHoveredSession] = useState<string | null>(null);
  const dayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  
  // Trier les jours du calendrier pour la semaine courante
  const getWeekStart = (date: Date) => {
    const start = new Date(date);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Lundi = début de semaine
    start.setDate(diff);
    start.setHours(0, 0, 0, 0);
    return start;
  };
  
  const weekStart = getWeekStart(currentDate);
  const weekDays = [];
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
    const maxSessionsPerDay = Math.max(...weekDays.map(day => day.data.sessions.length), 1);
    
    if (maxSessionsPerDay <= 1) return 'min-h-[200px]';
    if (maxSessionsPerDay <= 2) return 'min-h-[300px]';
    if (maxSessionsPerDay <= 3) return 'min-h-[400px]';
    if (maxSessionsPerDay <= 4) return 'min-h-[500px]';
    if (maxSessionsPerDay <= 5) return 'min-h-[600px]';
    return 'min-h-[700px]';
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

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
                  const studiedMinutes = Math.round((session.subject.timeSpent || 0) / 60);
                  const progress = session.plannedDuration > 0 ? (studiedMinutes / session.plannedDuration) * 100 : 0;
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
                            <Clock size={10} />
                            {formatMinutesToHours(session.plannedDuration)}
                          </span>
                          {studiedMinutes > 0 && (
                            <span className={`text-xs px-1 py-0.5 rounded-full ${
                              isCompleted 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                              {formatMinutesToHours(studiedMinutes)}
                            </span>
                          )}
                        </div>
                        
                        <button 
                          onClick={() => onLaunchSession(session)}
                          className={`w-full px-1.5 py-1 text-xs font-medium rounded transition-all duration-200 flex items-center justify-center gap-1 ${
                            isCompleted
                              ? 'bg-green-600 hover:bg-green-700 text-white'
                              : 'bg-blue-600 hover:bg-blue-700 text-white'
                          } group-hover:shadow-sm`}
                        >
                          <Play size={10} />
                          {isCompleted ? 'Refaire' : 'Démarrer'}
                        </button>
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
          Résumé de la semaine
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between mb-2">
              <div className="p-1.5 bg-blue-50 rounded-lg shadow-sm">
                <Target size={16} className="text-blue-600" />
              </div>
            </div>
            <div className="text-sm font-medium text-gray-700 mb-1">Sessions</div>
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
            <div className="text-sm font-medium text-gray-700 mb-1">Temps planifié</div>
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
            <div className="text-sm font-medium text-gray-700 mb-1">Matières</div>
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
            <div className="text-sm font-medium text-gray-700 mb-1">Durée moy.</div>
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