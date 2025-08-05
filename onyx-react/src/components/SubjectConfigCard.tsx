import React, { useState, useEffect } from 'react';
import { ErgonomicTimeInput } from '@/components/ErgonomicTimeInput';
import { HorizontalSlider } from '@/components/HorizontalSlider';
import { Subject } from '@/types/Subject';
import { ActiveTimer } from '@/types/ActiveTimer';
import { BookOpen, Timer, Coffee, Link2, Plus, Check } from 'lucide-react';

interface SubjectConfigCardProps {
  subject?: Subject; // Optionnel pour création
  availableTimers?: ActiveTimer[];
  linkedTimer?: ActiveTimer | null;
  onSave?: (subjectData: SubjectFormData) => void;
  onCancel?: () => void;
  isCreating?: boolean; // Mode création vs édition
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
  { id: 1, short: 'Lun', full: 'Lundi' },
  { id: 2, short: 'Mar', full: 'Mardi' },
  { id: 3, short: 'Mer', full: 'Mercredi' },
  { id: 4, short: 'Jeu', full: 'Jeudi' },
  { id: 5, short: 'Ven', full: 'Vendredi' },
  { id: 6, short: 'Sam', full: 'Samedi' },
  { id: 0, short: 'Dim', full: 'Dimanche' }
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
  const [selectedDays, setSelectedDays] = useState<number[]>(
    subject?.studyDays.map(day => WEEKDAYS.find(w => w.full.toUpperCase() === day)?.id || 1) || [1, 2, 3, 4, 5]
  );
  const [timerMode, setTimerMode] = useState<TimerMode>('quick-create');
  const [quickTimerType, setQuickTimerType] = useState<QuickTimerType>('simple');
  const [selectedExistingTimer, setSelectedExistingTimer] = useState<string | null>(linkedTimer?.id || null);

  // Validation
  const [errors, setErrors] = useState<string[]>([]);

  // Configuration timer rapide - Timer simple
  const [simpleTimerDuration, setSimpleTimerDuration] = useState(45); // 45 min par défaut

  // Configuration timer rapide - Pomodoro
  const [pomodoroWorkTime, setPomodoroWorkTime] = useState(25);
  const [pomodoroBreakTime, setPomodoroBreakTime] = useState(5);
  const [pomodoroCycles, setPomodoroCycles] = useState(4);

  // Validation en temps réel
  useEffect(() => {
    const newErrors: string[] = [];
    
    if (!subjectName.trim()) {
      newErrors.push('Le nom de la matière est requis');
    } else if (subjectName.trim().length < 2) {
      newErrors.push('Le nom doit contenir au moins 2 caractères');
    }
    
    if (selectedDays.length === 0) {
      newErrors.push('Sélectionnez au moins un jour d\'étude');
    }
    
    if (timerMode === 'link-existing' && !selectedExistingTimer && availableTimers.length > 0) {
      newErrors.push('Sélectionnez un timer à lier');
    }
    
    setErrors(newErrors);
  }, [subjectName, selectedDays, timerMode, selectedExistingTimer, availableTimers.length]);

  useEffect(() => {
    // Si un timer est déjà lié, basculer en mode "link-existing"
    if (linkedTimer) {
      setTimerMode('link-existing');
      setSelectedExistingTimer(linkedTimer.id);
    }
  }, [linkedTimer]);

  const formatWeeklyTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  const calculateDailyAverage = () => {
    if (selectedDays.length === 0) return 0;
    return Math.round(weeklyTimeMinutes / selectedDays.length);
  };

