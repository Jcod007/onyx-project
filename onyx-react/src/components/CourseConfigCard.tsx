import React, { useState, useEffect } from 'react';
import { TimeWheel } from '@/components/TimeWheel';
import { QuickTimerConfig } from '@/components/QuickTimerConfig';
import { Subject } from '@/types/Subject';
import { ActiveTimer } from '@/types/ActiveTimer';
import { BookOpen, Timer, Plus, Link2, Unlink, Settings, CheckCircle2 } from 'lucide-react';

interface CourseConfigCardProps {
  subject: Subject;
  availableTimers?: ActiveTimer[];
  linkedTimer?: ActiveTimer | null;
  onTimeAllocationChange?: (subjectId: string, timeInMinutes: number) => void;
  onLinkTimer?: (subjectId: string, timerId: string) => void;
  onUnlinkTimer?: (subjectId: string) => void;
  onCreateQuickTimer?: (subjectId: string, timerConfig: any) => void;
  className?: string;
}

export const CourseConfigCard: React.FC<CourseConfigCardProps> = ({
  subject,
  availableTimers = [],
  linkedTimer,
  onTimeAllocationChange,
  onLinkTimer,
  onUnlinkTimer,
  onCreateQuickTimer,
  className = ''
}) => {
  const [weeklyTimeMinutes, setWeeklyTimeMinutes] = useState(120); // 2h par défaut
  const [showTimerSelection, setShowTimerSelection] = useState(false);
  const [showQuickTimerConfig, setShowQuickTimerConfig] = useState(false);

  useEffect(() => {
    // Calculer le temps hebdomadaire basé sur le temps cible du sujet
    const targetTimeHours = subject.targetTime / 60; // Convertir en heures
    const weeklyTime = Math.round(targetTimeHours * 60 / 7); // Répartir sur 7 jours et convertir en minutes
    setWeeklyTimeMinutes(Math.max(30, Math.min(300, weeklyTime))); // Limiter entre 30min et 5h
  }, [subject.targetTime]);

  const handleTimeChange = (minutes: number) => {
    setWeeklyTimeMinutes(minutes);
    onTimeAllocationChange?.(subject.id, minutes);
  };

  const handleLinkTimer = (timerId: string) => {
    onLinkTimer?.(subject.id, timerId);
    setShowTimerSelection(false);
  };

  const handleQuickTimerCreate = (config: any) => {
    onCreateQuickTimer?.(subject.id, config);
    setShowQuickTimerConfig(false);
  };

  const formatWeeklyTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min/semaine`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 
      ? `${hours}h${mins.toString().padStart(2, '0')}/semaine` 
      : `${hours}h/semaine`;
  };

  const getProgressPercentage = () => {
    if (!subject.targetTime) return 0;
    return Math.min(100, (subject.studiedTime / subject.targetTime) * 100);
  };

  const getStatusColor = () => {
    const progress = getProgressPercentage();
    if (progress >= 100) return 'text-green-600 bg-green-100 border-green-200';
    if (progress >= 75) return 'text-blue-600 bg-blue-100 border-blue-200';
    if (progress >= 50) return 'text-yellow-600 bg-yellow-100 border-yellow-200';
    return 'text-gray-600 bg-gray-100 border-gray-200';
  };

  return (
    <div className={`bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden ${className}`}>
      {/* Header avec titre et progression */}
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BookOpen size={20} className="text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">{subject.name}</h3>
              <p className="text-sm text-gray-600">Configuration du temps d'étude</p>
            </div>
          </div>
          
          {/* Badge de statut */}
          <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor()}`}>
            {Math.round(getProgressPercentage())}% complété
          </div>
        </div>

        {/* Barre de progression */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-300"
            style={{ width: `${getProgressPercentage()}%` }}
          />
        </div>
      </div>

      {/* Configuration du temps hebdomadaire */}
      <div className="p-6 border-b border-gray-200">
        <div className="text-center">
          <h4 className="text-md font-semibold text-gray-900 mb-4">
            Temps alloué par semaine
          </h4>
          
          <TimeWheel
            value={weeklyTimeMinutes}
            min={30}
            max={300}
            step={15}
            onChange={handleTimeChange}
            size="md"
          />
          
          <div className="mt-3 text-sm text-gray-600">
            {formatWeeklyTime(weeklyTimeMinutes)}
          </div>
        </div>
      </div>

      {/* Section de liaison avec timer */}
      <div className="p-6">
        <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Timer size={16} />
          Liaison avec un timer
        </h4>

        {linkedTimer ? (
          /* Timer lié */
          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle2 size={16} className="text-green-600" />
                </div>
                <div>
                  <div className="font-medium text-green-900">{linkedTimer.title}</div>
                  <div className="text-sm text-green-700">
                    {linkedTimer.isPomodoroMode ? 'Mode Pomodoro' : 'Timer simple'} • 
                    {Math.round(linkedTimer.config.workDuration / 60)} min
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => onUnlinkTimer?.(subject.id)}
                className="p-2 text-green-600 hover:text-green-800 hover:bg-green-100 rounded-lg transition-colors"
                title="Délier ce timer"
              >
                <Unlink size={16} />
              </button>
            </div>
          </div>
        ) : (
          /* Aucun timer lié */
          <div className="space-y-3">
            {/* Lier un timer existant */}
            {availableTimers.length > 0 && (
              <div>
                <button
                  onClick={() => setShowTimerSelection(!showTimerSelection)}
                  className="w-full flex items-center justify-between p-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors group"
                >
                  <div className="flex items-center gap-2">
                    <Link2 size={16} className="text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">
                      Lier un timer existant
                    </span>
                  </div>
                  <span className="text-xs text-blue-600 bg-blue-200 px-2 py-1 rounded-full">
                    {availableTimers.length} disponible{availableTimers.length > 1 ? 's' : ''}
                  </span>
                </button>

                {/* Liste des timers disponibles */}
                {showTimerSelection && (
                  <div className="mt-2 space-y-2 max-h-40 overflow-y-auto bg-gray-50 rounded-lg p-2 border">
                    {availableTimers.map((timer) => (
                      <button
                        key={timer.id}
                        onClick={() => handleLinkTimer(timer.id)}
                        className="w-full flex items-center gap-3 p-2 bg-white hover:bg-blue-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors text-left"
                      >
                        <div className={`p-1 rounded ${
                          timer.isPomodoroMode ? 'bg-red-100' : 'bg-green-100'
                        }`}>
                          {timer.isPomodoroMode ? (
                            <div className="text-red-600 text-xs">🍅</div>
                          ) : (
                            <Timer size={12} className="text-green-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {timer.title}
                          </div>
                          <div className="text-xs text-gray-500">
                            {Math.round(timer.config.workDuration / 60)} min • 
                            {timer.isPomodoroMode ? ' Pomodoro' : ' Simple'}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Créer un timer rapide */}
            <button
              onClick={() => setShowQuickTimerConfig(true)}
              className="w-full flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 border border-purple-200 rounded-lg transition-colors group"
            >
              <Plus size={16} className="text-purple-600 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-purple-900">
                Créer un timer rapide
              </span>
            </button>

            {/* Message si aucun timer */}
            {availableTimers.length === 0 && (
              <div className="text-center py-4 text-gray-500 text-sm">
                <div className="w-12 h-12 mx-auto mb-2 bg-gray-100 rounded-full flex items-center justify-center">
                  <Timer size={20} className="text-gray-400" />
                </div>
                Aucun timer disponible
                <br />
                <span className="text-xs">Créez un timer rapide pour commencer</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Configuration rapide de timer */}
      <QuickTimerConfig
        isOpen={showQuickTimerConfig}
        onClose={() => setShowQuickTimerConfig(false)}
        onConfirm={handleQuickTimerCreate}
      />
    </div>
  );
};