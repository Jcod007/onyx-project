import React, { useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Grid3X3, RotateCcw } from 'lucide-react';

interface CalendarHeaderProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  viewMode: 'week' | 'day';
  onViewModeChange: (mode: 'week' | 'day') => void;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  currentDate,
  onDateChange,
  viewMode,
  onViewModeChange,
  onRefresh,
  isLoading = false
}) => {
  
  // Raccourcis clavier
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          goToPrevious();
          break;
        case 'ArrowRight':
          e.preventDefault();
          goToNext();
          break;
        case 't':
        case 'T':
          e.preventDefault();
          goToToday();
          break;
        case 'w':
        case 'W':
          e.preventDefault();
          onViewModeChange('week');
          break;
        case 'd':
        case 'D':
          e.preventDefault();
          onViewModeChange('day');
          break;
        case 'r':
        case 'R':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            onRefresh?.();
          }
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentDate, viewMode, onDateChange, onViewModeChange, onRefresh]);
  const goToPrevious = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setDate(newDate.getDate() - 1);
    }
    onDateChange(newDate);
  };

  const goToNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    onDateChange(newDate);
  };

  const goToToday = () => {
    onDateChange(new Date());
  };

  const formatHeaderDate = () => {
    if (viewMode === 'week') {
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay() + 1); // Lundi
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6); // Dimanche

      if (startOfWeek.getMonth() === endOfWeek.getMonth()) {
        return `${startOfWeek.getDate()}-${endOfWeek.getDate()} ${startOfWeek.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`;
      } else {
        return `${startOfWeek.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} - ${endOfWeek.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}`;
      }
    } else {
      return currentDate.toLocaleDateString('fr-FR', { 
        weekday: 'long',
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      });
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 mb-4">
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
        {/* Titre et informations */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg shadow-sm">
              <Calendar size={18} className="text-blue-600" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                Calendrier d'étude
              </h1>
              <p className="text-gray-600 text-sm">
                Planifiez et suivez vos sessions
              </p>
            </div>
          </div>
          
          {/* Raccourcis clavier - séparés sur mobile */}
          <div className="sm:ml-auto xl:ml-0">
            <span className="text-xs bg-gray-100 px-2 py-1 rounded-md text-gray-700 border border-gray-200">
              ←→ Naviguer • T Aujourd'hui • W/D Changer vue • Ctrl+R Actualiser
            </span>
          </div>
        </div>

        {/* Contrôles principaux */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 xl:flex-shrink-0">
          {/* Sélecteur de vue uniforme */}
          <div className="flex bg-gray-100 border border-gray-200 rounded-lg p-0.5 shadow-sm">
            <button
              onClick={() => onViewModeChange('week')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
                viewMode === 'week'
                  ? 'bg-white text-blue-600 shadow-sm border border-blue-200'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
              title="Vue semaine (W)"
            >
              <Grid3X3 size={14} />
              Semaine
            </button>
            <button
              onClick={() => onViewModeChange('day')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
                viewMode === 'day'
                  ? 'bg-white text-blue-600 shadow-sm border border-blue-200'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
              title="Vue jour (D)"
            >
              <Calendar size={14} />
              Jour
            </button>
          </div>

          {/* Navigation temporelle uniforme */}
          <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg overflow-hidden shadow-sm">
            <button
              onClick={goToPrevious}
              className="p-2 hover:bg-white hover:shadow-sm transition-all duration-200 text-gray-600 hover:text-gray-900 border-r border-gray-200"
              title={`${viewMode === 'week' ? 'Semaine précédente' : 'Jour précédent'} (←)`}
              disabled={isLoading}
            >
              <ChevronLeft size={16} />
            </button>
            
            <div className="flex flex-col items-center justify-center px-4 py-1.5 min-w-[160px] bg-white">
              <div className="font-semibold text-gray-900 text-sm leading-tight">
                {formatHeaderDate()}
              </div>
              <div className="text-xs text-gray-500">
                {viewMode === 'week' ? 'Semaine' : 'Journée'} • {new Date().getFullYear()}
              </div>
            </div>
            
            <button
              onClick={goToNext}
              className="p-2 hover:bg-white hover:shadow-sm transition-all duration-200 text-gray-600 hover:text-gray-900 border-l border-gray-200"
              title={`${viewMode === 'week' ? 'Semaine suivante' : 'Jour suivant'} (→)`}
              disabled={isLoading}
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Actions rapides uniformes */}
          <div className="flex items-center gap-2">
            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={isLoading}
                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg border border-gray-200 shadow-sm transition-all duration-200 disabled:opacity-50"
                title="Actualiser (Ctrl+R)"
              >
                <RotateCcw size={16} className={isLoading ? 'animate-spin' : ''} />
              </button>
            )}
            
            <button
              onClick={goToToday}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg border border-blue-700 shadow-sm hover:bg-blue-700 transition-all duration-200 disabled:opacity-50"
              title="Aujourd'hui (T)"
              disabled={isLoading}
            >
              Aujourd'hui
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};