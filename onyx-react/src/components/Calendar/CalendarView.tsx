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
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  calendarDays,
  currentDate,
  viewMode,
  onLaunchSession,
  onLinkCourse,
  onUnlinkCourse
}) => {
  if (viewMode === 'week') {
    return (
      <WeekView
        calendarDays={calendarDays}
        currentDate={currentDate}
        onLaunchSession={onLaunchSession}
        onLinkCourse={onLinkCourse}
        onUnlinkCourse={onUnlinkCourse}
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