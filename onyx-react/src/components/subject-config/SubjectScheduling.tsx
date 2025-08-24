import React from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, Zap, Settings, AlertCircle } from 'lucide-react';
import { SmartTimeInput } from '@/components/SmartTimeInput';
import { formatMinutesToHours } from '@/utils/timeFormat';



// Les jours seront maintenant définis dynamiquement dans le composant avec les traductions

interface SubjectSchedulingProps {
  // Configuration globale
  globalHours: number;
  globalMinutes: number;
  globalSeconds: number;
  onGlobalTimeChange: (hours: number, minutes: number, seconds: number) => void;
  
  // Configuration par jour  
  dailyTimes: Record<number, number>;
  onDayTimeChange: (dayId: number, minutes: number) => void;
  selectedDays: number[];
  onSelectedDaysChange: (days: number[]) => void;
  
  // Mode et état
  configMode: 'simple' | 'advanced';
  onConfigModeChange: (mode: 'simple' | 'advanced') => void;
  weeklyTimeMinutes: number;
  
  // Validation
  errors: { [key: string]: string };
}

export const SubjectScheduling: React.FC<SubjectSchedulingProps> = ({
  globalHours,
  globalMinutes,
  globalSeconds,
  onGlobalTimeChange,
  dailyTimes,
  onDayTimeChange,
  selectedDays,
  onSelectedDaysChange,
  configMode,
  onConfigModeChange,
  weeklyTimeMinutes,
  errors
}) => {
  const { t } = useTranslation();
  
  // Jours de la semaine avec traductions
  const WEEKDAYS = [
    { id: 1, short: t('subjectConfig.mondayShort', 'L'), full: t('subjectConfig.monday', 'Lundi') },
    { id: 2, short: t('subjectConfig.tuesdayShort', 'M'), full: t('subjectConfig.tuesday', 'Mardi') },
    { id: 3, short: t('subjectConfig.wednesdayShort', 'M'), full: t('subjectConfig.wednesday', 'Mercredi') },
    { id: 4, short: t('subjectConfig.thursdayShort', 'J'), full: t('subjectConfig.thursday', 'Jeudi') },
    { id: 5, short: t('subjectConfig.fridayShort', 'V'), full: t('subjectConfig.friday', 'Vendredi') },
    { id: 6, short: t('subjectConfig.saturdayShort', 'S'), full: t('subjectConfig.saturday', 'Samedi') },
    { id: 0, short: t('subjectConfig.sundayShort', 'D'), full: t('subjectConfig.sunday', 'Dimanche') }
  ];
  const totalWeeklyTime = Object.values(dailyTimes).reduce((sum, time) => sum + time, 0);
  const activeDaysCount = Object.values(dailyTimes).filter(time => time > 0).length;

  // Fonction formatDailyTime supprimée - utilisation de formatMinutesToHours centralisée

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Calendar size={24} className="text-green-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900">
          {t('subjectConfig.weeklySchedule', 'Planning hebdomadaire')}
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          {t('subjectConfig.defineIdealRhythm', 'Définissez votre rythme d\'\u00e9tude idéal')}
        </p>
      </div>

      {/* Configuration manuelle */}
      <div className="mb-6">
        {/* Mode Simple/Avancé */}
          <div className="mb-6">
            <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
              <button
                onClick={() => onConfigModeChange('simple')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md transition-all ${
                  configMode === 'simple' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Zap size={14} />
                <span className="text-sm font-medium">{t('subjectConfig.simple', 'Simple')}</span>
              </button>
              <button
                onClick={() => onConfigModeChange('advanced')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md transition-all ${
                  configMode === 'advanced' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Settings size={14} />
                <span className="text-sm font-medium">{t('subjectConfig.advanced', 'Avancé')}</span>
              </button>
            </div>
            <p className="text-xs text-gray-500 text-center mt-2">
              {configMode === 'simple' ? t('subjectConfig.globalConfigAutoDistribution', 'Configuration globale avec répartition automatique') : t('subjectConfig.individualConfigPerDay', 'Configuration individuelle par jour')}
            </p>
          </div>

          {configMode === 'simple' ? (
            <div className="space-y-4">
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                <SmartTimeInput
                  hours={globalHours}
                  minutes={globalMinutes}
                  seconds={globalSeconds}
                  onChange={onGlobalTimeChange}
                  className=""
                  label={t('subjectConfig.totalWeeklyStudyTime', 'Temps d\'\u00e9tude hebdomadaire total')}
                  showExamples={false}
                />
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">{t('subjectConfig.studyDays', 'Jours d\'\u00e9tude')}</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {WEEKDAYS.map((day) => {
                    const isSelected = selectedDays.includes(day.id);
                    return (
                      <button
                        key={day.id}
                        onClick={() => {
                          let newSelectedDays;
                          if (isSelected) {
                            newSelectedDays = selectedDays.filter(d => d !== day.id);
                          } else {
                            newSelectedDays = [...selectedDays, day.id];
                          }
                          onSelectedDaysChange(newSelectedDays);
                        }}
                        className={`px-4 py-3 rounded-xl border-2 transition-all ${
                          isSelected
                            ? 'border-blue-500 bg-blue-500 text-white'
                            : 'border-gray-300 bg-white text-gray-600 hover:border-blue-300'
                        }`}
                      >
                        <div className="text-center">
                          <div className="font-medium text-sm">{day.short}</div>
                          <div className="text-xs opacity-80">{day.full.slice(0, 3)}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
                
                <div className="flex justify-center gap-2 mt-3">
                  <button
                    onClick={() => {
                      onSelectedDaysChange([1, 2, 3, 4, 5]);
                    }}
                    className="px-3 py-1 text-xs border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    {t('subjectConfig.monFri', 'Lun-Ven')}
                  </button>
                  <button
                    onClick={() => {
                      onSelectedDaysChange([1, 2, 3, 4, 5, 6, 0]);
                    }}
                    className="px-3 py-1 text-xs border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    {t('subjectConfig.allDays', 'Tous les jours')}
                  </button>
                </div>
              </div>
              
              {selectedDays.length > 0 && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                  <div className="text-center">
                    <div className="text-sm text-blue-700 mb-2">
                      {t('subjectConfig.automaticDistribution', '📅 Répartition automatique')}
                    </div>
                    <div className="text-xl font-bold text-blue-900">
                      {formatMinutesToHours(Math.round(weeklyTimeMinutes / selectedDays.length))} {t('subjectConfig.perDay', 'par jour')}
                    </div>
                    <div className="text-sm text-blue-600 mt-1">
                      {t('subjectConfig.onXDays', 'sur {{count}} jour', { count: selectedDays.length })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 text-center">
                {t('subjectConfig.customConfigPerDay', 'Configuration personnalisée par jour')}
              </p>
              
              <div className="grid gap-3">
                {WEEKDAYS.map((day) => {
                  const dayTime = dailyTimes[day.id] || 0;
                  const isActive = dayTime > 0;
                  
                  return (
                    <div 
                      key={day.id} 
                      className={`bg-white rounded-xl border-2 p-4 transition-all ${
                        isActive 
                          ? 'border-blue-300 shadow-sm' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                            isActive 
                              ? 'bg-blue-100 text-blue-700' 
                              : 'bg-gray-100 text-gray-500'
                          }`}>
                            {day.short}
                          </div>
                          <div>
                            <div className={`font-medium ${isActive ? 'text-blue-900' : 'text-gray-700'}`}>
                              {day.full}
                            </div>
                            {dayTime > 0 && (
                              <div className="text-xs text-gray-500">
                                {formatMinutesToHours(dayTime)}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className={`w-3 h-3 rounded-full ${
                          isActive ? 'bg-blue-400' : 'bg-gray-300'
                        }`}></div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            max="480"
                            value={dayTime}
                            onChange={(e) => onDayTimeChange(day.id, Math.max(0, parseInt(e.target.value) || 0))}
                            className={`w-20 text-center text-lg font-semibold rounded-xl border-2 px-3 py-2 transition-all ${
                              isActive 
                                ? 'border-blue-300 bg-blue-50 focus:border-blue-500' 
                                : 'border-gray-300 bg-gray-50 focus:border-blue-500'
                            } focus:outline-none focus:ring-2 focus:ring-blue-200`}
                            placeholder="0"
                          />
                          <span className="text-sm text-gray-600 font-medium">{t('subjectConfig.minutes', 'min')}</span>
                        </div>
                        
                        <div className="flex gap-1 ml-auto">
                          {[30, 60, 90, 120].map((minutes) => (
                            <button
                              key={minutes}
                              onClick={() => onDayTimeChange(day.id, minutes)}
                              className={`w-10 h-10 text-xs font-medium rounded-xl transition-all ${
                                dayTime === minutes
                                  ? 'bg-blue-500 text-white shadow-sm'
                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              }`}
                              title={`${minutes} minutes`}
                            >
                              {minutes}
                            </button>
                          ))}
                          {dayTime > 0 && (
                            <button
                              onClick={() => onDayTimeChange(day.id, 0)}
                              className="w-10 h-10 text-sm font-medium rounded-xl bg-red-100 text-red-600 hover:bg-red-200 transition-all ml-1"
                              title={t('subjectConfig.disableDay', 'Désactiver ce jour')}
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-xl">📊</span>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-900">
                        {formatMinutesToHours(totalWeeklyTime)}
                      </div>
                      <div className="text-sm text-blue-700">
                        {t('subjectConfig.totalWeekly', 'Total hebdomadaire')} • {t('subjectConfig.xDaysActive', '{{count}} jour actif', { count: activeDaysCount })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

      </div>

      {errors.days && (
        <div className="text-center">
          <p className="text-sm text-red-500 flex items-center justify-center gap-2">
            <AlertCircle size={16} />
            {errors.days}
          </p>
        </div>
      )}
    </div>
  );
};