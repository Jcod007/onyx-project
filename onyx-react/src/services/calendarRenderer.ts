import { Subject, DayOfWeek, DayStudySession, CalendarDay, QuickTimerConfig } from '@/types/Subject';
import { ActiveTimer } from '@/types/ActiveTimer';
import { subjectService } from './subjectService';
import { centralizedTimerService } from './centralizedTimerService';

/**
 * 📅 CalendarRenderer
 * 
 * Service qui génère le calendrier dynamique basé sur la planification des cours.
 * Calcule automatiquement les sessions d'étude selon les jours sélectionnés et objectifs hebdomadaires.
 */
class CalendarRenderer {
  private static instance: CalendarRenderer;

  static getInstance(): CalendarRenderer {
    if (!CalendarRenderer.instance) {
      CalendarRenderer.instance = new CalendarRenderer();
    }
    return CalendarRenderer.instance;
  }

  /**
   * 📅 GÉNÉRATION DU CALENDRIER
   * Génère les jours avec sessions planifiées pour une période donnée
   */
  async generateCalendarDays(startDate: Date, endDate: Date): Promise<CalendarDay[]> {
    console.log(`📅 Génération calendrier ${startDate.toLocaleDateString()} → ${endDate.toLocaleDateString()}`);

    try {
      const allSubjects = await subjectService.getAllSubjects();
      const allTimers = centralizedTimerService.getTimers();
      const calendarDays: CalendarDay[] = [];

      // Générer chaque jour de la période
      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        const dayData = await this.generateDayData(new Date(currentDate), allSubjects, allTimers);
        calendarDays.push(dayData);
        currentDate.setDate(currentDate.getDate() + 1);
      }

      console.log(`✅ ${calendarDays.length} jours générés`);
      return calendarDays;

    } catch (error) {
      console.error('❌ Erreur génération calendrier:', error);
      throw error;
    }
  }

  /**
   * 📋 SESSIONS D'UN JOUR SPÉCIFIQUE  
   * Génère les sessions planifiées pour un jour donné
   */
  async generateDayData(date: Date, _subjects?: Subject[], _timers?: ActiveTimer[]): Promise<CalendarDay> {
    const dayOfWeek = this.getDayOfWeekFromDate(date);
    const isToday = this.isSameDay(date, new Date());

    // Toujours recharger les données pour éviter les problèmes de cache
    const allSubjects = await subjectService.getAllSubjects();
    const allTimers = centralizedTimerService.getTimers();

    // Filtrer les cours planifiés pour ce jour
    const scheduledSubjects = allSubjects.filter(subject => 
      subject.studyDays && subject.studyDays.includes(dayOfWeek)
    );

    console.log(`📋 ${scheduledSubjects.length} cours planifiés pour ${dayOfWeek.toLowerCase()}`);

    // Générer les sessions
    const sessions: DayStudySession[] = [];
    let totalPlannedTime = 0;

    for (const subject of scheduledSubjects) {
      const session = await this.createStudySession(subject, date, allTimers);
      if (session) {
        sessions.push(session);
        totalPlannedTime += session.plannedDuration;
      }
    }

    return {
      date: new Date(date),
      isToday,
      sessions,
      totalPlannedTime
    };
  }

  /**
   * 🎯 CRÉATION SESSION D'ÉTUDE
   * Crée une session d'étude pour un cours donné avec la bonne configuration de timer
   */
  private async createStudySession(
    subject: Subject, 
    date: Date, 
    allTimers: ActiveTimer[]
  ): Promise<DayStudySession | null> {
    try {
      // Calculer la durée planifiée selon la répartition hebdomadaire
      const plannedDuration = this.calculatePlannedDuration(subject);
      
      // Déterminer le type de timer et sa configuration
      let timerType: 'quick' | 'linked';
      let timerConfig: QuickTimerConfig | { timerId: string };

      console.log(`🔍 Analyse cours ${subject.name}:`, {
        id: subject.id,
        linkedTimerId: subject.linkedTimerId,
        hasLinkedTimer: !!subject.linkedTimerId,
        quickTimerConfig: subject.quickTimerConfig,
        defaultTimerMode: subject.defaultTimerMode
      });
      
      // Vérification spéciale pour Histoire
      if (subject.name.toLowerCase().includes('histoire')) {
        console.log(`🔍 HISTOIRE DÉTECTION - linkedTimerId:`, subject.linkedTimerId);
        console.log(`🔍 HISTOIRE DÉTECTION - hasLinkedTimer:`, !!subject.linkedTimerId);
        
        // Vérifier s'il y a une incohérence dans les timers
        const possibleTimer = allTimers.find(t => t.linkedSubject && t.linkedSubject.name.toLowerCase().includes('histoire'));
        if (possibleTimer) {
          console.log(`🔍 HISTOIRE - Timer trouvé dans les timers actifs:`, {
            timerId: possibleTimer.id,
            timerTitle: possibleTimer.title,
            linkedSubjectId: possibleTimer.linkedSubject?.id,
            courseId: subject.id,
            courseName: subject.name,
            MISMATCH: possibleTimer.linkedSubject?.id !== subject.id || possibleTimer.id !== subject.linkedTimerId
          });
          
          // RÉPARATION AUTOMATIQUE: Si le timer est lié au cours mais le cours n'a pas le linkedTimerId
          if (possibleTimer.linkedSubject?.id === subject.id && !subject.linkedTimerId) {
            console.log(`🔧 RÉPARATION AUTOMATIQUE: Ajout linkedTimerId au cours Histoire`);
            try {
              await subjectService.updateSubject(subject.id, {
                linkedTimerId: possibleTimer.id,
                defaultTimerMode: 'simple'
              });
              // Mettre à jour l'objet local
              subject.linkedTimerId = possibleTimer.id;
              subject.defaultTimerMode = 'simple';
              console.log(`✅ RÉPARATION TERMINÉE: linkedTimerId ajouté`);
            } catch (error) {
              console.error(`❌ ÉCHEC RÉPARATION:`, error);
            }
          }
        }
      }

      if (subject.linkedTimerId) {
        // Timer lié
        const linkedTimer = allTimers.find(t => t.id === subject.linkedTimerId);
        if (linkedTimer) {
          console.log(`✅ Timer lié trouvé pour ${subject.name}: ${linkedTimer.title}`);
          timerType = 'linked';
          timerConfig = { timerId: subject.linkedTimerId };
        } else {
          // Timer lié introuvable → fallback vers timer rapide
          console.warn(`⚠️ Timer lié ${subject.linkedTimerId} introuvable pour ${subject.name}, fallback timer rapide`);
          timerType = 'quick';
          timerConfig = this.createFallbackQuickConfig(subject);
        }
      } else {
        // Timer rapide
        console.log(`⚡ Pas de timer lié pour ${subject.name}, utilisation timer rapide`);
        timerType = 'quick';
        if (subject.quickTimerConfig) {
          timerConfig = subject.quickTimerConfig;
        } else {
          // Générer config par défaut
          timerConfig = this.createDefaultQuickConfig(subject);
        }
      }

      return {
        id: `${subject.id}-${date.toISOString().split('T')[0]}`,
        subjectId: subject.id,
        subject,
        date: new Date(date),
        plannedDuration,
        timerType,
        timerConfig
      };

    } catch (error) {
      console.error(`❌ Erreur création session pour ${subject.name}:`, error);
      return null;
    }
  }

  /**
   * ⏱️ LANCEMENT DE SESSION
   * Lance une session d'étude avec la configuration appropriée
   */
  async launchStudySession(session: DayStudySession): Promise<{
    timerConfig: any;
    mode: 'quick' | 'linked';
    timer?: ActiveTimer;
  }> {
    console.log(`▶️ Lancement session ${session.subject?.name || 'Matière inconnue'} (${session.timerType})`);

    try {
      if (session.timerType === 'linked') {
        // Lancer timer lié
        const timerId = (session.timerConfig as { timerId: string }).timerId;
        const allTimers = centralizedTimerService.getTimers();
        const linkedTimer = allTimers.find(t => t.id === timerId);

        if (!linkedTimer) {
          throw new Error(`Timer lié ${timerId} introuvable`);
        }

        // Mettre à jour la date de dernière utilisation
        await centralizedTimerService.updateTimer(timerId, { lastUsed: new Date() });

        return {
          timerConfig: linkedTimer.config,
          mode: 'linked',
          timer: linkedTimer
        };

      } else {
        // Lancer timer rapide
        const quickConfig = session.timerConfig as QuickTimerConfig;
        
        // Convertir en format TimerService
        const timerServiceConfig = {
          workDuration: quickConfig.workDuration * 60, // minutes → secondes
          shortBreakDuration: (quickConfig.shortBreakDuration || 5) * 60,
          longBreakDuration: (quickConfig.longBreakDuration || 15) * 60,
          longBreakInterval: quickConfig.cycles || 4
        };

        return {
          timerConfig: timerServiceConfig,
          mode: 'quick'
        };
      }

    } catch (error) {
      console.error('❌ Erreur lancement session:', error);
      throw error;
    }
  }

  /**
   * 📊 STATISTIQUES HEBDOMADAIRES
   * Calcule les statistiques pour une semaine donnée
   */
  async getWeeklyStats(weekStartDate: Date): Promise<{
    totalPlannedTime: number;
    plannedSessions: number;
    subjectsCount: number;
    averageSessionDuration: number;
  }> {
    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekStartDate.getDate() + 6);

    const weekDays = await this.generateCalendarDays(weekStartDate, weekEndDate);
    
    const totalPlannedTime = weekDays.reduce((sum, day) => sum + day.totalPlannedTime, 0);
    const plannedSessions = weekDays.reduce((sum, day) => sum + day.sessions.length, 0);
    const uniqueSubjects = new Set(
      weekDays.flatMap(day => day.sessions.map(s => s.subjectId))
    );

    return {
      totalPlannedTime,
      plannedSessions,
      subjectsCount: uniqueSubjects.size,
      averageSessionDuration: plannedSessions > 0 ? totalPlannedTime / plannedSessions : 0
    };
  }

  /**
   * Méthodes utilitaires privées
   */
  private calculatePlannedDuration(subject: Subject): number {
    if (!subject.studyDays || subject.studyDays.length === 0) {
      return Math.floor(subject.defaultTimerDuration / 60); // par défaut en minutes
    }

    // Répartir l'objectif hebdomadaire sur les jours sélectionnés
    const weeklyGoal = subject.weeklyTimeGoal || 120; // 2h par défaut
    return Math.floor(weeklyGoal / subject.studyDays.length);
  }

  private createDefaultQuickConfig(subject: Subject): QuickTimerConfig {
    const durationInMinutes = subject.defaultTimerDuration 
      ? Math.floor(subject.defaultTimerDuration / 60) 
      : 25; // 25 minutes par défaut
    return {
      type: 'simple',
      workDuration: Math.max(durationInMinutes, 1) // Minimum 1 minute
    };
  }

  private createFallbackQuickConfig(subject: Subject): QuickTimerConfig {
    const durationInMinutes = subject.defaultTimerDuration 
      ? Math.floor(subject.defaultTimerDuration / 60) 
      : 25; // 25 minutes par défaut
    return {
      type: 'simple',
      workDuration: Math.max(durationInMinutes, 1) // Minimum 1 minute
    };
  }

  private getDayOfWeekFromDate(date: Date): DayOfWeek {
    const days: DayOfWeek[] = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    return days[date.getDay()];
  }

  private isSameDay(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  }
}

export const calendarRenderer = CalendarRenderer.getInstance();