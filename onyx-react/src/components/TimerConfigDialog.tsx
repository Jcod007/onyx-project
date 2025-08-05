import React, { useState, useEffect } from 'react';
import { Subject, TimerType } from '@/types';
import { subjectService } from '@/services/subjectService';
import { isValidTimeInput, normalizeTime } from '@/utils/timeFormat';
import { Modal } from '@/components/Modal';
import { SmartTimeInput } from '@/components/SmartTimeInput';
import { Clock, BookOpen, Timer, Zap, Coffee } from 'lucide-react';

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
  isEditMode?: boolean;
  editingTimerData?: {
    id: string;
    mode: TimerModeType;
    isPomodoroMode: boolean;
    pomodoroConfig?: {
      workDuration: number;
      breakDuration: number;
      longBreakDuration: number;
      cycles: number;
    };
  };
  existingTimers?: Array<{ id: string; title: string; linkedSubject?: Subject }>;
}

export const TimerConfigDialog: React.FC<TimerConfigDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  defaultDuration = { hours: 0, minutes: 25, seconds: 0 },
  defaultName = '',
  preselectedSubject,
  isEditMode = false,
  editingTimerData,
  existingTimers = []
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
      setErrors([]);
      
      // Configuration spécifique pour le mode édition
      if (isEditMode && editingTimerData) {
        setTimerMode(editingTimerData.mode);
        
        if (editingTimerData.isPomodoroMode && editingTimerData.pomodoroConfig) {
          // Trouver le preset correspondant ou utiliser personnalisé
          const matchingPreset = POMODORO_PRESETS.find(preset => 
            preset.workDuration * 60 === editingTimerData.pomodoroConfig!.workDuration &&
            preset.breakDuration * 60 === editingTimerData.pomodoroConfig!.breakDuration &&
            preset.cycles === editingTimerData.pomodoroConfig!.cycles
          );
          
          if (matchingPreset) {
            setSelectedPreset(matchingPreset);
          } else {
            // Configuration personnalisée
            const customConfig = {
              name: 'Personnalisé',
              workDuration: Math.floor(editingTimerData.pomodoroConfig.workDuration / 60),
              breakDuration: Math.floor(editingTimerData.pomodoroConfig.breakDuration / 60),
              longBreakDuration: Math.floor(editingTimerData.pomodoroConfig.longBreakDuration / 60),
              cycles: editingTimerData.pomodoroConfig.cycles
            };
            setCustomPomodoro(customConfig);
            setSelectedPreset(customConfig);
          }
        } else {
          setSelectedPreset(POMODORO_PRESETS[0]);
        }
      } else {
        // Mode création - valeurs par défaut
        setTimerMode('simple');
        setSelectedPreset(POMODORO_PRESETS[0]);
      }
    }
  }, [isOpen, defaultDuration, defaultName, preselectedSubject, isEditMode, editingTimerData]);

  const loadSubjects = async () => {
    try {
      const loadedSubjects = await subjectService.getAllSubjects();
      setSubjects(loadedSubjects.filter(s => s.status !== 'COMPLETED'));
    } catch (error) {
      console.error('Erreur lors du chargement des matières:', error);
    }
  };

  // Fonction utilitaire pour vérifier si un cours est déjà lié à un autre timer
  const getLinkedTimerForSubject = (subjectId: string) => {
    return existingTimers.find(timer => 
      timer.linkedSubject && 
      timer.linkedSubject.id === subjectId &&
      (!isEditMode || timer.id !== editingTimerData?.id) // Exclure le timer en cours d'édition
    );
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
          {isEditMode ? 'Modifier le Timer' : 'Configuration du Timer'}
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

          {/* Type de session - Design amélioré */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Choix du mode de session
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setTimerType('FREE_SESSION');
                  setSelectedSubject(undefined);
                }}
                className={`p-3 rounded-lg border-2 transition-all duration-200 ${timerType === 'FREE_SESSION'
                  ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-purple-100 text-purple-700 shadow-md'
                  : 'border-gray-200 hover:border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <div className={`p-1 rounded ${
                    timerType === 'FREE_SESSION' ? 'bg-purple-200' : 'bg-gray-100'
                  }`}>
                    <Zap size={16} className={timerType === 'FREE_SESSION' ? 'text-purple-600' : 'text-gray-500'} />
                  </div>
                  <span className="font-medium text-sm">Session libre</span>
                </div>
              </button>
              
              <button
                type="button"
                onClick={() => setTimerType('STUDY_SESSION')}
                className={`p-3 rounded-lg border-2 transition-all duration-200 ${timerType === 'STUDY_SESSION'
                  ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 text-blue-700 shadow-md'
                  : 'border-gray-200 hover:border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <div className={`p-1 rounded ${
                    timerType === 'STUDY_SESSION' ? 'bg-blue-200' : 'bg-gray-100'
                  }`}>
                    <BookOpen size={16} className={timerType === 'STUDY_SESSION' ? 'text-blue-600' : 'text-gray-500'} />
                  </div>
                  <span className="font-medium text-sm">Session d'étude</span>
                </div>
              </button>
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
                <>
                  <select
                    value={selectedSubject?.id || ''}
                    onChange={(e) => {
                      const subject = subjects.find(s => s.id === e.target.value);
                      setSelectedSubject(subject);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Sélectionner une matière</option>
                    {subjects.map((subject) => {
                      const linkedTimer = getLinkedTimerForSubject(subject.id);
                      const isLinkedToOtherTimer = linkedTimer && (!isEditMode || linkedTimer.id !== editingTimerData?.id);
                      
                      return (
                        <option key={subject.id} value={subject.id}>
                          {subject.name}
                          {isLinkedToOtherTimer ? ` (déjà lié au timer "${linkedTimer.title}")` : ''}
                        </option>
                      );
                    })}
                  </select>
                  
                  {/* Message d'information sur le toggle */}
                  {selectedSubject && getLinkedTimerForSubject(selectedSubject.id) && (
                    <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                      <p className="text-xs text-blue-700">
                        ℹ Ce cours est déjà lié au timer "{getLinkedTimerForSubject(selectedSubject.id)?.title}". 
                        En confirmant, l'ancien timer sera délié automatiquement (relation 1:1).
                      </p>
                    </div>
                  )}
                </>
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

          {/* Choix du type de timer - Design amélioré */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Choix du type de timer
            </label>
            <div className="grid grid-cols-2 gap-2 mb-4">
              <button
                type="button"
                onClick={() => setTimerMode('simple')}
                className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                  timerMode === 'simple'
                    ? 'border-green-500 bg-gradient-to-br from-green-50 to-green-100 text-green-700 shadow-md'
                    : 'border-gray-200 hover:border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <div className={`p-1 rounded ${
                    timerMode === 'simple' ? 'bg-green-200' : 'bg-gray-100'
                  }`}>
                    <Timer size={16} className={timerMode === 'simple' ? 'text-green-600' : 'text-gray-500'} />
                  </div>
                  <span className="font-medium text-sm">Timer Simple</span>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setTimerMode('pomodoro')}
                className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                  timerMode === 'pomodoro'
                    ? 'border-red-500 bg-gradient-to-br from-red-50 to-red-100 text-red-700 shadow-md'
                    : 'border-gray-200 hover:border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <div className={`p-1 rounded ${
                    timerMode === 'pomodoro' ? 'bg-red-200' : 'bg-gray-100'
                  }`}>
                    <Coffee size={16} className={timerMode === 'pomodoro' ? 'text-red-600' : 'text-gray-500'} />
                  </div>
                  <span className="font-medium text-sm">Pomodoro</span>
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
              
              {/* Durées courantes prédéfinies */}
              <div className="mb-4">
                <div className="text-sm font-medium text-gray-600 mb-2">Durées courantes :</div>
                <div className="grid grid-cols-5 gap-2">
                  {[5, 15, 25, 45, 60].map((preset) => (
                    <button
                      key={preset}
                      onClick={() => handlePresetTime(preset)}
                      className={`px-3 py-2 text-sm rounded-lg border-2 transition-all duration-200 ${
                        minutes === preset && hours === 0 && seconds === 0
                          ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                          : 'border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {preset} min
                    </button>
                  ))}
                </div>
              </div>

              {/* Composant de saisie intelligente */}
              <SmartTimeInput
                hours={hours}
                minutes={minutes}
                seconds={seconds}
                onChange={(h, m, s) => {
                  setHours(h);
                  setMinutes(m);
                  setSeconds(s);
                }}
              />
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
              placeholder={timerMode === 'pomodoro' ? 'Timer Pomodoro' : 'Timer Simple'}
            />
            <p className="text-xs text-gray-500 mt-1">
              Un nom sera généré automatiquement si vide
            </p>
          </div>

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
          {isEditMode 
            ? (timerMode === 'pomodoro' ? 'Modifier le Pomodoro' : 'Modifier le timer')
            : (timerMode === 'pomodoro' ? 'Créer le Pomodoro' : 'Créer le timer')
          }
        </button>
      </div>
    </Modal>
  );
};