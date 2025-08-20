import React, { useState, useEffect } from 'react';
import { Subject } from '@/types/Subject';
import { ActiveTimer } from '@/types/ActiveTimer';
import { BookOpen, Timer, Coffee, Link2, Check, Calendar, Clock, AlertCircle } from 'lucide-react';
import { formatMinutesToHours } from '@/utils/timeFormat';

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
      longBreakTime: number;
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
  // État du formulaire principal
  const [subjectName, setSubjectName] = useState(subject?.name || '');
  const [weeklyTimeMinutes, setWeeklyTimeMinutes] = useState(subject?.weeklyTimeGoal || 240);
  const [selectedDays, setSelectedDays] = useState<number[]>(() => {
    if (subject?.studyDays?.length) {
      // Mapping des jours de DayOfWeek vers les IDs WEEKDAYS
      const dayMapping: Record<string, number> = {
        'MONDAY': 1,
        'TUESDAY': 2,
        'WEDNESDAY': 3,
        'THURSDAY': 4,
        'FRIDAY': 5,
        'SATURDAY': 6,
        'SUNDAY': 0
      };
      
      return subject.studyDays
        .map(day => dayMapping[day])
        .filter((id): id is number => id !== undefined);
    }
    return [1, 2, 3, 4, 5]; // Lun-Ven par défaut
  });

  // Configuration timer
  const [timerMode, setTimerMode] = useState<TimerMode>(() => {
    return linkedTimer ? 'link-existing' : 'quick-create';
  });
  const [quickTimerType, setQuickTimerType] = useState<QuickTimerType>('simple');
  const [selectedExistingTimer, setSelectedExistingTimer] = useState<string | null>(linkedTimer?.id || null);
  const [simpleTimerDuration, setSimpleTimerDuration] = useState(25);
  const [pomodoroWorkTime, setPomodoroWorkTime] = useState(25);
  const [pomodoroBreakTime, setPomodoroBreakTime] = useState(5);
  const [pomodoroLongBreakTime, setPomodoroLongBreakTime] = useState(15);
  const [pomodoroCycles, setPomodoroCycles] = useState(4);

  // Validation
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});

  // Initialisation depuis le sujet existant
  useEffect(() => {
    if (subject && !isCreating) {
      setSubjectName(subject.name);
      setWeeklyTimeMinutes(subject.weeklyTimeGoal || 240);
      
      // Réinitialiser les jours d'étude
      if (subject.studyDays?.length) {
        const dayMapping: Record<string, number> = {
          'MONDAY': 1,
          'TUESDAY': 2,
          'WEDNESDAY': 3,
          'THURSDAY': 4,
          'FRIDAY': 5,
          'SATURDAY': 6,
          'SUNDAY': 0
        };
        
        const mappedDays = subject.studyDays
          .map(day => dayMapping[day])
          .filter((id): id is number => id !== undefined);
        
        setSelectedDays(mappedDays);
      } else {
        setSelectedDays([1, 2, 3, 4, 5]); // Lun-Ven par défaut
      }
      
      // Configuration timer depuis le sujet
      if (subject.quickTimerConfig) {
        setTimerMode('quick-create');
        if (subject.quickTimerConfig.type === 'pomodoro') {
          setQuickTimerType('pomodoro');
          setPomodoroWorkTime(subject.quickTimerConfig.workDuration || 25);
          setPomodoroBreakTime(subject.quickTimerConfig.shortBreakDuration || 5);
          setPomodoroLongBreakTime(subject.quickTimerConfig.longBreakDuration || 15);
          setPomodoroCycles(subject.quickTimerConfig.cycles || 4);
        } else {
          setQuickTimerType('simple');
          setSimpleTimerDuration(subject.quickTimerConfig.workDuration || 25);
        }
      }
    }
  }, [subject, isCreating]);

  // Gestion du timer lié
  useEffect(() => {
    if (linkedTimer) {
      setTimerMode('link-existing');
      setSelectedExistingTimer(linkedTimer.id);
    }
  }, [linkedTimer]);

  // Validation en temps réel
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
    
    const trimmedName = subjectName.trim();
    if (!trimmedName || Object.keys(errors).length > 0) {
      return;
    }

    const formData: SubjectFormData = {
      name: trimmedName,
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
                      longBreakTime: pomodoroLongBreakTime,
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

  const handleWeeklyTimeChange = (field: 'hours' | 'minutes', value: string) => {
    const numValue = parseInt(value) || 0;
    
    if (field === 'hours') {
      const validHours = Math.max(0, Math.min(20, numValue));
      const currentMinutes = weeklyTimeMinutes % 60;
      setWeeklyTimeMinutes(Math.max(30, validHours * 60 + currentMinutes));
    } else {
      const validMinutes = Math.max(0, Math.min(59, numValue));
      const currentHours = Math.floor(weeklyTimeMinutes / 60);
      setWeeklyTimeMinutes(Math.max(30, currentHours * 60 + validMinutes));
    }
  };

  const dailyAverage = selectedDays.length > 0 ? Math.round(weeklyTimeMinutes / selectedDays.length) : 0;
  const isValid = Object.keys(errors).length === 0 && subjectName.trim().length > 0;

  return (
    <div className={`bg-white rounded-xl shadow-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6">
        <h3 className="text-xl font-bold text-gray-900">
          {isCreating ? 'Nouvelle matière' : `Modifier ${subject?.name}`}
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Configurez votre matière d'étude
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* Section 1: Nom de la matière */}
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
            maxLength={50}
          />
        </div>

        {/* Section 2: Planning hebdomadaire */}
        <div className="border-t pt-6">
          <h4 className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-4">
            <Calendar size={16} />
            Planning hebdomadaire
          </h4>
          
          {/* Jours d'étude */}
          <div className="mb-4">
            <p className="text-xs text-gray-600 mb-3 text-center">Jours d'étude prévus</p>
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
            <p className="text-xs text-gray-600 mb-3 text-center">Objectif hebdomadaire</p>
            
            <div className="flex items-center justify-center gap-1 mb-3">
              <input
                type="number"
                value={Math.floor(weeklyTimeMinutes / 60)}
                onChange={(e) => handleWeeklyTimeChange('hours', e.target.value)}
                className="w-16 text-center text-2xl font-bold bg-white rounded-lg border border-gray-300 focus:border-blue-500 focus:outline-none py-1"
                min="0"
                max="20"
              />
              <span className="text-2xl font-bold text-gray-700">h</span>
              <input
                type="number"
                value={weeklyTimeMinutes % 60}
                onChange={(e) => handleWeeklyTimeChange('minutes', e.target.value)}
                className="w-16 text-center text-2xl font-bold bg-white rounded-lg border border-gray-300 focus:border-blue-500 focus:outline-none py-1"
                min="0"
                max="59"
              />
            </div>

            {selectedDays.length > 0 && (
              <p className="text-sm text-gray-600 text-center">
                {formatDailyTime(dailyAverage)} par jour
              </p>
            )}
          </div>
        </div>

        {/* Section 3: Configuration timer */}
        <div className="border-t pt-6">
          <h4 className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-4">
            <Clock size={16} />
            Configuration du timer
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
              <p className="text-sm font-medium">Timer libre</p>
              <p className="text-xs text-gray-500 mt-1">Créer un nouveau timer</p>
            </button>
            
            <button
              onClick={() => setTimerMode('link-existing')}
              className={`p-3 rounded-lg border-2 transition-all ${
                timerMode === 'link-existing'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              } ${availableTimers.length === 0 && !linkedTimer ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={availableTimers.length === 0 && !linkedTimer}
            >
              <Link2 size={20} className={timerMode === 'link-existing' ? 'text-blue-600 mx-auto mb-1' : 'text-gray-400 mx-auto mb-1'} />
              <p className="text-sm font-medium">Timer lié</p>
              <p className="text-xs text-gray-500 mt-1">Utiliser un timer existant</p>
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
                  <span className="text-sm font-medium">Timer Simple</span>
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
                    
                    <div className="flex items-center justify-center gap-1 mb-3">
                      <input
                        type="number"
                        value={simpleTimerDuration}
                        onChange={(e) => setSimpleTimerDuration(Math.max(5, Math.min(120, parseInt(e.target.value) || 5)))}
                        className="w-16 text-center text-xl font-semibold bg-white rounded border border-gray-300 focus:border-blue-500 focus:outline-none"
                        min="5"
                        max="120"
                      />
                      <span className="text-xl text-gray-700">min</span>
                    </div>

                    <div className="flex justify-center gap-2">
                      {[15, 25, 45, 60].map(duration => (
                        <button
                          key={duration}
                          onClick={() => setSimpleTimerDuration(duration)}
                          className={`px-3 py-1 text-sm rounded-lg transition-all ${
                            simpleTimerDuration === duration
                              ? 'bg-blue-500 text-white'
                              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {duration}m
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-3">Configuration Pomodoro</p>
                      
                      {/* Presets rapides */}
                      <div className="flex justify-center gap-2 mb-4">
                        {[
                          { name: '25/5', work: 25, break: 5, longBreak: 15, cycles: 4 },
                          { name: '50/10', work: 50, break: 10, longBreak: 30, cycles: 3 },
                          { name: '45/15', work: 45, break: 15, longBreak: 30, cycles: 3 }
                        ].map((preset) => (
                          <button
                            key={preset.name}
                            onClick={() => {
                              setPomodoroWorkTime(preset.work);
                              setPomodoroBreakTime(preset.break);
                              setPomodoroLongBreakTime(preset.longBreak);
                              setPomodoroCycles(preset.cycles);
                            }}
                            className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${
                              pomodoroWorkTime === preset.work && pomodoroBreakTime === preset.break
                                ? 'bg-red-500 text-white border-red-500'
                                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            {preset.name}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      {/* Temps de travail */}
                      <div className="text-center">
                        <p className="text-xs text-gray-600 mb-2 font-medium">Temps de travail</p>
                        <div className="flex items-center justify-center gap-1">
                          <input
                            type="number"
                            value={pomodoroWorkTime}
                            onChange={(e) => setPomodoroWorkTime(Math.max(15, Math.min(60, parseInt(e.target.value) || 25)))}
                            className="w-16 text-center text-lg font-semibold bg-white rounded-lg border border-gray-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 py-2 px-2"
                            min="15"
                            max="60"
                          />
                          <span className="text-lg text-gray-700 font-medium">min</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">(15-60)</p>
                      </div>

                      {/* Temps de pause courte */}
                      <div className="text-center">
                        <p className="text-xs text-gray-600 mb-2 font-medium">Pause courte</p>
                        <div className="flex items-center justify-center gap-1">
                          <input
                            type="number"
                            value={pomodoroBreakTime}
                            onChange={(e) => setPomodoroBreakTime(Math.max(3, Math.min(15, parseInt(e.target.value) || 5)))}
                            className="w-16 text-center text-lg font-semibold bg-white rounded-lg border border-gray-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 py-2 px-2"
                            min="3"
                            max="15"
                          />
                          <span className="text-lg text-gray-700 font-medium">min</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">(3-15)</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Pause longue */}
                      <div className="text-center">
                        <p className="text-xs text-gray-600 mb-2 font-medium">Pause longue</p>
                        <div className="flex items-center justify-center gap-1">
                          <input
                            type="number"
                            value={pomodoroLongBreakTime}
                            onChange={(e) => setPomodoroLongBreakTime(Math.max(10, Math.min(60, parseInt(e.target.value) || 15)))}
                            className="w-16 text-center text-lg font-semibold bg-white rounded-lg border border-gray-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 py-2 px-2"
                            min="10"
                            max="60"
                          />
                          <span className="text-lg text-gray-700 font-medium">min</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">(10-60)</p>
                      </div>

                      {/* Nombre de cycles */}
                      <div className="text-center">
                        <p className="text-xs text-gray-600 mb-2 font-medium">Nombre de cycles</p>
                        <div className="flex items-center justify-center gap-1">
                          <input
                            type="number"
                            value={pomodoroCycles}
                            onChange={(e) => setPomodoroCycles(Math.max(2, Math.min(8, parseInt(e.target.value) || 4)))}
                            className="w-16 text-center text-lg font-semibold bg-white rounded-lg border border-gray-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 py-2 px-2"
                            min="2"
                            max="8"
                          />
                          <span className="text-lg text-gray-700 font-medium">cycles</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">(2-8)</p>
                      </div>
                    </div>

                    {/* Descriptif du fonctionnement Pomodoro */}
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="text-center">
                        <p className="text-xs font-medium text-blue-800 mb-2">🍅 Aperçu de la session</p>
                        <div className="text-xs text-blue-700 space-y-1">
                          <p><span className="font-medium">{pomodoroCycles - 1} cycles</span> : {pomodoroWorkTime}min travail → {pomodoroBreakTime}min pause</p>
                          <p><span className="font-medium">Dernier cycle</span> : {pomodoroWorkTime}min travail → {pomodoroLongBreakTime}min pause longue</p>
                          <p className="pt-1 border-t border-blue-300 text-blue-600">
                            <span className="font-medium">Total session</span> : {Math.floor((pomodoroWorkTime * pomodoroCycles + pomodoroBreakTime * (pomodoroCycles - 1) + pomodoroLongBreakTime) / 60)}h{((pomodoroWorkTime * pomodoroCycles + pomodoroBreakTime * (pomodoroCycles - 1) + pomodoroLongBreakTime) % 60).toString().padStart(2, '0')}
                          </p>
                        </div>
                      </div>
                    </div>

                  </div>
                )}
              </div>
            </div>
          ) : (
            <div>
              {linkedTimer && (
                <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-xs text-green-700 mb-1 font-medium">Timer actuellement lié :</p>
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded bg-green-100">
                      {linkedTimer.isPomodoroMode ? <Coffee size={14} className="text-green-600" /> : <Timer size={14} className="text-green-600" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-green-800">{linkedTimer.title}</p>
                      <p className="text-xs text-green-600">{formatMinutesToHours(Math.round(linkedTimer.config.workDuration / 60))}</p>
                    </div>
                  </div>
                </div>
              )}

              {(availableTimers.length > 0 || linkedTimer) ? (
                <div>
                  <p className="text-xs text-gray-600 mb-2 text-center">
                    {linkedTimer ? 'Changer pour un autre timer :' : 'Sélectionnez un timer :'}
                  </p>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {(() => {
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
                            <p className="text-xs text-gray-500">{formatMinutesToHours(Math.round(timer.config.workDuration / 60))}</p>
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