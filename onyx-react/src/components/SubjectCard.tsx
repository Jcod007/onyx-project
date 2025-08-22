import React, { useState } from 'react';
import { Subject, DayLabels, DayOfWeek } from '@/types/Subject';
import { formatDuration } from '@/utils/timeFormat';
import { Clock, Calendar, Target, Edit, Trash2, Link, Unlink } from 'lucide-react';

interface SubjectCardProps {
  subject: Subject;
  linkedTimerName?: string;
  onEdit?: (subject: Subject) => void;
  onDelete?: (subject: Subject) => void;
  showQuickActions?: boolean;
  className?: string;
}

export const SubjectCard: React.FC<SubjectCardProps> = ({
  subject,
  linkedTimerName,
  onEdit,
  onDelete,
  showQuickActions = true,
  className = ''
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(subject);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(subject);
  };

  // Formater les jours d'étude
  const formatStudyDays = (days: DayOfWeek[]): string => {
    if (!days || days.length === 0) return 'Aucun jour défini';
    return days.map(day => DayLabels[day]).join(', ');
  };

  // Formater l'objectif hebdomadaire (convertir minutes en format lisible)
  const formatWeeklyGoal = (minutes?: number): string => {
    if (!minutes || minutes === 0) return 'Aucun objectif';
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (hours > 0) {
      return remainingMinutes > 0 ? `${hours}h${remainingMinutes}min/semaine` : `${hours}h/semaine`;
    }
    return `${remainingMinutes}min/semaine`;
  };

  return (
    <div 
      className={`relative p-6 bg-white rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition-all duration-200 cursor-pointer ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onEdit?.(subject)}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
            {subject.name}
          </h3>
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

      {/* Les 4 informations principales */}
      <div className="space-y-4">
        {/* 1. Objectif par semaine */}
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <Target size={18} className="text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Objectif par semaine</p>
            <p className="text-base font-medium text-gray-900">
              {formatWeeklyGoal(subject.weeklyTimeGoal || 0)}
            </p>
          </div>
        </div>

        {/* 2. Jours d'étude */}
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Calendar size={18} className="text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Jours d'étude</p>
            <p className="text-base font-medium text-gray-900">
              {formatStudyDays(subject.studyDays || [])}
            </p>
          </div>
        </div>

        {/* 3. Temps déjà étudié */}
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-orange-100 rounded-lg">
            <Clock size={18} className="text-orange-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Temps déjà étudié</p>
            <p className="text-base font-medium text-gray-900">
              {formatDuration(subject.timeSpent || 0)}
            </p>
          </div>
        </div>

        {/* 4. Liaison avec timer */}
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${
            linkedTimerName || subject.linkedTimerId
              ? 'bg-purple-100' 
              : 'bg-gray-100'
          }`}>
            {linkedTimerName || subject.linkedTimerId ? (
              <Link size={18} className="text-purple-600" />
            ) : (
              <Unlink size={18} className="text-gray-500" />
            )}
          </div>
          <div>
            <p className="text-sm text-gray-500">Liaison timer</p>
            <p className={`text-base font-medium ${
              linkedTimerName || subject.linkedTimerId
                ? 'text-purple-900' 
                : 'text-gray-600'
            }`}>
              {linkedTimerName 
                ? `Lié à "${linkedTimerName}"` 
                : (subject.linkedTimerId ? 'Lié à un timer' : 'Aucune liaison')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};