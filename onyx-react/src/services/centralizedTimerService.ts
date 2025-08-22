import { ActiveTimer } from '@/types/ActiveTimer';
import { QuickTimerConfig } from '@/types/Subject';

// Re-export pour usage externe
export type { ActiveTimer };
import { subjectService } from './subjectService';
import { timerLogger } from '@/utils/logger';

/**
 * Service centralisé pour la gestion robuste des timers et liaisons
 * Résout les conflits de concurrence et assure la cohérence des données
 * Inclut un système de versioning et de synchronisation avancé
 */
interface TimerSyncMetadata {
  version: number;
  lastModified: number;
  hash: string;
  operationId?: string;
}


class CentralizedTimerService {
  private static instance: CentralizedTimerService;
  private readonly STORAGE_KEY = 'onyx_active_timers';
  private readonly SYNC_METADATA_KEY = 'onyx_timer_sync_metadata';
  private listeners: Set<() => void> = new Set();
  private operationQueue: Promise<any> = Promise.resolve();
  private syncMetadata: Map<string, TimerSyncMetadata> = new Map();
  private globalVersion: number = 1;

  static getInstance(): CentralizedTimerService {
    if (!CentralizedTimerService.instance) {
      CentralizedTimerService.instance = new CentralizedTimerService();
    }
    return CentralizedTimerService.instance;
  }
  
  private constructor() {
    this.loadSyncMetadata();
    this.startConsistencyChecks();
  }

  /**
   * Normalise un timer en s'assurant que les dates sont des objets Date
   */
  private normalizeTimer(timer: ActiveTimer): ActiveTimer {
    console.log('🔧 Normalisation timer:', timer.id, 'lastUsed type:', typeof timer.lastUsed, 'value:', timer.lastUsed);
    
    const normalized = {
      ...timer,
      createdAt: timer.createdAt instanceof Date ? timer.createdAt : new Date(timer.createdAt),
      lastUsed: timer.lastUsed instanceof Date ? timer.lastUsed : new Date(timer.lastUsed)
    };
    
    console.log('✅ Timer normalisé:', normalized.id, 'lastUsed type:', typeof normalized.lastUsed, 'isDate:', normalized.lastUsed instanceof Date);
    
    return normalized;
  }
  
  private generateHash(timer: ActiveTimer): string {
    try {
      const normalizedTimer = this.normalizeTimer(timer);
      const hashData = {
        title: normalizedTimer.title,
        config: normalizedTimer.config,
        isPomodoroMode: normalizedTimer.isPomodoroMode,
        maxCycles: normalizedTimer.maxCycles,
        linkedSubject: normalizedTimer.linkedSubject?.id || null,
        lastUsed: normalizedTimer.lastUsed.getTime()
      };
      return btoa(JSON.stringify(hashData));
    } catch (error) {
      console.error('Erreur génération hash pour timer:', timer.id, error);
      // Fallback hash simple
      return btoa(JSON.stringify({ id: timer.id, timestamp: Date.now() }));
    }
  }
  
  private loadSyncMetadata(): void {
    try {
      const saved = localStorage.getItem(this.SYNC_METADATA_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        this.globalVersion = data.globalVersion || 1;
        this.syncMetadata = new Map(Object.entries(data.metadata || {}));
        timerLogger.debug('Métadonnées de synchronisation chargées', {
          globalVersion: this.globalVersion,
          timers: this.syncMetadata.size
        });
      }
    } catch (error) {
      console.error('Erreur chargement métadonnées sync:', error);
      this.syncMetadata.clear();
      this.globalVersion = 1;
    }
  }
  
