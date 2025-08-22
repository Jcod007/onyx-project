/**
 * 🔄 HOOK POUR BINDING BIDIRECTIONNEL RÉACTIF
 * 
 * Synchronisation immédiate entre cours et timers sans délais
 * Utilise useMemo et useCallback pour des updates atomiques
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import { Subject } from '@/types/Subject';
import { ActiveTimer } from '@/types/ActiveTimer';
import { syncEventBus } from '@/services/syncEventBus';

export interface LinkedSubjectData extends Subject {
  linkedTimer?: ActiveTimer;
  hasValidLink: boolean;
}

interface LinkedTimerData extends ActiveTimer {
  hasValidLink: boolean;
}

interface BidirectionalBindingResult {
  linkedSubjects: LinkedSubjectData[];
  linkedTimers: LinkedTimerData[];
  linkCourseToTimer: (courseId: string, timerId: string) => void;
  unlinkCourse: (courseId: string) => void;
  refreshData: () => void;
}

export const useBidirectionalBinding = (
  initialSubjects: Subject[],
  initialTimers: ActiveTimer[]
): BidirectionalBindingResult => {
  const [subjects, setSubjects] = useState<Subject[]>(initialSubjects);
  const [timers, setTimers] = useState<ActiveTimer[]>(initialTimers);

  // ✅ BINDING BIDIRECTIONNEL EN TEMPS RÉEL
  const linkedSubjects = useMemo<LinkedSubjectData[]>(() => {
    const result = subjects.map(subject => {
      const linkedTimer = subject.linkedTimerId 
        ? timers.find(t => t.id === subject.linkedTimerId)
        : undefined;
      
      if (subject.linkedTimerId) {
        console.log(`🔗 Subject "${subject.name}" cherche timer ${subject.linkedTimerId}:`, 
          linkedTimer ? `✅ Trouvé "${linkedTimer.title}"` : '❌ Non trouvé');
      }
      
      return {
        ...subject,
        linkedTimer,
        hasValidLink: !!(subject.linkedTimerId && linkedTimer)
      };
    });
    
    console.log('🔄 Hook: linkedSubjects recalculés:', result.length, 
      result.filter(s => s.hasValidLink).length + ' avec liaisons valides');
    return result;
  }, [subjects, timers]); // ✅ Recalcul automatique dès changement

  // ✅ TIMERS AVEC VALIDATION DE LIAISON
  const linkedTimers = useMemo<LinkedTimerData[]>(() => {
    return timers.map(timer => {
      const hasValidLink = !!(timer.linkedSubject && 
        subjects.find(s => s.id === timer.linkedSubject?.id));
      
      return {
        ...timer,
        hasValidLink
      };
    });
  }, [timers, subjects]);

  // ✅ LIAISON IMMÉDIATE SANS DÉLAI
  const linkCourseToTimer = useCallback((courseId: string, timerId: string) => {
    console.log(`🔗 Binding immédiat: ${courseId} ↔ ${timerId}`);
    
    // 1. Trouver les entités
    const subject = subjects.find(s => s.id === courseId);
    const timer = timers.find(t => t.id === timerId);
    
    if (!subject || !timer) {
      console.error('Entités introuvables pour liaison');
      return;
    }
    
    // 2. Mise à jour ATOMIQUE des states
    setSubjects(prev => prev.map(s => {
      if (s.id === courseId) {
        return {
          ...s,
          linkedTimerId: timerId,
          defaultTimerMode: 'simple' as const,
          quickTimerConfig: undefined,
          timerConversionNote: undefined
        };
      }
      // Délier les autres cours de ce timer (avec conversion en timer rapide)
      if (s.linkedTimerId === timerId && s.id !== courseId) {
        console.log(`🔓 Binding: Déliaison automatique cours "${s.name}" du timer ${timerId}`);
        // Convertir en timer rapide
        const quickConfig = timer ? {
          type: 'simple' as const,
          workDuration: Math.floor(timer.config.workDuration / 60) || 25
        } : {
          type: 'simple' as const,
          workDuration: Math.floor(s.defaultTimerDuration / 60) || 25
        };
        
        return { 
          ...s, 
          linkedTimerId: undefined,
          defaultTimerMode: 'quick_timer' as const,
          quickTimerConfig: quickConfig,
          timerConversionNote: `Timer "${timer?.title || 'inconnu'}" délié automatiquement le ${new Date().toLocaleString('fr-FR')}`
        };
      }
      return s;
    }));
    
    setTimers(prev => prev.map(t => {
      if (t.id === timerId) {
        return {
          ...t,
          linkedSubject: { ...subject, linkedTimerId: timerId },
          lastUsed: new Date()
        };
      }
      // Délier ce cours des autres timers
      if (t.linkedSubject?.id === courseId && t.id !== timerId) {
        console.log(`🔓 Binding: Déliaison timer "${t.title}" du cours ${courseId}`);
        return { ...t, linkedSubject: undefined };
      }
      return t;
    }));
    
    // 3. Notification SYNCHRONE
    syncEventBus.notifyLinkageChange('link', courseId, timerId);
    
  }, [subjects, timers]);

  // ✅ DÉLIAISON IMMÉDIATE
  const unlinkCourse = useCallback((courseId: string) => {
    console.log(`🔓 Déliaison immédiate: ${courseId}`);
    
    const subject = subjects.find(s => s.id === courseId);
    if (!subject?.linkedTimerId) return;
    
    const linkedTimer = timers.find(t => t.id === subject.linkedTimerId);
    
    // Conversion vers timer rapide
    const quickConfig = linkedTimer ? {
      type: 'simple' as const,
      workDuration: Math.floor(linkedTimer.config.workDuration / 60) || 25
    } : {
      type: 'simple' as const,
      workDuration: Math.floor(subject.defaultTimerDuration / 60) || 25
    };
    
    // Mise à jour ATOMIQUE
    setSubjects(prev => prev.map(s => 
      s.id === courseId ? {
        ...s,
        linkedTimerId: undefined,
        defaultTimerMode: 'quick_timer' as const,
        quickTimerConfig: quickConfig,
        timerConversionNote: `Timer "${linkedTimer?.title || 'inconnu'}" délié le ${new Date().toLocaleString('fr-FR')}`
      } : s
    ));
    
    setTimers(prev => prev.map(t => 
      t.linkedSubject?.id === courseId ? {
        ...t,
        linkedSubject: undefined,
        lastUsed: new Date()
      } : t
    ));
    
    // Notification SYNCHRONE
    syncEventBus.notifyLinkageChange('unlink', courseId, subject.linkedTimerId);
    
  }, [subjects, timers]);

  // ✅ RAFRAÎCHISSEMENT MANUEL
  const refreshData = useCallback(() => {
    setSubjects([...subjects]);
    setTimers([...timers]);
  }, [subjects, timers]);

  // ✅ SYNCHRONISATION AVEC LES DONNÉES EXTERNES
  useEffect(() => {
    console.log('🔄 Hook: Mise à jour subjects depuis props:', initialSubjects.length);
    setSubjects(initialSubjects);
  }, [initialSubjects]);

  useEffect(() => {
    console.log('🔄 Hook: Mise à jour timers depuis props:', initialTimers.length);
    setTimers(initialTimers);
  }, [initialTimers]);

  return {
    linkedSubjects,
    linkedTimers,
    linkCourseToTimer,
    unlinkCourse,
    refreshData
  };
};