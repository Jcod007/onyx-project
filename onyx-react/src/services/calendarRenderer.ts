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
      
      // Détection et réparation des incohérences de liaison (pour tous les cours)
      const possibleTimer = allTimers.find(t => 
        t.linkedSubject && t.linkedSubject.id === subject.id
      );
      
      if (possibleTimer && !subject.linkedTimerId) {
        // INCOHÉRENCE DÉTECTÉE: Le timer pointe vers le cours mais le cours n'a pas le linkedTimerId
        console.warn(`🔧 INCOHÉRENCE DÉTECTÉE: Timer ${possibleTimer.title} lié au cours ${subject.name} mais linkedTimerId manquant`);
        console.log(`🔧 RÉPARATION: Ajout linkedTimerId=${possibleTimer.id} au cours ${subject.name}`);
        
        try {
          await subjectService.updateSubject(subject.id, {
            linkedTimerId: possibleTimer.id,
            defaultTimerMode: 'simple'
          });
          
          // Mettre à jour l'objet local pour cette session
          subject.linkedTimerId = possibleTimer.id;
          subject.defaultTimerMode = 'simple';
          console.log(`✅ RÉPARATION TERMINÉE: Cours ${subject.name} maintenant lié au timer ${possibleTimer.title}`);
        } catch (error) {
          console.error(`❌ ÉCHEC RÉPARATION pour ${subject.name}:`, error);
        }
      } else if (subject.linkedTimerId && !possibleTimer) {
        // INCOHÉRENCE INVERSE: Le cours a un linkedTimerId mais le timer n'existe pas ou n'est pas lié
        const referencedTimer = allTimers.find(t => t.id === subject.linkedTimerId);
        if (!referencedTimer) {
          console.warn(`🔧 TIMER MANQUANT: Cours ${subject.name} référence timer ${subject.linkedTimerId} qui n'existe pas`);
        } else if (!referencedTimer.linkedSubject || referencedTimer.linkedSubject.id !== subject.id) {
          console.warn(`🔧 LIAISON CASSÉE: Timer ${referencedTimer.title} n'est pas lié au cours ${subject.name}`);
        }
      }

      // LOGIQUE ROBUSTE DE DÉTERMINATION DU TYPE DE TIMER
      if (subject.linkedTimerId) {
        // Cours configuré pour utiliser un timer lié
        const linkedTimer = allTimers.find(t => t.id === subject.linkedTimerId);
        
        if (linkedTimer && linkedTimer.linkedSubject?.id === subject.id) {
          // Timer lié valide et cohérent
          console.log(`✅ Timer lié valide pour ${subject.name}: ${linkedTimer.title}`);
          timerType = 'linked';
          timerConfig = { timerId: subject.linkedTimerId };
        } else {
          // Timer lié invalide ou incohérent → fallback intelligent
          if (linkedTimer) {
            console.warn(`⚠️ Timer ${linkedTimer.title} trouvé mais liaison incohérente pour ${subject.name}`);
          } else {
            console.warn(`⚠️ Timer lié ${subject.linkedTimerId} introuvable pour ${subject.name}`);
          }
          
          // Fallback vers timer rapide basé sur les dernières données connues
          timerType = 'quick';
          if (subject.quickTimerConfig && Object.keys(subject.quickTimerConfig).length > 0) {
            timerConfig = subject.quickTimerConfig;
            console.log(`🔄 Fallback: Utilisation quickTimerConfig existante pour ${subject.name}`);
          } else {
            timerConfig = this.createFallbackQuickConfig(subject);
            console.log(`🔄 Fallback: Génération config par défaut pour ${subject.name}`);
          }
        }
      } else if (subject.defaultTimerMode === 'quick_timer' && subject.quickTimerConfig) {
        // Cours configuré explicitement pour timer rapide
        console.log(`⚡ Timer rapide configuré pour ${subject.name}`);
        timerType = 'quick';
        timerConfig = subject.quickTimerConfig;
      } else {
        // Cours sans configuration spécifique → timer rapide par défaut
        console.log(`⚡ Pas de configuration timer pour ${subject.name}, génération par défaut`);
        timerType = 'quick';
        timerConfig = this.createDefaultQuickConfig(subject);
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