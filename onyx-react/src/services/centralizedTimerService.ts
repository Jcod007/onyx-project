import { ActiveTimer } from '@/types/ActiveTimer';
import { QuickTimerConfig } from '@/types/Subject';

// Re-export pour usage externe
export type { ActiveTimer };
import { subjectService } from './subjectService';

/**
 * Service centralisé pour la gestion robuste des timers et liaisons
 * Résout les conflits de concurrence et assure la cohérence des données
 */
class CentralizedTimerService {
  private static instance: CentralizedTimerService;
  private readonly STORAGE_KEY = 'onyx_active_timers';
  private listeners: Set<() => void> = new Set();
  private operationQueue: Promise<any> = Promise.resolve();

  static getInstance(): CentralizedTimerService {
    if (!CentralizedTimerService.instance) {
      CentralizedTimerService.instance = new CentralizedTimerService();
    }
    return CentralizedTimerService.instance;
  }

  /**
   * Abonnement aux changements de timers pour les composants React
   */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Lecture sécurisée des timers depuis localStorage
   */
  getTimers(): ActiveTimer[] {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (!saved) return [];
      
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error('Erreur lecture timers:', error);
      return [];
    }
  }

  /**
   * Opération atomique de mise à jour des timers
   * Garantit qu'une seule opération s'exécute à la fois
   */
  private executeAtomicOperation<T>(
    operation: (currentTimers: ActiveTimer[]) => Promise<{ timers: ActiveTimer[]; result?: T }>
  ): Promise<T | undefined> {
    // Ajouter l'opération à la queue pour éviter les conflits
    this.operationQueue = this.operationQueue.then(async () => {
      try {
        const currentTimers = this.getTimers();
        const { timers: updatedTimers, result } = await operation(currentTimers);
        
        // Sauvegarde atomique
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedTimers));
        
        // Notification synchrone des listeners
        this.notifyListeners();
        
        return result;
      } catch (error) {
        console.error('Erreur opération atomique:', error);
        throw error;
      }
    });

    return this.operationQueue;
  }

  /**
   * Notification de tous les listeners de changement
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener();
      } catch (error) {
        console.error('Erreur dans listener timer:', error);
      }
    });
  }

  /**
   * Ajouter un nouveau timer
   */
  async addTimer(timer: ActiveTimer): Promise<ActiveTimer> {
    const newTimer = { ...timer, lastUsed: new Date() };
    
    await this.executeAtomicOperation(async (timers) => {
      // Vérifier l'unicité de l'ID
      if (timers.some(t => t.id === timer.id)) {
        throw new Error(`Timer avec ID ${timer.id} existe déjà`);
      }

      return {
        timers: [...timers, newTimer]
      };
    });
    
    return newTimer;
  }

  /**
   * Mettre à jour un timer existant
   */
  async updateTimer(timerId: string, updates: Partial<ActiveTimer>): Promise<void> {
    await this.executeAtomicOperation(async (timers) => {
      const timerIndex = timers.findIndex(t => t.id === timerId);
      
      if (timerIndex === -1) {
        throw new Error(`Timer ${timerId} introuvable`);
      }

      const updatedTimer = {
        ...timers[timerIndex],
        ...updates,
        lastUsed: new Date()
      };

      const updatedTimers = [...timers];
      updatedTimers[timerIndex] = updatedTimer;

      return { timers: updatedTimers };
    });
  }

  /**
   * Supprimer un timer avec conversion automatique du cours lié
   */
  async removeTimer(timerId: string): Promise<void> {
    await this.executeAtomicOperation(async (timers) => {
      const timer = timers.find(t => t.id === timerId);
      
      if (timer?.linkedSubject) {
        console.log(`🔄 Conversion du cours ${timer.linkedSubject.name} vers timer rapide suite à suppression`);
        
        // Créer la configuration de timer rapide basée sur le timer supprimé
        const quickTimerConfig = this.convertTimerToQuickConfig(timer);
        
        // Mettre à jour le cours : délier + convertir vers timer rapide
        const conversionNote = `Timer "${timer.title}" supprimé le ${new Date().toLocaleString('fr-FR')} et converti en timer rapide`;
        
        await subjectService.updateSubject(timer.linkedSubject.id, {
          linkedTimerId: undefined,
          defaultTimerMode: 'quick_timer',
          quickTimerConfig: quickTimerConfig,
          timerConversionNote: conversionNote
        });
        
        console.log(`✅ Cours ${timer.linkedSubject.name} converti en timer rapide (${quickTimerConfig.workDuration}min)`);
      }

      return {
        timers: timers.filter(t => t.id !== timerId)
      };
    });
  }

  /**
   * Conversion d'un timer vers configuration rapide
   */
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

  /**
   * Liaison robuste d'un timer à un cours
   * Gère automatiquement la déliaison des anciennes associations
   */
  async linkTimerToSubject(subjectId: string, timerId: string): Promise<void> {
    await this.executeAtomicOperation(async (timers) => {
      console.log(`🔄 Liaison timer ${timerId} → cours ${subjectId}`);
      
      // Récupérer le cours
      const subject = await subjectService.getSubject(subjectId);
      if (!subject) {
        throw new Error(`Cours ${subjectId} introuvable`);
      }

      // Vérifier l'existence du timer
      const targetTimer = timers.find(t => t.id === timerId);
      if (!targetTimer) {
        throw new Error(`Timer ${timerId} introuvable`);
      }

      // Mettre à jour le cours AVANT de lier le timer
      // Nettoyer les anciens paramètres de timer rapide et notes de conversion
      const updatedSubject = await subjectService.updateSubject(subjectId, {
        linkedTimerId: timerId,
        defaultTimerMode: 'simple',
        quickTimerConfig: undefined,
        timerConversionNote: undefined
      });

      if (!updatedSubject) {
        throw new Error(`Échec mise à jour cours ${subjectId}`);
      }

      // Préparer les nouvelles liaisons avec le cours MIS À JOUR
      const updatedTimers = timers.map(timer => {
        // Délier l'ancien timer du cours (si différent)
        if (timer.linkedSubject?.id === subjectId && timer.id !== timerId) {
          console.log(`🔓 Déliaison automatique timer ${timer.id} du cours ${updatedSubject.name}`);
          return {
            ...timer,
            linkedSubject: undefined,
            lastUsed: new Date()
          };
        }

        // Lier le nouveau timer au cours AVEC L'ÉTAT MIS À JOUR
        if (timer.id === timerId) {
          // Vérifier si le timer était lié à un autre cours
          if (timer.linkedSubject && timer.linkedSubject.id !== subjectId) {
            console.log(`🔄 Timer ${timerId} était lié au cours ${timer.linkedSubject.name}, déliaison automatique`);
            // Le cours sera délié via la mise à jour ci-dessous
          }
          
          console.log(`✅ Liaison timer ${timer.title} → cours ${updatedSubject.name} (mode: ${updatedSubject.defaultTimerMode})`);
          return {
            ...timer,
            linkedSubject: updatedSubject, // ← COURS MIS À JOUR !
            lastUsed: new Date()
          };
        }

        return timer;
      });

      // Si l'ancien timer était lié à un autre cours, délier ce cours
      if (targetTimer.linkedSubject && targetTimer.linkedSubject.id !== subjectId) {
        await subjectService.updateSubject(targetTimer.linkedSubject.id, {
          linkedTimerId: undefined
        });
      }

      return { timers: updatedTimers };
    });
  }

  /**
   * Délier un timer d'un cours
   */
  async unlinkTimerFromSubject(subjectId: string): Promise<void> {
    await this.executeAtomicOperation(async (timers) => {
      console.log(`🔓 Déliaison cours ${subjectId}`);
      
      const subject = await subjectService.getSubject(subjectId);
      if (!subject?.linkedTimerId) {
        console.log(`Cours ${subjectId} n'a pas de timer lié`);
        return { timers };
      }

      // Mettre à jour le cours et nettoyer les notes de conversion obsolètes
      await subjectService.updateSubject(subjectId, {
        linkedTimerId: undefined,
        timerConversionNote: undefined
      });

      // Délier le timer
      const updatedTimers = timers.map(timer => 
        timer.linkedSubject?.id === subjectId
          ? { ...timer, linkedSubject: undefined, lastUsed: new Date() }
          : timer
      );

      console.log(`✅ Timer délié du cours ${subject.name}`);
      return { timers: updatedTimers };
    });
  }

  /**
   * Déliaison forcée lors de suppression de cours
   * Ne tente pas de mettre à jour le cours (qui va être supprimé)
   */
  async unlinkTimersFromDeletedSubject(subjectId: string): Promise<void> {
    await this.executeAtomicOperation(async (timers) => {
      console.log(`🗑️ Déliaison forcée pour suppression cours ${subjectId}`);
      
      // Trouver tous les timers liés à ce cours
      const linkedTimers = timers.filter(timer => timer.linkedSubject?.id === subjectId);
      
      if (linkedTimers.length === 0) {
        console.log(`Aucun timer lié au cours ${subjectId}`);
        return { timers };
      }

      // Délier TOUS les timers de ce cours sans essayer de mettre à jour le cours
      const updatedTimers = timers.map(timer => 
        timer.linkedSubject?.id === subjectId
          ? { ...timer, linkedSubject: undefined, lastUsed: new Date() }
          : timer
      );

      console.log(`✅ ${linkedTimers.length} timer(s) délié(s) du cours supprimé ${subjectId}`);
      return { timers: updatedTimers };
    });
  }

  /**
   * Obtenir les timers disponibles pour liaison à un cours
   */
  getAvailableTimersForSubject(subjectId?: string): ActiveTimer[] {
    const timers = this.getTimers();
    return timers.filter(timer => 
      !timer.linkedSubject || 
      (subjectId && timer.linkedSubject.id === subjectId)
    );
  }

  /**
   * Obtenir les timers liés à un cours spécifique
   */
  getLinkedTimersForSubject(subjectId: string): ActiveTimer[] {
    const timers = this.getTimers();
    return timers.filter(timer => timer.linkedSubject?.id === subjectId);
  }

  /**
   * Vérification de cohérence et réparation automatique des données
   */
  async ensureDataConsistency(): Promise<void> {
    console.log('🔍 Vérification cohérence des données timer-cours');
    
    await this.executeAtomicOperation(async (timers) => {
      const subjects = await subjectService.getAllSubjects();
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
      const updatedTimers = timers.map(timer => {
        if (timer.linkedSubject) {
          const linkedSubject = subjects.find(s => s.id === timer.linkedSubject!.id);
          if (!linkedSubject) {
            console.warn(`⚠️ Timer ${timer.title} référence un cours inexistant ${timer.linkedSubject.id}`);
            hasChanges = true;
            return { ...timer, linkedSubject: undefined };
          }
        }
        return timer;
      });

      if (hasChanges) {
        console.log('✅ Réparation des incohérences terminée');
      }

      return { timers: updatedTimers };
    });
  }
}

export const centralizedTimerService = CentralizedTimerService.getInstance();

// Démarrer la vérification de cohérence périodique en développement
if (process.env.NODE_ENV === 'development') {
  setInterval(() => {
    centralizedTimerService.ensureDataConsistency();
  }, 30000); // Toutes les 30 secondes en dev
}