import React from 'react';
import { CalendarDay, DayStudySession } from '@/types/Subject';
import { Clock } from 'lucide-react';

interface DayViewProps {
  calendarDays: CalendarDay[];
  currentDate: Date;
  onLaunchSession: (session: DayStudySession) => void;
  onLinkCourse?: (courseId: string, timerId: string) => void;
  onUnlinkCourse?: (courseId: string) => void;
}

export const DayView: React.FC<DayViewProps> = ({
  calendarDays,
  currentDate,
  onLaunchSession
}) => {
  // Obtenir les données du jour actuel
  const todayData = calendarDays.find(day => 
    day.date.toDateString() === currentDate.toDateString()
  ) || {
    date: currentDate,
    isToday: currentDate.toDateString() === new Date().toDateString(),
    sessions: [],
    totalPlannedTime: 0
  };


  return (
    <div className="space-y-6">
      {/* Vue simplifiée du jour - les détails sont maintenant dans CalendarPage */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Sessions du jour
        </h2>
        
        {todayData.sessions.length > 0 ? (
          <div className="space-y-4">
            {todayData.sessions.map((session) => (
              <div key={session.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">{session.subject.name}</h3>
                    <p className="text-sm text-gray-600">{session.plannedDuration} minutes</p>
                  </div>
                  <button 
                    onClick={() => onLaunchSession(session)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Démarrer
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Clock size={32} className="mx-auto mb-2 opacity-50" />
            <p>Aucune session planifiée pour aujourd'hui</p>
          </div>
        )}
      </div>
    </div>
  );
};