import React, { useState, useEffect } from 'react';
import { Subject } from '@/types/Subject';
import { ActiveTimer } from '@/types/ActiveTimer';
import { BookOpen, Clock, Calendar, Zap, Link2, ChevronDown, CheckCircle2 } from 'lucide-react';

interface DayOfWeek {
  id: number;
  name: string;
  short: string;
}

const DAYS_OF_WEEK: DayOfWeek[] = [
  { id: 1, name: 'Lundi', short: 'Lun' },
  { id: 2, name: 'Mardi', short: 'Mar' },
  { id: 3, name: 'Mercredi', short: 'Mer' },
  { id: 4, name: 'Jeudi', short: 'Jeu' },
  { id: 5, name: 'Vendredi', short: 'Ven' },
  { id: 6, name: 'Samedi', short: 'Sam' },
  { id: 0, name: 'Dimanche', short: 'Dim' }
];

type TimerType = 'quick' | 'linked';

interface AdvancedCourseConfigProps {
  subject: Subject;
  availableTimers?: ActiveTimer[];
  onSave?: (config: {
    weeklyHours: number;
    studyDays: number[];
    timerType: TimerType;
    linkedTimerId?: string;
    quickTimerConfig?: any;
  }) => void;
  className?: string;
}

export const AdvancedCourseConfig: React.FC<AdvancedCourseConfigProps> = ({
  subject,
  availableTimers = [],
  onSave,
  className = ''
}) => {
  const [weeklyHours, setWeeklyHours] = useState(4);
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]); // Lun-Ven par défaut
  const [timerType, setTimerType] = useState<TimerType>('quick');
  const [selectedTimerId, setSelectedTimerId] = useState<string>('');
  const [showTimerDropdown, setShowTimerDropdown] = useState(false);

  const calculateDailyMinutes = () => {
    if (selectedDays.length === 0) return 0;
    return Math.round((weeklyHours * 60) / selectedDays.length);
  };

  const handleDayToggle = (dayId: number) => {
    setSelectedDays(prev => 
      prev.includes(dayId) 
        ? prev.filter(id => id !== dayId)
        : [...prev, dayId].sort()
    );
  };

  const handleTimerTypeChange = (type: TimerType) => {
    setTimerType(type);
    if (type === 'quick') {
      setSelectedTimerId('');
      setShowTimerDropdown(false);
    }
  };

  const handleSave = () => {
    const config = {
      weeklyHours,
      studyDays: selectedDays,
      timerType,
      ...(timerType === 'linked' && selectedTimerId ? { linkedTimerId: selectedTimerId } : {}),
      ...(timerType === 'quick' ? { quickTimerConfig: { duration: calculateDailyMinutes() } } : {})
    };
    
    onSave?.(config);
  };

  const selectedTimer = availableTimers.find(timer => timer.id === selectedTimerId);

  return (
    <div className={`bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-100 rounded-xl">
            <BookOpen size={24} className="text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{subject.name}</h2>
            <p className="text-sm text-gray-600">Configuration de l'étude</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {/* 1. Configuration du temps hebdomadaire */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Clock size={20} className="text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Temps d'étude hebdomadaire</h3>
          </div>
          
          <div className="space-y-4">
            {/* Affichage de la valeur actuelle */}
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-1">
                {weeklyHours}h<span className="text-lg text-gray-500">/sem</span>
              </div>
              <div className="text-sm text-gray-600">
                ≈ {calculateDailyMinutes()} min/jour
                {selectedDays.length > 0 && (
                  <span className="text-gray-400"> ({selectedDays.length} jour{selectedDays.length > 1 ? 's' : ''})</span>
                )}
              </div>
            </div>

            {/* Slider horizontal */}
            <div className="px-4">
              <input
                type="range"
                min="1"
                max="20"
                step="0.5"
                value={weeklyHours}
                onChange={(e) => setWeeklyHours(parseFloat(e.target.value))}
                className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-thumb"
                style={{
                  background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${((weeklyHours - 1) / 19) * 100}%, #E5E7EB ${((weeklyHours - 1) / 19) * 100}%, #E5E7EB 100%)`
                }}
              />
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>1h</span>
                <span>10h</span>
                <span>20h</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Choix des jours d'étude */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Calendar size={20} className="text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">Jours d'étude préférés</h3>
          </div>
          
          <div className="grid grid-cols-7 gap-2">
            {DAYS_OF_WEEK.map((day) => (
              <button
                key={day.id}
                onClick={() => handleDayToggle(day.id)}
                className={`
                  p-3 rounded-lg border-2 transition-all duration-200 text-center
                  ${selectedDays.includes(day.id)
                    ? 'border-green-500 bg-gradient-to-br from-green-50 to-green-100 text-green-700 shadow-md'
                    : 'border-gray-200 hover:border-gray-300 text-gray-600 hover:bg-gray-50'
                  }
                `}
              >
                <div className="text-sm font-medium">{day.short}</div>
              </button>
            ))}
          </div>
          
          <div className="mt-3 text-center text-sm text-gray-600">
            {selectedDays.length === 0 
              ? 'Sélectionnez au moins un jour'
              : `${selectedDays.length} jour${selectedDays.length > 1 ? 's' : ''} sélectionné${selectedDays.length > 1 ? 's' : ''}`
            }
          </div>
        </div>

        {/* 3. Type de timer */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Type de timer à utiliser</h3>
          
          <div className="space-y-4">
            {/* Timer rapide */}
            <div 
              className={`border-2 rounded-xl p-4 transition-all duration-200 cursor-pointer ${
                timerType === 'quick'
                  ? 'border-yellow-500 bg-gradient-to-br from-yellow-50 to-orange-50 shadow-lg'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
              onClick={() => handleTimerTypeChange('quick')}
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg ${
                  timerType === 'quick' ? 'bg-yellow-200' : 'bg-gray-100'
                }`}>
                  <Zap size={20} className={timerType === 'quick' ? 'text-yellow-600' : 'text-gray-500'} />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold text-gray-900">Timer rapide</h4>
                    <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded-full">
                      Création locale
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Créer un timer dédié à ce cours directement depuis cette configuration.
                  </p>
                  
                  {timerType === 'quick' && (
                    <div className="bg-white rounded-lg p-3 border border-yellow-200">
                      <div className="text-sm text-gray-700">
                        <div className="font-medium mb-1">Configuration automatique :</div>
                        <div>• Durée par session : {calculateDailyMinutes()} minutes</div>
                        <div>• Type : Timer simple</div>
                        <div>• Nom : Timer {subject.name}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Timer lié */}
            <div 
              className={`border-2 rounded-xl p-4 transition-all duration-200 cursor-pointer ${
                timerType === 'linked'
                  ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50 shadow-lg'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
              onClick={() => handleTimerTypeChange('linked')}
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg ${
                  timerType === 'linked' ? 'bg-purple-200' : 'bg-gray-100'
                }`}>
                  <Link2 size={20} className={timerType === 'linked' ? 'text-purple-600' : 'text-gray-500'} />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold text-gray-900">Timer lié</h4>
                    <span className="text-xs bg-purple-200 text-purple-800 px-2 py-1 rounded-full">
                      {availableTimers.length} disponible{availableTimers.length > 1 ? 's' : ''}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Lier un timer déjà créé dans la section Timer.
                  </p>
                  
                  {timerType === 'linked' && (
                    <div className="space-y-3">
                      {availableTimers.length > 0 ? (
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowTimerDropdown(!showTimerDropdown);
                            }}
                            className="w-full flex items-center justify-between p-3 bg-white border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors"
                          >
                            <span className="text-sm text-gray-700">
                              {selectedTimer ? selectedTimer.title : 'Sélectionner un timer...'}
                            </span>
                            <ChevronDown size={16} className={`text-gray-500 transition-transform ${showTimerDropdown ? 'rotate-180' : ''}`} />
                          </button>
                          
                          {showTimerDropdown && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-40 overflow-y-auto">
                              {availableTimers.map((timer) => (
                                <button
                                  key={timer.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedTimerId(timer.id);
                                    setShowTimerDropdown(false);
                                  }}
                                  className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-100 last:border-b-0"
                                >
                                  <div className={`p-1 rounded ${
                                    timer.isPomodoroMode ? 'bg-red-100' : 'bg-green-100'
                                  }`}>
                                    {timer.isPomodoroMode ? (
                                      <div className="text-red-600 text-xs">🍅</div>
                                    ) : (
                                      <Clock size={12} className="text-green-600" />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-gray-900 truncate">
                                      {timer.title}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {Math.round(timer.config.workDuration / 60)} min • 
                                      {timer.isPomodoroMode ? ' Pomodoro' : ' Simple'}
                                    </div>
                                  </div>
                                  {selectedTimerId === timer.id && (
                                    <CheckCircle2 size={16} className="text-green-600" />
                                  )}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="bg-white rounded-lg p-3 border border-purple-200 text-center">
                          <div className="text-sm text-gray-500">
                            Aucun timer disponible
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            Créez d'abord des timers dans la section Timer
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer avec bouton de sauvegarde */}
      <div className="p-6 bg-gray-50 border-t border-gray-200">
        <button
          onClick={handleSave}
          disabled={selectedDays.length === 0 || (timerType === 'linked' && !selectedTimerId)}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
        >
          <CheckCircle2 size={20} />
          Sauvegarder la configuration
        </button>
        
        {selectedDays.length === 0 && (
          <p className="text-center text-sm text-red-600 mt-2">
            Veuillez sélectionner au moins un jour d'étude
          </p>
        )}
        
        {timerType === 'linked' && !selectedTimerId && availableTimers.length > 0 && (
          <p className="text-center text-sm text-red-600 mt-2">
            Veuillez sélectionner un timer à lier
          </p>
        )}
      </div>

      {/* Style CSS pour le slider */}
      <style jsx>{`
        .slider-thumb::-webkit-slider-thumb {
          appearance: none;
          height: 24px;
          width: 24px;
          border-radius: 50%;
          background: #3B82F6;
          cursor: pointer;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
        }
        
        .slider-thumb::-moz-range-thumb {
          height: 24px;
          width: 24px;
          border-radius: 50%;
          background: #3B82F6;
          cursor: pointer;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
        }
      `}</style>
    </div>
  );
};