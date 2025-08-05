import React, { useState, useEffect, useRef } from 'react';
import { Clock } from 'lucide-react';

interface SmartTimeInputProps {
  hours: number;
  minutes: number;
  seconds: number;
  onChange: (hours: number, minutes: number, seconds: number) => void;
  className?: string;
  placeholder?: string;
}

export const SmartTimeInput: React.FC<SmartTimeInputProps> = ({
  hours,
  minutes,
  seconds,
  onChange,
  className = '',
  placeholder = '00:00:00'
}) => {
  const [displayValue, setDisplayValue] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Mettre à jour l'affichage quand les props changent
  useEffect(() => {
    if (!isFocused) {
      const formattedTime = formatTimeDisplay(hours, minutes, seconds);
      setDisplayValue(formattedTime);
      setInputValue('');
    }
  }, [hours, minutes, seconds, isFocused]);

  const formatTimeDisplay = (h: number, m: number, s: number): string => {
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const parseSmartInput = (input: string): { hours: number; minutes: number; seconds: number } => {
    // Nettoyer l'input (garder seulement les chiffres)
    const digits = input.replace(/\D/g, '');
    
    if (digits.length === 0) {
      return { hours: 0, minutes: 0, seconds: 0 };
    }

    // Logique de parsing intelligent
    const len = digits.length;
    let h = 0, m = 0, s = 0;

    if (len === 1) {
      // 1 -> 00:00:01
      s = parseInt(digits);
    } else if (len === 2) {
      // 12 -> 00:00:12
      s = parseInt(digits);
    } else if (len === 3) {
      // 123 -> 00:01:23
      m = parseInt(digits.charAt(0));
      s = parseInt(digits.substring(1));
    } else if (len === 4) {
      // 1234 -> 00:12:34
      m = parseInt(digits.substring(0, 2));
      s = parseInt(digits.substring(2));
    } else if (len === 5) {
      // 12345 -> 01:23:45
      h = parseInt(digits.charAt(0));
      m = parseInt(digits.substring(1, 3));
      s = parseInt(digits.substring(3));
    } else if (len >= 6) {
      // 123456+ -> 12:34:56
      h = parseInt(digits.substring(0, 2));
      m = parseInt(digits.substring(2, 4));
      s = parseInt(digits.substring(4, 6));
    }

    // Validation et normalisation
    s = Math.min(s, 59);
    m = Math.min(m, 59);
    h = Math.min(h, 99);

    return { hours: h, minutes: m, seconds: s };
  };

  const handleFocus = () => {
    setIsFocused(true);
    setInputValue('');
    // Sélectionner tout le texte pour faciliter la réécriture
    setTimeout(() => {
      inputRef.current?.select();
    }, 0);
  };

  const handleBlur = () => {
    setIsFocused(false);
    
    if (inputValue === '') {
      // Si rien n'a été tapé, remettre les valeurs actuelles
      setDisplayValue(formatTimeDisplay(hours, minutes, seconds));
    } else {
      // Parser et appliquer la nouvelle valeur
      const parsed = parseSmartInput(inputValue);
      onChange(parsed.hours, parsed.minutes, parsed.seconds);
      setInputValue(''); // Vider après application
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      inputRef.current?.blur();
    } else if (e.key === 'Escape') {
      setInputValue('');
      setIsFocused(false);
      setDisplayValue(formatTimeDisplay(hours, minutes, seconds));
    } else if (e.key === 'Backspace') {
      // Gérer le backspace pour supprimer le dernier chiffre
      e.preventDefault();
      const newInputValue = inputValue.slice(0, -1);
      setInputValue(newInputValue);
      
      if (newInputValue.length > 0) {
        const parsed = parseSmartInput(newInputValue);
        setDisplayValue(formatTimeDisplay(parsed.hours, parsed.minutes, parsed.seconds));
      } else {
        setDisplayValue('00:00:00');
      }
    } else if (/^\d$/.test(e.key)) {
      // Gérer les chiffres directement
      e.preventDefault();
      const newInputValue = inputValue + e.key;
      
      if (newInputValue.length <= 6) {
        setInputValue(newInputValue);
        const parsed = parseSmartInput(newInputValue);
        setDisplayValue(formatTimeDisplay(parsed.hours, parsed.minutes, parsed.seconds));
      }
    } else if (!/^(Tab|Shift|Control|Alt|Meta|Arrow|Home|End)/.test(e.key)) {
      // Bloquer les autres touches sauf les touches de navigation
      e.preventDefault();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isFocused) return; // Ne pas traiter si pas en focus
    
    const value = e.target.value;
    
    // Si l'utilisateur tape directement (pas de ":"), traiter comme des chiffres
    if (!/[:]/.test(value)) {
      const digitsOnly = value.replace(/\D/g, '');
      
      if (digitsOnly.length <= 6) { // Limiter à 6 chiffres max (HHMMSS)
        setInputValue(digitsOnly);
        
        // Affichage en temps réel au format HH:MM:SS pendant la saisie
        if (digitsOnly.length > 0) {
          const parsed = parseSmartInput(digitsOnly);
          setDisplayValue(formatTimeDisplay(parsed.hours, parsed.minutes, parsed.seconds));
        } else {
          setDisplayValue('00:00:00');
        }
      }
    } else {
      // Si l'utilisateur tape avec ":", laisser tel quel temporairement
      setInputValue(value.replace(/\D/g, ''));
      setDisplayValue(value);
    }
  };

  const getPreviewText = (): string => {
    if (!isFocused || inputValue.length === 0) return '';
    
    const digits = inputValue.replace(/\D/g, '');
    if (digits.length === 0) return '';

    const parsed = parseSmartInput(inputValue);
    return `→ ${formatTimeDisplay(parsed.hours, parsed.minutes, parsed.seconds)}`;
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
        <Clock size={16} className="text-gray-500" />
        Configuration du temps
      </label>
      
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={displayValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`w-full px-4 py-3 text-lg font-mono text-center border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
            isFocused ? 'bg-blue-50' : 'bg-white'
          }`}
        />
        
      </div>

      {/* Message d'aide */}
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
          <span>Tapez directement : 1→2→3 = 00:01:23</span>
        </div>
      </div>

      {/* Exemples d'utilisation */}
      {isFocused && (
        <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
          <div className="text-xs font-medium text-blue-700 mb-2">💡 Tapez directement les chiffres :</div>
          <div className="grid grid-cols-2 gap-2 text-xs text-blue-600">
            <div><code className="bg-white px-1 rounded text-gray-800">5</code> = 00:00:05</div>
            <div><code className="bg-white px-1 rounded text-gray-800">123</code> = 00:01:23</div>
            <div><code className="bg-white px-1 rounded text-gray-800">2530</code> = 00:25:30</div>
            <div><code className="bg-white px-1 rounded text-gray-800">12345</code> = 01:23:45</div>
          </div>
        </div>
      )}
    </div>
  );
};