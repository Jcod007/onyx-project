import { useState, useEffect } from 'react';
import { TimerConfig } from '@/services/timerService';
import { Subject } from '@/types/Subject';

export interface ActiveTimer {
  id: string;
  title: string;
  config: TimerConfig;
  linkedSubject?: Subject;
  createdAt: Date;
  lastUsed: Date;
}

const STORAGE_KEY = 'onyx_active_timers';
const COUNTER_KEY = 'onyx_timer_counter';

export const usePersistedTimers = () => {
  const [timers, setTimers] = useState<ActiveTimer[]>([]);
  const [timerCounter, setTimerCounter] = useState(1);
  const [isLoaded, setIsLoaded] = useState(false);

  // Charger les timers depuis le localStorage au démarrage
  useEffect(() => {
    try {
      console.log('🔄 Chargement des timers depuis localStorage...');
      const savedTimers = localStorage.getItem(STORAGE_KEY);
      const savedCounter = localStorage.getItem(COUNTER_KEY);
      
      console.log('📦 Données brutes:', { savedTimers, savedCounter });
      
      if (savedTimers) {
        const parsedTimers = JSON.parse(savedTimers).map((timer: any) => ({
          ...timer,
          createdAt: new Date(timer.createdAt),
          lastUsed: new Date(timer.lastUsed)
        }));
        console.log('✅ Timers chargés:', parsedTimers);
        setTimers(parsedTimers);
      }
      
      if (savedCounter) {
        const counter = parseInt(savedCounter, 10);
        console.log('🔢 Compteur chargé:', counter);
        setTimerCounter(counter);
      }
      
      setIsLoaded(true);
    } catch (error) {
      console.error('❌ Erreur lors du chargement des timers:', error);
      // En cas d'erreur, nettoyer le localStorage corrompu
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(COUNTER_KEY);
      setIsLoaded(true);
    }
  }, []);

  // Sauvegarder les timers dans le localStorage à chaque modification (mais pas au premier chargement)
  useEffect(() => {
    if (!isLoaded) return; // Ne pas sauvegarder pendant le chargement initial
    
    try {
      console.log('💾 Sauvegarde des timers:', timers);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(timers));
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde des timers:', error);
    }
  }, [timers, isLoaded]);

  // Sauvegarder le compteur à chaque modification (mais pas au premier chargement)
  useEffect(() => {
    if (!isLoaded) return; // Ne pas sauvegarder pendant le chargement initial
    
    try {
      console.log('💾 Sauvegarde du compteur:', timerCounter);
      localStorage.setItem(COUNTER_KEY, timerCounter.toString());
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde du compteur:', error);
    }
  }, [timerCounter, isLoaded]);

  const addTimer = (timer: Omit<ActiveTimer, 'id' | 'createdAt' | 'lastUsed'>) => {
    const now = new Date();
    const newTimer: ActiveTimer = {
      ...timer,
      id: crypto.randomUUID(),
      createdAt: now,
      lastUsed: now
    };
    
    console.log('➕ Ajout d\'un nouveau timer:', newTimer);
    setTimers(prev => {
      const updated = [...prev, newTimer];
      console.log('📝 Liste mise à jour:', updated);
      return updated;
    });
    return newTimer;
  };

  const updateTimer = (id: string, updates: Partial<Omit<ActiveTimer, 'id' | 'createdAt'>>) => {
    setTimers(prev => prev.map(timer => 
      timer.id === id 
        ? { ...timer, ...updates, lastUsed: new Date() }
        : timer
    ));
  };

  const removeTimer = (id: string) => {
    setTimers(prev => prev.filter(timer => timer.id !== id));
  };

  const updateTimerLastUsed = (id: string) => {
    setTimers(prev => prev.map(timer => 
      timer.id === id 
        ? { ...timer, lastUsed: new Date() }
        : timer
    ));
  };

  const clearAllTimers = () => {
    setTimers([]);
  };

  // Nettoyer les anciens timers (optionnel - après 30 jours sans utilisation)
  const cleanupOldTimers = () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    setTimers(prev => prev.filter(timer => timer.lastUsed > thirtyDaysAgo));
  };

  return {
    timers,
    timerCounter,
    setTimerCounter,
    addTimer,
    updateTimer,
    removeTimer,
    updateTimerLastUsed,
    clearAllTimers,
    cleanupOldTimers
  };
};