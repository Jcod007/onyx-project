import React from 'react';
import { SessionCard } from './SessionCard';
import { Subject } from '@/types/Subject';
import { ActiveTimer } from '@/types/ActiveTimer';
import { BookOpen, Clock, Link } from 'lucide-react';

interface WeekViewProps {
  currentDate: Date;
  subjects: Subject[];
  timers: ActiveTimer[];
  onLinkTimer: (subjectId: string, timerId: string) => void;
  onUnlinkTimer: (subjectId: string) => void;
  getAvailableTimers: (subjectId?: string) => ActiveTimer[];
  getLinkedTimers: (subjectId: string) => ActiveTimer[];
}

export const WeekView: React.FC<WeekViewProps> = ({
  currentDate,
  subjects,
  timers,
  onLinkTimer,
  onUnlinkTimer,
  getAvailableTimers,
  getLinkedTimers
}) => {
  // Générer les jours de la semaine (Lundi à Dimanche)
  const getWeekDays = (date: Date) => {
    const days = [];
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay() + 1); // Lundi

    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const weekDays = getWeekDays(currentDate);
  const dayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  // Simuler des sessions programmées (à remplacer par vraies données)
  const getSessionsForDay = (date: Date) => {
    const dayOfWeek = date.getDay();
    const sessions = [];

    // Exemple de données de test
    if (dayOfWeek === 1) { // Lundi
      const mathSubject = subjects.find(s => s.name.toLowerCase().includes('math'));
      if (mathSubject) {
        sessions.push({
          id: `session-${date.toISOString()}-1`,
          subject: mathSubject,
          startTime: '09:00',
          endTime: '10:30',
          type: 'study' as const
        });
      }
    }
    
    if (dayOfWeek === 3) { // Mercredi
      const historySubject = subjects.find(s => s.name.toLowerCase().includes('histoire'));
      if (historySubject) {
        sessions.push({
          id: `session-${date.toISOString()}-2`,
          subject: historySubject,
          startTime: '14:00',
          endTime: '15:30',
          type: 'study' as const
        });
      }
    }

    return sessions;
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* En-tête des jours */}
      <div className="grid grid-cols-7 border-b border-gray-200">
        {weekDays.map((day, index) => {
          const isToday = day.getTime() === today.getTime();
          return (
            <div
              key={day.toISOString()}
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
                {day.getDate()}
              </div>
            </div>
          );
        })}
      </div>

      {/* Grille des sessions */}
      <div className="grid grid-cols-7 min-h-[400px]">
        {weekDays.map((day) => {
          const sessions = getSessionsForDay(day);
          const isToday = day.getTime() === today.getTime();
          
          return (
            <div
              key={day.toISOString()}
              className={`p-3 border-r border-gray-200 last:border-r-0 ${
                isToday ? 'bg-blue-50/30' : ''
              }`}
            >
              <div className="space-y-2">
                {sessions.map((session) => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    timers={timers}
                    onLinkTimer={onLinkTimer}
                    onUnlinkTimer={onUnlinkTimer}
                    getAvailableTimers={getAvailableTimers}
                    getLinkedTimers={getLinkedTimers}
                  />
                ))}
                
                {/* Indicateur jour vide */}
                {sessions.length === 0 && (
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

      {/* Panel de liaison timer-cours */}
      <div className="border-t border-gray-200 p-4 bg-gray-50">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Link size={20} className="text-blue-600" />
          Liaisons Timer-Cours
        </h3>
        
        <div className="grid md:grid-cols-2 gap-4">
          {/* Matières */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
              <BookOpen size={16} />
              Matières ({subjects.length})
            </h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {subjects.map((subject) => {
                const linkedTimers = getLinkedTimers(subject.id);
                return (
                  <div key={subject.id} className="text-sm p-2 bg-white rounded border">
                    <div className="font-medium">{subject.name}</div>
                    {linkedTimers.length > 0 ? (
                      <div className="text-green-600 text-xs mt-1">
                        ↔ {linkedTimers[0].title}
                      </div>
                    ) : (
                      <div className="text-gray-400 text-xs mt-1">
                        Aucun timer lié
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Timers */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
              <Clock size={16} />
              Timers ({timers.length})
            </h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {timers.map(timer => (
                <div key={timer.id} className="text-sm p-2 bg-white rounded border">
                  <div className="font-medium">{timer.title}</div>
                  {timer.linkedSubject ? (
                    <div className="text-blue-600 text-xs mt-1">
                      → {timer.linkedSubject.name}
                    </div>
                  ) : (
                    <div className="text-gray-400 text-xs mt-1">
                      Non lié
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};