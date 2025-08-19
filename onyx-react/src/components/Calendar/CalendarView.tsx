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
  navigate
}) => {
  if (viewMode === 'week') {
    return (
      <WeekView
        calendarDays={calendarDays}
        currentDate={currentDate}
        onLaunchSession={onLaunchSession}
        onLinkCourse={onLinkCourse}
        onUnlinkCourse={onUnlinkCourse}
        onDateClick={onDateClick}
        getSessionButtonInfo={getSessionButtonInfo}
        navigate={navigate}
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