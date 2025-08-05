import { useState, useEffect, useCallback } from 'react';
import { ActiveTimer } from '@/types/ActiveTimer';
import { centralizedTimerService } from '@/services/centralizedTimerService';

/**
 * Hook React réactif utilisant le service centralisé
 * Interface compatible avec usePersistedTimers pour une migration transparente
 */
export const useReactiveTimers = () => {
  const [timers, setTimers] = useState<ActiveTimer[]>([]);
  const [timerCounter, setTimerCounter] = useState(1);
  const [isLoaded, setIsLoaded] = useState(false);

  console.log('🔄 Initialisation useReactiveTimers');

  // Charger l'état initial depuis le service centralisé
  useEffect(() => {
    const loadInitialState = async () => {
      try {
        console.log('📖 Chargement initial des timers depuis service centralisé');
        const savedCounter = localStorage.getItem('onyx_timer_counter');
        
        if (savedCounter) {
          const counter = parseInt(savedCounter, 10);
          console.log('🔢 Compteur chargé:', counter);
          setTimerCounter(counter);
        }
        
        // Synchroniser avec le service centralisé
        await syncFromCentralizedService();
        setIsLoaded(true);
      } catch (error) {
        console.error('Erreur chargement compteur:', error);
        setIsLoaded(true);
      }
    };

    loadInitialState();
  }, []);

  // Synchroniser depuis le service centralisé
  const syncFromCentralizedService = useCallback(async () => {
    try {
      const centralizedTimers = centralizedTimerService.getTimers();
      console.log('🔄 Synchronisation depuis service centralisé');
      setTimers(centralizedTimers);
    } catch (error) {
      console.error('Erreur synchronisation:', error);
    }
  }, []);

  // S'abonner aux changements du service centralisé
  useEffect(() => {
    const unsubscribe = centralizedTimerService.subscribe(() => {
      console.log('🔄 Synchronisation depuis service centralisé');
      syncFromCentralizedService();
    });

    return unsubscribe;
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
   * Interface compatible avec usePersistedTimers
   */
  const addTimer = useCallback(async (timer: Omit<ActiveTimer, 'id' | 'createdAt' | 'lastUsed'>) => {
    try {
      const newTimer: ActiveTimer = {
        ...timer,
        id: crypto.randomUUID(),
        createdAt: new Date(),
        lastUsed: new Date()
      };

      await centralizedTimerService.addTimer(newTimer);
      return newTimer;
    } catch (error) {
      console.error('Erreur ajout timer:', error);
      throw error;
    }
  }, []);

  /**
   * Mettre à jour un timer existant
   * Interface compatible avec usePersistedTimers
   */
  const updateTimer = useCallback(async (id: string, updates: Partial<Omit<ActiveTimer, 'id' | 'createdAt'>>) => {
    try {
      console.log(`🔄 Mise à jour timer ${id}`);
      await centralizedTimerService.updateTimer(id, updates);
    } catch (error) {
      console.error('Erreur mise à jour timer:', error);
      throw error;
    }
  }, []);

  /**
   * Supprimer un timer
   * Interface compatible avec usePersistedTimers
   */
  const removeTimer = useCallback(async (id: string) => {
    try {
      await centralizedTimerService.removeTimer(id);
    } catch (error) {
      console.error('Erreur suppression timer:', error);
      throw error;
    }
  }, []);

  /**
   * Mettre à jour la date de dernière utilisation
   * Interface compatible avec usePersistedTimers
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
   * Interface compatible avec usePersistedTimers
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
   * Interface compatible avec usePersistedTimers
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
    // Interface compatible avec usePersistedTimers
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
    isLoaded
  };
};