  const formatDailyAverage = (minutes: number) => {
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h${mins.toString().padStart(2, '0')}` : `${hours}h`;
  };

  const handleWeeklyTimeChange = (minutes: number) => {
    setWeeklyTimeMinutes(minutes);
  };

  const handleDayToggle = (dayId: number) => {
    const newSelectedDays = selectedDays.includes(dayId)
      ? selectedDays.filter(id => id !== dayId)
      : [...selectedDays, dayId].sort();
    
    setSelectedDays(newSelectedDays);
  };

  const handleTimerModeChange = (mode: TimerMode) => {
    setTimerMode(mode);
    if (mode === 'quick-create') {
      setSelectedExistingTimer(null);
    }
  };

  const handleExistingTimerSelect = (timerId: string) => {
    setSelectedExistingTimer(timerId);
  };

  const handleSave = () => {
    if (errors.length > 0) {
      return; // Ne pas sauvegarder s'il y a des erreurs
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

  const getProgressPercentage = () => {
    if (!subject?.targetTime) return 0;
    return Math.min(100, (subject.timeSpent / subject.targetTime) * 100);
  };

  const isFormValid = errors.length === 0 && subjectName.trim().length >= 2;

  const dailyAverage = calculateDailyAverage();

  return (
    <div className={`bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden w-full max-w-md ${className}`}>
      {/* Header */}
      <div className="p-5 bg-gradient-to-r from-indigo-50 to-blue-50 border-b border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 bg-indigo-100 rounded-lg">
            <BookOpen size={20} className="text-indigo-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-gray-900">
              {isCreating ? 'Nouvelle Matière' : 'Configuration'}
            </h3>
            <p className="text-sm text-gray-600">
              {isCreating ? 'Créez votre matière d\'étude' : `Modifier ${subject?.name}`}
            </p>
          </div>
        </div>

        {/* Barre de progression (uniquement en mode édition) */}
        {!isCreating && subject && (
          <div className="mb-2">
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>Progression</span>
              <span>{Math.round(getProgressPercentage())}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-blue-600 transition-all duration-300"
                style={{ width: `${getProgressPercentage()}%` }}
              />
            </div>
          </div>
        )}

        {/* Affichage des erreurs */}
        {errors.length > 0 && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <ul className="text-sm text-red-600 space-y-1">
              {errors.map((error, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-red-400 mt-0.5">•</span>
                  <span>{error}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Contenu principal */}
      <div className="p-5 space-y-6">
        
        {/* 1. Nom de la matière */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">
            Nom de la matière <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={subjectName}
            onChange={(e) => setSubjectName(e.target.value)}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all ${
              errors.some(e => e.includes('nom')) 
                ? 'border-red-300 bg-red-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            placeholder="ex: Mathématiques, Histoire..."
            maxLength={50}
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>Minimum 2 caractères</span>
            <span>{subjectName.length}/50</span>
          </div>
        </div>

        {/* Séparateur visuel */}
        <div className="border-t border-gray-100"></div>
        
        {/* 2. Temps hebdomadaire */}
        <div className="space-y-3">
          <div className="text-center">
            <h4 className="text-sm font-semibold text-gray-700 mb-1">Objectif hebdomadaire</h4>
            <div className="text-2xl font-bold text-indigo-600 mb-2">
              {formatWeeklyTime(weeklyTimeMinutes)}
            </div>
          </div>
          
          <div className="flex justify-center">
            <ErgonomicTimeInput
              value={weeklyTimeMinutes}
              min={30}
              max={1200}
              onChange={handleWeeklyTimeChange}
              className="mx-auto"
            />
          </div>
          
          {selectedDays.length > 0 && (
            <div className="text-center text-sm text-gray-600 bg-indigo-50 rounded-lg py-2 px-3">
              📅 Moyenne : <span className="font-semibold text-indigo-700">{formatDailyAverage(dailyAverage)}/jour</span>
            </div>
          )}
        </div>

        {/* Séparateur visuel */}
        <div className="border-t border-gray-100"></div>

        {/* 3. Jours d'étude préférés */}
        <div className="space-y-3">
          <div className="text-center">
            <h4 className="text-sm font-semibold text-gray-700 mb-1">Jours d'étude</h4>
            <p className="text-xs text-gray-500">Sélectionnez vos jours de travail</p>
          </div>
          <div className="flex justify-center">
            <div className="grid grid-cols-7 gap-2">
              {WEEKDAYS.map((day) => (
                <button
                  key={day.id}
                  onClick={() => handleDayToggle(day.id)}
                  className={`w-10 h-10 rounded-xl text-xs font-bold transition-all duration-200 ${
                    selectedDays.includes(day.id)
                      ? 'bg-indigo-600 text-white shadow-md ring-2 ring-indigo-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:scale-105'
                  }`}
                  title={day.full}
                >
                  {day.short.charAt(0)}
                </button>
              ))}
            </div>
          </div>
          {selectedDays.length === 0 && (
            <div className="text-center text-xs text-red-500 bg-red-50 rounded-lg py-2">
              ⚠️ Veuillez sélectionner au moins un jour
            </div>
          )}
        </div>

        {/* 3. Mode de timer */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3 text-center">Type de timer</h4>
          
          {/* Choix du mode */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <button
              onClick={() => handleTimerModeChange('quick-create')}
              className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                timerMode === 'quick-create'
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <div className="flex flex-col items-center space-y-1">
                <Plus size={16} />
                <span className="text-xs font-medium">Timer rapide</span>
              </div>
            </button>
            
            <button
              onClick={() => handleTimerModeChange('link-existing')}
              className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                timerMode === 'link-existing'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
              disabled={availableTimers.length === 0}
            >
              <div className="flex flex-col items-center space-y-1">
                <Link2 size={16} />
                <span className="text-xs font-medium">Timer lié</span>
              </div>
            </button>
          </div>

          {/* Interface selon le mode */}
          {timerMode === 'quick-create' ? (
            <div className="space-y-4">
              {/* Choix du type de timer rapide */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setQuickTimerType('simple')}
                  className={`p-2 rounded-lg border transition-all duration-200 ${
                    quickTimerType === 'simple'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1">
                    <Timer size={14} />
                    <span className="text-xs font-medium">Simple</span>
                  </div>
                </button>
                
                <button
                  onClick={() => setQuickTimerType('pomodoro')}
                  className={`p-2 rounded-lg border transition-all duration-200 ${
                    quickTimerType === 'pomodoro'
                      ? 'border-red-500 bg-red-50 text-red-700'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1">
                    <Coffee size={14} />
                    <span className="text-xs font-medium">Pomodoro</span>
                  </div>
                </button>
              </div>

              {/* Configuration avec sliders horizontaux */}
              {quickTimerType === 'simple' ? (
                <div className="text-center">
                  <HorizontalSlider
                    value={simpleTimerDuration}
                    min={5}
                    max={120}
                    step={5}
                    onChange={setSimpleTimerDuration}
                    width={200}
                    unit="min"
                    label="Durée totale"
                    className="mx-auto"
                  />
                </div>
              ) : (
                <div>
                  <div className="space-y-4 mb-3">
                    <HorizontalSlider
                      value={pomodoroWorkTime}
                      min={15}
                      max={60}
                      step={5}
                      onChange={setPomodoroWorkTime}
                      width={200}
                      unit="min"
                      label="Temps de travail"
                      className="mx-auto"
                    />
                    
                    <HorizontalSlider
                      value={pomodoroBreakTime}
                      min={3}
                      max={15}
                      step={1}
                      onChange={setPomodoroBreakTime}
                      width={200}
                      unit="min"
                      label="Temps de pause"
                      className="mx-auto"
                    />
                    
                    <HorizontalSlider
                      value={pomodoroCycles}
                      min={2}
                      max={8}
                      step={1}
                      onChange={setPomodoroCycles}
                      width={200}
                      unit=""
                      label="Nombre de cycles"
                      className="mx-auto"
                    />
                  </div>
                  
                  <div className="text-center text-xs text-gray-600 bg-red-50 rounded-lg p-2">
                    {pomodoroWorkTime}min travail • {pomodoroBreakTime}min pause • {pomodoroCycles} cycles
                  </div>
                </div>
              )}

              {/* Bouton créer */}
            </div>
          ) : (
            /* Mode timer lié */
            <div className="space-y-3">
              {linkedTimer ? (
                /* Timer déjà lié */
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1 bg-blue-100 rounded">
                        {linkedTimer.isPomodoroMode ? '🍅' : '⏱️'}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-blue-900">
                          {linkedTimer.title}
                        </div>
                        <div className="text-xs text-blue-700">
                          {Math.round(linkedTimer.config.workDuration / 60)}min
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedExistingTimer(null);
                      }}
                      className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded transition-colors"
                    >
                      <Link2 size={14} className="rotate-45" />
                    </button>
                  </div>
                </div>
              ) : (
                /* Sélection de timer */
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {availableTimers.length > 0 ? (
                    availableTimers.map((timer) => (
                      <button
                        key={timer.id}
                        onClick={() => handleExistingTimerSelect(timer.id)}
                        className={`w-full flex items-center gap-3 p-2 rounded-lg border transition-colors text-left ${
                          selectedExistingTimer === timer.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <div className="p-1 bg-gray-100 rounded text-sm">
                          {timer.isPomodoroMode ? '🍅' : '⏱️'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {timer.title}
                          </div>
                          <div className="text-xs text-gray-500">
                            {Math.round(timer.config.workDuration / 60)}min
                          </div>
                        </div>
                        {selectedExistingTimer === timer.id && (
                          <Check size={16} className="text-blue-600" />
                        )}
                      </button>
                    ))
                  ) : (
                    <div className="text-center text-xs text-gray-500 py-4">
                      Aucun timer disponible
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Boutons d'action intégrés */}
      <div className="p-5 bg-gray-50 border-t border-gray-200 flex gap-3">
        {onCancel && (
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Annuler
          </button>
        )}
        <button
          onClick={handleSave}
          disabled={!isFormValid}
          className={`flex-1 px-4 py-3 rounded-lg transition-colors font-medium ${
            isFormValid
              ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            {isCreating ? <Plus size={16} /> : <Check size={16} />}
            {isCreating ? 'Créer la Matière' : 'Sauvegarder'}
          </div>
        </button>
      </div>
    </div>
  );
};