import { useState, useEffect, useCallback } from 'react';
import { ActiveTimer } from '@/types/ActiveTimer';
import { centralizedTimerService } from '@/services/centralizedTimerService';
import { timerLogger } from '@/utils/logger';

/**
 * Hook React réactif utilisant le service centralisé
 * Hook principal pour la gestion des timers dans l'application
 */
// Variable statique pour éviter les initialisations multiples
let isInitializing = false;

// Clé de stockage pour les timers éphémères
const EPHEMERAL_TIMERS_KEY = 'onyx_ephemeral_timers';

// TTL par défaut pour les timers éphémères (2 heures en millisecondes)
const EPHEMERAL_TIMER_TTL = 2 * 60 * 60 * 1000;

// Interface pour les métadonnées des timers éphémères
interface EphemeralTimerMetadata {
  timer: ActiveTimer;
  createdAt: number;
  expiresAt: number;
  lastCleanupCheck: number;
}

export const useReactiveTimers = () => {
  const [timers, setTimers] = useState<ActiveTimer[]>([]);
  const [timerCounter, setTimerCounter] = useState(1);
  const [isLoaded, setIsLoaded] = useState(false);

  // Éviter les logs multiples dans le dev mode
  if (!isInitializing) {
    timerLogger.debug('Initialisation useReactiveTimers');
    isInitializing = true;
  }

  // Fonctions utilitaires pour les timers éphémères avec TTL amélioré
  const loadEphemeralTimers = useCallback((): ActiveTimer[] => {
    try {
      const saved = localStorage.getItem(EPHEMERAL_TIMERS_KEY);
      if (!saved) return [];
      
      const now = Date.now();
      const ephemeralData = JSON.parse(saved) as EphemeralTimerMetadata[];
      
      // Filtrer les timers non expirés et valides
      const validData = ephemeralData.filter(data => {
        // Vérifier l'expiration
        if (now > data.expiresAt) {
          console.log(`⏰ Timer éphémère expiré supprimé: ${data.timer.title}`);
          return false;
        }
        
        // Vérifier la cohérence des données
        if (!data.timer || !data.timer.id || !data.timer.isEphemeral) {
          console.warn('⚠️ Données de timer éphémère corrompues supprimées');
          return false;
        }
        
        return true;
      });
      
      // Mettre à jour le storage si des timers ont été nettoyés
      if (validData.length !== ephemeralData.length) {
        console.log(`🧹 ${ephemeralData.length - validData.length} timer(s) éphémère(s) expiré(s) nettoyé(s)`);
        saveEphemeralTimersMetadata(validData);
      }
      
      const validTimers = validData.map(data => data.timer);
      console.log('⏱️ Timers éphémères chargés:', validTimers.length);
      return validTimers;
    } catch (error) {
      console.error('Erreur chargement timers éphémères:', error);
      // En cas d'erreur, nettoyer le localStorage corrompu
      localStorage.removeItem(EPHEMERAL_TIMERS_KEY);
      return [];
    }
  }, []);
  
  // Sauvegarder les métadonnées des timers éphémères avec TTL
  const saveEphemeralTimersMetadata = useCallback((metadata: EphemeralTimerMetadata[]) => {
    try {
      localStorage.setItem(EPHEMERAL_TIMERS_KEY, JSON.stringify(metadata));
    } catch (error) {
      console.error('Erreur sauvegarde métadonnées timers éphémères:', error);
    }
  }, []);

  // Sauvegarder les timers éphémères avec métadonnées TTL
  const saveEphemeralTimers = useCallback((ephemeralTimers: ActiveTimer[]) => {
    try {
      const now = Date.now();
      const metadata: EphemeralTimerMetadata[] = ephemeralTimers.map(timer => ({
        timer,
        createdAt: new Date(timer.createdAt).getTime(),
        expiresAt: now + EPHEMERAL_TIMER_TTL,
        lastCleanupCheck: now
      }));
      
      saveEphemeralTimersMetadata(metadata);
    } catch (error) {
      console.error('Erreur sauvegarde timers éphémères:', error);
    }
  }, [saveEphemeralTimersMetadata]);
  
  // Nettoyage forcé des timers éphémères expirés (sans synchronisation automatique)
  const cleanupExpiredEphemeralTimers = useCallback(() => {
    try {
      const saved = localStorage.getItem(EPHEMERAL_TIMERS_KEY);
      if (!saved) return false; // Retourner false si aucun nettoyage effectué
      
      const now = Date.now();
      const ephemeralData = JSON.parse(saved) as EphemeralTimerMetadata[];
      
      const validData = ephemeralData.filter(data => {
        if (now > data.expiresAt) {
          console.log(`🧹 Nettoyage forcé timer éphémère expiré: ${data.timer.title}`);
          return false;
        }
        return true;
      });
      
      if (validData.length !== ephemeralData.length) {
        console.log(`🧹 ${ephemeralData.length - validData.length} timer(s) éphémère(s) forcément nettoyé(s)`);
        saveEphemeralTimersMetadata(validData);
        return true; // Retourner true si un nettoyage a été effectué
      }
      
      return false; // Aucun nettoyage nécessaire
    } catch (error) {
      console.error('Erreur nettoyage forcé timers éphémères:', error);
      // En cas d'erreur, nettoyer complètement
      localStorage.removeItem(EPHEMERAL_TIMERS_KEY);
      return true; // Un nettoyage a été effectué (même complet)
    }
  }, [saveEphemeralTimersMetadata]);
  
  // Vérification de cohérence spécifique aux timers éphémères
  const ensureEphemeralTimersConsistency = useCallback(async () => {
    try {
      console.log('🔍 Vérification cohérence des timers éphémères');
      
      const saved = localStorage.getItem(EPHEMERAL_TIMERS_KEY);
      if (!saved) {
        console.log('✅ Aucun timer éphémère à vérifier');
        return;
      }
      
      const now = Date.now();
      let ephemeralData: EphemeralTimerMetadata[];
      
      try {
        ephemeralData = JSON.parse(saved) as EphemeralTimerMetadata[];
        
        // Vérifier que la structure est correcte
        if (!Array.isArray(ephemeralData)) {
          throw new Error('Structure de données invalide');
        }
      } catch (parseError) {
        console.warn('⚠️ Données timers éphémères corrompues, nettoyage complet');
        localStorage.removeItem(EPHEMERAL_TIMERS_KEY);
        return;
      }
      
      let hasChanges = false;
      const cleanedData: EphemeralTimerMetadata[] = [];
      
      for (const data of ephemeralData) {
        // Vérifier la structure des métadonnées
        if (!data.timer || !data.timer.id || !data.createdAt || !data.expiresAt) {
          console.warn(`⚠️ Métadonnées corrompues pour timer éphémère, suppression`);
          hasChanges = true;
          continue;
        }
        
        // Vérifier que le timer est bien éphémère
        if (!data.timer.isEphemeral) {
          console.warn(`⚠️ Timer non-éphémère dans le storage éphémère: ${data.timer.title}`);
          hasChanges = true;
          continue;
        }
        
        // Vérifier l'expiration
        if (now > data.expiresAt) {
          console.log(`⏰ Timer éphémère expiré supprimé: ${data.timer.title}`);
          hasChanges = true;
          continue;
        }
        
        // Réinitialiser la date d'expiration si elle semble incorrecte
        if (data.expiresAt - data.createdAt > EPHEMERAL_TIMER_TTL * 2) {
          console.log(`🔧 Correction TTL pour timer éphémère: ${data.timer.title}`);
          data.expiresAt = data.createdAt + EPHEMERAL_TIMER_TTL;
          hasChanges = true;
        }
        
        cleanedData.push(data);
      }
      
      if (hasChanges) {
        console.log(`🔧 ${ephemeralData.length - cleanedData.length} incohérence(s) réparée(s) dans les timers éphémères`);
        saveEphemeralTimersMetadata(cleanedData);
      } else {
        console.log('✅ Cohérence des timers éphémères vérifiée');
      }
      
    } catch (error) {
      console.error('Erreur vérification cohérence timers éphémères:', error);
      // En cas d'erreur majeure, nettoyer complètement
      localStorage.removeItem(EPHEMERAL_TIMERS_KEY);
    }
  }, [saveEphemeralTimersMetadata]);

  // Synchroniser depuis le service centralisé
  const syncFromCentralizedService = useCallback(async () => {
    try {
      // Nettoyer d'abord les timers éphémères expirés
      const cleanupPerformed = cleanupExpiredEphemeralTimers();
      
      const centralizedTimers = centralizedTimerService.getTimers();
      const ephemeralTimers = loadEphemeralTimers();
      
      // Combiner les timers persistés et éphémères
      const allTimers = [...centralizedTimers, ...ephemeralTimers];
      
      console.log('🔄 Synchronisation depuis service centralisé:', {
        persistés: centralizedTimers.length,
        éphémères: ephemeralTimers.length,
        total: allTimers.length,
        nettoyage: cleanupPerformed ? 'effectué' : 'pas nécessaire'
      });
      
      setTimers(allTimers);
    } catch (error) {
      console.error('Erreur synchronisation:', error);
    }
  }, [loadEphemeralTimers, cleanupExpiredEphemeralTimers]);

  // Charger l'état initial avec vérification de cohérence
  useEffect(() => {
    const loadInitialState = async () => {
      try {
        console.log('📖 Chargement initial des timers avec vérification de cohérence');
        
        // Nettoyer les timers éphémères expirés AVANT le chargement
        cleanupExpiredEphemeralTimers();
        
        const savedCounter = localStorage.getItem('onyx_timer_counter');
        
        if (savedCounter) {
          const counter = parseInt(savedCounter, 10);
          console.log('🔢 Compteur chargé:', counter);
          setTimerCounter(counter);
        }
        
        // Vérification de cohérence des données localStorage sera effectuée via cleanupExpiredEphemeralTimers
        
        // Synchroniser avec le service centralisé et charger les timers éphémères
        await syncFromCentralizedService();
        setIsLoaded(true);
        
        console.log('✅ Chargement initial terminé avec succès');
      } catch (error) {
        console.error('Erreur chargement initial:', error);
        setIsLoaded(true);
      }
    };

    loadInitialState();
  }, [syncFromCentralizedService, cleanupExpiredEphemeralTimers]);

  // Nettoyage périodique des timers éphémères expirés
  useEffect(() => {
    // Nettoyer immédiatement au montage
    const initialCleanup = cleanupExpiredEphemeralTimers();
    if (initialCleanup) {
      // Programmer une synchronisation après le nettoyage initial
      setTimeout(() => syncFromCentralizedService(), 50);
    }
    
    // Puis nettoyer toutes les 30 secondes
    const cleanupInterval = setInterval(() => {
      console.log('🔄 Nettoyage périodique des timers éphémères');
      const cleanupPerformed = cleanupExpiredEphemeralTimers();
      if (cleanupPerformed) {
        // Programmer une synchronisation si un nettoyage a été effectué
        setTimeout(() => syncFromCentralizedService(), 50);
      }
    }, 30000); // 30 secondes
    
    return () => {
      clearInterval(cleanupInterval);
      console.log('🧹 Nettoyage périodique des timers éphémères arrêté');
    };
  }, [cleanupExpiredEphemeralTimers, syncFromCentralizedService]);

  // S'abonner aux changements du service centralisé avec débounce
  useEffect(() => {
    let syncTimeout: NodeJS.Timeout | null = null;
    let isComponentMounted = true;
    
    const unsubscribe = centralizedTimerService.subscribe(() => {
      // Annuler la synchronisation précédente si elle n'a pas encore eu lieu
      if (syncTimeout) {
        clearTimeout(syncTimeout);
        syncTimeout = null;
      }
      
      // Programmer une synchronisation avec un délai pour éviter les race conditions
      // Seulement si le composant est encore monté
      if (isComponentMounted) {
        syncTimeout = setTimeout(() => {
          if (isComponentMounted) {
            console.log('🔄 Synchronisation depuis service centralisé (débounce)');
            syncFromCentralizedService();
          }
          syncTimeout = null;
        }, 50); // 50ms de débounce
      }
    });

    return () => {
      console.log('🧹 useReactiveTimers - Nettoyage lors du démontage');
      isComponentMounted = false;
      
      // Nettoyer le timeout en cours
      if (syncTimeout) {
        console.log('🧹 Nettoyage du timeout de synchronisation');
        clearTimeout(syncTimeout);
        syncTimeout = null;
      }
      
      // Désabonner du service
      unsubscribe();
      console.log('✅ useReactiveTimers - Désabonnement terminé');
    };
  }, [syncFromCentralizedService]);

  // Sauvegarder le compteur quand il change
  useEffect(() => {
    if (!isLoaded) return;
    
    try {
      localStorage.setItem('onyx_timer_counter', timerCounter.toString());
    } catch (error) {
      console.error('Erreur sauvegarde compteur:', error);
    }
  }, [timerCounter, isLoaded]);

  /**
   * Ajouter un nouveau timer
   */
  const addTimer = useCallback(async (timer: Omit<ActiveTimer, 'id' | 'createdAt' | 'lastUsed'>) => {
    try {
      const newTimer: ActiveTimer = {
        ...timer,
        id: crypto.randomUUID(),
        createdAt: new Date(),
        lastUsed: new Date()
      };

      // Si le timer est éphémère, le persister temporairement dans localStorage
      if (newTimer.isEphemeral) {
        console.log('⏱️ Timer éphémère créé (persisté temporairement):', newTimer.title);
        // Ajouter à l'état local
        setTimers(prev => {
          const updatedTimers = [...prev, newTimer];
          // Sauvegarder uniquement les timers éphémères
          const ephemeralTimers = updatedTimers.filter(t => t.isEphemeral);
          saveEphemeralTimers(ephemeralTimers);
          return updatedTimers;
        });
      } else {
        // Timer normal - persister via le service centralisé
        await centralizedTimerService.addTimer(newTimer);
      }
      
      return newTimer;
    } catch (error) {
      console.error('Erreur ajout timer:', error);
      throw error;
    }
  }, [saveEphemeralTimers]);

  /**
   * Mettre à jour un timer existant
   */
  const updateTimer = useCallback(async (id: string, updates: Partial<Omit<ActiveTimer, 'id' | 'createdAt'>>) => {
    try {
      console.log(`🔄 Mise à jour timer ${id}`);
      
      // Vérifier si c'est un timer éphémère
      const timer = timers.find(t => t.id === id);
      if (timer?.isEphemeral) {
        console.log('⏱️ Mise à jour timer éphémère (persisté temporairement)');
        setTimers(prev => {
          const updatedTimers = prev.map(t => t.id === id ? { ...t, ...updates } : t);
          // Sauvegarder les timers éphémères mis à jour
          const ephemeralTimers = updatedTimers.filter(t => t.isEphemeral);
          saveEphemeralTimers(ephemeralTimers);
          return updatedTimers;
        });
      } else {
        await centralizedTimerService.updateTimer(id, updates);
      }
    } catch (error) {
      console.error('Erreur mise à jour timer:', error);
      throw error;
    }
  }, [timers, saveEphemeralTimers]);

  /**
   * Supprimer un timer avec nettoyage automatique du localStorage
   */
  const removeTimer = useCallback(async (id: string) => {
    try {
      // Vérifier si c'est un timer éphémère
      const timer = timers.find(t => t.id === id);
      if (timer?.isEphemeral) {
        console.log('⏱️ Suppression timer éphémère avec nettoyage localStorage');
        setTimers(prev => {
          const updatedTimers = prev.filter(t => t.id !== id);
          // Sauvegarder les timers éphémères restants
          const ephemeralTimers = updatedTimers.filter(t => t.isEphemeral);
          saveEphemeralTimers(ephemeralTimers);
          
          // Nettoyer immédiatement les timers expirés lors de la suppression
          setTimeout(() => {
            const cleanupPerformed = cleanupExpiredEphemeralTimers();
            if (cleanupPerformed) {
              // Forcer une re-synchronisation si un nettoyage a été effectué
              syncFromCentralizedService();
            }
          }, 100);
          
          return updatedTimers;
        });
        
        console.log(`✅ Timer éphémère ${timer.title} supprimé et localStorage nettoyé`);
      } else {
        await centralizedTimerService.removeTimer(id);
      }
    } catch (error) {
      console.error('Erreur suppression timer:', error);
      throw error;
    }
  }, [timers, saveEphemeralTimers, cleanupExpiredEphemeralTimers, syncFromCentralizedService]);

  /**
   * Mettre à jour la date de dernière utilisation
   */
  const updateTimerLastUsed = useCallback(async (id: string) => {
    try {
      await centralizedTimerService.updateTimer(id, { lastUsed: new Date() });
    } catch (error) {
      console.error('Erreur mise à jour lastUsed:', error);
    }
  }, []);

  /**
   * Vider tous les timers
   */
  const clearAllTimers = useCallback(async () => {
    try {
      const currentTimers = centralizedTimerService.getTimers();
      for (const timer of currentTimers) {
        await centralizedTimerService.removeTimer(timer.id);
      }
    } catch (error) {
      console.error('Erreur suppression complète:', error);
    }
  }, []);

  /**
   * Nettoyer les anciens timers
   */
  const cleanupOldTimers = useCallback(async () => {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const currentTimers = centralizedTimerService.getTimers();
      const oldTimers = currentTimers.filter(timer => timer.lastUsed < thirtyDaysAgo);
      
      for (const timer of oldTimers) {
        await centralizedTimerService.removeTimer(timer.id);
      }
    } catch (error) {
      console.error('Erreur nettoyage timers:', error);
    }
  }, []);

  /**
   * NOUVELLES MÉTHODES - Fonctionnalités avancées du service centralisé
   */

  /**
   * Lier un timer à un cours
   */
  const linkTimerToSubject = useCallback(async (subjectId: string, timerId: string) => {
    try {
      await centralizedTimerService.linkTimerToSubject(subjectId, timerId);
    } catch (error) {
      console.error('Erreur liaison timer-cours:', error);
      throw error;
    }
  }, []);

  /**
   * Délier un timer d'un cours
   */
  const unlinkTimerFromSubject = useCallback(async (subjectId: string) => {
    try {
      await centralizedTimerService.unlinkTimerFromSubject(subjectId);
    } catch (error) {
      console.error('Erreur déliaison timer-cours:', error);
      throw error;
    }
  }, []);

  /**
   * Obtenir les timers disponibles pour liaison
   */
  const getAvailableTimersForSubject = useCallback((subjectId?: string) => {
    return centralizedTimerService.getAvailableTimersForSubject(subjectId);
  }, []);

  /**
   * Obtenir les timers liés à un cours spécifique
   */
  const getLinkedTimersForSubject = useCallback((subjectId: string) => {
    return centralizedTimerService.getLinkedTimersForSubject(subjectId);
  }, []);

  /**
   * Vérifier et réparer la cohérence des données
   */
  const ensureDataConsistency = useCallback(async () => {
    try {
      await centralizedTimerService.ensureDataConsistency();
    } catch (error) {
      console.error('Erreur vérification cohérence:', error);
    }
  }, []);

  return {
    // Interface principale de gestion des timers
    timers,
    timerCounter,
    setTimerCounter,
    addTimer,
    updateTimer,
    removeTimer,
    updateTimerLastUsed,
    clearAllTimers,
    cleanupOldTimers,
    
    // Nouvelles fonctionnalités avancées
    linkTimerToSubject,
    unlinkTimerFromSubject,
    getAvailableTimersForSubject,
    getLinkedTimersForSubject,
    ensureDataConsistency,
    
    // État de chargement
    isLoaded,
    
    // Fonctions utilitaires pour les timers éphémères
    loadEphemeralTimers,
    cleanupExpiredEphemeralTimers,
    ensureEphemeralTimersConsistency,
    clearEphemeralTimers: () => {
      localStorage.removeItem(EPHEMERAL_TIMERS_KEY);
      console.log('🧹 Timers éphémères complètement nettoyés du localStorage');
      // Forcer une synchronisation après le nettoyage complet
      syncFromCentralizedService();
    },
    
    // Fonction de maintenance complète pour les timers éphémères
    performEphemeralTimersMaintenance: () => {
      console.log('🔧 Maintenance complète des timers éphémères');
      try {
        // 1. Nettoyer les timers expirés
        cleanupExpiredEphemeralTimers();
        
        // 2. Vérifier la cohérence
        ensureEphemeralTimersConsistency();
        
        console.log('✅ Maintenance des timers éphémères terminée');
      } catch (error) {
        console.error('Erreur lors de la maintenance des timers éphémères:', error);
        // En cas d'erreur critique, nettoyer complètement
        localStorage.removeItem(EPHEMERAL_TIMERS_KEY);
        syncFromCentralizedService();
      }
    }
  };
};