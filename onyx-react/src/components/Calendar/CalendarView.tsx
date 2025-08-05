import React from 'react';
import { WeekView } from './WeekView';
import { DayView } from './DayView';
import { Subject } from '@/types/Subject';
import { ActiveTimer } from '@/types/ActiveTimer';

interface CalendarViewProps {
  currentDate: Date;
  viewMode: 'week' | 'day';
  subjects: Subject[];
  timers: ActiveTimer[];
  onLinkTimer: (subjectId: string, timerId: string) => void;
  onUnlinkTimer: (subjectId: string) => void;
  getAvailableTimers: (subjectId?: string) => ActiveTimer[];
  getLinkedTimers: (subjectId: string) => ActiveTimer[];
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  currentDate,
  viewMode,
  subjects,
  timers,
  onLinkTimer,
  onUnlinkTimer,
  getAvailableTimers,
  getLinkedTimers
}) => {
  if (viewMode === 'week') {
    return (
      <WeekView
        currentDate={currentDate}
        subjects={subjects}
        timers={timers}
        onLinkTimer={onLinkTimer}
        onUnlinkTimer={onUnlinkTimer}
        getAvailableTimers={getAvailableTimers}
        getLinkedTimers={getLinkedTimers}
      />
    );
  } else {
    return (
      <DayView
        currentDate={currentDate}
        subjects={subjects}
        timers={timers}
        onLinkTimer={onLinkTimer}
        onUnlinkTimer={onUnlinkTimer}
        getAvailableTimers={getAvailableTimers}
        getLinkedTimers={getLinkedTimers}
      />
    );
  }
};