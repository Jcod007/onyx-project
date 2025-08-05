import React, { useState, useRef, useEffect } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface ErgonomicTimeInputProps {
  value: number; // en minutes
  min?: number;
  max?: number;
  onChange: (value: number) => void;
  className?: string;
  disabled?: boolean;
  label?: string;
}

export const ErgonomicTimeInput: React.FC<ErgonomicTimeInputProps> = ({
  value,
  min = 30,
  max = 1200,
  onChange,
  className = '',
  disabled = false,
  label
}) => {
  const [hours, setHours] = useState(Math.floor(value / 60));
  const [minutes, setMinutes] = useState(value % 60);
  const [focusedField, setFocusedField] = useState<'hours' | 'minutes' | null>(null);
  
  const hoursRef = useRef<HTMLInputElement>(null);
  const minutesRef = useRef<HTMLInputElement>(null);

  // Mettre à jour les valeurs internes quand la prop value change
  useEffect(() => {
    const newHours = Math.floor(value / 60);
    const newMinutes = value % 60;
    setHours(newHours);
    setMinutes(newMinutes);
  }, [value]);

  const updateValue = (newHours: number, newMinutes: number) => {
    // Validation et ajustement
    newHours = Math.max(0, Math.min(Math.floor(max / 60), newHours));
    newMinutes = Math.max(0, Math.min(59, newMinutes));
    
    const totalMinutes = newHours * 60 + newMinutes;
    const clampedValue = Math.max(min, Math.min(max, totalMinutes));
    
    onChange(clampedValue);
  };

  const handleHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHours = parseInt(e.target.value) || 0;
    setHours(newHours);
    updateValue(newHours, minutes);
  };

  const handleMinutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newMinutes = parseInt(e.target.value) || 0;
    
    // Auto-conversion : si on tape plus de 59, convertir en heures
    if (newMinutes >= 60) {
      const additionalHours = Math.floor(newMinutes / 60);
      newMinutes = newMinutes % 60;
      const newHours = hours + additionalHours;
      setHours(newHours);
      updateValue(newHours, newMinutes);
    } else {
      setMinutes(newMinutes);
      updateValue(hours, newMinutes);
    }
  };

  const incrementHours = () => {
    const newHours = hours + 1;
    setHours(newHours);
    updateValue(newHours, minutes);
  };

  const decrementHours = () => {
    const newHours = Math.max(0, hours - 1);
    setHours(newHours);
    updateValue(newHours, minutes);
  };

  const incrementMinutes = () => {
    let newMinutes = minutes + 15; // Incrément de 15 minutes
    let newHours = hours;
    
    if (newMinutes >= 60) {
      newHours += Math.floor(newMinutes / 60);
      newMinutes = newMinutes % 60;
    }
    
    setHours(newHours);
    setMinutes(newMinutes);
    updateValue(newHours, newMinutes);
  };

  const decrementMinutes = () => {
    let newMinutes = minutes - 15;
    let newHours = hours;
    
    if (newMinutes < 0 && newHours > 0) {
      newHours -= 1;
      newMinutes = 45;
    } else if (newMinutes < 0) {
      newMinutes = 0;
    }
    
    setHours(newHours);
    setMinutes(newMinutes);
    updateValue(newHours, newMinutes);
  };

  const handleKeyDown = (e: React.KeyboardEvent, field: 'hours' | 'minutes') => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (field === 'hours') incrementHours();
      else incrementMinutes();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (field === 'hours') decrementHours();
      else decrementMinutes();
    } else if (e.key === 'Tab' && field === 'hours' && !e.shiftKey) {
      e.preventDefault();
      minutesRef.current?.focus();
    }
  };

  const formatValue = (val: number) => val.toString().padStart(2, '0');

  const getProgressPercentage = () => {
    return ((value - min) / (max - min)) * 100;
  };

  return (
    <div className={`flex flex-col items-center space-y-2 ${className}`}>
      {/* Label */}
      {label && (
        <label className="text-xs font-medium text-gray-700 text-center">
          {label}
        </label>
      )}

      {/* Contrôleur principal compact */}
      <div className={`relative bg-white rounded-lg border shadow-sm transition-all duration-200 ${
        focusedField ? 'border-indigo-400 shadow-md' : 'border-gray-200 hover:border-indigo-300'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
        
        {/* Barre de progression */}
        <div className="absolute inset-0 rounded-lg overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-indigo-50 to-blue-50 transition-all duration-300"
            style={{ width: `${getProgressPercentage()}%` }}
          />
        </div>

        {/* Contenu compact */}
        <div className="relative p-3">
          {/* Saisie du temps horizontale */}
          <div className="flex items-center justify-center space-x-1">
            {/* Heures */}
            <div className="flex items-center space-x-1">
              <button
                onClick={decrementHours}
                disabled={disabled}
                className="p-1 text-indigo-600 hover:bg-indigo-100 rounded transition-colors disabled:opacity-50"
              >
                <ChevronDown size={12} />
              </button>
              
              <input
                ref={hoursRef}
                type="number"
                value={formatValue(hours)}
                onChange={handleHoursChange}
                onFocus={() => setFocusedField('hours')}
                onBlur={() => setFocusedField(null)}
                onKeyDown={(e) => handleKeyDown(e, 'hours')}
                min="0"
                max={Math.floor(max / 60)}
                disabled={disabled}
                className="w-8 h-8 text-sm font-bold text-center bg-transparent border border-gray-300 rounded focus:border-indigo-500 focus:outline-none transition-colors disabled:opacity-50"
              />
              
              <button
                onClick={incrementHours}
                disabled={disabled}
                className="p-1 text-indigo-600 hover:bg-indigo-100 rounded transition-colors disabled:opacity-50"
              >
                <ChevronUp size={12} />
              </button>
            </div>

            {/* Séparateur */}
            <div className="text-sm font-bold text-indigo-600">h</div>

            {/* Minutes */}
            <div className="flex items-center space-x-1">
              <button
                onClick={decrementMinutes}
                disabled={disabled}
                className="p-1 text-indigo-600 hover:bg-indigo-100 rounded transition-colors disabled:opacity-50"
              >
                <ChevronDown size={12} />
              </button>
              
              <input
                ref={minutesRef}
                type="number"
                value={formatValue(minutes)}
                onChange={handleMinutesChange}
                onFocus={() => setFocusedField('minutes')}
                onBlur={() => setFocusedField(null)}
                onKeyDown={(e) => handleKeyDown(e, 'minutes')}
                min="0"
                max="59"
                step="15"
                disabled={disabled}
                className="w-8 h-8 text-sm font-bold text-center bg-transparent border border-gray-300 rounded focus:border-indigo-500 focus:outline-none transition-colors disabled:opacity-50"
              />
              
              <button
                onClick={incrementMinutes}
                disabled={disabled}
                className="p-1 text-indigo-600 hover:bg-indigo-100 rounded transition-colors disabled:opacity-50"
              >
                <ChevronUp size={12} />
              </button>
            </div>

            <div className="text-xs text-gray-500">min</div>
          </div>
        </div>
      </div>

      {/* Presets rapides compacts */}
      <div className="flex flex-wrap gap-1 justify-center">
        {[
          { label: '1h', value: 60 },
          { label: '2h', value: 120 },
          { label: '4h', value: 240 },
          { label: '6h', value: 360 },
          { label: '8h', value: 480 }
        ].filter(preset => preset.value >= min && preset.value <= max).map(preset => (
          <button
            key={preset.value}
            onClick={() => onChange(preset.value)}
            disabled={disabled}
            className={`px-2 py-1 text-xs rounded transition-all duration-200 ${
              value === preset.value
                ? 'bg-indigo-600 text-white'
                : disabled
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-100 text-gray-600 hover:bg-indigo-100 hover:text-indigo-700'
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
};