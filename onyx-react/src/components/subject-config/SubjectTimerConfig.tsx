import React from 'react';
import { Clock, Timer, Coffee, Link2, Check, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ActiveTimer } from '@/types/ActiveTimer';
import { formatMinutesToHours } from '@/utils/timeFormat';

type TimerMode = 'quick-create' | 'link-existing';
type QuickTimerType = 'simple' | 'pomodoro';


interface SubjectTimerConfigProps {
  // Timer mode
  timerMode: TimerMode;
  onTimerModeChange: (mode: TimerMode) => void;
  
  // Quick timer config
  quickTimerType: QuickTimerType;
  onQuickTimerTypeChange: (type: QuickTimerType) => void;
  simpleTimerDuration: number;
  onSimpleTimerDurationChange: (duration: number) => void;
  
  // Pomodoro config
  pomodoroWorkTime: number;
  onPomodoroWorkTimeChange: (time: number) => void;
  pomodoroBreakTime: number;
  onPomodoroBreakTimeChange: (time: number) => void;
  pomodoroLongBreakTime: number;
  onPomodoroLongBreakTimeChange: (time: number) => void;
  pomodoroCycles: number;
  onPomodoroCyclesChange: (cycles: number) => void;
  
  // Existing timers
  availableTimers: ActiveTimer[];
  linkedTimer?: ActiveTimer | null;
  selectedExistingTimer: string | null;
  onSelectedExistingTimerChange: (timerId: string | null) => void;
  
  // Validation
  errors: { [key: string]: string };
}

