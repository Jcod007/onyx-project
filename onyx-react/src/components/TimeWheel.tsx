import React, { useState, useRef, useEffect } from 'react';
import { formatHoursMinutes } from '@/utils/timeFormat';

interface TimeWheelProps {
  value: number; // valeur en minutes
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
  label?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const TimeWheel: React.FC<TimeWheelProps> = ({
  value,
  min = 5,
  max = 300,
  step = 5,
  onChange,
  label,
  className = '',
  size = 'md'
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startValue, setStartValue] = useState(0);
  const wheelRef = useRef<HTMLDivElement>(null);

  const sizeClasses = {
    sm: { wheel: 'w-16 h-24', text: 'text-sm', display: 'text-lg' },
    md: { wheel: 'w-20 h-32', text: 'text-base', display: 'text-xl' },
    lg: { wheel: 'w-24 h-40', text: 'text-lg', display: 'text-2xl' }
  };

  const classes = sizeClasses[size];

  // Générer les valeurs autour de la valeur actuelle
  const generateWheelValues = () => {
    const values = [];
    const range = 5; // Afficher 5 valeurs avant et après
    
    for (let i = -range; i <= range; i++) {
      const val = Math.round(value + (i * step));
      if (val >= min && val <= max) {
        values.push(val);
      }
    }
    return values;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartY(e.clientY);
    setStartValue(value);
    e.preventDefault();
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    
    const deltaY = startY - e.clientY;
    const sensitivity = 2; // Sensibilité du défilement
    const deltaValue = Math.round((deltaY / sensitivity) / step) * step;
    const newValue = Math.max(min, Math.min(max, startValue + deltaValue));
    
    if (newValue !== value) {
      onChange(newValue);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -step : step;
    const newValue = Math.max(min, Math.min(max, value + delta));
    onChange(newValue);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setStartY(e.touches[0].clientY);
    setStartValue(value);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging) return;
    
    const deltaY = startY - e.touches[0].clientY;
    const sensitivity = 2;
    const deltaValue = Math.round((deltaY / sensitivity) / step) * step;
    const newValue = Math.max(min, Math.min(max, startValue + deltaValue));
    
    if (newValue !== value) {
      onChange(newValue);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleTouchEnd);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isDragging, startY, startValue]);

  const formatValue = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h${mins.toString().padStart(2, '0')}` : `${hours}h`;
  };

  const wheelValues = generateWheelValues();

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {label && (
        <label className={`font-medium text-gray-700 mb-2 ${classes.text}`}>
          {label}
        </label>
      )}
      
      {/* Affichage de la valeur actuelle */}
      <div className={`font-bold text-blue-600 mb-3 ${classes.display}`}>
        {formatValue(value)}
      </div>

      {/* Roue de sélection */}
      <div 
        ref={wheelRef}
        className={`
          relative ${classes.wheel} 
          bg-gradient-to-b from-gray-100 via-white to-gray-100 
          rounded-xl border-2 border-gray-200 
          shadow-inner cursor-grab active:cursor-grabbing
          overflow-hidden
          ${isDragging ? 'select-none' : ''}
        `}
        onMouseDown={handleMouseDown}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
      >
        {/* Indicateur central */}
        <div className="absolute inset-x-0 top-1/2 transform -translate-y-1/2 h-8 bg-blue-100 border-y-2 border-blue-300 pointer-events-none z-10 opacity-80" />
        
        {/* Dégradés de masquage */}
        <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-white to-transparent pointer-events-none z-20" />
        <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white to-transparent pointer-events-none z-20" />

        {/* Valeurs de la roue */}
        <div className="absolute inset-0 flex flex-col justify-center items-center space-y-1">
          {wheelValues.map((val, index) => {
            const isCenter = val === value;
            const distance = Math.abs(wheelValues.indexOf(value) - index);
            const opacity = Math.max(0.3, 1 - (distance * 0.2));
            const scale = isCenter ? 1 : Math.max(0.8, 1 - (distance * 0.1));
            
            return (
              <div
                key={val}
                className={`
                  font-mono transition-all duration-200
                  ${isCenter ? 'text-blue-600 font-bold' : 'text-gray-600'}
                  ${classes.text}
                `}
                style={{
                  opacity,
                  transform: `scale(${scale})`,
                  lineHeight: '1.2'
                }}
              >
                {formatValue(val)}
              </div>
            );
          })}
        </div>

        {/* Boutons + et - */}
        <button
          className="absolute top-1 left-1/2 transform -translate-x-1/2 w-6 h-6 bg-white border border-gray-300 rounded-full text-gray-600 hover:bg-gray-50 flex items-center justify-center text-xs shadow-sm z-30"
          onClick={() => onChange(Math.min(max, value + step))}
        >
          +
        </button>
        <button
          className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-6 h-6 bg-white border border-gray-300 rounded-full text-gray-600 hover:bg-gray-50 flex items-center justify-center text-xs shadow-sm z-30"
          onClick={() => onChange(Math.max(min, value - step))}
        >
          −
        </button>
      </div>

      {/* Indicateurs de glissement */}
      <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
        <span>↕</span>
        <span>Glissez ou défilez</span>
      </div>
    </div>
  );
};