  private saveSyncMetadata(): void {
    try {
      const data = {
        globalVersion: this.globalVersion,
        metadata: Object.fromEntries(this.syncMetadata.entries())
      };
      localStorage.setItem(this.SYNC_METADATA_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Erreur sauvegarde métadonnées sync:', error);
    }
  }
  
  private updateTimerMetadata(timer: ActiveTimer, operationId?: string): void {
    console.log('🔄 updateTimerMetadata appelé pour timer:', timer.id, 'lastUsed:', timer.lastUsed, 'type:', typeof timer.lastUsed);
    
    try {
      const normalizedTimer = this.normalizeTimer(timer);
      const hash = this.generateHash(normalizedTimer);
      const now = Date.now();
      const currentMetadata = this.syncMetadata.get(timer.id);
      
      this.syncMetadata.set(timer.id, {
        version: (currentMetadata?.version || 0) + 1,
        lastModified: now,
        hash,
        operationId
      });
      
      this.globalVersion++;
      this.saveSyncMetadata();
    } catch (error) {
      console.error('❌ Erreur dans updateTimerMetadata pour timer:', timer.id, error);
    }
  }
  
  private detectConflict(timerId: string, expectedHash: string): boolean {
    const metadata = this.syncMetadata.get(timerId);
    return metadata ? metadata.hash !== expectedHash : false;
  }
  
  private startConsistencyChecks(): void {
    // Vérification de cohérence toutes les 15 secondes
    setInterval(() => {
      this.performInternalConsistencyCheck();
    }, 15000);
  }

  /**
   * Abonnement aux changements de timers pour les composants React
   */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Vérification interne de cohérence des données
   */
  private performInternalConsistencyCheck(): void {
    try {
      const timers = this.getTimersRaw();
      let hasInconsistencies = false;
      
      for (const timer of timers) {
        const metadata = this.syncMetadata.get(timer.id);
        if (metadata) {
          const currentHash = this.generateHash(timer);
          if (currentHash !== metadata.hash) {
            console.warn(`⚠️ Incohérence détectée pour timer ${timer.id}`);
            this.updateTimerMetadata(timer, 'consistency-fix');
            hasInconsistencies = true;
          }
        } else {
          // Métadonnées manquantes, les créer
          console.log(`🔧 Création métadonnées manquantes pour timer ${timer.id}`);
          this.updateTimerMetadata(timer, 'metadata-creation');
          hasInconsistencies = true;
        }
      }
      
      // Nettoyer les métadonnées orphelines
      const timerIds = new Set(timers.map(t => t.id));
      const orphanedMetadata = Array.from(this.syncMetadata.keys()).filter(id => !timerIds.has(id));
      
      if (orphanedMetadata.length > 0) {
        console.log(`🧹 Suppression ${orphanedMetadata.length} métadonnées orphelines`);
        orphanedMetadata.forEach(id => this.syncMetadata.delete(id));
        this.saveSyncMetadata();
        hasInconsistencies = true;
      }
      
      if (hasInconsistencies) {
        this.notifyListeners();
      }
    } catch (error) {
      console.error('Erreur vérification cohérence interne:', error);
    }
  }
  
  /**
   * Lecture sécurisée des timers depuis localStorage (version interne)
   */
  private getTimersRaw(): ActiveTimer[] {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (!saved) return [];
      
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) return [];
      
      // Convertir les dates en objets Date avec vérification robuste
      return parsed.map(timer => {
        console.log('📖 Lecture timer depuis localStorage:', timer.id, 'lastUsed raw:', timer.lastUsed, 'type:', typeof timer.lastUsed);
        
        let normalizedCreatedAt, normalizedLastUsed;
        
        try {
          normalizedCreatedAt = timer.createdAt instanceof Date ? timer.createdAt : new Date(timer.createdAt);
          if (isNaN(normalizedCreatedAt.getTime())) {
            normalizedCreatedAt = new Date();
          }
        } catch {
          normalizedCreatedAt = new Date();
        }
        
        try {
          normalizedLastUsed = timer.lastUsed instanceof Date ? timer.lastUsed : new Date(timer.lastUsed);
          if (isNaN(normalizedLastUsed.getTime())) {
            normalizedLastUsed = new Date();
          }
        } catch {
          normalizedLastUsed = new Date();
        }
        
        const normalized = {
          ...timer,
          createdAt: normalizedCreatedAt,
          lastUsed: normalizedLastUsed
        };
        
        console.log('✅ Timer normalisé depuis localStorage:', normalized.id, 'lastUsed final:', normalized.lastUsed);
        return normalized;
      });
    } catch (error) {
      console.error('Erreur lecture timers:', error);
      return [];
    }
  }

  /**
   * Lecture sécurisée des timers depuis localStorage avec vérification de cohérence
   */
  getTimers(): ActiveTimer[] {
    const timers = this.getTimersRaw();
    
    // Normaliser tous les timers et vérifier les métadonnées
    const normalizedTimers = timers.map(timer => this.normalizeTimer(timer));
    
    for (const timer of normalizedTimers) {
      if (!this.syncMetadata.has(timer.id)) {
        this.updateTimerMetadata(timer, 'auto-metadata-creation');
      }
    }
    
    return normalizedTimers;
  }

  /**
   * Opération atomique de mise à jour des timers avec gestion avancée des conflits
   * Garantit qu'une seule opération s'exécute à la fois et gère le versioning
   */
  private executeAtomicOperation<T>(
    operation: (currentTimers: ActiveTimer[]) => Promise<{ timers: ActiveTimer[]; result?: T }>,
    operationId: string = `op-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  ): Promise<T | undefined> {
    // Ajouter l'opération à la queue pour éviter les conflits
    this.operationQueue = this.operationQueue.then(async () => {
      try {
        console.log(`🔒 Début opération atomique: ${operationId}`);
        const currentTimers = this.getTimersRaw();
        const { timers: updatedTimers, result } = await operation(currentTimers);
        
        // Vérifier la cohérence avant la sauvegarde
        const conflictingTimers: string[] = [];
        
        for (const timer of updatedTimers) {
          const currentMetadata = this.syncMetadata.get(timer.id);
          if (currentMetadata) {
            const currentHash = this.generateHash(timer);
            if (this.detectConflict(timer.id, currentHash)) {
              conflictingTimers.push(timer.id);
            }
          }
        }
        
        if (conflictingTimers.length > 0) {
          console.warn(`⚠️ Conflits détectés lors de l'opération ${operationId}:`, conflictingTimers);
          // Pour les conflits, on procède mais on log pour monitoring
        }
        
        // Sauvegarde atomique
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedTimers));
        
        // Mettre à jour les métadonnées pour tous les timers modifiés
        updatedTimers.forEach(timer => {
          this.updateTimerMetadata(timer, operationId);
        });
        
        // Notification synchrone des listeners
        this.notifyListeners();
        
        console.log(`✅ Opération atomique réussie: ${operationId}`);
        return result;
      } catch (error) {
        console.error(`❌ Erreur opération atomique ${operationId}:`, error);
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
   * Ajouter un nouveau timer avec gestion de conflits
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
    }, `add-timer-${timer.id}`);
    
    return newTimer;
  }

  /**
   * Mettre à jour un timer existant avec détection de conflits
   */
  async updateTimer(timerId: string, updates: Partial<ActiveTimer>): Promise<void> {
    await this.executeAtomicOperation(async (timers) => {
      const timerIndex = timers.findIndex(t => t.id === timerId);
      
      if (timerIndex === -1) {
        throw new Error(`Timer ${timerId} introuvable`);
      }

      const currentTimer = timers[timerIndex];
      const currentMetadata = this.syncMetadata.get(timerId);
      
      // Vérifier les conflits de concurrence
      if (currentMetadata) {
        const currentHash = this.generateHash(currentTimer);
        if (this.detectConflict(timerId, currentHash)) {
          console.warn(`⚠️ Conflit détecté lors de la mise à jour du timer ${timerId}`);
          // On procède avec la mise à jour mais on log le conflit
        }
      }

      const updatedTimer = {
        ...currentTimer,
        ...updates,
        lastUsed: new Date()
      };

      const updatedTimers = [...timers];
      updatedTimers[timerIndex] = updatedTimer;

      return { timers: updatedTimers };
    }, `update-timer-${timerId}`);
  }

  /**
   * Supprimer un timer avec conversion automatique du cours lié et nettoyage des métadonnées
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

      // Nettoyer les métadonnées du timer supprimé
      this.syncMetadata.delete(timerId);
      this.saveSyncMetadata();

      return {
        timers: timers.filter(t => t.id !== timerId)
      };
    }, `remove-timer-${timerId}`);
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
   * Exclut les timers éphémères qui ne peuvent pas être liés de manière permanente
   */
  getAvailableTimersForSubject(subjectId?: string): ActiveTimer[] {
    const timers = this.getTimers();
    return timers.filter(timer => 
      !timer.isEphemeral && // Exclure les timers éphémères
      (!timer.linkedSubject || 
      (subjectId && timer.linkedSubject.id === subjectId))
    );
  }

  /**
   * Obtenir uniquement les timers non-éphémères (persistants)
   * Utile pour éviter les conflits avec les timers éphémères
   */
  getPersistentTimers(): ActiveTimer[] {
    const timers = this.getTimers();
    return timers.filter(timer => !timer.isEphemeral);
  }

  /**
   * Obtenir les timers liés à un cours spécifique
   */
  getLinkedTimersForSubject(subjectId: string): ActiveTimer[] {
    const timers = this.getTimers();
    return timers.filter(timer => timer.linkedSubject?.id === subjectId);
  }

  /**
   * Vérification de cohérence et réparation automatique des données avec validation des métadonnées
   */
  async ensureDataConsistency(): Promise<void> {
    timerLogger.debug('Vérification cohérence des données timer-cours avec synchronisation');
    
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
      
      // Vérifier la cohérence des métadonnées de synchronisation
      const inconsistentMetadata: string[] = [];
      updatedTimers.forEach(timer => {
        const metadata = this.syncMetadata.get(timer.id);
        if (metadata) {
          const currentHash = this.generateHash(timer);
          if (metadata.hash !== currentHash) {
            inconsistentMetadata.push(timer.id);
            this.updateTimerMetadata(timer, 'consistency-repair');
            hasChanges = true;
          }
        } else {
          // Métadonnées manquantes
          this.updateTimerMetadata(timer, 'missing-metadata-repair');
          hasChanges = true;
        }
      });
      
      if (inconsistentMetadata.length > 0) {
        console.log(`🔧 Réparation métadonnées incohérentes:`, inconsistentMetadata);
      }
      
      // Nettoyer les métadonnées orphelines
      const timerIds = new Set(updatedTimers.map(t => t.id));
      const orphanedMetadata = Array.from(this.syncMetadata.keys()).filter(id => !timerIds.has(id));
      
      if (orphanedMetadata.length > 0) {
        console.log(`🧹 Nettoyage ${orphanedMetadata.length} métadonnées orphelines:`, orphanedMetadata);
        orphanedMetadata.forEach(id => this.syncMetadata.delete(id));
        this.saveSyncMetadata();
        hasChanges = true;
      }

      if (hasChanges) {
        console.log('✅ Réparation des incohérences et synchronisation terminée');
      } else {
        console.log('✅ Aucune incohérence détectée - Système cohérent');
      }

      return { timers: updatedTimers };
    }, 'data-consistency-check');
  }
  
  /**
   * Obtenir les informations de synchronisation d'un timer
   */
  getTimerSyncInfo(timerId: string): TimerSyncMetadata | null {
    return this.syncMetadata.get(timerId) || null;
  }
  
  /**
   * Obtenir les informations globales de synchronisation
   */
  getSyncState(): { globalVersion: number; timerCount: number; lastCheck: number } {
    return {
      globalVersion: this.globalVersion,
      timerCount: this.syncMetadata.size,
      lastCheck: Date.now()
    };
  }
  
  /**
   * Forcer une resynchronisation complète
   */
  async forceSynchronization(): Promise<void> {
    console.log('🔄 Forçage de la resynchronisation complète');
    
    // Recharger et vérifier tous les timers
    const timers = this.getTimersRaw();
    
    // Réinitialiser les métadonnées
    this.syncMetadata.clear();
    this.globalVersion++;
    
    // Recréer les métadonnées pour tous les timers
    timers.forEach(timer => {
      this.updateTimerMetadata(timer, 'force-resync');
    });
    
    // Vérifier la cohérence complète
    await this.ensureDataConsistency();
    
    console.log('✅ Resynchronisation complète terminée');
  }
}

export const centralizedTimerService = CentralizedTimerService.getInstance();

// Auto-démarrage des vérifications de cohérence (compatible avec les timers éphémères)
if (typeof window !== 'undefined') {
  // Vérification de cohérence délayée au démarrage (après initialisation)
  setTimeout(() => {
    centralizedTimerService.ensureDataConsistency().catch(error => {
      console.error('Erreur vérification cohérence initiale:', error);
    });
  }, 2000);
  
  // Vérification périodique allégée en production
  if (process.env.NODE_ENV === 'production') {
    setInterval(() => {
      centralizedTimerService.ensureDataConsistency().catch(error => {
        console.error('Erreur vérification cohérence périodique:', error);
      });
    }, 60000); // Toutes les minutes en production
  }
}