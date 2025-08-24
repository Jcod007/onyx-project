import React from 'react';
import { Play, Pause, RotateCcw, BookOpen, Clock, Link2, Plus, Edit3, Trash2 } from 'lucide-react';
import { Subject } from '@/types/Subject';
import { TimerState } from '@/types/Timer';
import { useTranslation } from 'react-i18next';

interface ModernTimerCardProps {
  id: string;
  title: string;
  duration: number; // en secondes
  state: TimerState;
  timeRemaining?: number;
  linkedSubject?: Subject | null;
  isPomodoroMode?: boolean;
  sessionCount?: number;
  maxCycles?: number;
  progress?: number; // 0-100
  onStart?: () => void;
  onPause?: () => void;
  onReset?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onLinkSubject?: () => void;
  className?: string;
}

export const ModernTimerCard: React.FC<ModernTimerCardProps> = ({
  id: _id,
  title,
  duration,
  state,
  timeRemaining = duration,
  linkedSubject,
  isPomodoroMode = false,
  sessionCount = 0,
  maxCycles,
  progress = 0,
  onStart,
  onPause,
  onReset,
  onEdit,
  onDelete,
  onLinkSubject,
  className = ''
}) => {
  const { t } = useTranslation();
  // Déterminer les styles selon l'état
  const getStateStyles = () => {
    switch (state) {
      case 'running':
        return {
          border: 'border-green-200',
          background: 'bg-gradient-to-br from-green-50 to-green-100',
          badge: 'bg-green-100 text-green-800 border-green-200',
          progressBar: 'from-green-500 to-green-600'
        };
      case 'paused':
        return {
          border: 'border-orange-200',
          background: 'bg-gradient-to-br from-orange-50 to-orange-100',
          badge: 'bg-orange-100 text-orange-800 border-orange-200',
          progressBar: 'from-orange-500 to-orange-600'
        };
      case 'finished':
        return {
          border: 'border-purple-200',
          background: 'bg-gradient-to-br from-purple-50 to-purple-100',
          badge: 'bg-purple-100 text-purple-800 border-purple-200',
          progressBar: 'from-purple-500 to-purple-600'
        };
      default:
        return {
          border: 'border-gray-200',
          background: 'bg-white',
          badge: 'bg-gray-100 text-gray-700 border-gray-200',
          progressBar: 'from-gray-400 to-gray-500'
        };
    }
  };

  const styles = getStateStyles();
  
  const getStateLabel = () => {
    switch (state) {
      case 'running': return t('timerCard.running', 'EN COURS');
      case 'paused': return t('timerCard.paused', 'PAUSE');
      case 'finished': return t('timerCard.finished', 'TERMINÉ');
      default: return t('timerCard.ready', 'PRÊT');
    }
  };

  const formatTimeDisplay = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    
    if (h > 0) {
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`relative group ${className}`}>
      {/* Carte principale - Hauteur fixe pour uniformité */}
      <div className={`
        min-h-72 h-auto w-full rounded-xl border-2 ${styles.border} ${styles.background}
        shadow-lg hover:shadow-xl transition-all duration-300
        flex flex-col p-5 relative overflow-hidden
      `}>
        {/* Action buttons - À l'intérieur de la carte */}
        <div className="absolute top-3 right-3 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="p-2 bg-white/90 backdrop-blur-sm text-blue-600 rounded-lg shadow-sm hover:bg-blue-50 transition-colors border border-gray-200"
              title={t('timerCard.editTimer', 'Modifier ce timer')}
            >
              <Edit3 size={14} />
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="p-2 bg-white/90 backdrop-blur-sm text-red-600 rounded-lg shadow-sm hover:bg-red-50 transition-colors border border-gray-200"
              title={t('timerCard.deleteTimer', 'Supprimer ce timer')}
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
        
        {/* Header avec titre et statut */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg text-gray-900 truncate mb-1">
              {title}
            </h3>
            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold border ${styles.badge}`}>
              {getStateLabel()}
            </div>
          </div>
        </div>

        {/* Temps principal */}
        <div className="text-center mb-4 flex-1 flex flex-col justify-center">
          <div className={`text-3xl font-mono font-bold text-gray-900 mb-2 ${
            state === 'running' ? 'animate-pulse' : ''
          }`}>
            {formatTimeDisplay(timeRemaining)}
          </div>
          
          {/* Barre de progression */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div 
              className={`h-full rounded-full transition-all duration-1000 bg-gradient-to-r ${styles.progressBar}`}
              style={{ width: `${progress}%` }}
            />
          </div>
          
          <div className="text-xs text-gray-500">
            {Math.round(progress)}% {t('timerCard.completed', 'complété')}
          </div>
        </div>

        {/* Liaison à un cours */}
        <div className="mb-4">
          {linkedSubject ? (
            <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
              <BookOpen size={14} className="text-blue-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-xs font-medium text-blue-900 block truncate">
                  {t('timerCard.linkedTo', 'Thème lié à :')} {linkedSubject.name}
                </span>
              </div>
            </div>
          ) : (
            <button
              onClick={onLinkSubject}
              className="w-full flex items-center gap-2 p-2 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors group/link"
            >
              <Link2 size={14} className="text-gray-400 group-hover/link:text-gray-600" />
              <span className="text-xs text-gray-500 group-hover/link:text-gray-700">
                {t('timerCard.notLinked', 'Pas encore lié à un cours')}
              </span>
              <Plus size={12} className="ml-auto text-gray-400 group-hover/link:text-gray-600" />
            </button>
          )}
        </div>

        {/* Informations additionnelles */}
        <div className="flex items-center justify-between text-xs text-gray-600">
          <div className="flex items-center gap-1">
            <Clock size={12} />
            <span>
              {isPomodoroMode ? t('timerCard.pomodoro', 'Pomodoro') : t('timerCard.simple', 'Simple')} 
              {sessionCount > 0 && ` • ${sessionCount} ${t('timerCard.sessions', 'sessions')}`}
            </span>
          </div>
          
          {isPomodoroMode && maxCycles && (
            <div className="text-purple-600 font-medium">
              {t('timerCard.cycles', 'Cycles')}: {Math.ceil(sessionCount / 4)}/{maxCycles}
            </div>
          )}
        </div>

        {/* Boutons d'action - Section finale */}
        <div className="mt-auto pt-3 border-t border-gray-200">
          {state === 'finished' ? (
            <button
              onClick={onReset}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <RotateCcw size={16} />
              {t('timerCard.restart', 'Recommencer')}
            </button>
          ) : state === 'running' ? (
            <div className="flex gap-2">
              <button
                onClick={onPause}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
              >
                <Pause size={16} />
                {t('common.pause', 'Pause')}
              </button>
              <button
                onClick={onReset}
                className="px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                title={t('common.reset', 'Reset')}
              >
                <RotateCcw size={16} />
              </button>
            </div>
          ) : state === 'paused' ? (
            <div className="flex gap-2">
              <button
                onClick={onStart}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                <Play size={16} />
                {t('common.resume', 'Reprendre')}
              </button>
              <button
                onClick={onReset}
                className="px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                title={t('common.reset', 'Reset')}
              >
                <RotateCcw size={16} />
              </button>
            </div>
          ) : (
            <button
              onClick={onStart}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              <Play size={16} />
              {t('common.start', 'Démarrer')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};