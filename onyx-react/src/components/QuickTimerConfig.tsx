import React, { useState } from 'react';
import { TimeWheel } from '@/components/TimeWheel';
import { Timer, Coffee, X } from 'lucide-react';

type TimerMode = 'simple' | 'pomodoro';

interface PomodoroConfig {
  workDuration: number;
  breakDuration: number;
  cycles: number;
}

interface QuickTimerConfigProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (config: {
    mode: TimerMode;
    duration?: number;
    pomodoroConfig?: PomodoroConfig;
    name: string;
  }) => void;
}

export const QuickTimerConfig: React.FC<QuickTimerConfigProps> = ({
  isOpen,
  onClose,
  onConfirm
}) => {
  const [mode, setMode] = useState<TimerMode>('simple');
  const [simpleDuration, setSimpleDuration] = useState(25);
  const [pomodoroConfig, setPomodoroConfig] = useState<PomodoroConfig>({
    workDuration: 25,
    breakDuration: 5,
    cycles: 4
  });

  if (!isOpen) return null;

  const handleConfirm = () => {
    const config = {
      mode,
      name: mode === 'pomodoro' 
        ? `Pomodoro ${pomodoroConfig.workDuration}/${pomodoroConfig.breakDuration}` 
        : `Timer ${simpleDuration}min`,
      ...(mode === 'simple' ? { duration: simpleDuration } : { pomodoroConfig })
    };
    
    onConfirm(config);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Configuration timer rapide</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Mode Selection */}
        <div className="p-6 border-b border-gray-200">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setMode('simple')}
              className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                mode === 'simple'
                  ? 'border-green-500 bg-gradient-to-br from-green-50 to-green-100 text-green-700 shadow-lg'
                  : 'border-gray-200 hover:border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <div className="flex flex-col items-center space-y-2">
                <div className={`p-2 rounded-lg ${
                  mode === 'simple' ? 'bg-green-200' : 'bg-gray-100'
                }`}>
                  <Timer size={20} className={mode === 'simple' ? 'text-green-600' : 'text-gray-500'} />
                </div>
                <span className="font-medium text-sm">Timer Simple</span>
              </div>
            </button>
            
            <button
              onClick={() => setMode('pomodoro')}
              className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                mode === 'pomodoro'
                  ? 'border-red-500 bg-gradient-to-br from-red-50 to-red-100 text-red-700 shadow-lg'
                  : 'border-gray-200 hover:border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <div className="flex flex-col items-center space-y-2">
                <div className={`p-2 rounded-lg ${
                  mode === 'pomodoro' ? 'bg-red-200' : 'bg-gray-100'
                }`}>
                  <Coffee size={20} className={mode === 'pomodoro' ? 'text-red-600' : 'text-gray-500'} />
                </div>
                <span className="font-medium text-sm">Pomodoro</span>
              </div>
            </button>
          </div>
        </div>

        {/* Configuration Content */}
        <div className="p-6">
          {mode === 'simple' ? (
            /* Configuration Timer Simple */
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Durée du timer
              </h3>
              <TimeWheel
                value={simpleDuration}
                min={5}
                max={180}
                step={5}
                onChange={setSimpleDuration}
                size="lg"
              />
              <div className="mt-4 text-sm text-gray-600">
                Timer de {simpleDuration} minutes
              </div>
            </div>
          ) : (
            /* Configuration Pomodoro */
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">
                Configuration Pomodoro
              </h3>
              
              <div className="grid grid-cols-3 gap-4">
                {/* Temps de travail */}
                <div className="text-center">
                  <TimeWheel
                    value={pomodoroConfig.workDuration}
                    min={15}
                    max={60}
                    step={5}
                    onChange={(value) => setPomodoroConfig(prev => ({ ...prev, workDuration: value }))}
                    label="Travail"
                    size="sm"
                  />
                </div>

                {/* Temps de pause */}
                <div className="text-center">
                  <TimeWheel
                    value={pomodoroConfig.breakDuration}
                    min={3}
                    max={15}
                    step={1}
                    onChange={(value) => setPomodoroConfig(prev => ({ ...prev, breakDuration: value }))}
                    label="Pause"
                    size="sm"
                  />
                </div>

                {/* Nombre de cycles */}
                <div className="text-center">
                  <TimeWheel
                    value={pomodoroConfig.cycles}
                    min={2}
                    max={10}
                    step={1}
                    onChange={(value) => setPomodoroConfig(prev => ({ ...prev, cycles: value }))}
                    label="Cycles"
                    size="sm"
                  />
                </div>
              </div>

              {/* Résumé de la configuration */}
              <div className="mt-6 p-4 bg-gradient-to-r from-red-50 to-pink-50 rounded-lg border border-red-200">
                <div className="text-sm text-red-800 text-center">
                  <div className="font-medium mb-1">Configuration Pomodoro</div>
                  <div>
                    {pomodoroConfig.workDuration}min travail • {pomodoroConfig.breakDuration}min pause • {pomodoroConfig.cycles} cycles
                  </div>
                  <div className="text-xs mt-1 opacity-75">
                    Durée totale: {(pomodoroConfig.workDuration + pomodoroConfig.breakDuration) * pomodoroConfig.cycles}min
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Annuler
          </button>
          <button
            onClick={handleConfirm}
            className={`px-6 py-2 text-white rounded-lg transition-colors font-medium ${
              mode === 'simple' 
                ? 'bg-green-600 hover:bg-green-700' 
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            Créer le timer
          </button>
        </div>
      </div>
    </div>
  );
};