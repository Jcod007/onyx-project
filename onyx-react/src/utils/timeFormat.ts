/**
 * Utilitaires de formatage du temps - Migration de TimeFormatService.java
 */

export function formatDuration(seconds: number): string {
  if (seconds < 0) return '00:00';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}h${minutes.toString().padStart(2, '0')}`;
  }
  
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export function formatHoursMinutes(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours === 0) {
    return `${minutes}min`;
  }
  
  return `${hours}h${minutes > 0 ? `${minutes.toString().padStart(2, '0')}` : ''}`;
}

export function parseTimeInput(timeStr: string): { hours: number; minutes: number; seconds: number } {
  const parts = timeStr.split(':');
  
  if (parts.length === 2) {
    // Format MM:SS
    return {
      hours: 0,
      minutes: parseInt(parts[0]) || 0,
      seconds: parseInt(parts[1]) || 0
    };
  } else if (parts.length === 3) {
    // Format HH:MM:SS
    return {
      hours: parseInt(parts[0]) || 0,
      minutes: parseInt(parts[1]) || 0,
      seconds: parseInt(parts[2]) || 0
    };
  }
  
  // Fallback
  return { hours: 0, minutes: 0, seconds: 0 };
}

export function secondsToTimeSpan(seconds: number): { hours: number; minutes: number; seconds: number } {
  return {
    hours: Math.floor(seconds / 3600),
    minutes: Math.floor((seconds % 3600) / 60),
    seconds: seconds % 60
  };
}

export function timeSpanToSeconds(hours: number, minutes: number, seconds: number): number {
  return hours * 3600 + minutes * 60 + seconds;
}

export function calculateProgress(timeSpent: number, targetTime: number): number {
  if (targetTime === 0) return 0;
  return Math.min((timeSpent / targetTime) * 100, 100);
}

export function isValidTimeInput(hours: number, minutes: number, seconds: number): boolean {
  return hours >= 0 && hours <= 99 && 
         minutes >= 0 && minutes <= 59 && 
         seconds >= 0 && seconds <= 59 &&
         (hours + minutes + seconds) > 0;
}

export function normalizeTime(hours: number, minutes: number, seconds: number): { hours: number; minutes: number; seconds: number } {
  let totalSeconds = timeSpanToSeconds(hours, minutes, seconds);
  
  // Clamp to maximum (99:59:59)
  const maxSeconds = 99 * 3600 + 59 * 60 + 59;
  if (totalSeconds > maxSeconds) {
    totalSeconds = maxSeconds;
  }
  
  return secondsToTimeSpan(totalSeconds);
}