import { centralizedTimerService } from './centralizedTimerService';
import { timerSubjectLinkService } from './timerSubjectLinkService';
import { ActiveTimer } from '@/types/ActiveTimer';

/**
 * 🎯 IntegratedTimerService
 * 
 * Service intégré qui combine centralizedTimerService et timerSubjectLinkService
 * Fournit une interface unifiée pour toutes les opérations de timers
 */
class IntegratedTimerService {
  private static instance: IntegratedTimerService;
  private listeners: Set<() => void> = new Set();
  
  static getInstance(): IntegratedTimerService {
    if (!IntegratedTimerService.instance) {
      IntegratedTimerService.instance = new IntegratedTimerService();
      IntegratedTimerService.instance.initialize();
    }
    return IntegratedTimerService.instance;
  }

  private initialize(): void {
    // Injecter le service de timers dans le service de liaison
    timerSubjectLinkService.setTimerService({
      getTimers: () => centralizedTimerService.getTimers(),
      updateTimer: (id: string, updates: Partial<ActiveTimer>) => centralizedTimerService.updateTimer(id, updates),
      removeTimer: (id: string) => centralizedTimerService.removeTimer(id),
      subscribe: (listener: () => void) => centralizedTimerService.subscribe(listener)
    });

    // S'abonner aux changements des deux services pour les propager
    centralizedTimerService.subscribe(() => {
      this.notifyListeners();
    });

    timerSubjectLinkService.subscribe(() => {
      this.notifyListeners();
    });
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener();
      } catch (error) {
        console.error('Erreur dans listener integratedTimerService:', error);
      }
    });
  }

  // ==== GESTION DES TIMERS (délégué à centralizedTimerService) ====
  
  getTimers(): ActiveTimer[] {
    return centralizedTimerService.getTimers();
  }

  async addTimer(timer: ActiveTimer): Promise<ActiveTimer> {
    return centralizedTimerService.addTimer(timer);
  }

  async updateTimer(timerId: string, updates: Partial<ActiveTimer>): Promise<void> {
    return centralizedTimerService.updateTimer(timerId, updates);
  }

  async removeTimer(timerId: string): Promise<void> {
    // Utiliser le service unifié pour gérer les conversions de cours
    return timerSubjectLinkService.handleTimerDeletion(timerId);
  }


  getPersistentTimers(): ActiveTimer[] {
    return centralizedTimerService.getPersistentTimers();
  }

  // ==== LIAISONS TIMER-COURS (délégué à timerSubjectLinkService) ====

  async linkCourseToTimer(courseId: string, timerId: string): Promise<void> {
    return timerSubjectLinkService.linkCourseToTimer(courseId, timerId);
  }

  async unlinkCourse(courseId: string): Promise<void> {
    return timerSubjectLinkService.unlinkCourse(courseId);
  }

  async handleCourseDeletion(courseId: string): Promise<void> {
    return timerSubjectLinkService.handleCourseDeletion(courseId);
  }

  async handleTimerDeletion(timerId: string): Promise<void> {
    return timerSubjectLinkService.handleTimerDeletion(timerId);
  }

  async getLinkageStatus() {
    return timerSubjectLinkService.getLinkageStatus();
  }

  getAvailableTimersForSubject(subjectId?: string): ActiveTimer[] {
    return timerSubjectLinkService.getAvailableTimersForSubject(subjectId);
  }

  getLinkedTimersForSubject(subjectId: string): ActiveTimer[] {
    return timerSubjectLinkService.getLinkedTimersForSubject(subjectId);
  }

  async linkTimerToSubject(subjectId: string, timerId: string): Promise<void> {
    await timerSubjectLinkService.linkTimerToSubject(subjectId, timerId);
    // Force notification après liaison
    this.notifyListeners();
  }

  async unlinkTimerFromSubject(subjectId: string): Promise<void> {
    await timerSubjectLinkService.unlinkTimerFromSubject(subjectId);
    // Force notification après déliaison
    this.notifyListeners();
  }

  async unlinkTimersFromDeletedSubject(subjectId: string): Promise<void> {
    return timerSubjectLinkService.unlinkTimersFromDeletedSubject(subjectId);
  }

  // ==== ABONNEMENTS ====

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // ==== COHÉRENCE DES DONNÉES ====

  async ensureDataConsistency(): Promise<void> {
    // Vérifier d'abord la cohérence interne des métadonnées
    await centralizedTimerService.ensureDataConsistency();
    
    // Puis vérifier la cohérence des liaisons timer-cours
    await timerSubjectLinkService.ensureDataConsistency();
  }

  // ==== MÉTHODES AVANCÉES ====

  getTimerSyncInfo(timerId: string) {
    return centralizedTimerService.getTimerSyncInfo(timerId);
  }

  getSyncState() {
    return centralizedTimerService.getSyncState();
  }

  async forceSynchronization(): Promise<void> {
    return centralizedTimerService.forceSynchronization();
  }
}

export const integratedTimerService = IntegratedTimerService.getInstance();