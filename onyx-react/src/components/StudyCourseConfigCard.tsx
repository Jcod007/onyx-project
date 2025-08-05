import React, { useState, useEffect } from 'react';
import { RotaryWheel } from '@/components/RotaryWheel';
import { Subject } from '@/types/Subject';
import { ActiveTimer } from '@/types/ActiveTimer';
import { BookOpen, Timer, Coffee, Link2, Plus, CheckCircle2, Settings, ChevronDown } from 'lucide-react';

interface StudyCourseConfigCardProps {
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

export const StudyCourseConfigCard: React.FC<StudyCourseConfigCardProps> = ({
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
  const [showTimerOptions, setShowTimerOptions] = useState(false);
  const [showQuickTimerConfig, setShowQuickTimerConfig] = useState(false);
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
    setShowTimerOptions(false);
  };

  const handleCreateQuickTimer = () => {
    const config = {
      mode: quickTimerMode,
      name: `${subject.name} - ${quickTimerMode === 'pomodoro' ? 'Pomodoro' : 'Timer Simple'}`,
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

  return (
    <div className={`bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden h-96 flex flex-col ${className}`}>
      {/* Header avec titre */}
      <div className="p-5 bg-gradient-to-r from-indigo-50 to-blue-50 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <BookOpen size={20} className="text-indigo-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-gray-900 truncate">{subject.name}</h3>
            <p className="text-sm text-gray-600">Configuration du temps alloué</p>
          </div>
        </div>

        {/* Barre de progression */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-blue-600 transition-all duration-300"
            style={{ width: `${getProgressPercentage()}%` }}
          />
        </div>
      </div>

      {/* Contenu principal */}
      <div className="flex-1 p-5 overflow-y-auto">
        {linkedTimer ? (
          /* Timer lié affiché */
          <div className="space-y-4">
            {/* Temps hebdomadaire avec molette */}
            <div className="text-center">
              <div className="mb-4">
                <div className="text-2xl font-bold text-indigo-600 mb-1">
                  {formatWeeklyTime(weeklyTimeMinutes)}
                </div>
                <p className="text-xs text-gray-500">Temps alloué par semaine</p>
              </div>
              
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

            {/* Timer lié */}
            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle2 size={16} className="text-green-600" />
                  </div>
                  <div>
                    <div className="font-medium text-green-900">{linkedTimer.title}</div>
                    <div className="text-sm text-green-700">
                      {linkedTimer.isPomodoroMode ? '🍅 Pomodoro' : '⏱️ Simple'} • 
                      {Math.round(linkedTimer.config.workDuration / 60)} min
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => onUnlinkTimer?.(subject.id)}
                  className="p-2 text-green-600 hover:text-green-800 hover:bg-green-100 rounded-lg transition-colors"
                  title="Délier ce timer"
                >
                  <Link2 size={16} className="rotate-45" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Configuration sans timer lié */
          <div className="space-y-4">
            {/* Temps hebdomadaire avec molette */}
            <div className="text-center">
              <div className="mb-4">
                <div className="text-2xl font-bold text-indigo-600 mb-1">
                  {formatWeeklyTime(weeklyTimeMinutes)}
                </div>
                <p className="text-xs text-gray-500">Temps alloué par semaine</p>
              </div>
              
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

            {/* Options de timer */}
            <div className="space-y-2">
              {/* Lier timer existant */}
              {availableTimers.length > 0 && (
                <button
                  onClick={() => setShowTimerOptions(!showTimerOptions)}
                  className="w-full flex items-center justify-between p-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Link2 size={16} className="text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">Lier un timer existant</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded-full">
                      {availableTimers.length}
                    </span>
                    <ChevronDown size={16} className={`text-blue-600 transition-transform ${showTimerOptions ? 'rotate-180' : ''}`} />
                  </div>
                </button>
              )}

              {/* Liste des timers disponibles */}
              {showTimerOptions && availableTimers.length > 0 && (
                <div className="max-h-24 overflow-y-auto bg-gray-50 rounded-lg border">
                  {availableTimers.map((timer) => (
                    <button
                      key={timer.id}
                      onClick={() => handleLinkTimer(timer.id)}
                      className="w-full flex items-center gap-3 p-2 hover:bg-white transition-colors text-left border-b border-gray-200 last:border-b-0"
                    >
                      <div className={`p-1 rounded text-xs ${
                        timer.isPomodoroMode ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                      }`}>
                        {timer.isPomodoroMode ? '🍅' : '⏱️'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">{timer.title}</div>
                        <div className="text-xs text-gray-500">
                          {Math.round(timer.config.workDuration / 60)} min
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Créer timer rapide */}
              <button
                onClick={() => setShowQuickTimerConfig(true)}
                className="w-full flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 border border-purple-200 rounded-lg transition-colors"
              >
                <Plus size={16} className="text-purple-600" />
                <span className="text-sm font-medium text-purple-900">Timer rapide</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal configuration timer rapide */}
      {showQuickTimerConfig && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 text-center">Timer rapide</h3>
              <p className="text-sm text-gray-600 text-center">pour {subject.name}</p>
            </div>

            {/* Mode selection */}
            <div className="p-4 border-b border-gray-200">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setQuickTimerMode('simple')}
                  className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                    quickTimerMode === 'simple'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Timer size={16} />
                    <span className="text-sm font-medium">Simple</span>
                  </div>
                </button>
                
                <button
                  onClick={() => setQuickTimerMode('pomodoro')}
                  className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                    quickTimerMode === 'pomodoro'
                      ? 'border-red-500 bg-red-50 text-red-700'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Coffee size={16} />
                    <span className="text-sm font-medium">Pomodoro</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Configuration content */}
            <div className="p-4">
              {quickTimerMode === 'simple' ? (
                <div className="text-center">
                  <RotaryWheel
                    value={simpleTimerDuration}
                    min={5}
                    max={120}
                    step={5}
                    onChange={setSimpleTimerDuration}
                    label="Durée"
                    unit="min"
                    size="md"
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
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
                  
                  <div className="text-center text-sm text-gray-600 bg-red-50 rounded-lg p-2">
                    {pomodoroConfig.workDuration}min travail • {pomodoroConfig.breakDuration}min pause • {pomodoroConfig.cycles} cycles
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex gap-2 p-4 border-t border-gray-200">
              <button
                onClick={() => setShowQuickTimerConfig(false)}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleCreateQuickTimer}
                className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors ${
                  quickTimerMode === 'simple' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                Créer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};