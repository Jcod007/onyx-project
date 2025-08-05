import React from 'react';
import { CalendarDay, DayStudySession } from '@/types/Subject';
import { BookOpen, Clock } from 'lucide-react';

interface WeekViewProps {
  calendarDays: CalendarDay[];
  currentDate: Date;
  onLaunchSession: (session: DayStudySession) => void;
  onLinkCourse?: (courseId: string, timerId: string) => void;
  onUnlinkCourse?: (courseId: string) => void;
}

export const WeekView: React.FC<WeekViewProps> = ({
  calendarDays,
  currentDate,
  onLaunchSession
}) => {
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

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* En-tête des jours */}
      <div className="grid grid-cols-7 border-b border-gray-200">
        {weekDays.map((dayInfo, index) => {
          const isToday = dayInfo.data.isToday;
          return (
            <div
              key={dayInfo.date.toISOString()}
              className={`p-4 text-center border-r border-gray-200 last:border-r-0 ${
                isToday ? 'bg-blue-50' : ''
              }`}
            >
              <div className="text-sm font-medium text-gray-600">
                {dayNames[index]}
              </div>
              <div className={`text-lg font-semibold mt-1 ${
                isToday ? 'text-blue-600' : 'text-gray-900'
              }`}>
                {dayInfo.date.getDate()}
              </div>
            </div>
          );
        })}
      </div>

      {/* Grille des sessions */}
      <div className="grid grid-cols-7 min-h-[400px]">
        {weekDays.map((dayInfo) => {
          const isToday = dayInfo.data.isToday;
          
          return (
            <div
              key={dayInfo.date.toISOString()}
              className={`p-3 border-r border-gray-200 last:border-r-0 ${
                isToday ? 'bg-blue-50/30' : ''
              }`}
            >
              <div className="space-y-2">
                {dayInfo.data.sessions.map((session) => (
                  <div key={session.id} className="bg-white border border-gray-200 rounded-lg p-3 text-sm">
                    <div className="font-medium text-gray-900 mb-1">{session.subject.name}</div>
                    <div className="text-xs text-gray-600 mb-2">{session.plannedDuration} min</div>
                    <button 
                      onClick={() => onLaunchSession(session)}
                      className="w-full px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                    >
                      Démarrer
                    </button>
                  </div>
                ))}
                
                {/* Temps total planifié */}
                {dayInfo.data.totalPlannedTime > 0 && (
                  <div className="text-xs text-gray-500 text-center mt-2">
                    Total: {dayInfo.data.totalPlannedTime} min
                  </div>
                )}
                
                {/* Indicateur jour vide */}
                {dayInfo.data.sessions.length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    <Clock size={24} className="mx-auto mb-2 opacity-50" />
                    <span className="text-sm">Aucune session</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Résumé de la semaine */}
      <div className="border-t border-gray-200 p-4 bg-gray-50">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <BookOpen size={20} className="text-blue-600" />
          Résumé de la semaine
        </h3>
        
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">
              {calendarDays.reduce((sum, day) => sum + day.sessions.length, 0)}
            </div>
            <div className="text-sm text-gray-600">Sessions planifiées</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">
              {calendarDays.reduce((sum, day) => sum + day.totalPlannedTime, 0)} min
            </div>
            <div className="text-sm text-gray-600">Temps planifié</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600">
              {new Set(calendarDays.flatMap(day => day.sessions.map(s => s.subjectId))).size}
            </div>
            <div className="text-sm text-gray-600">Matières différentes</div>
          </div>
        </div>
      </div>
    </div>
  );
};