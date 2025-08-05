import React, { useState, useRef, useEffect } from 'react';

interface RotaryWheelProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
  label?: string;
  unit?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const RotaryWheel: React.FC<RotaryWheelProps> = ({
  value,
  min = 0,
  max = 100,
  step = 1,
  onChange,
  label,
  unit = '',
  className = '',
  size = 'md'
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [startAngle, setStartAngle] = useState(0);
  const [startValue, setStartValue] = useState(value);
  const wheelRef = useRef<HTMLDivElement>(null);

  const sizeClasses = {
    sm: { wheel: 'w-16 h-16', text: 'text-xs', display: 'text-sm' },
    md: { wheel: 'w-24 h-24', text: 'text-sm', display: 'text-lg' },
    lg: { wheel: 'w-32 h-32', text: 'text-base', display: 'text-xl' }
  };

  const classes = sizeClasses[size];

  // Calculer l'angle basé sur la valeur (0-360 degrés)
  const getAngleFromValue = (val: number) => {
    const normalizedValue = (val - min) / (max - min);
    return normalizedValue * 300; // 300 degrés de rotation (pas un cercle complet)
  };

  // Calculer la valeur basée sur l'angle
  const getValueFromAngle = (angle: number) => {
    const normalizedAngle = Math.max(0, Math.min(300, angle)) / 300;
    const newValue = min + (normalizedAngle * (max - min));
    return Math.round(newValue / step) * step;
  };

  // Calculer l'angle entre deux points
  const getAngle = (centerX: number, centerY: number, pointX: number, pointY: number) => {
    const deltaX = pointX - centerX;
    const deltaY = pointY - centerY;
    let angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
    
    // Normaliser l'angle (0-360)
    angle = (angle + 90 + 360) % 360;
    return angle;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!wheelRef.current) return;
    
    const rect = wheelRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    setIsDragging(true);
    setStartAngle(getAngle(centerX, centerY, e.clientX, e.clientY));
    setStartValue(value);
    e.preventDefault();
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !wheelRef.current) return;
    
    const rect = wheelRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const currentAngle = getAngle(centerX, centerY, e.clientX, e.clientY);
    let angleDelta = currentAngle - startAngle;
    
    // Gérer le passage de 360 à 0 et vice versa
    if (angleDelta > 180) angleDelta -= 360;
    if (angleDelta < -180) angleDelta += 360;
    
    const currentValueAngle = getAngleFromValue(startValue);
    const newAngle = currentValueAngle + angleDelta;
    const newValue = getValueFromAngle(newAngle);
    
    if (newValue !== value && newValue >= min && newValue <= max) {
      onChange(newValue);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!wheelRef.current) return;
    
    const rect = wheelRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const touch = e.touches[0];
    
    setIsDragging(true);
    setStartAngle(getAngle(centerX, centerY, touch.clientX, touch.clientY));
    setStartValue(value);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging || !wheelRef.current) return;
    
    const rect = wheelRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const touch = e.touches[0];
    
    const currentAngle = getAngle(centerX, centerY, touch.clientX, touch.clientY);
    let angleDelta = currentAngle - startAngle;
    
    if (angleDelta > 180) angleDelta -= 360;
    if (angleDelta < -180) angleDelta += 360;
    
    const currentValueAngle = getAngleFromValue(startValue);
    const newAngle = currentValueAngle + angleDelta;
    const newValue = getValueFromAngle(newAngle);
    
    if (newValue !== value && newValue >= min && newValue <= max) {
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
  }, [isDragging, startAngle, startValue]);

  const formatValue = (val: number) => {
    if (unit === 'time') {
      if (val < 60) return `${val}min`;
      const hours = Math.floor(val / 60);
      const mins = val % 60;
      return mins > 0 ? `${hours}h${mins.toString().padStart(2, '0')}` : `${hours}h`;
    }
    return `${val}${unit}`;
  };

  const currentAngle = getAngleFromValue(value);
  const progress = (value - min) / (max - min);

  // Générer les graduation marks
  const generateMarks = () => {
    const marks = [];
    const totalMarks = 12; // 12 marques comme une horloge
    
    for (let i = 0; i < totalMarks; i++) {
      const angle = (i * 300) / (totalMarks - 1) - 150; // -150 à +150 degrés
      const isActive = (i / (totalMarks - 1)) <= progress;
      
      marks.push(
        <div
          key={i}
          className={`absolute w-0.5 h-3 ${isActive ? 'bg-blue-500' : 'bg-gray-300'} rounded-full transition-colors duration-200`}
          style={{
            top: '10%',
            left: '50%',
            transform: `translate(-50%, 0) rotate(${angle}deg)`,
            transformOrigin: `50% ${size === 'lg' ? '54px' : size === 'md' ? '38px' : '22px'}`
          }}
        />
      );
    }
    return marks;
  };

  return (
    <div className={`flex flex-col items-center space-y-3 ${className}`}>
      {label && (
        <label className={`font-medium text-gray-700 ${classes.text}`}>
          {label}
        </label>
      )}
      
      {/* Affichage de la valeur */}
      <div className={`font-bold text-blue-600 ${classes.display}`}>
        {formatValue(value)}
      </div>

      {/* Roue rotative */}
      <div className="relative">
        <div
          ref={wheelRef}
          className={`
            ${classes.wheel} relative rounded-full border-4 border-gray-200
            bg-gradient-to-br from-white via-gray-50 to-gray-100
            shadow-lg hover:shadow-xl cursor-grab active:cursor-grabbing
            transition-all duration-300
            ${isDragging ? 'shadow-2xl scale-105' : ''}
          `}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          style={{ userSelect: 'none' }}
        >
          {/* Marques de graduation */}
          {generateMarks()}
          
          {/* Indicateur central */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 bg-blue-600 rounded-full shadow-md"></div>
          </div>
          
          {/* Aiguille/Pointeur */}
          <div
            className="absolute top-1/2 left-1/2 w-0.5 bg-blue-600 rounded-full shadow-lg transition-transform duration-200"
            style={{
              height: size === 'lg' ? '28px' : size === 'md' ? '20px' : '12px',
              transform: `translate(-50%, -100%) rotate(${currentAngle - 150}deg)`,
              transformOrigin: `50% 100%`
            }}
          />
          
          {/* Cercle central */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-4 h-4 bg-white border-2 border-blue-600 rounded-full shadow-md"></div>
          </div>
        </div>
      </div>

      {/* Indicateurs de range */}
      <div className="flex justify-between text-xs text-gray-500 w-full max-w-20">
        <span>{formatValue(min)}</span>
        <span>{formatValue(max)}</span>
      </div>
    </div>
  );
};