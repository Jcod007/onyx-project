import React, { useState, useRef, useEffect } from 'react';
import { Clock, Timer as TimerIcon, BookOpen, Coffee, Info } from 'lucide-react';

interface TimerConfigData {
  sessionType: 'study' | 'free';
  timerType: 'simple' | 'pomodoro';
  duration: number; // en secondes
  timerName: string;
}

interface TimerConfigBoxProps {
  initialConfig?: Partial<TimerConfigData>;
  onConfigChange?: (config: TimerConfigData) => void;
  className?: string;
}

export const TimerConfigBox: React.FC<TimerConfigBoxProps> = ({
  initialConfig = {},
  onConfigChange,
  className = ''
}) => {
  const [config, setConfig] = useState<TimerConfigData>({
    sessionType: 'free',
    timerType: 'simple',
    duration: 25 * 60, // 25 minutes par défaut
    timerName: '',
    ...initialConfig
  });

  const [timeInput, setTimeInput] = useState('');
  const [isManualInput, setIsManualInput] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Durées prédéfinies (en minutes)
  const presetDurations = [5, 15, 25, 45, 60];

  // Synchroniser la configuration
  useEffect(() => {
    onConfigChange?.(config);
  }, [config, onConfigChange]);

  // Formater le temps pour l'affichage
  const formatTimeDisplay = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Gérer la saisie manuelle du temps
  const handleManualTimeInput = (value: string) => {
    // Enlever tous les caractères non-numériques
    const numbersOnly = value.replace(/[^0-9]/g, '');
    
    if (numbersOnly.length === 0) {
      setTimeInput('');
      setConfig(prev => ({ ...prev, duration: 0 }));
      return;
    }

    // Limiter à 6 chiffres (HHMMSS)
    const limitedInput = numbersOnly.slice(0, 6);
    
    // Convertir en format HH:MM:SS
    let formatted = limitedInput;
    if (limitedInput.length <= 2) {
      // SS
      formatted = limitedInput;
    } else if (limitedInput.length <= 4) {
      // MM:SS
      formatted = limitedInput.slice(0, -2) + ':' + limitedInput.slice(-2);
    } else {
      // HH:MM:SS
      formatted = limitedInput.slice(0, -4) + ':' + limitedInput.slice(-4, -2) + ':' + limitedInput.slice(-2);
    }
    
    setTimeInput(formatted);
    
    // Convertir en secondes
    const parts = formatted.split(':').map(p => parseInt(p) || 0);
    let totalSeconds = 0;
    
    if (parts.length === 1) {
      totalSeconds = parts[0]; // Secondes seulement
    } else if (parts.length === 2) {
      totalSeconds = parts[0] * 60 + parts[1]; // Minutes:Secondes
    } else if (parts.length === 3) {
      totalSeconds = parts[0] * 3600 + parts[1] * 60 + parts[2]; // Heures:Minutes:Secondes
    }
    
    setConfig(prev => ({ ...prev, duration: totalSeconds }));
  };

  // Définir une durée prédéfinie
  const setPresetDuration = (minutes: number) => {
    const seconds = minutes * 60;
    setConfig(prev => ({ ...prev, duration: seconds }));
    setTimeInput('');
    setIsManualInput(false);
  };

  // Générer un nom automatique
  const generateTimerName = (): string => {
    const typeLabel = config.timerType === 'pomodoro' ? 'Pomodoro' : 'Timer Simple';
    const sessionLabel = config.sessionType === 'study' ? 'Étude' : 'Libre';
    const durationLabel = Math.round(config.duration / 60);
    return `${typeLabel} ${sessionLabel} - ${durationLabel}min`;
  };

  const displayName = config.timerName || generateTimerName();

  return (
    <div className={`w-full max-w-md mx-auto p-6 bg-white rounded-xl shadow-lg border border-gray-200 ${className}`}>
      {/* 1. Choix du mode de session */}
      <div className=\"mb-6\">
        <h3 className=\"text-sm font-medium text-gray-700 mb-3\">Mode de session</h3>
        <div className=\"flex gap-2\">
          <button
            onClick={() => setConfig(prev => ({ ...prev, sessionType: 'study' }))}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-colors ${
              config.sessionType === 'study'
                ? 'bg-red-50 border-red-200 text-red-700'
                : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
            }`}
          >
            <BookOpen size={16} />
            <span className=\"text-sm font-medium\">Session d'étude</span>
          </button>
          <button
            onClick={() => setConfig(prev => ({ ...prev, sessionType: 'free' }))}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-colors ${
              config.sessionType === 'free'
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Clock size={16} />
            <span className=\"text-sm font-medium\">Session libre</span>
          </button>
        </div>
      </div>

      {/* 2. Choix du type de timer */}
      <div className=\"mb-6\">
        <h3 className=\"text-sm font-medium text-gray-700 mb-3\">Type de timer</h3>
        <div className=\"flex gap-2\">
          <button
            onClick={() => setConfig(prev => ({ ...prev, timerType: 'simple' }))}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-colors ${
              config.timerType === 'simple'
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
            }`}
          >
            <TimerIcon size={16} />
            <span className=\"text-sm font-medium\">Timer Simple</span>
          </button>
          <button
            onClick={() => setConfig(prev => ({ ...prev, timerType: 'pomodoro' }))}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-colors ${
              config.timerType === 'pomodoro'
                ? 'bg-red-50 border-red-200 text-red-700'
                : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Coffee size={16} />
            <span className=\"text-sm font-medium\">Pomodoro</span>
          </button>
        </div>
      </div>

      {/* 3. Durées prédéfinies */}
      <div className=\"mb-6\">
        <h3 className=\"text-sm font-medium text-gray-700 mb-3\">Durées courantes</h3>
        <div className=\"flex flex-wrap gap-2\">
          {presetDurations.map(minutes => (
            <button
              key={minutes}
              onClick={() => setPresetDuration(minutes)}
              className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                config.duration === minutes * 60 && !isManualInput
                  ? 'bg-blue-50 border-blue-200 text-blue-700'
                  : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
              }`}
            >
              {minutes} min
            </button>
          ))}
        </div>
      </div>

      {/* 4. Durée personnalisée */}
      <div className=\"mb-6\">
        <label className=\"flex items-center gap-2 text-sm font-medium text-gray-700 mb-3\">
          <Clock size={16} />
          Configuration du temps
        </label>
        <div className=\"relative\">
          <input
            ref={inputRef}
            type=\"text\"
            value={isManualInput ? timeInput : formatTimeDisplay(config.duration)}
            onChange={(e) => {
              setIsManualInput(true);
              handleManualTimeInput(e.target.value);
            }}
            onFocus={() => {
              setIsManualInput(true);
              if (timeInput === '') {
                setTimeInput(formatTimeDisplay(config.duration));
              }
            }}
            onBlur={() => {
              if (timeInput === '') {
                setIsManualInput(false);
              }
            }}
            className=\"w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-lg text-center\"
            placeholder=\"00:00:00\"
          />
        </div>
        <div className=\"flex items-center gap-2 mt-2 text-xs text-gray-500\">
          <Info size={12} />
          <span>💡 Tapez directement : 1→2→3 = 00:01:23</span>
        </div>
      </div>

      {/* 5. Nom du timer */}
      <div className=\"mb-6\">
        <label className=\"text-sm font-medium text-gray-700 mb-2 block\">
          Nom du timer (optionnel)
        </label>
        <input
          type=\"text\"
          value={config.timerName}
          onChange={(e) => setConfig(prev => ({ ...prev, timerName: e.target.value }))}
          placeholder={generateTimerName()}
          className=\"w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500\"
        />
        <p className=\"text-xs text-gray-500 mt-1\">
          Un nom sera généré automatiquement si vide
        </p>
      </div>

      {/* Aperçu de la configuration */}
      <div className=\"p-4 bg-gray-50 rounded-lg border border-gray-200\">
        <h4 className=\"text-sm font-medium text-gray-700 mb-2\">Aperçu</h4>
        <div className=\"space-y-1 text-sm text-gray-600\">
          <div><span className=\"font-medium\">Type:</span> {displayName}</div>
          <div><span className=\"font-medium\">Durée:</span> {formatTimeDisplay(config.duration)}</div>
          <div><span className=\"font-medium\">Mode:</span> {config.sessionType === 'study' ? 'Session d\\'étude' : 'Session libre'}</div>
        </div>
      </div>
    </div>
  );
};