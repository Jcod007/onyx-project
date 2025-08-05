import React from 'react';
import { SessionCard } from './SessionCard';
import { Subject } from '@/types/Subject';
import { ActiveTimer } from '@/types/ActiveTimer';
import { Clock, BookOpen, Plus } from 'lucide-react';

interface DayViewProps {
  currentDate: Date;
  subjects: Subject[];
  timers: ActiveTimer[];
  onLinkTimer: (subjectId: string, timerId: string) => void;
  onUnlinkTimer: (subjectId: string) => void;
  getAvailableTimers: (subjectId?: string) => ActiveTimer[];
  getLinkedTimers: (subjectId: string) => ActiveTimer[];
}

export const DayView: React.FC<DayViewProps> = ({
  currentDate,
  subjects,
  timers,
  onLinkTimer,
  onUnlinkTimer,
  getAvailableTimers,
  getLinkedTimers
}) => {
  // Générer les heures de la journée (8h à 22h)
  const hours = Array.from({ length: 15 }, (_, i) => i + 8);
  
  // Simuler des sessions pour la journée
  const getSessionsForHour = (hour: number) => {
    const sessions = [];
    
    // Exemple de données de test basées sur l'heure
    if (hour === 9) {
      const mathSubject = subjects.find(s => s.name.toLowerCase().includes('math'));
      if (mathSubject) {
        sessions.push({
          id: `session-${currentDate.toISOString()}-${hour}`,
          subject: mathSubject,
          startTime: '09:00',
          endTime: '10:30',
          type: 'study' as const
        });
      }
    }
    
    if (hour === 14) {
      const historySubject = subjects.find(s => s.name.toLowerCase().includes('histoire'));
      if (historySubject) {
        sessions.push({
          id: `session-${currentDate.toISOString()}-${hour}`,
          subject: historySubject,
          startTime: '14:00',
          endTime: '15:30',
          type: 'study' as const
        });
      }
    }

    return sessions;
  };

  const formatHour = (hour: number) => {
    return `${hour.toString().padStart(2, '0')}:00`;
  };

  const isCurrentHour = (hour: number) => {
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDay = new Date(currentDate);
    selectedDay.setHours(0, 0, 0, 0);
    
    return selectedDay.getTime() === today.getTime() && now.getHours() === hour;
  };

  return (
    <div className="space-y-6">
      {/* Vue détaillée du jour */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* En-tête du jour */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {currentDate.toLocaleDateString('fr-FR', { 
                  weekday: 'long',
                  day: 'numeric', 
                  month: 'long' 
                })}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Planification détaillée de la journée
              </p>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
              <Plus size={16} />
              Nouvelle session
            </button>
          </div>
        </div>

        {/* Grille horaire */}
        <div className="divide-y divide-gray-200">
          {hours.map(hour => {
            const sessions = getSessionsForHour(hour);
            const isCurrent = isCurrentHour(hour);
            
            return (
              <div
                key={hour}
                className={`flex ${isCurrent ? 'bg-blue-50' : ''}`}
              >
                {/* Colonne heure */}
                <div className={`w-20 p-4 text-center border-r border-gray-200 ${
                  isCurrent ? 'bg-blue-100' : 'bg-gray-50'
                }`}>
                  <div className={`text-sm font-medium ${
                    isCurrent ? 'text-blue-600' : 'text-gray-600'
                  }`}>
                    {formatHour(hour)}
                  </div>
                  {isCurrent && (
                    <div className="text-xs text-blue-500 mt-1">
                      Maintenant
                    </div>
                  )}
                </div>

                {/* Colonne contenu */}
                <div className="flex-1 p-4 min-h-[80px]">
                  {sessions.length > 0 ? (
                    <div className="space-y-2">
                      {sessions.map(session => (
                        <SessionCard
                          key={session.id}
                          session={session}
                          timers={timers}
                          onLinkTimer={onLinkTimer}
                          onUnlinkTimer={onUnlinkTimer}
                          getAvailableTimers={getAvailableTimers}
                          getLinkedTimers={getLinkedTimers}
                          isExpanded={true} // Vue détaillée en mode jour
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      <div className="text-center">
                        <Clock size={20} className="mx-auto mb-1 opacity-50" />
                        <span className="text-sm">Créneau libre</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Résumé des liaisons pour le jour */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <BookOpen size={20} className="text-blue-600" />
          Résumé des liaisons Timer-Cours
        </h3>
        
        <div className="grid md:grid-cols-3 gap-4">
          {/* Matières avec timers liés */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700">Matières liées</h4>
            {subjects
              .filter(subject => getLinkedTimers(subject.id).length > 0)
              .map(subject => {
                const linkedTimers = getLinkedTimers(subject.id);
                return (
                  <div key={subject.id} className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="font-medium text-green-900">{subject.name}</div>
                    <div className="text-sm text-green-700 mt-1">
                      ↔ {linkedTimers[0].title}
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Matières sans timer */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700">Matières non liées</h4>
            {subjects
              .filter(subject => getLinkedTimers(subject.id).length === 0)
              .map(subject => (
                <div key={subject.id} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="font-medium text-yellow-900">{subject.name}</div>
                  <div className="text-sm text-yellow-700 mt-1">
                    Aucun timer lié
                  </div>
                </div>
              ))}
          </div>

          {/* Timers disponibles */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700">Timers disponibles</h4>
            {getAvailableTimers().map(timer => (
              <div key={timer.id} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="font-medium text-blue-900">{timer.title}</div>
                <div className="text-sm text-blue-700 mt-1">
                  {timer.linkedSubject ? `→ ${timer.linkedSubject.name}` : 'Disponible'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};