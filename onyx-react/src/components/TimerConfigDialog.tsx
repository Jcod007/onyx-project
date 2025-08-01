import React, { useState, useEffect } from 'react';
import { Subject, TimerType, TimerTypeLabels } from '@/types';
import { subjectService } from '@/services/subjectService';
import { isValidTimeInput, normalizeTime } from '@/utils/timeFormat';
import { Modal } from '@/components/Modal';
import { Clock, BookOpen, Timer, RotateCcw } from 'lucide-react';

type TimerModeType = 'simple' | 'pomodoro';
type PomodoroPreset = {
  name: string;
  workDuration: number;
  breakDuration: number;
  longBreakDuration: number;
  cycles: number;
};

const POMODORO_PRESETS: PomodoroPreset[] = [
  { name: 'Classique 25/5', workDuration: 25, breakDuration: 5, longBreakDuration: 15, cycles: 4 },
  { name: 'Intense 50/10', workDuration: 50, breakDuration: 10, longBreakDuration: 30, cycles: 3 },
  { name: 'Équilibré 45/15', workDuration: 45, breakDuration: 15, longBreakDuration: 30, cycles: 3 },
  { name: 'Sprint 15/5', workDuration: 15, breakDuration: 5, longBreakDuration: 15, cycles: 6 }
];

interface TimerConfigDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (config: {
    name?: string;
    hours: number;
    minutes: number;
    seconds: number;
    timerType: TimerType;
    linkedSubject?: Subject;
    mode?: TimerModeType;
    pomodoroConfig?: {
      workDuration: number;
      breakDuration: number;
      longBreakDuration: number;
      cycles: number;
    };
  }) => void;
  defaultDuration?: {
    hours: number;
    minutes: number;
    seconds: number;
  };
  defaultName?: string;
  preselectedSubject?: Subject;
}

