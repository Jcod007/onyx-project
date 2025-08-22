import { Subject, QuickTimerConfig } from '@/types/Subject';
import { ActiveTimer } from '@/types/ActiveTimer';
import { subjectService } from './subjectService';
import { linkLogger } from '@/utils/logger';

/**
 * 🔗 TimerSubjectLinkService
 * 
 * Service unifié pour toute la logique de liaison entre timers et cours.
 * Remplace et unifie les fonctionnalités de courseTimerLinkManager et centralizedTimerService.
 * Assure la cohérence bidirectionnelle stricte : 1 cours ↔ 1 timer.
 */
class TimerSubjectLinkService {
  private static instance: TimerSubjectLinkService;
  private listeners: Set<() => void> = new Set();

  // Interface avec le service de timers (sera injecté)
  private timerService: {
    getTimers: () => ActiveTimer[];
    updateTimer: (id: string, updates: Partial<ActiveTimer>) => Promise<void>;
    removeTimer: (id: string) => Promise<void>;
    subscribe: (listener: () => void) => () => void;
  } | null = null;

  static getInstance(): TimerSubjectLinkService {
    if (!TimerSubjectLinkService.instance) {
      TimerSubjectLinkService.instance = new TimerSubjectLinkService();
    }
    return TimerSubjectLinkService.instance;
  }

