import React, { useState, useEffect } from 'react';
import { ErgonomicTimeInput } from '@/components/ErgonomicTimeInput';
import { HorizontalSlider } from '@/components/HorizontalSlider';
import { Subject } from '@/types/Subject';
import { ActiveTimer } from '@/types/ActiveTimer';
import { BookOpen, Timer, Coffee, Link2, Plus, Check, Calendar, Clock, AlertCircle } from 'lucide-react';

interface SubjectConfigCardProps {
  subject?: Subject;
  availableTimers?: ActiveTimer[];
  linkedTimer?: ActiveTimer | null;
  onSave?: (subjectData: SubjectFormData) => void;
  onCancel?: () => void;
  isCreating?: boolean;
  className?: string;
}

interface SubjectFormData {
  name: string;
  weeklyTimeMinutes: number;
  selectedDays: number[];
  timerConfig?: {
    mode: TimerMode;
    quickTimerType?: QuickTimerType;
    simpleTimerDuration?: number;
    pomodoroConfig?: {
      workTime: number;
      breakTime: number;
      cycles: number;
    };
    linkedTimerId?: string;
  };
}

type TimerMode = 'quick-create' | 'link-existing';
type QuickTimerType = 'simple' | 'pomodoro';

const WEEKDAYS = [
  { id: 1, short: 'L', full: 'Lundi' },
  { id: 2, short: 'M', full: 'Mardi' },
  { id: 3, short: 'M', full: 'Mercredi' },
  { id: 4, short: 'J', full: 'Jeudi' },
  { id: 5, short: 'V', full: 'Vendredi' },
  { id: 6, short: 'S', full: 'Samedi' },
  { id: 0, short: 'D', full: 'Dimanche' }
];

