import React from 'react';
import { WeekView } from './WeekView';
import { DayView } from './DayView';
import { CalendarDay, DayStudySession } from '@/types/Subject';

interface CalendarViewProps {
  calendarDays: CalendarDay[];
  currentDate: Date;
  viewMode: 'week' | 'day';
  onLaunchSession: (session: DayStudySession) => void;
  onLinkCourse: (courseId: string, timerId: string) => void;
  onUnlinkCourse: (courseId: string) => void;
  onDateClick?: (date: Date) => void;
  getSessionButtonInfo?: (session: DayStudySession) => any;
  navigate?: (path: string) => void;
  persistentState?: {
    selectedSessions: Set<string>;
    hoveredSession: string | null;
    expandedSessions: Set<string>;
  };
  onPersistentStateChange?: (state: any) => void;
  getSubjectTimeForDate?: (subjectId: string, date: Date) => number;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  calendarDays,
  currentDate,
  viewMode,
  onLaunchSession,
  onLinkCourse,
  onUnlinkCourse,
  onDateClick,
  getSessionButtonInfo,
  navigate,
  persistentState,
  onPersistentStateChange,
  getSubjectTimeForDate
}) => {
  // Variables utilisées seulement par DayView - éviter warning unused
  void { getSessionButtonInfo, navigate, persistentState, onPersistentStateChange };
  if (viewMode === 'week') {
    return (
      <WeekView
        calendarDays={calendarDays}
        currentDate={currentDate}
        onDateClick={onDateClick}
        getSubjectTimeForDate={getSubjectTimeForDate}
      />
    );
  } else {
    return (
      <DayView
        calendarDays={calendarDays}
        currentDate={currentDate}
        onLaunchSession={onLaunchSession}
        onLinkCourse={onLinkCourse}
        onUnlinkCourse={onUnlinkCourse}
      />
    );
  }
};