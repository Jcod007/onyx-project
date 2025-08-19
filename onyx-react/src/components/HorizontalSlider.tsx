import React, { useState, useRef, useEffect } from 'react';

interface HorizontalSliderProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
  width?: number;
  className?: string;
  disabled?: boolean;
  label?: string;
  unit?: string;
  showValue?: boolean;
}

export const HorizontalSlider: React.FC<HorizontalSliderProps> = ({
  value,
  min = 0,
  max = 100,
  step = 1,
  onChange,
  width = 200,
  className = '',
  disabled = false,
  label,
  unit = '',
  showValue = true
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startValue, setStartValue] = useState(value);
  const sliderRef = useRef<HTMLDivElement>(null);

  // Calculer la position du curseur basée sur la valeur (0-100%)
  const getPositionFromValue = (val: number) => {
    const normalizedValue = (val - min) / (max - min);
    return normalizedValue * 100;
  };

  // Calculer la valeur basée sur la position X
  const getValueFromPosition = (x: number, rect: DOMRect) => {
    const relativeX = x - rect.left;
    const percentage = Math.max(0, Math.min(1, relativeX / rect.width));
    const newValue = min + (percentage * (max - min));
    return Math.round(newValue / step) * step;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled || !sliderRef.current) return;
    
    setIsDragging(true);
    setStartX(e.clientX);
    setStartValue(value);
    
    // Permettre le clic direct pour positionner le curseur
    const rect = sliderRef.current.getBoundingClientRect();
    const newValue = getValueFromPosition(e.clientX, rect);
    if (newValue !== value && newValue >= min && newValue <= max) {
      onChange(Math.max(min, Math.min(max, newValue)));
    }
    
    e.preventDefault();
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !sliderRef.current) return;
    
    const rect = sliderRef.current.getBoundingClientRect();
    const newValue = getValueFromPosition(e.clientX, rect);
    
    if (newValue !== value && newValue >= min && newValue <= max) {
      onChange(Math.max(min, Math.min(max, newValue)));
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled || !sliderRef.current) return;
    
    const touch = e.touches[0];
    setIsDragging(true);
    setStartX(touch.clientX);
    setStartValue(value);
    
    // Permettre le tap direct pour positionner le curseur
    const rect = sliderRef.current.getBoundingClientRect();
    const newValue = getValueFromPosition(touch.clientX, rect);
    if (newValue !== value && newValue >= min && newValue <= max) {
      onChange(Math.max(min, Math.min(max, newValue)));
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging || !sliderRef.current) return;
    
    const touch = e.touches[0];
    const rect = sliderRef.current.getBoundingClientRect();
    const newValue = getValueFromPosition(touch.clientX, rect);
    
    if (newValue !== value && newValue >= min && newValue <= max) {
      onChange(Math.max(min, Math.min(max, newValue)));
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
  }, [isDragging, startX, startValue]);

  const currentPosition = getPositionFromValue(value);
  const progress = (value - min) / (max - min);

  // Générer les marques de graduation
  const generateTicks = () => {
    const ticks = [];
    const tickCount = Math.min(10, Math.floor((max - min) / step) + 1);
    const tickStep = (max - min) / (tickCount - 1);
    
    for (let i = 0; i < tickCount; i++) {
      const tickValue = min + (i * tickStep);
      const position = getPositionFromValue(tickValue);
      const isActive = tickValue <= value;
      
      ticks.push(
        <div
          key={i}
          className={`absolute bottom-0 w-0.5 h-2 rounded-full transition-colors duration-200 ${
            isActive ? 'bg-indigo-500' : 'bg-gray-300'
          }`}
          style={{
            left: `${position}%`,
            transform: 'translateX(-50%)'
          }}
        />
      );
    }
    return ticks;
  };

  const formatValue = (val: number) => {
    if (unit === 'time') {
      const hours = Math.floor(val / 60);
      const mins = val % 60;
      return `${hours.toString().padStart(2, '0')}h${mins.toString().padStart(2, '0')}`;
    }
    return `${val}${unit}`;
  };

  return (
    <div className={`flex flex-col space-y-2 ${className}`}>
      {/* Label */}
      {label && (
        <label className="text-sm font-medium text-gray-700 text-center">
          {label}
        </label>
      )}
      
      {/* Affichage de la valeur */}
      {showValue && (
        <div className="text-lg font-bold text-indigo-600 text-center">
          {formatValue(value)}
        </div>
      )}

      {/* Slider horizontal */}
      <div className="relative flex items-center" style={{ width: `${width}px` }}>
        {/* Rail du slider */}
        <div
          ref={sliderRef}
          className={`relative h-1 bg-gray-200 rounded-full cursor-pointer select-none ${
            disabled ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          style={{ width: `${width}px` }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          {/* Partie active du rail */}
          <div
            className="absolute left-0 top-0 h-full bg-gradient-to-r from-indigo-500 to-indigo-400 rounded-full transition-all duration-200"
            style={{ width: `${progress * 100}%` }}
          />
          
          {/* Marques de graduation */}
          {generateTicks()}
          
          {/* Curseur */}
          <div
            className={`absolute top-1/2 w-4 h-4 bg-white border-2 border-indigo-500 rounded-full shadow-lg transform -translate-y-1/2 -translate-x-1/2 transition-all duration-200 ${
              isDragging ? 'scale-110 shadow-xl' : 'hover:scale-105'
            } ${disabled ? 'opacity-50' : 'cursor-grab active:cursor-grabbing'}`}
            style={{
              left: `${currentPosition}%`
            }}
          >
            {/* Point central */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Étiquettes min/max */}
      <div className="flex justify-between text-xs text-gray-500" style={{ width: `${width}px` }}>
        <span>{formatValue(min)}</span>
        <span>{formatValue(max)}</span>
      </div>
    </div>
  );
};