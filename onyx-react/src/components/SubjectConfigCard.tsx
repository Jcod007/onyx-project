import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Subject } from '@/types/Subject';
import { ActiveTimer } from '@/types/ActiveTimer';
import { SubjectBasicInfo } from './subject-config/SubjectBasicInfo';
import { SubjectScheduling } from './subject-config/SubjectScheduling';
import { SubjectTimerConfig } from './subject-config/SubjectTimerConfig';
import { useSubjectTimeManagement } from '@/hooks/useSubjectTimeManagement';

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

export const SubjectConfigCard: React.FC<SubjectConfigCardProps> = ({
  subject,
  availableTimers = [],
  linkedTimer,
  onSave,
  onCancel,
  isCreating = true,
  className = ''
}) => {
  const { t } = useTranslation();
  // États du formulaire de base
  const [subjectName, setSubjectName] = useState(subject?.name || '');
  
  // Utilisation du hook centralisé pour la gestion des temps
  const timeManagement = useSubjectTimeManagement({ subject });

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

  // Validation
  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!subjectName.trim()) {
      newErrors.name = t('subjectConfig.nameRequired', 'Le nom est requis');
    }
    
    if (timeManagement.activeDaysCount === 0) {
      newErrors.days = t('subjectConfig.defineStudyDays', 'Définissez au moins un jour avec du temps d\'étude');
    }
    
    if (timerMode === 'link-existing' && !selectedExistingTimer && availableTimers.length > 0) {
      newErrors.timer = t('subjectConfig.selectTimer', 'Sélectionnez un timer');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    setTouched({ name: true, days: true, timer: true });
    
    if (!validateForm()) return;
    
    const totalWeeklyTime = timeManagement.totalWeeklyTime;
    const trimmedName = subjectName.trim();

    const formData: SubjectFormData = {
      name: trimmedName,
      weeklyTimeMinutes: totalWeeklyTime,
      selectedDays: timeManagement.selectedDays,
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

  const isValid = Object.keys(errors).length === 0 && subjectName.trim().length > 0;

  return (
    <div className={`bg-white rounded-xl shadow-lg overflow-hidden max-w-4xl mx-auto ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {isCreating ? t('subjectConfig.createSubject', 'Créer une matière') : t('subjectConfig.editSubject', 'Modifier la matière')}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {t('subjectConfig.configureSubject', 'Configurez votre matière d\'\u00e9tude')}
            </p>
          </div>
          
          {onCancel && (
            <button
              onClick={onCancel}
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              {t('subjectConfig.cancel', 'Annuler')}
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-8 py-8 space-y-8">
        {/* Section 1: Informations de base */}
        <SubjectBasicInfo
          subjectName={subjectName}
          onNameChange={setSubjectName}
          errors={errors}
          touched={touched}
          onBlur={() => setTouched(prev => ({ ...prev, name: true }))}
          isCreating={isCreating}
          existingName={subject?.name}
        />

        {/* Section 2: Planning */}
        <div className="border-t pt-8">
          <SubjectScheduling
            globalHours={timeManagement.globalHours}
            globalMinutes={timeManagement.globalMinutes}
            globalSeconds={timeManagement.globalSeconds}
            onGlobalTimeChange={timeManagement.handleGlobalTimeChange}
            dailyTimes={timeManagement.dailyTimes}
            onDayTimeChange={timeManagement.handleDayTimeChange}
            selectedDays={timeManagement.selectedDays}
            onSelectedDaysChange={timeManagement.handleSelectedDaysChange}
            configMode={timeManagement.configMode}
            onConfigModeChange={timeManagement.handleConfigModeChange}
            weeklyTimeMinutes={timeManagement.weeklyTimeMinutes}
            errors={errors}
          />
        </div>

        {/* Section 3: Timer */}
        <div className="border-t pt-8">
          <SubjectTimerConfig
            timerMode={timerMode}
            onTimerModeChange={setTimerMode}
            quickTimerType={quickTimerType}
            onQuickTimerTypeChange={setQuickTimerType}
            simpleTimerDuration={simpleTimerDuration}
            onSimpleTimerDurationChange={setSimpleTimerDuration}
            pomodoroWorkTime={pomodoroWorkTime}
            onPomodoroWorkTimeChange={setPomodoroWorkTime}
            pomodoroBreakTime={pomodoroBreakTime}
            onPomodoroBreakTimeChange={setPomodoroBreakTime}
            pomodoroLongBreakTime={pomodoroLongBreakTime}
            onPomodoroLongBreakTimeChange={setPomodoroLongBreakTime}
            pomodoroCycles={pomodoroCycles}
            onPomodoroCyclesChange={setPomodoroCycles}
            availableTimers={availableTimers}
            linkedTimer={linkedTimer}
            selectedExistingTimer={selectedExistingTimer}
            onSelectedExistingTimerChange={setSelectedExistingTimer}
            errors={errors}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="bg-gray-50 px-8 py-6 flex items-center justify-end gap-4 border-t">
        {onCancel && (
          <button
            onClick={onCancel}
            className="px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-medium"
          >
            Annuler
          </button>
        )}
        <button
          onClick={handleSave}
          disabled={!isValid}
          className={`px-8 py-3 rounded-xl font-medium transition-all ${
            isValid
              ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {isCreating ? t('subjectConfig.create', 'Créer') : t('subjectConfig.save', 'Enregistrer')}
        </button>
      </div>
    </div>
  );
};