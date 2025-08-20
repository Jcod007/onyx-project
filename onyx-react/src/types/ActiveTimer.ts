import { TimerConfig } from '@/types/Timer';
import { Subject } from '@/types/Subject';

/**
 * Représentation unifiée d'un timer actif dans le système
 * Source unique de vérité pour tous les timers persistés
 */
export interface ActiveTimer {
  id: string;
  title: string;
  config: TimerConfig;
  linkedSubject?: Subject; // Objet Subject complet pour cohérence
  isPomodoroMode?: boolean;
  maxCycles?: number;
  createdAt: Date;
  lastUsed: Date;
  isEphemeral?: boolean; // Timer temporaire qui ne sera pas sauvegardé
}

/**
 * Représentation légère d'un Subject pour les contextes de runtime
 * Utilisé dans TimerContext pour éviter les références circulaires
 */
export interface LinkedSubjectRef {
  id: string;
  name: string;
}

/**
 * Interface pour les opérations de création de timer
 */
export type CreateActiveTimerDto = Omit<ActiveTimer, 'id' | 'createdAt' | 'lastUsed'>;

/**
 * Interface pour les opérations de mise à jour de timer
 */
export type UpdateActiveTimerDto = Partial<Omit<ActiveTimer, 'id' | 'createdAt'>>;