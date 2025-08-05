import React from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

interface CalendarHeaderProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  viewMode: 'week' | 'day';
  onViewModeChange: (mode: 'week' | 'day') => void;
}

export const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  currentDate,
  onDateChange,
  viewMode,
  onViewModeChange
}) => {
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
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-gray-200">
      {/* Titre et navigation */}
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar size={28} className="text-blue-600" />
            Calendrier d'étude
          </h1>
          <p className="text-gray-600 mt-1">
            Planifiez et suivez vos sessions d'étude
          </p>
        </div>
      </div>

      {/* Contrôles de navigation */}
      <div className="flex items-center gap-3">
        {/* Sélecteur de vue */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => onViewModeChange('week')}
            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              viewMode === 'week'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Semaine
          </button>
          <button
            onClick={() => onViewModeChange('day')}
            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              viewMode === 'day'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Jour
          </button>
        </div>

        {/* Navigation temporelle */}
        <div className="flex items-center gap-2">
          <button
            onClick={goToPrevious}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title={viewMode === 'week' ? 'Semaine précédente' : 'Jour précédent'}
          >
            <ChevronLeft size={20} />
          </button>
          
          <div className="text-center min-w-[200px]">
            <div className="font-semibold text-gray-900">
              {formatHeaderDate()}
            </div>
          </div>
          
          <button
            onClick={goToNext}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title={viewMode === 'week' ? 'Semaine suivante' : 'Jour suivant'}
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Bouton aujourd'hui */}
        <button
          onClick={goToToday}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          Aujourd'hui
        </button>
      </div>
    </div>
  );
};