  /**
   * Injection du service de timers (évite la dépendance circulaire)
   */
  setTimerService(timerService: {
    getTimers: () => ActiveTimer[];
    updateTimer: (id: string, updates: Partial<ActiveTimer>) => Promise<void>;
    removeTimer: (id: string) => Promise<void>;
    subscribe: (listener: () => void) => () => void;
  }): void {
    this.timerService = timerService;
    
    // S'abonner aux changements du service de timers
    this.timerService.subscribe(() => {
      this.notifyListeners();
    });
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
        linkLogger.error('Erreur dans listener TimerSubjectLinkService:', error);
      }
    });
  }

  private ensureTimerService(): void {
    if (!this.timerService) {
      throw new Error('TimerService non injecté dans TimerSubjectLinkService');
    }
  }

  /**
   * 🔗 LIAISON COURS → TIMER
   * Lier un cours à un timer existant (relation exclusive 1↔1) avec rollback transactionnel
   */
  async linkCourseToTimer(courseId: string, timerId: string): Promise<void> {
    this.ensureTimerService();
    linkLogger.link(`Liaison cours ${courseId} → timer ${timerId}`);

    // État initial pour rollback
    const initialState = {
      course: null as Subject | null,
      timer: null as ActiveTimer | null,
      previousCourseLinkedTimer: null as string | null,
      previousTimerLinkedCourse: null as { id: string; name: string } | null
    };

    try {
      // 1. Vérifier et sauvegarder l'état initial
      initialState.course = await subjectService.getSubject(courseId);
      const timers = this.timerService!.getTimers();
      initialState.timer = timers.find(t => t.id === timerId) || null;

      if (!initialState.course) throw new Error(`Cours ${courseId} introuvable`);
      if (!initialState.timer) throw new Error(`Timer ${timerId} introuvable`);

      // Sauvegarder les liaisons actuelles pour rollback
      initialState.previousCourseLinkedTimer = initialState.course.linkedTimerId || null;
      initialState.previousTimerLinkedCourse = initialState.timer.linkedSubject || null;

      // 2. Délier les anciennes liaisons si nécessaire
      await this.unlinkCourseFromAnyTimer(courseId);
      await this.unlinkTimerFromAnyCourse(timerId);

      // 3. Créer la nouvelle liaison bidirectionnelle
      await this.linkTimerToSubject(courseId, timerId);
      
      // 4. Mettre à jour le cours : passer en mode "timer lié"
      await subjectService.updateSubject(courseId, {
        linkedTimerId: timerId,
        defaultTimerMode: 'simple', // Mode simple = timer lié
        quickTimerConfig: undefined, // Nettoyer l'ancienne config rapide
        timerConversionNote: undefined // Nettoyer les notes de conversion
      });

      linkLogger.success(`Liaison réussie : cours "${initialState.course.name}" ↔ timer "${initialState.timer.title}"`);
      this.notifyListeners();

    } catch (error) {
      linkLogger.error('Erreur liaison cours-timer, tentative de rollback:', error);
      
      // Rollback transactionnel
      try {
        await this.rollbackLinkage(courseId, timerId, initialState);
        linkLogger.info('Rollback effectué avec succès');
      } catch (rollbackError) {
        linkLogger.error('Erreur critique lors du rollback:', rollbackError);
        // En cas d'échec du rollback, forcer une notification pour que les composants se rafraîchissent
        this.notifyListeners();
      }
      
      throw error;
    }
  }

  /**
   * 🔄 ROLLBACK TRANSACTIONNEL
   * Restaure l'état précédent en cas d'erreur de liaison
   */
  private async rollbackLinkage(
    courseId: string, 
    timerId: string, 
    initialState: {
      course: Subject | null;
      timer: ActiveTimer | null;
      previousCourseLinkedTimer: string | null;
      previousTimerLinkedCourse: { id: string; name: string } | null;
    }
  ): Promise<void> {
    linkLogger.debug('Début du rollback transactionnel');

    // Restaurer l'état du cours
    if (initialState.course) {
      const courseRestoreData: Partial<Subject> = {
        linkedTimerId: initialState.previousCourseLinkedTimer || undefined
      };

      // Si le cours avait un timer lié précédemment, restaurer le mode simple
      if (initialState.previousCourseLinkedTimer) {
        courseRestoreData.defaultTimerMode = 'simple';
      } else {
        // Si le cours n'avait pas de timer lié, restaurer le mode quick_timer
        courseRestoreData.defaultTimerMode = 'quick_timer';
        // Recréer une config rapide basique si elle n'existe pas
        if (!initialState.course.quickTimerConfig) {
          courseRestoreData.quickTimerConfig = {
            type: 'simple',
            workDuration: Math.floor(initialState.course.defaultTimerDuration / 60) || 25
          };
        }
      }

      await subjectService.updateSubject(courseId, courseRestoreData);
    }

    // Restaurer l'état du timer
    if (initialState.previousTimerLinkedCourse) {
      // Re-lier le timer à son cours précédent
      await this.linkTimerToSubject(
        initialState.previousTimerLinkedCourse.id, 
        timerId
      );
    } else {
      // Délier le timer s'il n'était pas lié avant
      await this.unlinkTimerFromSubject(courseId);
    }

    // Restaurer la liaison précédente du cours si elle existait
    if (initialState.previousCourseLinkedTimer && initialState.previousCourseLinkedTimer !== timerId) {
      await this.linkTimerToSubject(courseId, initialState.previousCourseLinkedTimer);
    }

    linkLogger.debug('Rollback transactionnel terminé');
  }

  /**
   * 🔓 DÉLIAISON COURS ↔ TIMER
   * Délier un cours de son timer (passer en mode timer rapide)
   */
  async unlinkCourse(courseId: string): Promise<void> {
    this.ensureTimerService();
    linkLogger.debug(`Déliaison cours ${courseId}`);

    try {
      const course = await subjectService.getSubject(courseId);
      if (!course) throw new Error(`Cours ${courseId} introuvable`);

      if (!course.linkedTimerId) {
        linkLogger.info(`Cours ${course.name} n'a pas de timer lié`);
        return;
      }

      // Délier le timer (qui fait aussi la conversion automatiquement)
      await this.unlinkTimerFromSubject(courseId);

      linkLogger.success(`Cours "${course.name}" délié et converti en timer rapide`);
      this.notifyListeners();

    } catch (error) {
      linkLogger.error('Erreur déliaison cours:', error);
      throw error;
    }
  }

  /**
   * 🗑️ SUPPRESSION TIMER → CONVERSION AUTOMATIQUE
   * Quand un timer est supprimé, convertir automatiquement les cours liés
   */
  async handleTimerDeletion(timerId: string): Promise<void> {
    this.ensureTimerService();
    linkLogger.debug(`Gestion suppression timer ${timerId}`);

    try {
      // Récupérer le timer avant suppression pour conversion
      const timers = this.timerService!.getTimers();
      const timerToDelete = timers.find(t => t.id === timerId);

      if (!timerToDelete) {
        linkLogger.info(`Timer ${timerId} introuvable`);
        return;
      }

      // Trouver tous les cours liés à ce timer
      const allSubjects = await subjectService.getAllSubjects();
      const linkedCourses = allSubjects.filter(course => course.linkedTimerId === timerId);

      // Convertir les cours liés en timers rapides
      for (const course of linkedCourses) {
        linkLogger.loading(`Conversion cours "${course.name}" vers timer rapide`);
        
        const quickConfig = this.convertTimerToQuickConfig(timerToDelete);

        await subjectService.updateSubject(course.id, {
          linkedTimerId: undefined,
          defaultTimerMode: 'quick_timer',
          quickTimerConfig: quickConfig,
          timerConversionNote: `Timer "${timerToDelete.title}" supprimé le ${new Date().toLocaleString('fr-FR')} et converti en timer rapide`
        });
      }

      // Supprimer le timer
      await this.timerService!.removeTimer(timerId);

      linkLogger.success(`Timer "${timerToDelete.title}" supprimé${linkedCourses.length > 0 ? ` et ${linkedCourses.length} cours converti(s)` : ''}`);
      this.notifyListeners();

    } catch (error) {
      linkLogger.error('Erreur suppression timer:', error);
      throw error;
    }
  }

  /**
   * 🗑️ SUPPRESSION COURS → DÉLIAISON
   * Quand un cours est supprimé, délier le timer associé
   */
  async handleCourseDeletion(courseId: string): Promise<void> {
    this.ensureTimerService();
    linkLogger.debug(`Gestion suppression cours ${courseId}`);

    try {
      const course = await subjectService.getSubject(courseId);
      if (!course) {
        linkLogger.info(`Cours ${courseId} déjà supprimé`);
        return;
      }

      // Délier le timer si lié AVANT de supprimer le cours
      if (course.linkedTimerId) {
        // Forcer la mise à jour immédiate du timer
        await this.unlinkTimersFromDeletedSubject(courseId);
        linkLogger.debug(`Timer ${course.linkedTimerId} délié du cours supprimé`);
        
        // Notifier immédiatement pour que les composants se mettent à jour
        this.notifyListeners();
        
        // Attendre un peu pour s'assurer que la mise à jour est propagée
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Supprimer le cours
      await subjectService.deleteSubject(courseId);

      linkLogger.success(`Cours "${course.name}" supprimé`);
      
      // Notifier à nouveau après la suppression complète
      this.notifyListeners();

    } catch (error) {
      linkLogger.error('Erreur suppression cours:', error);
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
    this.ensureTimerService();
    const allSubjects = await subjectService.getAllSubjects();
    const allTimers = this.timerService!.getTimers();

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
   * Liaison robuste d'un timer à un cours
   * Gère automatiquement la déliaison des anciennes associations
   */
  async linkTimerToSubject(subjectId: string, timerId: string): Promise<void> {
    this.ensureTimerService();
    console.log(`🔄 Liaison timer ${timerId} → cours ${subjectId}`);
    
    // Récupérer le cours
    const subject = await subjectService.getSubject(subjectId);
    if (!subject) {
      throw new Error(`Cours ${subjectId} introuvable`);
    }

    // Vérifier l'existence du timer
    const timers = this.timerService!.getTimers();
    const targetTimer = timers.find(t => t.id === timerId);
    if (!targetTimer) {
      throw new Error(`Timer ${timerId} introuvable`);
    }

    // Délier l'ancien timer du cours s'il existe
    const currentLinkedTimer = timers.find(t => t.linkedSubject?.id === subjectId && t.id !== timerId);
    if (currentLinkedTimer) {
      console.log(`🔓 Déliaison automatique timer ${currentLinkedTimer.id} du cours ${subject.name}`);
      await this.timerService!.updateTimer(currentLinkedTimer.id, {
        linkedSubject: undefined,
        lastUsed: new Date()
      });
    }

    // Si le timer était lié à un autre cours, délier ce cours
    if (targetTimer.linkedSubject && targetTimer.linkedSubject.id !== subjectId) {
      console.log(`🔓 Déliaison automatique cours ${targetTimer.linkedSubject.id} du timer ${targetTimer.title}`);
      await subjectService.updateSubject(targetTimer.linkedSubject.id, {
        linkedTimerId: undefined
      });
    }

    // Mettre à jour le cours AVEC les bonnes informations
    const updatedSubject = await subjectService.updateSubject(subjectId, {
      linkedTimerId: timerId,
      defaultTimerMode: 'simple',
      quickTimerConfig: undefined,
      timerConversionNote: undefined
    });

    if (!updatedSubject) {
      throw new Error(`Échec mise à jour cours ${subjectId}`);
    }

    // Lier le timer au cours avec les données fraîches du subject
    console.log(`✅ Liaison timer ${targetTimer.title} → cours ${updatedSubject.name} (mode: ${updatedSubject.defaultTimerMode})`);
    await this.timerService!.updateTimer(timerId, {
      linkedSubject: updatedSubject,
      lastUsed: new Date()
    });
    
    // FORCER UNE DOUBLE NOTIFICATION pour s'assurer que tous les composants se mettent à jour
    this.notifyListeners();
    
    // Petite pause pour éviter les race conditions
    setTimeout(() => {
      this.notifyListeners();
    }, 100);
  }

  /**
   * Délier un timer d'un cours
   */
  async unlinkTimerFromSubject(subjectId: string): Promise<void> {
    this.ensureTimerService();
    console.log(`🔓 Déliaison cours ${subjectId}`);
    
    const subject = await subjectService.getSubject(subjectId);
    if (!subject?.linkedTimerId) {
      console.log(`Cours ${subjectId} n'a pas de timer lié`);
      return;
    }

    // Récupérer le timer avant déliaison pour conversion
    const timers = this.timerService!.getTimers();
    const linkedTimer = timers.find(t => t.id === subject.linkedTimerId);

    // Convertir le cours vers timer rapide
    let quickConfig: QuickTimerConfig;
    if (linkedTimer) {
      quickConfig = this.convertTimerToQuickConfig(linkedTimer);
    } else {
      // Fallback si timer non trouvé
      quickConfig = {
        type: 'simple',
        workDuration: Math.floor(subject.defaultTimerDuration / 60) || 25
      };
    }

    // Mettre à jour le cours avec conversion complète
    await subjectService.updateSubject(subjectId, {
      linkedTimerId: undefined,
      defaultTimerMode: 'quick_timer',
      quickTimerConfig: quickConfig,
      timerConversionNote: `Timer "${linkedTimer?.title || 'inconnu'}" délié le ${new Date().toLocaleString('fr-FR')} et converti en timer rapide`
    });

    // Délier le timer
    if (linkedTimer) {
      await this.timerService!.updateTimer(linkedTimer.id, {
        linkedSubject: undefined,
        lastUsed: new Date()
      });
    }

    console.log(`✅ Timer délié du cours ${subject.name} et converti en timer rapide`);
    
    // Notifier les changements
    this.notifyListeners();
  }

  /**
   * Déliaison forcée lors de suppression de cours
   */
  async unlinkTimersFromDeletedSubject(subjectId: string): Promise<void> {
    this.ensureTimerService();
    console.log(`🗑️ Déliaison forcée pour suppression cours ${subjectId}`);
    
    // Trouver tous les timers liés à ce cours
    const timers = this.timerService!.getTimers();
    const linkedTimers = timers.filter(timer => timer.linkedSubject?.id === subjectId);
    
    if (linkedTimers.length === 0) {
      console.log(`Aucun timer lié au cours ${subjectId}`);
      return;
    }

    // Délier TOUS les timers de ce cours
    for (const timer of linkedTimers) {
      await this.timerService!.updateTimer(timer.id, {
        linkedSubject: undefined,
        lastUsed: new Date()
      });
    }

    console.log(`✅ ${linkedTimers.length} timer(s) délié(s) du cours supprimé ${subjectId}`);
  }

  /**
   * Obtenir les timers disponibles pour liaison à un cours
   */
  getAvailableTimersForSubject(subjectId?: string): ActiveTimer[] {
    this.ensureTimerService();
    const timers = this.timerService!.getTimers();
    return timers.filter(timer => 
      !timer.isEphemeral && // Exclure les timers éphémères
      (!timer.linkedSubject || 
      (subjectId && timer.linkedSubject.id === subjectId))
    );
  }

  /**
   * Obtenir les timers liés à un cours spécifique
   */
  getLinkedTimersForSubject(subjectId: string): ActiveTimer[] {
    this.ensureTimerService();
    const timers = this.timerService!.getTimers();
    return timers.filter(timer => timer.linkedSubject?.id === subjectId);
  }

  /**
   * 🔄 SYNCHRONISATION COURS → TIMER
   * Met à jour les informations du cours dans tous les timers liés
   */
  async syncSubjectInfoToLinkedTimers(subjectId: string): Promise<void> {
    this.ensureTimerService();
    
    try {
      // Récupérer le cours mis à jour
      const updatedSubject = await subjectService.getSubject(subjectId);
      if (!updatedSubject) {
        console.warn(`⚠️ Cours ${subjectId} introuvable pour synchronisation`);
        return;
      }

      // Trouver tous les timers liés à ce cours
      const timers = this.timerService!.getTimers();
      const linkedTimers = timers.filter(timer => 
        timer.linkedSubject?.id === subjectId
      );

      if (linkedTimers.length === 0) {
        linkLogger.debug(`Aucun timer lié au cours ${updatedSubject.name} - pas de synchronisation nécessaire`);
        return;
      }

      // Mettre à jour chaque timer lié avec les nouvelles informations du cours
      for (const timer of linkedTimers) {
        await this.timerService!.updateTimer(timer.id, {
          linkedSubject: updatedSubject,
          lastUsed: new Date()
        });
        
        linkLogger.success(`Timer "${timer.title}" synchronisé avec cours "${updatedSubject.name}"`);
      }

      // Notifier les changements
      this.notifyListeners();
      
      linkLogger.info(`${linkedTimers.length} timer(s) synchronisé(s) avec cours "${updatedSubject.name}"`);

    } catch (error) {
      linkLogger.error('Erreur synchronisation cours-timers:', error);
      throw error;
    }
  }

  /**
   * Vérification de cohérence et réparation automatique
   */
  async ensureDataConsistency(): Promise<void> {
    this.ensureTimerService();
    linkLogger.debug('Vérification cohérence des données timer-cours');
    
    const subjects = await subjectService.getAllSubjects();
    const timers = this.timerService!.getTimers();
    let hasChanges = false;

    // Vérifier et réparer les cours avec linkedTimerId invalide
    for (const subject of subjects) {
      if (subject.linkedTimerId) {
        const linkedTimer = timers.find(t => t.id === subject.linkedTimerId);
        if (!linkedTimer) {
          console.warn(`⚠️ Cours ${subject.name} référence un timer inexistant ${subject.linkedTimerId}`);
          
          // Réparer en supprimant la référence orpheline
          await subjectService.updateSubject(subject.id, {
            linkedTimerId: undefined
          });
          hasChanges = true;
        }
      }
    }

    // Vérifier et réparer les timers avec linkedSubject invalide
    for (const timer of timers) {
      if (timer.linkedSubject) {
        const linkedSubject = subjects.find(s => s.id === timer.linkedSubject!.id);
        if (!linkedSubject) {
          console.warn(`⚠️ Timer ${timer.title} référence un cours inexistant ${timer.linkedSubject.id}`);
          await this.timerService!.updateTimer(timer.id, {
            linkedSubject: undefined
          });
          hasChanges = true;
        }
      }
    }

    if (hasChanges) {
      console.log('✅ Réparation des incohérences terminée');
      this.notifyListeners();
    } else {
      console.log('✅ Aucune incohérence détectée - Système cohérent');
    }
  }

  /**
   * Méthodes utilitaires privées
   */
  private async unlinkCourseFromAnyTimer(courseId: string): Promise<void> {
    const course = await subjectService.getSubject(courseId);
    if (course?.linkedTimerId) {
      await this.unlinkTimerFromSubject(courseId);
    }
  }

  private async unlinkTimerFromAnyCourse(timerId: string): Promise<void> {
    this.ensureTimerService();
    const timers = this.timerService!.getTimers();
    const timer = timers.find(t => t.id === timerId);
    if (timer?.linkedSubject) {
      await this.unlinkTimerFromSubject(timer.linkedSubject.id);
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

export const timerSubjectLinkService = TimerSubjectLinkService.getInstance();