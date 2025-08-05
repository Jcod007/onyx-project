import React, { useState } from 'react';
import { Subject, SubjectStatusLabels, DayLabels } from '@/types/Subject';
import { ActiveTimer } from '@/types/ActiveTimer';
import { formatDuration } from '@/utils/timeFormat';
import { Clock, Target, Edit, Trash2, Calendar, Link2, TimerIcon } from 'lucide-react';

interface SubjectCardProps {
  subject: Subject;
  linkedTimer?: ActiveTimer; // Timer lié à ce cours
  onEdit?: (subject: Subject) => void;
  onDelete?: (subject: Subject) => void;
  showQuickActions?: boolean;
  className?: string;
}

export const SubjectCard: React.FC<SubjectCardProps> = ({
  subject,
  linkedTimer,
  onEdit,
  onDelete,
  showQuickActions = true,
  className = ''
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // Calculer les informations du timer
  const getTimerInfo = () => {
    if (linkedTimer) {
      // Timer lié
      return {
        duration: linkedTimer.config.workDuration,
        type: 'lié',
        name: linkedTimer.title,
        isLinked: true
      };
    } else if (subject.quickTimerConfig) {
      // Quick timer configuré
      return {
        duration: subject.quickTimerConfig.workDuration * 60, // Convertir minutes en secondes
        type: 'libre',
        name: `${subject.quickTimerConfig.type === 'pomodoro' ? 'Pomodoro' : 'Simple'} Timer`,
        isLinked: false
      };
    } else {
      // Timer par défaut
      return {
        duration: subject.defaultTimerDuration,
        type: 'libre',
        name: 'Timer par défaut',
        isLinked: false
      };
    }
  };

  const timerInfo = getTimerInfo();

  const getStatusColor = (status: Subject['status']): string => {
    switch (status) {
      case 'COMPLETED': return 'text-green-600 bg-green-100';
      case 'IN_PROGRESS': return 'text-blue-600 bg-blue-100';
      case 'NOT_STARTED': return 'text-gray-600 bg-gray-100';
    }
  };


  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(subject);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(subject);
  };

  return (
    <div 
      className={`relative p-6 bg-white rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition-all duration-200 cursor-pointer ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onEdit?.(subject)}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
            {subject.name}
          </h3>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(subject.status)}`}>
            {SubjectStatusLabels[subject.status]}
          </span>
        </div>
        
        {/* Quick Actions */}
        {showQuickActions && isHovered && (
          <div className="flex items-center space-x-2 ml-4">
            <button
              onClick={handleEdit}
              className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
              title="Modifier"
            >
              <Edit size={18} />
            </button>
            <button
              onClick={handleDelete}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Supprimer"
            >
              <Trash2 size={18} />
            </button>
          </div>
        )}
      </div>


      {/* Nouvelles informations */}
      <div className="space-y-4 mb-4">
        {/* Objectif hebdomadaire */}
        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <Calendar size={16} className="text-blue-600" />
            <span className="text-sm text-gray-700">Objectif hebdomadaire</span>
          </div>
          <span className="text-sm font-semibold text-blue-700">
            {subject.weeklyTimeGoal ? `${Math.floor(subject.weeklyTimeGoal / 60).toString().padStart(2, '0')}h${(subject.weeklyTimeGoal % 60).toString().padStart(2, '0')}/semaine` : 'Non défini'}
          </span>
        </div>

        {/* Timer configuré */}
        <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <TimerIcon size={16} className="text-purple-600" />
            <span className="text-sm text-gray-700">Timer configuré</span>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-purple-700">
              {formatDuration(timerInfo.duration)}
            </p>
            <p className="text-xs text-purple-600">
              {timerInfo.name}
            </p>
          </div>
        </div>

        {/* Statut de liaison */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <Link2 size={16} className={timerInfo.isLinked ? 'text-green-600' : 'text-gray-500'} />
            <span className="text-sm text-gray-700">État du timer</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${timerInfo.isLinked ? 'bg-green-500' : 'bg-gray-400'}`} />
            <span className={`text-sm font-medium ${timerInfo.isLinked ? 'text-green-700' : 'text-gray-600'}`}>
              {timerInfo.type === 'lié' ? 'Timer lié' : 'Timer libre'}
            </span>
          </div>
        </div>
      </div>


      {/* Completed Badge */}
      {subject.status === 'COMPLETED' && (
        <div className="absolute top-4 right-4">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
        </div>
      )}


      {/* Last Study Date */}
      {subject.lastStudyDate && (
        <div className="mt-3 text-xs text-gray-500">
          Dernière session: {new Date(subject.lastStudyDate).toLocaleDateString('fr-FR')}
        </div>
      )}
    </div>
  );
};