import React, { useState, useEffect } from 'react';
import { DayOfWeek } from '@/types/Schedule';
import { DefaultTimerMode, QuickTimerConfig } from '@/types/Subject';
import { centralizedTimerService } from '@/services/centralizedTimerService';
import { ActiveTimer } from '@/types/ActiveTimer';
import { Check, Link } from 'lucide-react';

interface SimpleSubjectConfigProps {
  onSubmit: (data: {
    name: string;
    weeklyTimeGoal: number;
    preferredDays: DayOfWeek[];
    sessionDuration?: number;
    defaultTimerMode: DefaultTimerMode;
    selectedPomodoroId?: string;
    linkedTimerId?: string;
    quickTimerConfig?: QuickTimerConfig;
  }) => void;
  onCancel: () => void;
  initialData?: {
    id?: string; // Ajouté pour édition
    name?: string;
    weeklyTimeGoal?: number;
    preferredDays?: DayOfWeek[];
    sessionDuration?: number;
    defaultTimerMode?: DefaultTimerMode;
    selectedPomodoroId?: string;
    linkedTimerId?: string;
    quickTimerConfig?: QuickTimerConfig;
  };
  isEditing?: boolean;
}

export const SimpleSubjectConfig: React.FC<SimpleSubjectConfigProps> = ({
  onSubmit,
  onCancel,
  initialData = {},
  isEditing = false
}) => {
  const [name, setName] = useState(initialData.name || '');
  const [weeklyTimeGoal, setWeeklyTimeGoal] = useState(initialData.weeklyTimeGoal || 4);
  const [preferredDays, setPreferredDays] = useState<DayOfWeek[]>(
    initialData.preferredDays || ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']
  );
  const [defaultTimerMode, setDefaultTimerMode] = useState<DefaultTimerMode>(initialData.defaultTimerMode || 'simple');
  const [linkedTimerId, setLinkedTimerId] = useState<string | undefined>(initialData.linkedTimerId);
  const [quickTimerConfig, setQuickTimerConfig] = useState<QuickTimerConfig | undefined>(
    initialData.quickTimerConfig || { type: 'simple', workDuration: 25 }
  );
  const [availableTimers, setAvailableTimers] = useState<ActiveTimer[]>([]);
  const [loadingTimers, setLoadingTimers] = useState(false);

  // Charger les timers disponibles
  useEffect(() => {
    const loadData = async () => {
      setLoadingTimers(true);
      
      try {
        const timers = await centralizedTimerService.getAvailableTimersForSubject(initialData?.id);
        setAvailableTimers(timers);
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
      } finally {
        setLoadingTimers(false);
      }
    };

    loadData();
  }, []);

  const dayNames = {
    MONDAY: 'Lun', TUESDAY: 'Mar', WEDNESDAY: 'Mer', 
    THURSDAY: 'Jeu', FRIDAY: 'Ven', SATURDAY: 'Sam', SUNDAY: 'Dim'
  };

  const toggleDay = (day: DayOfWeek) => {
    const newPreferredDays = preferredDays.includes(day)
      ? preferredDays.filter(d => d !== day)
      : [...preferredDays, day];
    setPreferredDays(newPreferredDays);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit({
        name: name.trim(),
        weeklyTimeGoal,
        preferredDays,
        sessionDuration: undefined, // Plus utilisé
        defaultTimerMode,
        // selectedPomodoroId supprimé - plus utilisé
        linkedTimerId: defaultTimerMode === 'simple' ? linkedTimerId : undefined,
        quickTimerConfig: defaultTimerMode === 'quick_timer' ? quickTimerConfig : undefined
      });
    }
  };

  const canSubmit = () => {
    if (!name.trim() || weeklyTimeGoal <= 0 || preferredDays.length === 0) {
      return false;
    }
    
    if (defaultTimerMode === 'quick_timer') {
      return quickTimerConfig != null && quickTimerConfig.workDuration != null && quickTimerConfig.workDuration > 0;
    }
    
    if (defaultTimerMode === 'simple') {
      return linkedTimerId != null;
    }
    
    return true;
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {isEditing ? '✏️ Modifier le cours' : '📚 Nouveau cours'}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Configuration simple et rapide
          </p>
        </div>

        {/* Nom du cours */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Nom du cours
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all"
            placeholder="Ex: Mathématiques, Histoire..."
            autoFocus
          />
        </div>

        {/* Objectif hebdomadaire */}
        <div className="space-y-2 bg-blue-50 dark:bg-blue-900/10 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
          <label className="block text-sm font-semibold text-blue-800 dark:text-blue-200 mb-3">
            Objectif hebdomadaire pour{' '}
            <span className="text-blue-600 dark:text-blue-400 font-semibold">
              {name || 'ce cours'}
            </span>
          </label>
          
          <div className="space-y-2">
            <div className="flex items-center justify-center">
              <div className="text-xl font-bold text-blue-600 dark:text-blue-400 tabular-nums">
                {weeklyTimeGoal}
              </div>
              <div className="text-sm text-blue-600 dark:text-blue-400 ml-1 self-end mb-1">
                h/semaine
              </div>
            </div>
            
            <input
              type="range"
              min="1"
              max="20"
              step="0.5"
              value={weeklyTimeGoal}
              onChange={(e) => setWeeklyTimeGoal(parseFloat(e.target.value))}
              className="w-full h-2 bg-blue-100 dark:bg-blue-800 rounded-lg appearance-none cursor-pointer slider-thumb"
            />
            
            <div className="flex justify-between text-xs text-blue-500 dark:text-blue-400">
              <span>1h</span>
              <span className="text-gray-500">≈ {Math.round((weeklyTimeGoal * 60) / 7)} min/jour</span>
              <span>20h</span>
            </div>
          </div>
        </div>

        {/* Jours d'étude */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Jours d'étude préférés
          </label>
          <div className="grid grid-cols-7 gap-1">
            {(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'] as DayOfWeek[]).map((day) => (
              <button
                key={day}
                type="button"
                onClick={() => toggleDay(day)}
                className={`p-2 text-sm font-medium rounded-lg border transition-all ${
                  preferredDays.includes(day)
                    ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 text-gray-500 dark:text-gray-400'
                }`}
              >
                {dayNames[day]}
              </button>
            ))}
          </div>
        </div>

        {/* Type de timer */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Type de timer
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setDefaultTimerMode('quick_timer');
                setQuickTimerConfig({
                  type: 'simple',
                  workDuration: 25
                });
                setLinkedTimerId(undefined);
              }}
              className={`p-3 text-center rounded-lg border transition-all ${
                defaultTimerMode === 'quick_timer'
                  ? 'border-blue-300 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 text-gray-600 dark:text-gray-400'
              }`}
            >
              <div className="text-base mb-1">⚡</div>
              <div className="text-sm font-medium">Timer rapide</div>
              <div className="text-xs text-gray-500">Création locale</div>
            </button>
            <button
              type="button"
              onClick={() => {
                setDefaultTimerMode('simple');
                setQuickTimerConfig(undefined);
              }}
              className={`p-3 text-center rounded-lg border transition-all ${
                defaultTimerMode === 'simple'
                  ? 'border-blue-300 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 text-gray-600 dark:text-gray-400'
              }`}
            >
              <div className="text-base mb-1">🔗</div>
              <div className="text-sm font-medium">Timer lié</div>
              <div className="text-xs text-gray-500">Timer existant</div>
            </button>
          </div>


          {/* Sélection Timer lié */}
          {defaultTimerMode === 'simple' && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Link size={16} className="text-blue-600 dark:text-blue-400" />
                <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-200">
                  Sélectionner un timer existant
                </h4>
              </div>
              <p className="text-xs text-blue-600 dark:text-blue-400 mb-3">
                Choisissez un timer déjà créé dans la section Timer (Timers trouvés: {availableTimers.length})
              </p>
              
              {loadingTimers ? (
                <div className="text-center py-4">
                  <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
                  <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">Chargement des timers...</p>
                </div>
              ) : availableTimers.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-sm text-blue-600 dark:text-blue-400 mb-2">
                    Aucun timer disponible
                  </p>
                  <p className="text-xs text-blue-500 dark:text-blue-300">
                    Créez d'abord des timers dans la section Timer
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {availableTimers.map((timer) => {
                    // Pour ActiveTimer, on utilise le title et les informations de config
                    const workDuration = timer.config.workDuration ? Math.floor(timer.config.workDuration / 60) : 0;
                    const workMinutes = timer.config.workDuration ? timer.config.workDuration % 60 : 0;
                    const timerLabel = timer.title || `${workDuration}:${workMinutes.toString().padStart(2, '0')}`;
                    
                    return (
                      <button
                        key={timer.id}
                        type="button"
                        onClick={() => setLinkedTimerId(timer.id)}
                        className={`w-full p-3 text-left rounded-lg border transition-all ${
                          linkedTimerId === timer.id
                            ? 'border-blue-500 bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200'
                            : 'border-blue-200 dark:border-blue-700 hover:border-blue-300 dark:hover:border-blue-600 text-blue-700 dark:text-blue-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{timerLabel}</div>
                            <div className="text-xs opacity-75">
                              {timer.isPomodoroMode ? '🍅 Pomodoro' : '⏱️ Timer simple'}
                              {timer.linkedSubject && ` • Lié à ${timer.linkedSubject.name}`}
                            </div>
                          </div>
                          {linkedTimerId === timer.id && (
                            <Check size={16} className="text-blue-600 dark:text-blue-400" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Configuration Timer Rapide */}
          {defaultTimerMode === 'quick_timer' && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-3">
                ⚡ Configuration rapide
              </h4>
              
              {/* Type de timer rapide */}
              <div className="mb-3">
                <label className="block text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">
                  Type de timer
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setQuickTimerConfig({
                      type: 'simple',
                      workDuration: quickTimerConfig?.workDuration || 25
                    })}
                    className={`p-3 text-sm rounded-lg border transition-all ${
                      quickTimerConfig?.type === 'simple'
                        ? 'border-blue-500 bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200'
                        : 'border-blue-200 dark:border-blue-700 hover:border-blue-300 text-blue-700 dark:text-blue-300'
                    }`}
                  >
                    ⏱️ Simple
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickTimerConfig({
                      type: 'pomodoro',
                      workDuration: 25,
                      shortBreakDuration: 5,
                      longBreakDuration: 15,
                      cycles: 4
                    })}
                    className={`p-3 text-sm rounded-lg border transition-all ${
                      quickTimerConfig?.type === 'pomodoro'
                        ? 'border-blue-500 bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200'
                        : 'border-blue-200 dark:border-blue-700 hover:border-blue-300 text-blue-700 dark:text-blue-300'
                    }`}
                  >
                    🍅 Pomodoro
                  </button>
                </div>
              </div>

              {/* Configuration simple */}
              {quickTimerConfig?.type === 'simple' && (
                <div>
                  <label className="block text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">
                    Durée de travail
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="range"
                      min="5"
                      max="120"
                      step="5"
                      value={quickTimerConfig.workDuration || 25}
                      onChange={(e) => setQuickTimerConfig(prev => ({
                        ...prev!,
                        workDuration: parseInt(e.target.value)
                      }))}
                      className="flex-1 h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer dark:bg-blue-800"
                    />
                    <span className="text-sm font-bold text-blue-600 dark:text-blue-400 min-w-[3rem] text-center">
                      {quickTimerConfig.workDuration || 25}min
                    </span>
                  </div>
                </div>
              )}

              {/* Configuration Pomodoro */}
              {quickTimerConfig?.type === 'pomodoro' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">
                      Travail: {quickTimerConfig.workDuration || 25}min
                    </label>
                    <input
                      type="range"
                      min="15"
                      max="45"
                      step="5"
                      value={quickTimerConfig.workDuration || 25}
                      onChange={(e) => setQuickTimerConfig(prev => ({
                        ...prev!,
                        workDuration: parseInt(e.target.value)
                      }))}
                      className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer dark:bg-blue-800"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm text-blue-600 dark:text-blue-400 mb-1">
                        Pause courte: {quickTimerConfig.shortBreakDuration || 5}min
                      </label>
                      <input
                        type="range"
                        min="3"
                        max="10"
                        value={quickTimerConfig.shortBreakDuration || 5}
                        onChange={(e) => setQuickTimerConfig(prev => ({
                          ...prev!,
                          shortBreakDuration: parseInt(e.target.value)
                        }))}
                        className="w-full h-1.5 bg-blue-200 rounded-lg appearance-none cursor-pointer dark:bg-blue-800"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-blue-600 dark:text-blue-400 mb-1">
                        Pause longue: {quickTimerConfig.longBreakDuration || 15}min
                      </label>
                      <input
                        type="range"
                        min="10"
                        max="30"
                        step="5"
                        value={quickTimerConfig.longBreakDuration || 15}
                        onChange={(e) => setQuickTimerConfig(prev => ({
                          ...prev!,
                          longBreakDuration: parseInt(e.target.value)
                        }))}
                        className="w-full h-1.5 bg-blue-200 rounded-lg appearance-none cursor-pointer dark:bg-blue-800"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-blue-600 dark:text-blue-400 mb-1">
                      Cycles: {quickTimerConfig.cycles || 4}
                    </label>
                    <input
                      type="range"
                      min="2"
                      max="8"
                      value={quickTimerConfig.cycles || 4}
                      onChange={(e) => setQuickTimerConfig(prev => ({
                        ...prev!,
                        cycles: parseInt(e.target.value)
                      }))}
                      className="w-full h-1.5 bg-blue-200 rounded-lg appearance-none cursor-pointer dark:bg-blue-800"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Boutons d'action */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors rounded-lg"
          >
            Annuler
          </button>

          <button
            type="submit"
            disabled={!canSubmit()}
            className={`px-6 py-2 rounded-lg font-medium text-sm transition-all shadow-sm ${
              canSubmit()
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isEditing ? 'Enregistrer' : 'Créer le cours'}
          </button>
        </div>
      </form>

      <style dangerouslySetInnerHTML={{
        __html: `
          .slider-thumb::-webkit-slider-thumb {
            appearance: none;
            width: 24px;
            height: 24px;
            background: #2563eb;
            border-radius: 50%;
            cursor: pointer;
            box-shadow: 0 2px 6px rgba(37, 99, 235, 0.3);
          }
          
          .slider-thumb::-moz-range-thumb {
            width: 24px;
            height: 24px;
            background: #2563eb;
            border-radius: 50%;
            cursor: pointer;
            border: none;
            box-shadow: 0 2px 6px rgba(37, 99, 235, 0.3);
          }
        `}}
      />
    </div>
  );
};