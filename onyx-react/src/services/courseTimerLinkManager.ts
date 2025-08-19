import { Subject, QuickTimerConfig } from '@/types/Subject';
import { ActiveTimer } from '@/types/ActiveTimer';
import { subjectService } from './subjectService';
import { centralizedTimerService } from './centralizedTimerService';

/**
 * 🔗 CourseTimerLinkManager
 * 
 * Gestionnaire unifié pour toute la logique de liaison entre cours et timers.
 * Assure la cohérence bidirectionnelle stricte : 1 cours ↔ 1 timer.
 */
class CourseTimerLinkManager {
  private static instance: CourseTimerLinkManager;
  private listeners: Set<() => void> = new Set();

  static getInstance(): CourseTimerLinkManager {
    if (!CourseTimerLinkManager.instance) {
      CourseTimerLinkManager.instance = new CourseTimerLinkManager();
    }
    return CourseTimerLinkManager.instance;
  }

  /**
   * S'abonner aux changements de liaisons
   */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener();
      } catch (error) {
        console.error('Erreur dans listener CourseTimerLinkManager:', error);
      }
    });
  }

  /**
   * 🔗 LIAISON COURS → TIMER
   * Lier un cours à un timer existant (relation exclusive 1↔1)
   */
  async linkCourseToTimer(courseId: string, timerId: string): Promise<void> {
    console.log(`🔗 Liaison cours ${courseId} → timer ${timerId}`);

    try {
      // 1. Vérifier que le cours et le timer existent
      const course = await subjectService.getSubject(courseId);
      const timers = centralizedTimerService.getTimers();
      const timer = timers.find(t => t.id === timerId);

      if (!course) throw new Error(`Cours ${courseId} introuvable`);
      if (!timer) throw new Error(`Timer ${timerId} introuvable`);

      // 2. Délier les anciennes liaisons si nécessaire
      await this.unlinkCourseFromAnyTimer(courseId);
      await this.unlinkTimerFromAnyCourse(timerId);

      // 3. Créer la nouvelle liaison bidirectionnelle
      await centralizedTimerService.linkTimerToSubject(courseId, timerId);
      
      // 4. Mettre à jour le cours : passer en mode "timer lié"
      await subjectService.updateSubject(courseId, {
        linkedTimerId: timerId,
        defaultTimerMode: 'simple', // Mode simple = timer lié
        quickTimerConfig: undefined, // Nettoyer l'ancienne config rapide
        timerConversionNote: undefined // Nettoyer les notes de conversion
      });

      console.log(`✅ Liaison réussie : cours "${course.name}" ↔ timer "${timer.title}"`);
      this.notifyListeners();

    } catch (error) {
      console.error('❌ Erreur liaison cours-timer:', error);
      throw error;
    }
  }

  /**
   * 🔓 DÉLIAISON COURS ↔ TIMER
   * Délier un cours de son timer (passer en mode timer rapide)
   */
  async unlinkCourse(courseId: string): Promise<void> {
    console.log(`🔓 Déliaison cours ${courseId}`);

    try {
      const course = await subjectService.getSubject(courseId);
      if (!course) throw new Error(`Cours ${courseId} introuvable`);

      if (!course.linkedTimerId) {
        console.log(`Cours ${course.name} n'a pas de timer lié`);
        return;
      }

      // 1. Récupérer le timer avant déliaison pour conversion
      const timers = centralizedTimerService.getTimers();
      const linkedTimer = timers.find(t => t.id === course.linkedTimerId);

      // 2. Délier dans le service centralisé
      await centralizedTimerService.unlinkTimerFromSubject(courseId);

      // 3. Convertir le cours vers timer rapide
      let quickConfig: QuickTimerConfig;
      if (linkedTimer) {
        quickConfig = this.convertTimerToQuickConfig(linkedTimer);
      } else {
        // Fallback si timer non trouvé
        quickConfig = {
          type: 'simple',
          workDuration: Math.floor(course.defaultTimerDuration / 60) || 25
        };
      }

      await subjectService.updateSubject(courseId, {
        linkedTimerId: undefined,
        defaultTimerMode: 'quick_timer',
        quickTimerConfig: quickConfig,
        timerConversionNote: `Timer "${linkedTimer?.title || 'inconnu'}" délié le ${new Date().toLocaleString('fr-FR')} et converti en timer rapide`
      });

      console.log(`✅ Cours "${course.name}" délié et converti en timer rapide`);
      this.notifyListeners();

    } catch (error) {
      console.error('❌ Erreur déliaison cours:', error);
      throw error;
    }
  }

  /**
   * 🗑️ SUPPRESSION TIMER → CONVERSION AUTOMATIQUE
   * Quand un timer est supprimé, convertir automatiquement les cours liés
   */
  async handleTimerDeletion(timerId: string): Promise<void> {
    console.log(`🗑️ Gestion suppression timer ${timerId}`);

    try {
      // Récupérer le timer avant suppression pour conversion
      const timers = centralizedTimerService.getTimers();
      const timerToDelete = timers.find(t => t.id === timerId);

      if (!timerToDelete) {
        console.log(`Timer ${timerId} introuvable`);
        return;
      }

      // Trouver tous les cours liés à ce timer
      const allSubjects = await subjectService.getAllSubjects();
      const linkedCourses = allSubjects.filter(course => course.linkedTimerId === timerId);

      // Convertir les cours liés en timers rapides
      for (const course of linkedCourses) {
        console.log(`🔄 Conversion cours "${course.name}" vers timer rapide`);
        
        const quickConfig = this.convertTimerToQuickConfig(timerToDelete);

        await subjectService.updateSubject(course.id, {
          linkedTimerId: undefined,
          defaultTimerMode: 'quick_timer',
          quickTimerConfig: quickConfig,
          timerConversionNote: `Timer "${timerToDelete.title}" supprimé le ${new Date().toLocaleString('fr-FR')} et converti en timer rapide`
        });
      }

      // Supprimer le timer (qu'il soit lié ou non)
      await centralizedTimerService.removeTimer(timerId);

      console.log(`✅ Timer "${timerToDelete.title}" supprimé${linkedCourses.length > 0 ? ` et ${linkedCourses.length} cours converti(s)` : ''}`);
      this.notifyListeners();

    } catch (error) {
      console.error('❌ Erreur suppression timer:', error);
      throw error;
    }
  }

  /**
   * 🗑️ SUPPRESSION COURS → DÉLIAISON
   * Quand un cours est supprimé, délier le timer associé
   */
  async handleCourseDeletion(courseId: string): Promise<void> {
    console.log(`🗑️ Gestion suppression cours ${courseId}`);

    try {
      const course = await subjectService.getSubject(courseId);
      if (!course) {
        console.log(`Cours ${courseId} déjà supprimé`);
        return;
      }

      // Délier le timer si lié
      if (course.linkedTimerId) {
        await centralizedTimerService.unlinkTimersFromDeletedSubject(courseId);
        console.log(`🔓 Timer ${course.linkedTimerId} délié du cours supprimé`);
      }

      // Supprimer le cours
      await subjectService.deleteSubject(courseId);

      console.log(`✅ Cours "${course.name}" supprimé`);
      this.notifyListeners();

    } catch (error) {
      console.error('❌ Erreur suppression cours:', error);
      throw error;
    }
  }

  /**
   * 📊 ÉTAT DES LIAISONS
   * Obtenir un rapport complet des liaisons cours-timer
   */
  async getLinkageStatus(): Promise<{
    linkedCourses: Array<{ course: Subject; timer: ActiveTimer }>;
    unlinkedCourses: Subject[];
    unlinkedTimers: ActiveTimer[];
    orphanedReferences: Array<{ type: 'course' | 'timer'; id: string; issue: string }>;
  }> {
    const allSubjects = await subjectService.getAllSubjects();
    const allTimers = centralizedTimerService.getTimers();

    const linkedCourses: Array<{ course: Subject; timer: ActiveTimer }> = [];
    const unlinkedCourses: Subject[] = [];
    const unlinkedTimers: ActiveTimer[] = [];
    const orphanedReferences: Array<{ type: 'course' | 'timer'; id: string; issue: string }> = [];

    // Analyser les cours
    for (const course of allSubjects) {
      if (course.linkedTimerId) {
        const timer = allTimers.find(t => t.id === course.linkedTimerId);
        if (timer) {
          linkedCourses.push({ course, timer });
        } else {
          orphanedReferences.push({
            type: 'course',
            id: course.id,
            issue: `Référence timer ${course.linkedTimerId} inexistant`
          });
        }
      } else {
        unlinkedCourses.push(course);
      }
    }

    // Analyser les timers
    for (const timer of allTimers) {
      if (!timer.linkedSubject || !linkedCourses.find(lc => lc.timer.id === timer.id)) {
        unlinkedTimers.push(timer);
      }
    }

    return {
      linkedCourses,
      unlinkedCourses,
      unlinkedTimers,
      orphanedReferences
    };
  }

  /**
   * Méthodes utilitaires privées
   */
  private async unlinkCourseFromAnyTimer(courseId: string): Promise<void> {
    const course = await subjectService.getSubject(courseId);
    if (course?.linkedTimerId) {
      await centralizedTimerService.unlinkTimerFromSubject(courseId);
    }
  }

  private async unlinkTimerFromAnyCourse(timerId: string): Promise<void> {
    const timers = centralizedTimerService.getTimers();
    const timer = timers.find(t => t.id === timerId);
    if (timer?.linkedSubject) {
      await centralizedTimerService.unlinkTimerFromSubject(timer.linkedSubject.id);
    }
  }

  private convertTimerToQuickConfig(timer: ActiveTimer): QuickTimerConfig {
    const workDurationMinutes = Math.floor(timer.config.workDuration / 60);
    
    if (timer.isPomodoroMode && timer.config.shortBreakDuration && timer.config.longBreakDuration) {
      return {
        type: 'pomodoro',
        workDuration: workDurationMinutes,
        shortBreakDuration: Math.floor(timer.config.shortBreakDuration / 60),
        longBreakDuration: Math.floor(timer.config.longBreakDuration / 60),
        cycles: timer.config.longBreakInterval || 4
      };
    } else {
      return {
        type: 'simple',
        workDuration: workDurationMinutes
      };
    }
  }
}

export const courseTimerLinkManager = CourseTimerLinkManager.getInstance();