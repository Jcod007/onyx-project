import React, { useState } from 'react';
import { Subject, DayLabels, DayOfWeek } from '@/types/Subject';
import { Calendar, Target, Edit, Trash2, Link, Unlink } from 'lucide-react';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();

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
    if (!days || days.length === 0) return t('subjectCard.noDaysDefined', 'Aucun jour défini');
    return days.map(day => t(`subjectConfig.${day.toLowerCase()}`, DayLabels[day])).join(', ');
  };

  // Formater l'objectif hebdomadaire (convertir minutes en format lisible)
  const formatWeeklyGoal = (minutes?: number): string => {
    if (!minutes || minutes === 0) return t('subjectCard.noObjective', 'Aucun objectif');
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    const perWeek = t('subjectCard.perWeek', '/semaine');
    if (hours > 0) {
      return remainingMinutes > 0 ? `${hours.toString().padStart(2, '0')}:${remainingMinutes.toString().padStart(2, '0')}${perWeek}` : `${hours.toString().padStart(2, '0')}:00${perWeek}`;
    }
    return `00:${remainingMinutes.toString().padStart(2, '0')}${perWeek}`;
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
              title={t('common.edit', 'Modifier')}
            >
              <Edit size={18} />
            </button>
            <button
              onClick={handleDelete}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title={t('common.delete', 'Supprimer')}
            >
              <Trash2 size={18} />
            </button>
          </div>
        )}
      </div>

      {/* Les 3 informations principales */}
      <div className="space-y-4">
        {/* 1. Objectif par semaine */}
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <Target size={18} className="text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">{t('subjectCard.weeklyObjective', 'Objectif par semaine')}</p>
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
            <p className="text-sm text-gray-500">{t('subjectCard.studyDays', 'Jours d\'étude')}</p>
            <p className="text-base font-medium text-gray-900">
              {formatStudyDays(subject.studyDays || [])}
            </p>
          </div>
        </div>

        {/* 3. Liaison avec timer */}
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${
            linkedTimerName
              ? 'bg-purple-100' 
              : subject.linkedTimerId
              ? 'bg-orange-100' 
              : 'bg-gray-100'
          }`}>
            {linkedTimerName ? (
              <Link size={18} className="text-purple-600" />
            ) : subject.linkedTimerId ? (
              <Link size={18} className="text-orange-600" />
            ) : (
              <Unlink size={18} className="text-gray-500" />
            )}
          </div>
          <div>
            <p className="text-sm text-gray-500">{t('subjectCard.timerLink', 'Liaison timer')}</p>
            <p className={`text-base font-medium ${
              linkedTimerName
                ? 'text-purple-900' 
                : subject.linkedTimerId
                ? 'text-orange-700'
                : 'text-gray-600'
            }`}>
              {linkedTimerName 
                ? t('subjectCard.linkedTo', 'Lié à "{{name}}"', { name: linkedTimerName })
                : subject.linkedTimerId 
                ? `Timer ID: ${subject.linkedTimerId.slice(0, 8)}...` 
                : t('subjectCard.noLink', 'Aucune liaison')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};