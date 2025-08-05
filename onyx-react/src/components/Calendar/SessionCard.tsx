import React, { useState } from 'react';
import { Subject } from '@/types/Subject';
import { ActiveTimer } from '@/types/ActiveTimer';
import { Clock, Link, Unlink, Play, Settings } from 'lucide-react';
import { formatHoursMinutes } from '@/utils/timeFormat';

interface SessionCardProps {
  session: {
    id: string;
    subject: Subject;
    startTime: string;
    endTime: string;
    type: 'study' | 'break';
  };
  timers: ActiveTimer[];
  onLinkTimer: (subjectId: string, timerId: string) => void;
  onUnlinkTimer: (subjectId: string) => void;
  getAvailableTimers: (subjectId?: string) => ActiveTimer[];
  getLinkedTimers: (subjectId: string) => ActiveTimer[];
  isExpanded?: boolean;
}

export const SessionCard: React.FC<SessionCardProps> = ({
  session,
  timers: _timers,
  onLinkTimer,
  onUnlinkTimer,
  getAvailableTimers,
  getLinkedTimers,
  isExpanded = false
}) => {
  const [showTimerSelector, setShowTimerSelector] = useState(false);
  
  const linkedTimers = getLinkedTimers(session.subject.id);
  const availableTimers = getAvailableTimers(session.subject.id);
  const hasLinkedTimer = linkedTimers.length > 0;

  const handleLinkTimer = (timerId: string) => {
    onLinkTimer(session.subject.id, timerId);
    setShowTimerSelector(false);
  };

  const handleUnlinkTimer = () => {
    onUnlinkTimer(session.subject.id);
  };

  const getSubjectColor = (subjectName: string) => {
    const colors = [
      'bg-blue-100 border-blue-300 text-blue-800',
      'bg-green-100 border-green-300 text-green-800',
      'bg-purple-100 border-purple-300 text-purple-800',
      'bg-orange-100 border-orange-300 text-orange-800',
      'bg-pink-100 border-pink-300 text-pink-800'
    ];
    const hash = subjectName.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const subjectColorClass = getSubjectColor(session.subject.name);

  return (
    <div className={`border-2 rounded-lg p-3 ${subjectColorClass} ${
      isExpanded ? 'space-y-3' : 'space-y-2'
    }`}>
      {/* En-tête de la session */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="font-semibold text-sm leading-tight">
            {session.subject.name}
          </h4>
          <div className="text-xs opacity-75 mt-1 flex items-center gap-1">
            <Clock size={12} />
            {session.startTime} - {session.endTime}
          </div>
        </div>
        
        {/* Indicateur de liaison */}
        <div className="flex items-center gap-1 ml-2">
          {hasLinkedTimer ? (
            <div className="flex items-center gap-1">
              <Link size={14} className="text-green-600" />
              {isExpanded && (
                <span className="text-xs font-medium">
                  {linkedTimers[0].title}
                </span>
              )}
            </div>
          ) : (
            <Unlink size={14} className="text-gray-400" />
          )}
        </div>
      </div>

      {/* Informations étendues (mode jour) */}
      {isExpanded && (
        <div className="space-y-2">
          {/* Progrès de la matière */}
          <div className="text-xs">
            <div className="flex justify-between items-center mb-1">
              <span>Temps étudié</span>
              <span className="font-medium">
                {formatHoursMinutes(session.subject.timeSpent)} / {formatHoursMinutes(session.subject.targetTime)}
              </span>
            </div>
            <div className="w-full bg-white/50 rounded-full h-1.5">
              <div 
                className="bg-current h-1.5 rounded-full transition-all duration-300"
                style={{ 
                  width: `${Math.min((session.subject.timeSpent / session.subject.targetTime) * 100, 100)}%` 
                }}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1 px-2 py-1 bg-white/70 hover:bg-white rounded text-xs font-medium transition-colors">
              <Play size={12} />
              Démarrer
            </button>
            
            <button 
              onClick={() => setShowTimerSelector(!showTimerSelector)}
              className="flex items-center gap-1 px-2 py-1 bg-white/70 hover:bg-white rounded text-xs font-medium transition-colors"
            >
              <Settings size={12} />
              Timer
            </button>
            
            {hasLinkedTimer && (
              <button 
                onClick={handleUnlinkTimer}
                className="flex items-center gap-1 px-2 py-1 bg-red-100/70 hover:bg-red-100 text-red-700 rounded text-xs font-medium transition-colors"
              >
                <Unlink size={12} />
                Délier
              </button>
            )}
          </div>
        </div>
      )}

      {/* Sélecteur de timer */}
      {showTimerSelector && (
        <div className="mt-2 p-2 bg-white/70 rounded border">
          <div className="text-xs font-medium mb-2">Choisir un timer :</div>
          <div className="space-y-1 max-h-24 overflow-y-auto">
            {availableTimers.length > 0 ? (
              availableTimers.map(timer => (
                <button
                  key={timer.id}
                  onClick={() => handleLinkTimer(timer.id)}
                  className="w-full text-left px-2 py-1 text-xs bg-white hover:bg-gray-50 rounded border transition-colors"
                >
                  <div className="font-medium">{timer.title}</div>
                  <div className="text-gray-500">
                    {formatHoursMinutes(timer.config.workDuration)}
                    {timer.isPomodoroMode && ' (Pomodoro)'}
                  </div>
                </button>
              ))
            ) : (
              <div className="text-xs text-gray-500 italic py-2">
                Aucun timer disponible
              </div>
            )}
          </div>
          <button
            onClick={() => setShowTimerSelector(false)}
            className="mt-2 text-xs text-gray-600 hover:text-gray-800"
          >
            Fermer
          </button>
        </div>
      )}
    </div>
  );
};