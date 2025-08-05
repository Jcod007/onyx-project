import React from 'react';
import { Calendar, Clock, Target, TrendingUp, Play, CheckCircle2 } from 'lucide-react';
import { Subject } from '@/types/Subject';
import { formatDuration, formatHoursMinutes } from '@/utils/timeFormat';

interface DailySession {
  id: string;
  subject: Subject;
  plannedDuration: number; // en secondes
  studiedTime: number; // en secondes
  isCompleted: boolean;
  progress: number; // 0-100
}

interface DailySummaryProps {
  date?: Date;
  sessions: DailySession[];
  onStartSession?: (sessionId: string) => void;
  className?: string;
}

export const DailySummary: React.FC<DailySummaryProps> = ({
  date = new Date(),
  sessions,
  onStartSession,
  className = ''
}) => {
  // Calculs des métriques journalières
  const totalPlannedTime = sessions.reduce((acc, session) => acc + session.plannedDuration, 0);
  const totalStudiedTime = sessions.reduce((acc, session) => acc + session.studiedTime, 0);
  const completedSessions = sessions.filter(session => session.isCompleted).length;
  const totalSessions = sessions.length;
  const dailyProgress = totalPlannedTime > 0 ? (totalStudiedTime / totalPlannedTime) * 100 : 0;
  const remainingTime = Math.max(0, totalPlannedTime - totalStudiedTime);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return 'from-green-500 to-green-600';
    if (progress >= 75) return 'from-blue-500 to-blue-600';
    if (progress >= 50) return 'from-yellow-500 to-yellow-600';
    if (progress >= 25) return 'from-orange-500 to-orange-600';
    return 'from-red-500 to-red-600';
  };

  return (
    <div className={`bg-white rounded-xl shadow-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Calendar size={20} className="text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Résumé journalier</h2>
            <p className="text-sm text-gray-600 capitalize">{formatDate(date)}</p>
          </div>
        </div>

        {/* Métriques principales */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Temps planifié vs étudié */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Clock size={16} className="text-blue-600" />
              <span className="text-sm font-medium text-blue-900">Temps d'étude</span>
            </div>
            <div className="text-2xl font-bold text-blue-900 mb-1">
              {formatHoursMinutes(totalStudiedTime)}
            </div>
            <div className="text-xs text-blue-700">
              sur {formatHoursMinutes(totalPlannedTime)} planifiées
            </div>
          </div>

          {/* Sessions complétées */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 size={16} className="text-green-600" />
              <span className="text-sm font-medium text-green-900">Sessions</span>
            </div>
            <div className="text-2xl font-bold text-green-900 mb-1">
              {completedSessions}/{totalSessions}
            </div>
            <div className="text-xs text-green-700">
              terminées aujourd'hui
            </div>
          </div>

          {/* Progression générale */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={16} className="text-purple-600" />
              <span className="text-sm font-medium text-purple-900">Progression</span>
            </div>
            <div className="text-2xl font-bold text-purple-900 mb-1">
              {Math.round(dailyProgress)}%
            </div>
            <div className="text-xs text-purple-700">
              de l'objectif quotidien
            </div>
          </div>
        </div>

        {/* Barre de progression générale */}
        <div className="mt-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Avancement de la journée</span>
            <span className="text-sm text-gray-600">
              {formatHoursMinutes(remainingTime)} restantes
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className={`h-full rounded-full transition-all duration-1000 bg-gradient-to-r ${getProgressColor(dailyProgress)}`}
              style={{ width: `${Math.min(dailyProgress, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Liste des sessions du jour */}
      <div className="p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Target size={16} />
          Sessions du jour ({sessions.length})
        </h3>

        {sessions.length > 0 ? (
          <div className="space-y-3">
            {sessions.map((session) => (
              <div
                key={session.id}
                className={`flex items-center gap-4 p-4 rounded-lg border-2 transition-all duration-200 ${
                  session.isCompleted
                    ? 'border-green-200 bg-green-50'
                    : session.studiedTime > 0
                    ? 'border-blue-200 bg-blue-50'
                    : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                }`}
              >
                {/* Icône de statut */}
                <div className={`p-2 rounded-lg ${
                  session.isCompleted
                    ? 'bg-green-200'
                    : session.studiedTime > 0
                    ? 'bg-blue-200'
                    : 'bg-gray-200'
                }`}>
                  {session.isCompleted ? (
                    <CheckCircle2 size={16} className="text-green-600" />
                  ) : (
                    <Clock size={16} className={session.studiedTime > 0 ? 'text-blue-600' : 'text-gray-500'} />
                  )}
                </div>

                {/* Informations de la session */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 truncate">
                    {session.subject.name}
                  </h4>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-sm text-gray-600">
                      📋 {formatHoursMinutes(session.plannedDuration)}
                    </span>
                    <span className="text-sm text-gray-600">
                      ⏱️ {formatHoursMinutes(session.studiedTime)}
                    </span>
                    <div className="flex items-center gap-1">
                      <div className="w-12 bg-gray-200 rounded-full h-1.5">
                        <div 
                          className={`h-full rounded-full bg-gradient-to-r ${getProgressColor(session.progress)}`}
                          style={{ width: `${Math.min(session.progress, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 ml-1">
                        {Math.round(session.progress)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bouton d'action */}
                {!session.isCompleted && onStartSession && (
                  <button
                    onClick={() => onStartSession(session.id)}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                  >
                    <Play size={14} />
                    Démarrer
                  </button>
                )}

                {session.isCompleted && (
                  <div className="flex items-center gap-1 px-3 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium">
                    <CheckCircle2 size={14} />
                    Terminé
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          /* État vide */
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Calendar size={24} className="text-gray-400" />
            </div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">
              Aucune session planifiée
            </h4>
            <p className="text-gray-500 text-sm max-w-md mx-auto">
              Planifiez vos sessions d'étude pour aujourd'hui afin de voir votre progression
            </p>
          </div>
        )}
      </div>
    </div>
  );
};