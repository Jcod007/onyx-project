/**
 * 🚀 BUS D'ÉVÉNEMENTS SYNCHRONE
 * 
 * Remplace les setTimeout par des notifications immédiates
 * Garantit une synchronisation instantanée entre cours et timers
 */

type EventHandler<T = any> = (data: T) => void | Promise<any>;

interface LinkageEvent {
  type: 'link' | 'unlink';
  courseId: string;
  timerId?: string;
  timestamp: number;
}

class SyncEventBus {
  private handlers = new Map<string, Set<EventHandler>>();
  
  /**
   * S'abonner à un événement
   */
  on<T = any>(event: string, handler: EventHandler<T>): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    
    this.handlers.get(event)!.add(handler);
    
    // Retourner fonction de désabonnement
    return () => {
      this.handlers.get(event)?.delete(handler);
    };
  }
  
  /**
   * Émettre un événement SYNCHRONE (pas d'async/await)
   */
  emit<T = any>(event: string, data?: T): void {
    const handlers = this.handlers.get(event);
    if (!handlers || handlers.size === 0) return;
    
    console.log(`📡 SyncEventBus: Émission ${event} vers ${handlers.size} handler(s)`);
    
    // Exécution SYNCHRONE de tous les handlers
    let successCount = 0;
    for (const handler of handlers) {
      try {
        const result = handler(data);
        // ✅ Vérifier si le handler retourne une promesse (ce qui ne devrait pas arriver)
        if (result && typeof result === 'object' && 'then' in result && typeof result.then === 'function') {
          console.warn(`⚠️ Handler pour ${event} retourne une promesse - cela devrait être synchrone`);
        }
        successCount++;
      } catch (error) {
        console.error(`❌ Erreur dans handler pour événement ${event}:`, error);
      }
    }
    
    console.log(`✅ SyncEventBus: ${successCount}/${handlers.size} handlers exécutés avec succès pour ${event}`);
  }
  
  /**
   * Notification spécialisée pour les liaisons cours-timer
   */
  notifyLinkageChange(type: 'link' | 'unlink', courseId: string, timerId?: string): void {
    const event: LinkageEvent = {
      type,
      courseId,
      timerId,
      timestamp: Date.now()
    };
    
    const stats = this.getStats();
    console.log(`🔗 SyncEventBus: ${type} cours-timer IMMÉDIAT (${courseId} ↔ ${timerId})`);
    console.log(`📊 Listeners actifs:`, stats);
    
    // Notifications SYNCHRONES - pas de délai
    this.emit('linkage:changed', event);
    this.emit('subjects:refresh');
    this.emit('timers:refresh');
    
    console.log(`✅ SyncEventBus: Propagation terminée pour ${type}`);
  }
  
  /**
   * Obtenir les statistiques du bus
   */
  getStats(): Record<string, number> {
    const stats: Record<string, number> = {};
    this.handlers.forEach((handlers, event) => {
      stats[event] = handlers.size;
    });
    return stats;
  }
  
  /**
   * Nettoyer tous les handlers
   */
  cleanup(): void {
    this.handlers.clear();
  }
}

// Instance singleton
export const syncEventBus = new SyncEventBus();