import React, { useState, useEffect } from 'react';
import { CalendarView } from '@/components/Calendar/CalendarView';
import { CalendarHeader } from '@/components/Calendar/CalendarHeader';
import { Subject } from '@/types/Subject';
import { subjectService } from '@/services/subjectService';
import { useReactiveTimers } from '@/hooks/useReactiveTimers';

export const CalendarPage: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'day'>('week');
  const [loading, setLoading] = useState(true);
  
  const { 
    timers, 
    linkTimerToSubject, 
    unlinkTimerFromSubject,
    getAvailableTimersForSubject,
    getLinkedTimersForSubject,
    ensureDataConsistency 
  } = useReactiveTimers();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Charger les matières
      const loadedSubjects = await subjectService.getAllSubjects();
      setSubjects(loadedSubjects);
      
      // Vérifier la cohérence des données timer-cours
      await ensureDataConsistency();
      
      console.log('📅 Données calendrier chargées:', {
        subjects: loadedSubjects.length,
        timers: timers.length
      });
    } catch (error) {
      console.error('Erreur chargement données calendrier:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLinkTimer = async (subjectId: string, timerId: string) => {
    try {
      await linkTimerToSubject(subjectId, timerId);
      await loadData(); // Recharger pour voir les changements
      console.log(`✅ Timer ${timerId} lié au cours ${subjectId}`);
    } catch (error) {
      console.error('Erreur liaison timer:', error);
    }
  };

  const handleUnlinkTimer = async (subjectId: string) => {
    try {
      await unlinkTimerFromSubject(subjectId);
      await loadData(); // Recharger pour voir les changements
      console.log(`✅ Timer délié du cours ${subjectId}`);
    } catch (error) {
      console.error('Erreur déliaison timer:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header du calendrier */}
      <CalendarHeader
        currentDate={currentDate}
        onDateChange={setCurrentDate}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {/* Vue principale du calendrier */}
      <CalendarView
        currentDate={currentDate}
        viewMode={viewMode}
        subjects={subjects}
        timers={timers}
        onLinkTimer={handleLinkTimer}
        onUnlinkTimer={handleUnlinkTimer}
        getAvailableTimers={getAvailableTimersForSubject}
        getLinkedTimers={getLinkedTimersForSubject}
      />

      {/* Informations de débogage en mode développement */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-8 p-4 bg-gray-50 rounded-lg border">
          <h3 className="font-semibold text-gray-900 mb-2">🔧 Debug Info</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Matières:</span> {subjects.length}
              <ul className="ml-4 mt-1 space-y-1">
                {subjects.map(subject => (
                  <li key={subject.id} className="text-gray-600">
                    • {subject.name} 
                    {subject.linkedTimerId && (
                      <span className="text-blue-600 ml-2">
                        (lié: {subject.linkedTimerId.slice(0, 8)}...)
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <span className="font-medium">Timers:</span> {timers.length}
              <ul className="ml-4 mt-1 space-y-1">
                {timers.map(timer => (
                  <li key={timer.id} className="text-gray-600">
                    • {timer.title}
                    {timer.linkedSubject && (
                      <span className="text-green-600 ml-2">
                        (→ {timer.linkedSubject.name})
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};