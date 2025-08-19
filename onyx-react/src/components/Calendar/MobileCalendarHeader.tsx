import React from 'react';
import { ChevronLeft, ChevronRight, Calendar, Grid3X3, RefreshCw } from 'lucide-react';

interface MobileCalendarHeaderProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  viewMode: 'week' | 'day';
  onViewModeChange: (mode: 'week' | 'day') => void;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export const MobileCalendarHeader: React.FC<MobileCalendarHeaderProps> = ({
  currentDate,
  onDateChange,
  viewMode,
  onViewModeChange,
  onRefresh,
  isLoading = false
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

  const formatHeaderDateMobile = () => {
    if (viewMode === 'week') {
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay() + 1);
      return startOfWeek.toLocaleDateString('fr-FR', { 
        day: 'numeric',
        month: 'short' 
      });
    } else {
      return currentDate.toLocaleDateString('fr-FR', { 
        day: 'numeric',
        month: 'short',
        weekday: 'short'
      });
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm lg:hidden">
      {/* Vue mobile uniforme */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-blue-50 rounded-lg shadow-sm">
            <Calendar size={16} className="text-blue-600" />
          </div>
          <div>
            <div className="text-lg font-semibold text-gray-900">
              {formatHeaderDateMobile()}
            </div>
            <div className="text-sm text-gray-700">
              {viewMode === 'week' ? 'Semaine' : 'Jour'}
            </div>
          </div>
        </div>
        
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg border border-gray-200 shadow-sm transition-all duration-200 disabled:opacity-50"
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          </button>
        )}
      </div>

      {/* Navigation et contrôles */}
      <div className="flex items-center justify-between">
        <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg overflow-hidden shadow-sm">
          <button
            onClick={goToPrevious}
            className="p-2 hover:bg-white hover:shadow-sm transition-all duration-200 text-gray-600 hover:text-gray-900 border-r border-gray-200"
            disabled={isLoading}
          >
            <ChevronLeft size={16} />
          </button>
          
          <button
            onClick={goToToday}
            className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-white hover:bg-blue-50 transition-all duration-200 border-r border-gray-200"
          >
            Aujourd'hui
          </button>
          
          <button
            onClick={goToNext}
            className="p-2 hover:bg-white hover:shadow-sm transition-all duration-200 text-gray-600 hover:text-gray-900"
            disabled={isLoading}
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Sélecteur de vue mobile uniforme */}
        <div className="flex bg-gray-100 border border-gray-200 rounded-lg p-0.5 shadow-sm">
          <button
            onClick={() => onViewModeChange('week')}
            className={`flex items-center gap-1 px-2 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
              viewMode === 'week'
                ? 'bg-white text-blue-600 shadow-sm border border-blue-200'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <Grid3X3 size={12} />
            S
          </button>
          <button
            onClick={() => onViewModeChange('day')}
            className={`flex items-center gap-1 px-2 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
              viewMode === 'day'
                ? 'bg-white text-blue-600 shadow-sm border border-blue-200'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <Calendar size={12} />
            J
          </button>
        </div>
      </div>
    </div>
  );
};