export const SubjectConfigCard: React.FC<SubjectConfigCardProps> = ({
  subject,
  availableTimers = [],
  linkedTimer,
  onSave,
  onCancel,
  isCreating = true,
  className = ''
}) => {
  // État du formulaire
  const [subjectName, setSubjectName] = useState(subject?.name || '');
  const [weeklyTimeMinutes, setWeeklyTimeMinutes] = useState(subject?.weeklyTimeGoal || 240);
  const [selectedDays, setSelectedDays] = useState<number[]>(
    subject?.studyDays.map(day => WEEKDAYS.find(w => w.full.toUpperCase() === day)?.id || 1) || [1, 2, 3, 4, 5]
  );
  const [timerMode, setTimerMode] = useState<TimerMode>('quick-create');
  const [quickTimerType, setQuickTimerType] = useState<QuickTimerType>('simple');
  const [selectedExistingTimer, setSelectedExistingTimer] = useState<string | null>(linkedTimer?.id || null);

  // Configuration timer
  const [simpleTimerDuration, setSimpleTimerDuration] = useState(25);
  const [pomodoroWorkTime, setPomodoroWorkTime] = useState(25);
  const [pomodoroBreakTime, setPomodoroBreakTime] = useState(5);
  const [pomodoroCycles, setPomodoroCycles] = useState(4);

  // Validation
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    if (linkedTimer) {
      setTimerMode('link-existing');
      setSelectedExistingTimer(linkedTimer.id);
    }
  }, [linkedTimer]);

  // Validation temps réel
  useEffect(() => {
    const newErrors: { [key: string]: string } = {};
    
    if (touched.name && !subjectName.trim()) {
      newErrors.name = 'Le nom est requis';
    }
    
    if (selectedDays.length === 0) {
      newErrors.days = 'Sélectionnez au moins un jour';
    }
    
    if (timerMode === 'link-existing' && !selectedExistingTimer && availableTimers.length > 0) {
      newErrors.timer = 'Sélectionnez un timer';
    }
    
    setErrors(newErrors);
  }, [subjectName, selectedDays, timerMode, selectedExistingTimer, availableTimers.length, touched]);

  const handleDayToggle = (dayId: number) => {
    setSelectedDays(prev => 
      prev.includes(dayId) 
        ? prev.filter(id => id !== dayId)
        : [...prev, dayId].sort()
    );
  };

  const handleSave = () => {
    // Marquer tous les champs comme touchés
    setTouched({ name: true, days: true, timer: true });
    
    if (Object.keys(errors).length > 0 || !subjectName.trim()) {
      return;
    }

    const formData: SubjectFormData = {
      name: subjectName.trim(),
      weeklyTimeMinutes,
      selectedDays,
      timerConfig: {
        mode: timerMode,
        ...(timerMode === 'quick-create' 
          ? {
              quickTimerType,
              ...(quickTimerType === 'simple'
                ? { simpleTimerDuration }
                : {
                    pomodoroConfig: {
                      workTime: pomodoroWorkTime,
                      breakTime: pomodoroBreakTime,
                      cycles: pomodoroCycles
                    }
                  }
              )
            }
          : { linkedTimerId: selectedExistingTimer || undefined }
        )
      }
    };

    onSave?.(formData);
  };

  const formatDailyTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h${mins.toString().padStart(2, '0')}`;
  };

  const dailyAverage = selectedDays.length > 0 ? Math.round(weeklyTimeMinutes / selectedDays.length) : 0;
  const isValid = Object.keys(errors).length === 0 && subjectName.trim().length > 0;

  return (
    <div className={`bg-white rounded-xl shadow-lg overflow-hidden ${className}`}>
      {/* Header simplifié */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6">
        <h3 className="text-xl font-bold text-gray-900">
          {isCreating ? 'Nouvelle matière' : `Modifier ${subject?.name}`}
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Configurez votre matière d'étude
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* Section 1: Informations de base */}
        <div className="space-y-4">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <BookOpen size={16} />
              Nom de la matière
              {errors.name && touched.name && (
                <span className="text-red-500 text-xs flex items-center gap-1">
                  <AlertCircle size={12} />
                  {errors.name}
                </span>
              )}
            </label>
            <input
              type="text"
              value={subjectName}
              onChange={(e) => setSubjectName(e.target.value)}
              onBlur={() => setTouched(prev => ({ ...prev, name: true }))}
              className={`w-full px-4 py-2.5 rounded-lg border transition-colors ${
                errors.name && touched.name
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                  : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
              } focus:outline-none focus:ring-2`}
              placeholder="Ex: Mathématiques"
            />
          </div>
        </div>

        {/* Section 2: Planning hebdomadaire */}
        <div className="border-t pt-6">
          <h4 className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-4">
            <Calendar size={16} />
            Planning hebdomadaire
          </h4>
          
          {/* Jours d'étude */}
          <div className="mb-4">
            <p className="text-xs text-gray-600 mb-3">Jours d'étude prévus</p>
            <div className="flex gap-2 justify-center">
              {WEEKDAYS.map((day) => (
                <button
                  key={day.id}
                  onClick={() => handleDayToggle(day.id)}
                  className={`w-10 h-10 rounded-lg text-sm font-medium transition-all ${
                    selectedDays.includes(day.id)
                      ? 'bg-blue-500 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  title={day.full}
                >
                  {day.short}
                </button>
              ))}
            </div>
            {errors.days && (
              <p className="text-xs text-red-500 mt-2 text-center flex items-center justify-center gap-1">
                <AlertCircle size={12} />
                {errors.days}
              </p>
            )}
          </div>

          {/* Temps hebdomadaire */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-center mb-3">
              <p className="text-xs text-gray-600 mb-1">Objectif hebdomadaire</p>
              <p className="text-2xl font-bold text-gray-900">
                {Math.floor(weeklyTimeMinutes / 60)}h{(weeklyTimeMinutes % 60).toString().padStart(2, '0')}
              </p>
              {selectedDays.length > 0 && (
                <p className="text-sm text-gray-600 mt-1">
                  ≈ {formatDailyTime(dailyAverage)} par jour
                </p>
              )}
            </div>
            <ErgonomicTimeInput
              value={weeklyTimeMinutes}
              min={30}
              max={1200}
              onChange={setWeeklyTimeMinutes}
              className="mx-auto"
            />
          </div>
        </div>

        {/* Section 3: Configuration timer simplifiée */}
        <div className="border-t pt-6">
          <h4 className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-4">
            <Clock size={16} />
            Timer par défaut
          </h4>

          {/* Choix du mode */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <button
              onClick={() => setTimerMode('quick-create')}
              className={`p-3 rounded-lg border-2 transition-all ${
                timerMode === 'quick-create'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Timer size={20} className={timerMode === 'quick-create' ? 'text-blue-600 mx-auto mb-1' : 'text-gray-400 mx-auto mb-1'} />
              <p className="text-sm font-medium">Timer rapide</p>
            </button>
            
            <button
              onClick={() => setTimerMode('link-existing')}
              className={`p-3 rounded-lg border-2 transition-all ${
                timerMode === 'link-existing'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              } ${availableTimers.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={availableTimers.length === 0}
            >
              <Link2 size={20} className={timerMode === 'link-existing' ? 'text-blue-600 mx-auto mb-1' : 'text-gray-400 mx-auto mb-1'} />
              <p className="text-sm font-medium">Timer existant</p>
            </button>
          </div>

          {/* Configuration selon le mode */}
          {timerMode === 'quick-create' ? (
            <div className="space-y-4">
              {/* Type de timer */}
              <div className="flex gap-2">
                <button
                  onClick={() => setQuickTimerType('simple')}
                  className={`flex-1 py-2 px-3 rounded-lg border transition-all ${
                    quickTimerType === 'simple'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 text-gray-600'
                  }`}
                >
                  <span className="text-sm font-medium">Simple</span>
                </button>
                <button
                  onClick={() => setQuickTimerType('pomodoro')}
                  className={`flex-1 py-2 px-3 rounded-lg border transition-all ${
                    quickTimerType === 'pomodoro'
                      ? 'border-red-500 bg-red-50 text-red-700'
                      : 'border-gray-200 text-gray-600'
                  }`}
                >
                  <span className="text-sm font-medium">Pomodoro</span>
                </button>
              </div>

              {/* Configuration du timer */}
              <div className="bg-gray-50 rounded-lg p-4">
                {quickTimerType === 'simple' ? (
                  <div>
                    <p className="text-sm text-gray-600 text-center mb-3">Durée de la session</p>
                    <div className="flex justify-center items-center gap-4">
                      <button
                        onClick={() => setSimpleTimerDuration(Math.max(5, simpleTimerDuration - 5))}
                        className="w-8 h-8 rounded-full bg-white border border-gray-300 hover:bg-gray-50"
                      >
                        -
                      </button>
                      <span className="text-lg font-semibold w-16 text-center">{simpleTimerDuration} min</span>
                      <button
                        onClick={() => setSimpleTimerDuration(Math.min(120, simpleTimerDuration + 5))}
                        className="w-8 h-8 rounded-full bg-white border border-gray-300 hover:bg-gray-50"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Travail</p>
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setPomodoroWorkTime(Math.max(15, pomodoroWorkTime - 5))}
                            className="w-6 h-6 rounded bg-white border border-gray-300 text-xs hover:bg-gray-50"
                          >
                            -
                          </button>
                          <span className="text-sm font-medium w-12">{pomodoroWorkTime}m</span>
                          <button
                            onClick={() => setPomodoroWorkTime(Math.min(60, pomodoroWorkTime + 5))}
                            className="w-6 h-6 rounded bg-white border border-gray-300 text-xs hover:bg-gray-50"
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Pause</p>
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setPomodoroBreakTime(Math.max(3, pomodoroBreakTime - 1))}
                            className="w-6 h-6 rounded bg-white border border-gray-300 text-xs hover:bg-gray-50"
                          >
                            -
                          </button>
                          <span className="text-sm font-medium w-12">{pomodoroBreakTime}m</span>
                          <button
                            onClick={() => setPomodoroBreakTime(Math.min(15, pomodoroBreakTime + 1))}
                            className="w-6 h-6 rounded bg-white border border-gray-300 text-xs hover:bg-gray-50"
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Cycles</p>
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setPomodoroCycles(Math.max(2, pomodoroCycles - 1))}
                            className="w-6 h-6 rounded bg-white border border-gray-300 text-xs hover:bg-gray-50"
                          >
                            -
                          </button>
                          <span className="text-sm font-medium w-12">{pomodoroCycles}</span>
                          <button
                            onClick={() => setPomodoroCycles(Math.min(8, pomodoroCycles + 1))}
                            className="w-6 h-6 rounded bg-white border border-gray-300 text-xs hover:bg-gray-50"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div>
              {/* Timer actuellement lié */}
              {linkedTimer && (
                <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-xs text-green-700 mb-1 font-medium">Timer actuellement lié :</p>
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded bg-green-100">
                      {linkedTimer.isPomodoroMode ? <Coffee size={14} className="text-green-600" /> : <Timer size={14} className="text-green-600" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-green-800">{linkedTimer.title}</p>
                      <p className="text-xs text-green-600">{Math.round(linkedTimer.config.workDuration / 60)} min</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Liste des timers disponibles */}
              {availableTimers.length > 0 || linkedTimer ? (
                <div>
                  <p className="text-xs text-gray-600 mb-2">
                    {linkedTimer ? 'Changer pour un autre timer :' : 'Sélectionnez un timer :'}
                  </p>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {/* Créer une liste combinée de tous les timers */}
                    {(() => {
                      // Combiner le timer lié actuel avec les timers disponibles
                      const allTimers = linkedTimer 
                        ? [linkedTimer, ...availableTimers.filter(t => t.id !== linkedTimer.id)]
                        : availableTimers;
                      
                      return allTimers.map((timer) => (
                        <button
                          key={timer.id}
                          onClick={() => setSelectedExistingTimer(timer.id)}
                          className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all ${
                            selectedExistingTimer === timer.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <div className="p-2 rounded bg-gray-100">
                            {timer.isPomodoroMode ? <Coffee size={16} className="text-gray-600" /> : <Timer size={16} className="text-gray-600" />}
                          </div>
                          <div className="flex-1 text-left">
                            <p className="font-medium text-sm">{timer.title}</p>
                            <p className="text-xs text-gray-500">{Math.round(timer.config.workDuration / 60)} min</p>
                          </div>
                          {selectedExistingTimer === timer.id && (
                            <Check size={16} className="text-blue-600" />
                          )}
                        </button>
                      ));
                    })()}
                  </div>
                </div>
              ) : (
                <p className="text-center text-sm text-gray-500 py-4">
                  Aucun timer disponible
                </p>
              )}
              {errors.timer && (
                <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
                  <AlertCircle size={12} />
                  {errors.timer}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 p-6 bg-gray-50 border-t">
        {onCancel && (
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 px-4 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Annuler
          </button>
        )}
        <button
          onClick={handleSave}
          disabled={!isValid}
          className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-all ${
            isValid
              ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {isCreating ? 'Créer' : 'Enregistrer'}
        </button>
      </div>
    </div>
  );
};