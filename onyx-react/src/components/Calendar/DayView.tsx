import React from 'react';
import { CalendarDay, DayStudySession } from '@/types/Subject';

interface DayViewProps {
  calendarDays: CalendarDay[];
  currentDate: Date;
  onLaunchSession: (session: DayStudySession) => void;
  onLinkCourse?: (courseId: string, timerId: string) => void;
  onUnlinkCourse?: (courseId: string) => void;
}

export const DayView: React.FC<DayViewProps> = () => {
  // Cette vue est maintenant entièrement gérée par CalendarPage
  // Retourne null car le contenu est affiché directement dans CalendarPage
  return null;
};