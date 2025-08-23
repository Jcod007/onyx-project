import { ActiveTimer } from '@/types/ActiveTimer';

// Re-export pour usage externe
export type { ActiveTimer };
import { timerLogger } from '@/utils/logger';
import { normalizeTimer, normalizeTimers } from '@/utils/timerNormalizer';
import { storageService, STORAGE_KEYS } from '@/services/storageService';

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

  
  private generateHash(timer: ActiveTimer): string {
    try {
      const normalizedTimer = normalizeTimer(timer);
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
      const data = storageService.load(STORAGE_KEYS.TIMER_SYNC_METADATA, null);
      if (data) {
        this.globalVersion = (data as any).globalVersion || 1;
        this.syncMetadata = new Map(Object.entries((data as any).metadata || {}));
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
      storageService.save(STORAGE_KEYS.TIMER_SYNC_METADATA, data);
    } catch (error) {
      console.error('Erreur sauvegarde métadonnées sync:', error);
    }
  }
  
  private updateTimerMetadata(timer: ActiveTimer, operationId?: string): void {
    console.log('🔄 updateTimerMetadata appelé pour timer:', timer.id, 'lastUsed:', timer.lastUsed, 'type:', typeof timer.lastUsed);
    
    try {
      const normalizedTimer = normalizeTimer(timer);
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
      const parsed = storageService.load(STORAGE_KEYS.ACTIVE_TIMERS, []);
      if (!Array.isArray(parsed)) return [];
      
      // Normaliser les timers avec l'utilitaire centralisé
      return normalizeTimers(parsed);
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
    
    // Les timers sont déjà normalisés par getTimersRaw via normalizeTimers()
    // Vérifier les métadonnées
    for (const timer of timers) {
      if (!this.syncMetadata.has(timer.id)) {
        this.updateTimerMetadata(timer, 'auto-metadata-creation');
      }
    }
    
    return timers;
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
        storageService.save(STORAGE_KEYS.ACTIVE_TIMERS, updatedTimers);
        
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
   * Supprimer un timer avec nettoyage des métadonnées
   * Note: La conversion des cours liés est gérée par timerSubjectLinkService
   */
  async removeTimer(timerId: string): Promise<void> {
    await this.executeAtomicOperation(async (timers) => {
      // Nettoyer les métadonnées du timer supprimé
      this.syncMetadata.delete(timerId);
      this.saveSyncMetadata();

      return {
        timers: timers.filter(t => t.id !== timerId)
      };
    }, `remove-timer-${timerId}`);
  }



  /**
   * Obtenir uniquement les timers non-éphémères (persistants)
   */
  getPersistentTimers(): ActiveTimer[] {
    const timers = this.getTimers();
    return timers.filter(timer => !timer.isEphemeral);
  }


  /**
   * Vérification de cohérence interne des métadonnées
   * Note: La cohérence timer-cours est gérée par timerSubjectLinkService
   */
  async ensureDataConsistency(): Promise<void> {
    timerLogger.debug('Vérification cohérence interne des métadonnées de synchronisation');
    
    await this.executeAtomicOperation(async (timers) => {
      let hasChanges = false;
      
      // Vérifier la cohérence des métadonnées de synchronisation
      const inconsistentMetadata: string[] = [];
      timers.forEach(timer => {
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
      const timerIds = new Set(timers.map(t => t.id));
      const orphanedMetadata = Array.from(this.syncMetadata.keys()).filter(id => !timerIds.has(id));
      
      if (orphanedMetadata.length > 0) {
        console.log(`🧹 Nettoyage ${orphanedMetadata.length} métadonnées orphelines:`, orphanedMetadata);
        orphanedMetadata.forEach(id => this.syncMetadata.delete(id));
        this.saveSyncMetadata();
        hasChanges = true;
      }

      if (hasChanges) {
        console.log('✅ Réparation des métadonnées de synchronisation terminée');
      } else {
        console.log('✅ Métadonnées de synchronisation cohérentes');
      }

      return { timers };
    }, 'metadata-consistency-check');
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