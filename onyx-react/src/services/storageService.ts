/**
 * 🗄️ StorageService
 * 
 * Service unifié pour tous les accès localStorage avec gestion d'erreurs robuste
 * Remplace la logique dispersée dans 27+ fichiers
 */

import { timerLogger } from '@/utils/logger';

class StorageService {
  private static instance: StorageService;
  
  static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }
  
  /**
   * Sauvegarder des données avec gestion d'erreurs
   */
  save<T>(key: string, data: T): void {
    try {
      const serialized = JSON.stringify(data);
      localStorage.setItem(key, serialized);
      timerLogger.debug(`💾 Sauvegarde réussie: ${key}`);
    } catch (error) {
      timerLogger.error(`❌ Erreur sauvegarde ${key}:`, error);
      
      // Tentative de nettoyage si quota dépassé
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        this.cleanupOldData();
        // Réessayer une fois
        try {
          localStorage.setItem(key, JSON.stringify(data));
          timerLogger.debug(`💾 Sauvegarde réussie après nettoyage: ${key}`);
        } catch (retryError) {
          timerLogger.error(`❌ Échec définitif sauvegarde ${key}:`, retryError);
        }
      }
    }
  }
  
  /**
   * Charger des données avec fallback
   */
  load<T>(key: string, defaultValue: T): T {
    try {
      const saved = localStorage.getItem(key);
      if (saved === null) {
        timerLogger.debug(`📖 Clé non trouvée, utilisation valeur par défaut: ${key}`);
        return defaultValue;
      }
      
      const parsed = JSON.parse(saved) as T;
      timerLogger.debug(`📖 Chargement réussi: ${key}`);
      return parsed;
    } catch (error) {
      timerLogger.error(`❌ Erreur chargement ${key}:`, error);
      
      // Si les données sont corrompues, les supprimer
      try {
        localStorage.removeItem(key);
        timerLogger.debug(`🧹 Données corrompues supprimées: ${key}`);
      } catch (removeError) {
        timerLogger.error(`❌ Erreur suppression données corrompues ${key}:`, removeError);
      }
      
      return defaultValue;
    }
  }
  
  /**
   * Supprimer une clé
   */
  remove(key: string): void {
    try {
      localStorage.removeItem(key);
      timerLogger.debug(`🗑️ Suppression réussie: ${key}`);
    } catch (error) {
      timerLogger.error(`❌ Erreur suppression ${key}:`, error);
    }
  }
  
  /**
   * Vérifier si une clé existe
   */
  exists(key: string): boolean {
    try {
      return localStorage.getItem(key) !== null;
    } catch (error) {
      timerLogger.error(`❌ Erreur vérification existence ${key}:`, error);
      return false;
    }
  }
  
  /**
   * Obtenir toutes les clés Onyx
   */
  getOnyxKeys(): string[] {
    try {
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('onyx_')) {
          keys.push(key);
        }
      }
      return keys;
    } catch (error) {
      timerLogger.error('❌ Erreur récupération clés Onyx:', error);
      return [];
    }
  }
  
  /**
   * Nettoyage automatique des anciennes données
   */
  private cleanupOldData(): void {
    try {
      const keys = this.getOnyxKeys();
      const now = Date.now();
      const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
      
      // Supprimer les sessions de plus de 30 jours
      const sessionKeys = keys.filter(key => key.startsWith('onyx_sessions_'));
      for (const key of sessionKeys) {
        const dateStr = key.replace('onyx_sessions_', '');
        const sessionDate = new Date(dateStr).getTime();
        if (sessionDate < thirtyDaysAgo) {
          this.remove(key);
        }
      }
      
      timerLogger.debug(`🧹 Nettoyage automatique terminé: ${sessionKeys.length} clés vérifiées`);
    } catch (error) {
      timerLogger.error('❌ Erreur nettoyage automatique:', error);
    }
  }
  
  /**
   * Obtenir les statistiques de stockage
   */
  getStorageStats(): {
    totalKeys: number;
    onyxKeys: number;
    estimatedSize: number;
  } {
    try {
      const totalKeys = localStorage.length;
      const onyxKeys = this.getOnyxKeys();
      
      // Estimation de la taille (approximative)
      let estimatedSize = 0;
      for (const key of onyxKeys) {
        const value = localStorage.getItem(key);
        if (value) {
          estimatedSize += key.length + value.length;
        }
      }
      
      return {
        totalKeys,
        onyxKeys: onyxKeys.length,
        estimatedSize
      };
    } catch (error) {
      timerLogger.error('❌ Erreur calcul statistiques stockage:', error);
      return {
        totalKeys: 0,
        onyxKeys: 0,
        estimatedSize: 0
      };
    }
  }
  
  /**
   * Nettoyer complètement toutes les données Onyx (pour debug/reset)
   */
  clearAllOnyxData(): void {
    try {
      const keys = this.getOnyxKeys();
      for (const key of keys) {
        this.remove(key);
      }
      timerLogger.debug(`🧹 Nettoyage complet: ${keys.length} clés supprimées`);
    } catch (error) {
      timerLogger.error('❌ Erreur nettoyage complet:', error);
    }
  }
}

export const storageService = StorageService.getInstance();

// Constantes pour les clés de stockage
export const STORAGE_KEYS = {
  ACTIVE_TIMERS: 'onyx_active_timers',
  TIMER_SYNC_METADATA: 'onyx_timer_sync_metadata',
  EPHEMERAL_TIMERS: 'onyx_ephemeral_timers',
  TIMER_COUNTER: 'onyx_timer_counter',
  SOUND_ENABLED: 'onyx_sound_enabled',
  THEME: 'onyx-theme',
  CALENDAR_VIEW_STATE: 'calendarViewState',
  LAST_RESET: 'onyx_last_reset'
} as const;

// Fonction utilitaire pour les clés de sessions avec date
export const getSessionKey = (date: Date = new Date()): string => {
  return `onyx_sessions_${date.toDateString()}`;
};