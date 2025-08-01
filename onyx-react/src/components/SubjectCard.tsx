import React, { useState } from 'react';
import { Subject, SubjectStatusLabels } from '@/types/Subject';
import { formatDuration, calculateProgress } from '@/utils/timeFormat';
import { Clock, Play, Target, TrendingUp, Edit, Trash2 } from 'lucide-react';

interface SubjectCardProps {
  subject: Subject;
  onStartTimer?: (subject: Subject) => void;
  onEdit?: (subject: Subject) => void;
  onDelete?: (subject: Subject) => void;
  showQuickActions?: boolean;
  className?: string;
}

export const SubjectCard: React.FC<SubjectCardProps> = ({
  subject,
  onStartTimer,
  onEdit,
  onDelete,
  showQuickActions = true,
  className = ''
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const progress = calculateProgress(subject.timeSpent, subject.targetTime);
  const remainingTime = Math.max(0, subject.targetTime - subject.timeSpent);

  const getStatusColor = (status: Subject['status']): string => {
    switch (status) {
      case 'COMPLETED': return 'text-green-600 bg-green-100';
      case 'IN_PROGRESS': return 'text-blue-600 bg-blue-100';
      case 'NOT_STARTED': return 'text-gray-600 bg-gray-100';
    }
  };

  const getProgressColor = (progress: number): string => {
    if (progress >= 100) return 'bg-green-500';
    if (progress >= 75) return 'bg-blue-500';
    if (progress >= 50) return 'bg-yellow-500';
    return 'bg-gray-400';
  };

  const handleQuickTimer = () => {
    onStartTimer?.(subject);
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
              onClick={handleQuickTimer}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Démarrer un timer"
            >
              <Play size={18} />
            </button>
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

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-600">Progression</span>
          <span className="text-sm font-medium text-gray-900">
            {Math.round(progress)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-500 ${getProgressColor(progress)}`}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Clock size={16} className="text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Temps passé</p>
            <p className="text-sm font-medium text-gray-900">
              {formatDuration(subject.timeSpent)}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-green-100 rounded-lg">
            <Target size={16} className="text-green-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Objectif</p>
            <p className="text-sm font-medium text-gray-900">
              {formatDuration(subject.targetTime)}
            </p>
          </div>
        </div>
      </div>

      {/* Remaining Time */}
      {remainingTime > 0 && (
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <TrendingUp size={16} className="text-orange-500" />
            <span className="text-sm text-gray-600">Temps restant</span>
          </div>
          <span className="text-sm font-medium text-orange-600">
            {formatDuration(remainingTime)}
          </span>
        </div>
      )}

      {/* Completed Badge */}
      {subject.status === 'COMPLETED' && (
        <div className="absolute top-4 right-4">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
        </div>
      )}

      {/* Quick Timer Button */}
      {showQuickActions && subject.status !== 'COMPLETED' && (
        <button
          onClick={handleQuickTimer}
          className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <Play size={16} />
          Timer {formatDuration(subject.defaultTimerDuration)}
        </button>
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