export const TimerConfigDialog: React.FC<TimerConfigDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  defaultDuration = { hours: 0, minutes: 25, seconds: 0 },
  defaultName = '',
  preselectedSubject
}) => {
  const [name, setName] = useState(defaultName);
  const [hours, setHours] = useState(defaultDuration.hours);
  const [minutes, setMinutes] = useState(defaultDuration.minutes);
  const [seconds, setSeconds] = useState(defaultDuration.seconds);
  const [timerType, setTimerType] = useState<TimerType>('FREE_SESSION');
  const [selectedSubject, setSelectedSubject] = useState<Subject | undefined>(preselectedSubject);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [timerMode, setTimerMode] = useState<TimerModeType>('simple');
  const [selectedPreset, setSelectedPreset] = useState<PomodoroPreset>(POMODORO_PRESETS[0]);
  const [customPomodoro, setCustomPomodoro] = useState({
    workDuration: 25,
    breakDuration: 5,
    longBreakDuration: 15,
    cycles: 4
  });

  useEffect(() => {
    if (isOpen) {
      loadSubjects();
      setName(defaultName);
      setHours(defaultDuration.hours);
      setMinutes(defaultDuration.minutes);
      setSeconds(defaultDuration.seconds);
      setSelectedSubject(preselectedSubject);
      setTimerType(preselectedSubject ? 'STUDY_SESSION' : 'FREE_SESSION');
      setTimerMode('simple');
      setSelectedPreset(POMODORO_PRESETS[0]);
      setErrors([]);
    }
  }, [isOpen, defaultDuration, defaultName, preselectedSubject]);

  const loadSubjects = async () => {
    try {
      const loadedSubjects = await subjectService.getAllSubjects();
      setSubjects(loadedSubjects.filter(s => s.status !== 'COMPLETED'));
    } catch (error) {
      console.error('Erreur lors du chargement des matières:', error);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: string[] = [];

    // Validation du temps
    if (!isValidTimeInput(hours, minutes, seconds)) {
      newErrors.push('Veuillez entrer une durée valide (format HH:MM:SS)');
    }

    // Validation de la matière pour les sessions d'étude
    if (timerType === 'STUDY_SESSION' && !selectedSubject) {
      newErrors.push('Veuillez sélectionner une matière pour une session d\'étude');
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleConfirm = () => {
    if (validateForm()) {
      let finalDuration;
      let pomodoroConfig;
      
      if (timerMode === 'pomodoro') {
        const preset = selectedPreset || customPomodoro;
        finalDuration = { hours: 0, minutes: preset.workDuration, seconds: 0 };
        pomodoroConfig = {
          workDuration: preset.workDuration * 60,
          breakDuration: preset.breakDuration * 60,
          longBreakDuration: preset.longBreakDuration * 60,
          cycles: preset.cycles
        };
      } else {
        finalDuration = normalizeTime(hours, minutes, seconds);
      }
      
      onConfirm({
        name: name.trim() || undefined,
        hours: finalDuration.hours,
        minutes: finalDuration.minutes,
        seconds: finalDuration.seconds,
        timerType,
        linkedSubject: timerType === 'STUDY_SESSION' ? selectedSubject : undefined,
        mode: timerMode,
        pomodoroConfig
      });
    }
  };

  const handleTimeChange = (
    value: string, 
    setter: React.Dispatch<React.SetStateAction<number>>,
    max: number
  ) => {
    const numValue = parseInt(value) || 0;
    if (numValue >= 0 && numValue <= max) {
      setter(numValue);
    }
  };

  const handlePresetTime = (presetMinutes: number) => {
    setHours(0);
    setMinutes(presetMinutes);
    setSeconds(0);
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-md"
    >
      {/* Header */}
      <div className="flex items-center space-x-3 p-6 border-b border-gray-200">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Clock size={20} className="text-blue-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900">
          Configuration du Timer
        </h2>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
          {/* Erreurs */}
          {errors.length > 0 && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <ul className="text-sm text-red-600 space-y-1">
                {errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Nom du timer */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nom du timer (optionnel)
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="ex: Session de travail, Timer Pomodoro..."
            />
            <p className="text-xs text-gray-500 mt-1">
              Si vide, un nom sera généré automatiquement (Timer 1, Timer 2...)
            </p>
          </div>

          {/* Mode de timer */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Mode de timer
            </label>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                type="button"
                onClick={() => setTimerMode('simple')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  timerMode === 'simple'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-600'
                }`}
              >
                <div className="flex flex-col items-center space-y-2">
                  <Timer size={24} />
                  <span className="font-medium">Mode Simple</span>
                  <span className="text-xs text-center">Une seule durée de travail</span>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setTimerMode('pomodoro')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  timerMode === 'pomodoro'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-600'
                }`}
              >
                <div className="flex flex-col items-center space-y-2">
                  <RotateCcw size={24} />
                  <span className="font-medium">Mode Pomodoro</span>
                  <span className="text-xs text-center">Cycles travail/pause automatiques</span>
                </div>
              </button>
            </div>
          </div>

          {/* Configuration selon le mode */}
          {timerMode === 'simple' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Durée du timer
              </label>
              
              {/* Presets */}
              <div className="grid grid-cols-4 gap-2 mb-4">
                {[5, 15, 25, 45].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => handlePresetTime(preset)}
                    className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    {preset}min
                  </button>
                ))}
              </div>

              {/* Time inputs */}
              <div className="flex items-center space-x-2">
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1">Heures</label>
                  <input
                    type="number"
                    value={hours}
                    onChange={(e) => handleTimeChange(e.target.value, setHours, 99)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                    max="99"
                  />
                </div>
                <div className="text-2xl font-bold text-gray-400 mt-6">:</div>
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1">Minutes</label>
                  <input
                    type="number"
                    value={minutes}
                    onChange={(e) => handleTimeChange(e.target.value, setMinutes, 59)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                    max="59"
                  />
                </div>
                <div className="text-2xl font-bold text-gray-400 mt-6">:</div>
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1">Secondes</label>
                  <input
                    type="number"
                    value={seconds}
                    onChange={(e) => handleTimeChange(e.target.value, setSeconds, 59)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                    max="59"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Configuration Pomodoro
              </label>
              
              {/* Presets Pomodoro */}
              <div className="space-y-2 mb-4">
                <div className="text-sm font-medium text-gray-600 mb-2">Configurations prédéfinies:</div>
                {POMODORO_PRESETS.map((preset, index) => (
                  <label key={index} className="flex items-center space-x-3 cursor-pointer p-3 border rounded-lg hover:bg-gray-50">
                    <input
                      type="radio"
                      name="pomodoroPreset"
                      checked={selectedPreset === preset}
                      onChange={() => setSelectedPreset(preset)}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{preset.name}</div>
                      <div className="text-sm text-gray-600">
                        {preset.workDuration}min travail • {preset.breakDuration}min pause • {preset.cycles} cycles
                      </div>
                    </div>
                  </label>
                ))}
              </div>

              {/* Configuration personnalisée */}
              <div className="border-t pt-4">
                <div className="text-sm font-medium text-gray-600 mb-3">Configuration personnalisée:</div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Travail (min)</label>
                    <input
                      type="number"
                      value={customPomodoro.workDuration}
                      onChange={(e) => setCustomPomodoro(prev => ({...prev, workDuration: parseInt(e.target.value) || 0}))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="1"
                      max="120"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Pause (min)</label>
                    <input
                      type="number"
                      value={customPomodoro.breakDuration}
                      onChange={(e) => setCustomPomodoro(prev => ({...prev, breakDuration: parseInt(e.target.value) || 0}))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="1"
                      max="60"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Pause longue (min)</label>
                    <input
                      type="number"
                      value={customPomodoro.longBreakDuration}
                      onChange={(e) => setCustomPomodoro(prev => ({...prev, longBreakDuration: parseInt(e.target.value) || 0}))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="1"
                      max="60"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Nombre de cycles</label>
                    <input
                      type="number"
                      value={customPomodoro.cycles}
                      onChange={(e) => setCustomPomodoro(prev => ({...prev, cycles: parseInt(e.target.value) || 1}))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="1"
                      max="10"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedPreset({...customPomodoro, name: 'Personnalisé'})}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Utiliser cette configuration personnalisée
                </button>
              </div>
            </div>
          )}

          {/* Type de timer */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Type de session
            </label>
            <div className="space-y-2">
              {Object.entries(TimerTypeLabels).map(([type, label]) => (
                <label key={type} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="timerType"
                    value={type}
                    checked={timerType === type}
                    onChange={(e) => {
                      setTimerType(e.target.value as TimerType);
                      if (e.target.value === 'FREE_SESSION') {
                        setSelectedSubject(undefined);
                      }
                    }}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Matière (si session d'étude) */}
          {timerType === 'STUDY_SESSION' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                <div className="flex items-center space-x-2">
                  <BookOpen size={16} />
                  <span>Matière d'étude</span>
                </div>
              </label>
              
              {subjects.length > 0 ? (
                <select
                  value={selectedSubject?.id || ''}
                  onChange={(e) => {
                    const subject = subjects.find(s => s.id === e.target.value);
                    setSelectedSubject(subject);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Sélectionner une matière</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="p-4 bg-gray-50 rounded-lg text-center">
                  <p className="text-sm text-gray-500 mb-2">
                    Aucune matière disponible
                  </p>
                  <p className="text-xs text-gray-400">
                    Créez d'abord des matières dans la section Étude
                  </p>
                </div>
              )}
            </div>
          )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
        <button
          onClick={onClose}
          className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
        >
          Annuler
        </button>
        <button
          onClick={handleConfirm}
          className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors font-medium"
        >
          {timerMode === 'pomodoro' ? 'Créer le Pomodoro' : 'Créer le timer'}
        </button>
      </div>
    </Modal>
  );
};