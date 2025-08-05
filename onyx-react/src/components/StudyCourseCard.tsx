import React, { useState, useEffect } from 'react';
import { RotaryWheel } from '@/components/RotaryWheel';
import { Subject } from '@/types/Subject';
import { ActiveTimer } from '@/types/ActiveTimer';
import { BookOpen, Timer, Coffee, Link2, Plus, CheckCircle2, ChevronDown, X, Unlink } from 'lucide-react';

interface StudyCourseCardProps {
  subject: Subject;
  availableTimers?: ActiveTimer[];
  linkedTimer?: ActiveTimer | null;
  onTimeAllocationChange?: (subjectId: string, timeInMinutes: number) => void;
  onLinkTimer?: (subjectId: string, timerId: string) => void;
  onUnlinkTimer?: (subjectId: string) => void;
  onCreateQuickTimer?: (subjectId: string, timerConfig: any) => void;
  className?: string;
}

type QuickTimerMode = 'simple' | 'pomodoro';

export const StudyCourseCard: React.FC<StudyCourseCardProps> = ({
  subject,
  availableTimers = [],
  linkedTimer,
  onTimeAllocationChange,
  onLinkTimer,
  onUnlinkTimer,
  onCreateQuickTimer,
  className = ''
}) => {
  const [weeklyTimeMinutes, setWeeklyTimeMinutes] = useState(120);
  const [showTimerDropdown, setShowTimerDropdown] = useState(false);
  const [showQuickTimerModal, setShowQuickTimerModal] = useState(false);
  const [quickTimerMode, setQuickTimerMode] = useState<QuickTimerMode>('simple');
  
  // Configuration timer simple
  const [simpleTimerDuration, setSimpleTimerDuration] = useState(25);
  
  // Configuration Pomodoro
  const [pomodoroConfig, setPomodoroConfig] = useState({
    workDuration: 25,
    breakDuration: 5,
    cycles: 4
  });

  useEffect(() => {
    // Calculer le temps hebdomadaire basé sur le temps cible du sujet
    const targetTimeHours = subject.targetTime / 60;
    const weeklyTime = Math.round(targetTimeHours * 60 / 7);
    setWeeklyTimeMinutes(Math.max(30, Math.min(600, weeklyTime)));
  }, [subject.targetTime]);

  const handleTimeChange = (minutes: number) => {
    setWeeklyTimeMinutes(minutes);
    onTimeAllocationChange?.(subject.id, minutes);
  };

  const handleLinkTimer = (timerId: string) => {
    onLinkTimer?.(subject.id, timerId);
    setShowTimerDropdown(false);
  };

  const handleCreateQuickTimer = () => {
    const config = {
      mode: quickTimerMode,
      name: `${subject.name} - ${quickTimerMode === 'pomodoro' ? 'Pomodoro' : 'Timer'}`,
      ...(quickTimerMode === 'simple' 
        ? { duration: simpleTimerDuration } 
        : { pomodoroConfig: {
            workDuration: pomodoroConfig.workDuration * 60,
            breakDuration: pomodoroConfig.breakDuration * 60,
            cycles: pomodoroConfig.cycles
          }
        })
    };
    
    onCreateQuickTimer?.(subject.id, config);
    setShowQuickTimerModal(false);
  };

  const formatWeeklyTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h${mins.toString().padStart(2, '0')}` : `${hours}h`;
  };

  const getProgressPercentage = () => {
    if (!subject.targetTime) return 0;
    return Math.min(100, (subject.studiedTime / subject.targetTime) * 100);
  };

  const getStatusColor = () => {
    if (linkedTimer) return 'border-green-300 bg-gradient-to-br from-green-50 to-emerald-50';
    if (availableTimers.length > 0) return 'border-orange-300 bg-gradient-to-br from-orange-50 to-amber-50';
    return 'border-red-300 bg-gradient-to-br from-red-50 to-rose-50';
  };

  const getStatusIcon = () => {
    if (linkedTimer) return <CheckCircle2 size={16} className="text-green-600" />;
    if (availableTimers.length > 0) return <Timer size={16} className="text-orange-600" />;
    return <X size={16} className="text-red-600" />;
  };

  const getStatusText = () => {
    if (linkedTimer) return 'Opérationnel';
    if (availableTimers.length > 0) return 'Configuration requise';
    return 'Non opérationnel';
  };

  return (
    <>
      {/* Carte principale */}
      <div className={`min-h-80 w-full rounded-xl border-2 ${getStatusColor()} shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col relative overflow-hidden ${className}`}>
        
        {/* Header avec titre et statut */}
        <div className="p-4 border-b border-gray-200/50 flex-shrink-0">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <BookOpen size={18} className="text-indigo-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-gray-900 truncate">{subject.name}</h3>
                <p className="text-sm text-gray-600">Temps alloué</p>
              </div>
            </div>
            
            {/* Statut */}
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/60 border">
              {getStatusIcon()}
              <span className="text-xs font-medium">{getStatusText()}</span>
            </div>
          </div>

          {/* Barre de progression */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-blue-600 transition-all duration-500"
              style={{ width: `${getProgressPercentage()}%` }}
            />
          </div>
        </div>

        {/* Contenu principal */}
        <div className="flex-1 p-4 flex flex-col">
          {/* Temps hebdomadaire avec molette centrale */}
          <div className="text-center mb-4 flex-1 flex flex-col justify-center">
            <div className="mb-3">
              <div className="text-2xl font-bold text-indigo-600 mb-1">
                {formatWeeklyTime(weeklyTimeMinutes)}
              </div>
              <p className="text-xs text-gray-500">par semaine</p>
            </div>
            
            <div className="flex justify-center">
              <RotaryWheel
                value={weeklyTimeMinutes}
                min={30}
                max={600}
                step={15}
                onChange={handleTimeChange}
                unit="time"
                size="sm"
              />
            </div>
          </div>

          {/* Section timer */}
          <div className="mt-auto pt-3 border-t border-gray-200/50">
            {linkedTimer ? (
              /* Timer lié */
              <div className="bg-white/60 rounded-lg p-3 border border-green-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="text-green-600 text-sm">
                      {linkedTimer.isPomodoroMode ? '🍅' : '⏱️'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {linkedTimer.title}
                      </div>
                      <div className="text-xs text-gray-600">
                        {Math.round(linkedTimer.config.workDuration / 60)} min
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => onUnlinkTimer?.(subject.id)}
                    className="p-1 text-green-600 hover:text-green-800 hover:bg-green-100 rounded transition-colors"
                    title="Délier"
                  >
                    <Unlink size={14} />
                  </button>
                </div>
              </div>
            ) : (
              /* Options de liaison */
              <div className="space-y-2">
                {/* Lier timer existant */}
                {availableTimers.length > 0 && (
                  <div className="relative">
                    <button
                      onClick={() => setShowTimerDropdown(!showTimerDropdown)}
                      className="w-full flex items-center justify-between p-2 bg-white/60 hover:bg-white/80 border border-blue-200 rounded-lg transition-colors text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <Link2 size={14} className="text-blue-600" />
                        <span className="font-medium text-blue-900">Lier un timer</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full">
                          {availableTimers.length}
                        </span>
                        <ChevronDown size={14} className={`text-blue-600 transition-transform ${showTimerDropdown ? 'rotate-180' : ''}`} />
                      </div>
                    </button>

                    {/* Dropdown timers */}
                    {showTimerDropdown && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-32 overflow-y-auto">
                        {availableTimers.map((timer) => (
                          <button
                            key={timer.id}
                            onClick={() => handleLinkTimer(timer.id)}
                            className="w-full flex items-center gap-2 p-2 hover:bg-gray-50 transition-colors text-left border-b border-gray-100 last:border-b-0"
                          >
                            <div className="text-sm">
                              {timer.isPomodoroMode ? '🍅' : '⏱️'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-gray-900 truncate">
                                {timer.title}
                              </div>
                              <div className="text-xs text-gray-500">
                                {Math.round(timer.config.workDuration / 60)} min
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Créer timer rapide */}
                <button
                  onClick={() => setShowQuickTimerModal(true)}
                  className="w-full flex items-center justify-center gap-2 p-2 bg-white/60 hover:bg-white/80 border border-purple-200 rounded-lg transition-colors text-sm"
                >
                  <Plus size={14} className="text-purple-600" />
                  <span className="font-medium text-purple-900">Timer rapide</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Timer Rapide */}
      {showQuickTimerModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Timer rapide</h3>
                <p className="text-sm text-gray-600">{subject.name}</p>
              </div>
              <button
                onClick={() => setShowQuickTimerModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            {/* Onglets mode */}
            <div className="p-6 border-b border-gray-200">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setQuickTimerMode('simple')}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                    quickTimerMode === 'simple'
                      ? 'border-green-500 bg-gradient-to-br from-green-50 to-green-100 text-green-700 shadow-md'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex flex-col items-center space-y-2">
                    <div className={`p-2 rounded-lg ${
                      quickTimerMode === 'simple' ? 'bg-green-200' : 'bg-gray-100'
                    }`}>
                      <Timer size={20} className={quickTimerMode === 'simple' ? 'text-green-600' : 'text-gray-500'} />
                    </div>
                    <span className="font-medium text-sm">Timer Simple</span>
                    <span className="text-xs text-center opacity-80">Une durée fixe</span>
                  </div>
                </button>
                
                <button
                  onClick={() => setQuickTimerMode('pomodoro')}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                    quickTimerMode === 'pomodoro'
                      ? 'border-red-500 bg-gradient-to-br from-red-50 to-red-100 text-red-700 shadow-md'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex flex-col items-center space-y-2">
                    <div className={`p-2 rounded-lg ${
                      quickTimerMode === 'pomodoro' ? 'bg-red-200' : 'bg-gray-100'
                    }`}>
                      <Coffee size={20} className={quickTimerMode === 'pomodoro' ? 'text-red-600' : 'text-gray-500'} />
                    </div>
                    <span className="font-medium text-sm">Pomodoro</span>
                    <span className="text-xs text-center opacity-80">Cycles automatiques</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Configuration avec molettes */}
            <div className="p-6">
              {quickTimerMode === 'simple' ? (
                <div className="text-center">
                  <RotaryWheel
                    value={simpleTimerDuration}
                    min={5}
                    max={120}
                    step={5}
                    onChange={setSimpleTimerDuration}
                    label="Durée du timer"
                    unit="min"
                    size="lg"
                  />
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-3 gap-4">
                    <RotaryWheel
                      value={pomodoroConfig.workDuration}
                      min={15}
                      max={60}
                      step={5}
                      onChange={(value) => setPomodoroConfig(prev => ({ ...prev, workDuration: value }))}
                      label="Travail"
                      unit="min"
                      size="sm"
                    />
                    <RotaryWheel
                      value={pomodoroConfig.breakDuration}
                      min={3}
                      max={15}
                      step={1}
                      onChange={(value) => setPomodoroConfig(prev => ({ ...prev, breakDuration: value }))}
                      label="Pause"
                      unit="min"
                      size="sm"
                    />
                    <RotaryWheel
                      value={pomodoroConfig.cycles}
                      min={2}
                      max={8}
                      step={1}
                      onChange={(value) => setPomodoroConfig(prev => ({ ...prev, cycles: value }))}
                      label="Cycles"
                      unit=""
                      size="sm"
                    />
                  </div>
                  
                  {/* Résumé Pomodoro */}
                  <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                    <div className="text-center">
                      <div className="text-sm font-medium text-red-900 mb-2">Configuration Pomodoro</div>
                      <div className="text-sm text-red-700">
                        {pomodoroConfig.workDuration}min travail • {pomodoroConfig.breakDuration}min pause
                      </div>
                      <div className="text-xs text-red-600 mt-1">
                        {pomodoroConfig.cycles} cycles • Durée totale: {(pomodoroConfig.workDuration + pomodoroConfig.breakDuration) * pomodoroConfig.cycles}min
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowQuickTimerModal(false)}
                className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Annuler
              </button>
              <button
                onClick={handleCreateQuickTimer}
                className={`flex-1 px-4 py-3 text-white rounded-lg transition-colors font-medium ${
                  quickTimerMode === 'simple' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                Créer le timer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};