/**
 * Service déprecié pour la liaison bidirectionnelle entre cours et timers
 * 
 * @deprecated Ce service a été remplacé par centralizedTimerService
 * Toutes les fonctionnalités sont maintenant disponibles directement dans centralizedTimerService
 * 
 * Migration recommandée :
 * - timerLinkingService.linkTimerToSubject() → centralizedTimerService.linkTimerToSubject()
 * - timerLinkingService.unlinkTimerFromSubject() → centralizedTimerService.unlinkTimerFromSubject()
 * - timerLinkingService.getAvailableTimersForSubject() → centralizedTimerService.getAvailableTimersForSubject()
 * 
 * Ce fichier sera supprimé dans une version future.
 */

import { centralizedTimerService } from './centralizedTimerService';

console.warn('⚠️ timerLinkingService est déprécié. Utilisez centralizedTimerService directement.');

// Re-export du service centralisé pour compatibilité temporaire
export const timerLinkingService = {
  linkTimerToSubject: centralizedTimerService.linkTimerToSubject.bind(centralizedTimerService),
  unlinkTimerFromSubject: centralizedTimerService.unlinkTimerFromSubject.bind(centralizedTimerService),
  getAvailableTimersForSubject: centralizedTimerService.getAvailableTimersForSubject.bind(centralizedTimerService),
  getLinkedTimersForSubject: centralizedTimerService.getLinkedTimersForSubject.bind(centralizedTimerService),
};