export const SubjectTimerConfig: React.FC<SubjectTimerConfigProps> = ({
  timerMode,
  onTimerModeChange,
  quickTimerType,
  onQuickTimerTypeChange,
  simpleTimerDuration,
  onSimpleTimerDurationChange,
  pomodoroWorkTime,
  onPomodoroWorkTimeChange,
  pomodoroBreakTime,
  onPomodoroBreakTimeChange,
  pomodoroLongBreakTime,
  onPomodoroLongBreakTimeChange,
  pomodoroCycles,
  onPomodoroCyclesChange,
  availableTimers,
  linkedTimer,
  selectedExistingTimer,
  onSelectedExistingTimerChange,
  errors
}) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Clock size={24} className="text-orange-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900">
          {t('timerConfig.title', 'Configuration du timer')}
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          {t('timerConfig.subtitle', 'Choisissez votre méthode de travail préférée')}
        </p>
      </div>


      {/* Mode selection */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <button
          onClick={() => onTimerModeChange('quick-create')}
          className={`p-4 rounded-xl border-2 transition-all ${
            timerMode === 'quick-create'
              ? 'border-orange-500 bg-orange-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <Timer size={24} className={timerMode === 'quick-create' ? 'text-orange-600 mx-auto mb-2' : 'text-gray-400 mx-auto mb-2'} />
          <p className="text-sm font-medium">{t('timerConfig.customTimer', 'Timer personnalisé')}</p>
          <p className="text-xs text-gray-500 mt-1">{t('timerConfig.createNewTimer', 'Créer un nouveau timer')}</p>
        </button>
        
        <button
          onClick={() => onTimerModeChange('link-existing')}
          className={`p-4 rounded-xl border-2 transition-all ${
            timerMode === 'link-existing'
              ? 'border-orange-500 bg-orange-50'
              : 'border-gray-200 hover:border-gray-300'
          } ${availableTimers.length === 0 && !linkedTimer ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={availableTimers.length === 0 && !linkedTimer}
        >
          <Link2 size={24} className={timerMode === 'link-existing' ? 'text-orange-600 mx-auto mb-2' : 'text-gray-400 mx-auto mb-2'} />
          <p className="text-sm font-medium">{t('timerConfig.existingTimer', 'Timer existant')}</p>
          <p className="text-xs text-gray-500 mt-1">{t('timerConfig.useCreatedTimer', 'Utiliser un timer créé')}</p>
        </button>
      </div>

      {/* Configuration selon le mode */}
      {timerMode === 'quick-create' ? (
        <div className="space-y-6">
          {/* Type de timer */}
          <div className="flex gap-3">
            <button
              onClick={() => onQuickTimerTypeChange('simple')}
              className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all ${
                quickTimerType === 'simple'
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-200 text-gray-600 hover:border-green-200'
              }`}
            >
              <Timer size={20} className="mx-auto mb-1" />
              <span className="text-sm font-medium block">{t('timerConfig.simpleTimer', 'Timer Simple')}</span>
            </button>
            <button
              onClick={() => onQuickTimerTypeChange('pomodoro')}
              className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all ${
                quickTimerType === 'pomodoro'
                  ? 'border-red-500 bg-red-50 text-red-700'
                  : 'border-gray-200 text-gray-600 hover:border-red-200'
              }`}
            >
              <Coffee size={20} className="mx-auto mb-1" />
              <span className="text-sm font-medium block">{t('timerConfig.pomodoro', 'Pomodoro')}</span>
            </button>
          </div>

          {/* Configuration du timer */}
          <div className="bg-gray-50 rounded-xl p-6">
            {quickTimerType === 'simple' ? (
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-4">{t('timerConfig.sessionDuration', 'Durée de votre session de travail')}</p>
                
                <div className="flex items-center justify-center gap-2 mb-6">
                  <input
                    type="number"
                    value={simpleTimerDuration}
                    onChange={(e) => onSimpleTimerDurationChange(Math.max(5, Math.min(120, parseInt(e.target.value) || 5)))}
                    className="w-24 text-center text-3xl font-bold bg-white rounded-xl border-2 border-gray-300 focus:border-green-500 focus:outline-none py-3"
                    min="5"
                    max="120"
                  />
                  <span className="text-3xl text-gray-700 font-bold">min</span>
                </div>

                <div className="flex justify-center gap-3">
                  {[15, 25, 45, 60, 90].map(duration => (
                    <button
                      key={duration}
                      onClick={() => onSimpleTimerDurationChange(duration)}
                      className={`px-4 py-2 text-sm font-medium rounded-xl transition-all ${
                        simpleTimerDuration === duration
                          ? 'bg-green-500 text-white shadow-sm'
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
                  <p className="text-sm text-gray-600 mb-4">{t('timerConfig.pomodoroConfig', 'Configuration de votre session Pomodoro')}</p>
                  
                  {/* Presets rapides */}
                  <div className="flex justify-center gap-3 mb-6">
                    {[
                      { name: '25/5', work: 25, break: 5, longBreak: 15, cycles: 4 },
                      { name: '50/10', work: 50, break: 10, longBreak: 30, cycles: 3 },
                      { name: '45/15', work: 45, break: 15, longBreak: 30, cycles: 3 }
                    ].map((preset) => (
                      <button
                        key={preset.name}
                        onClick={() => {
                          onPomodoroWorkTimeChange(preset.work);
                          onPomodoroBreakTimeChange(preset.break);
                          onPomodoroLongBreakTimeChange(preset.longBreak);
                          onPomodoroCyclesChange(preset.cycles);
                        }}
                        className={`px-4 py-2 text-sm font-medium rounded-xl border-2 transition-all ${
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
                
                <div className="grid grid-cols-2 gap-6">
                  {/* Temps de travail */}
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-700 mb-3">{t('timerConfig.workTime', 'Temps de travail')}</p>
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <input
                        type="number"
                        value={pomodoroWorkTime}
                        onChange={(e) => onPomodoroWorkTimeChange(Math.max(15, Math.min(60, parseInt(e.target.value) || 25)))}
                        className="w-20 text-center text-xl font-bold bg-white rounded-xl border-2 border-gray-300 focus:border-red-500 focus:outline-none py-2"
                        min="15"
                        max="60"
                      />
                      <span className="text-xl font-bold text-gray-700">min</span>
                    </div>
                    <p className="text-xs text-gray-500">(15-60 min)</p>
                  </div>

                  {/* Temps de pause courte */}
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-700 mb-3">{t('timerConfig.shortBreak', 'Pause courte')}</p>
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <input
                        type="number"
                        value={pomodoroBreakTime}
                        onChange={(e) => onPomodoroBreakTimeChange(Math.max(3, Math.min(15, parseInt(e.target.value) || 5)))}
                        className="w-20 text-center text-xl font-bold bg-white rounded-xl border-2 border-gray-300 focus:border-red-500 focus:outline-none py-2"
                        min="3"
                        max="15"
                      />
                      <span className="text-xl font-bold text-gray-700">min</span>
                    </div>
                    <p className="text-xs text-gray-500">(3-15 min)</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  {/* Pause longue */}
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-700 mb-3">{t('timerConfig.longBreak', 'Pause longue')}</p>
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <input
                        type="number"
                        value={pomodoroLongBreakTime}
                        onChange={(e) => onPomodoroLongBreakTimeChange(Math.max(10, Math.min(60, parseInt(e.target.value) || 15)))}
                        className="w-20 text-center text-xl font-bold bg-white rounded-xl border-2 border-gray-300 focus:border-red-500 focus:outline-none py-2"
                        min="10"
                        max="60"
                      />
                      <span className="text-xl font-bold text-gray-700">min</span>
                    </div>
                    <p className="text-xs text-gray-500">(10-60 min)</p>
                  </div>

                  {/* Nombre de cycles */}
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-700 mb-3">{t('timerConfig.cyclesCount', 'Nombre de cycles')}</p>
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <input
                        type="number"
                        value={pomodoroCycles}
                        onChange={(e) => onPomodoroCyclesChange(Math.max(2, Math.min(8, parseInt(e.target.value) || 4)))}
                        className="w-20 text-center text-xl font-bold bg-white rounded-xl border-2 border-gray-300 focus:border-red-500 focus:outline-none py-2"
                        min="2"
                        max="8"
                      />
                      <span className="text-xl font-bold text-gray-700">cycles</span>
                    </div>
                    <p className="text-xs text-gray-500">(2-8 cycles)</p>
                  </div>
                </div>

                {/* Aperçu de la session */}
                <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                  <div className="text-center">
                    <p className="text-sm font-medium text-red-800 mb-3">🍅 {t('timerConfig.sessionPreview', 'Aperçu de votre session')}</p>
                    <div className="text-sm text-red-700 space-y-2">
                      <p><span className="font-medium">{pomodoroCycles - 1} cycles</span> : {pomodoroWorkTime}min {t('timerConfig.work', 'travail')} → {pomodoroBreakTime}min {t('timerConfig.break', 'pause')}</p>
                      <p><span className="font-medium">{t('timerConfig.lastCycle', 'Dernier cycle')}</span> : {pomodoroWorkTime}min {t('timerConfig.work', 'travail')} → {pomodoroLongBreakTime}min {t('timerConfig.longBreakLabel', 'pause longue')}</p>
                      <div className="pt-2 border-t border-red-300">
                        <p className="font-bold text-red-600">
                          {t('timerConfig.totalDuration', 'Durée totale')} : {formatMinutesToHours(pomodoroWorkTime * pomodoroCycles + pomodoroBreakTime * (pomodoroCycles - 1) + pomodoroLongBreakTime)}
                        </p>
                      </div>
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
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl">
              <p className="text-sm font-medium text-green-700 mb-2">{t('timerConfig.currentLinkedTimer', 'Timer actuellement lié')} :</p>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100">
                  {linkedTimer.isPomodoroMode ? <Coffee size={16} className="text-green-600" /> : <Timer size={16} className="text-green-600" />}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-green-800">{linkedTimer.title}</p>
                  <p className="text-sm text-green-600">{formatMinutesToHours(Math.round(linkedTimer.config.workDuration / 60))}</p>
                </div>
              </div>
            </div>
          )}

          {(availableTimers.length > 0 || linkedTimer) ? (
            <div>
              <p className="text-sm text-gray-600 mb-4 text-center">
                {linkedTimer ? t('timerConfig.orChooseAnother', 'Ou choisissez un autre timer') : t('timerConfig.selectExisting', 'Sélectionnez un timer existant')} :
              </p>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {(() => {
                  const allTimers = linkedTimer 
                    ? [linkedTimer, ...availableTimers.filter(t => t.id !== linkedTimer.id)]
                    : availableTimers;
                  
                  return allTimers.map((timer) => (
                    <button
                      key={timer.id}
                      onClick={() => onSelectedExistingTimerChange(timer.id)}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                        selectedExistingTimer === timer.id
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="p-3 rounded-lg bg-gray-100">
                        {timer.isPomodoroMode ? <Coffee size={20} className="text-gray-600" /> : <Timer size={20} className="text-gray-600" />}
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-medium text-gray-900">{timer.title}</p>
                        <p className="text-sm text-gray-500">{formatMinutesToHours(Math.round(timer.config.workDuration / 60))}</p>
                      </div>
                      {selectedExistingTimer === timer.id && (
                        <Check size={20} className="text-orange-600" />
                      )}
                    </button>
                  ));
                })()}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Timer size={48} className="text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">{t('timerConfig.noTimersAvailable', 'Aucun timer disponible')}</p>
              <p className="text-sm text-gray-400">{t('timerConfig.createFirstTimer', 'Créez d\'abord un timer ou utilisez un timer personnalisé')}</p>
            </div>
          )}
          
          {errors.timer && (
            <div className="text-center mt-4">
              <p className="text-sm text-red-500 flex items-center justify-center gap-2">
                <AlertCircle size={16} />
                {errors.timer}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};