/**
 * Utilitaires pour les notifications audio
 */

export const playTimerFinishedSound = (): void => {
  try {
    // Utiliser l'API Web Audio pour créer un son de notification
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Créer une séquence de bips
    const playBeep = (frequency: number, duration: number, delay: number = 0) => {
      setTimeout(() => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration);
      }, delay);
    };
    
    // Jouer 3 bips successifs (comme une alarme)
    playBeep(800, 0.2, 0);     // Premier bip
    playBeep(800, 0.2, 300);   // Deuxième bip après 300ms
    playBeep(800, 0.4, 600);   // Troisième bip plus long après 600ms
    
    console.log('🔔 Son de fin de timer joué');
    
  } catch (error) {
    console.warn('⚠️ Impossible de jouer le son de notification:', error);
    
    // Fallback: utiliser l'API Notification si le son échoue
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Timer terminé !', {
        body: 'Votre session d\'étude est terminée.',
        icon: '/favicon.ico'
      });
    }
  }
};

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.warn('Ce navigateur ne supporte pas les notifications');
    return false;
  }
  
  if (Notification.permission === 'granted') {
    return true;
  }
  
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  
  return false;
};

export const playBreakFinishedSound = (): void => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Son plus doux pour la fin de pause
    const playBeep = (frequency: number, duration: number, delay: number = 0) => {
      setTimeout(() => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration);
      }, delay);
    };
    
    // Double bip plus doux pour la fin de pause
    playBeep(600, 0.3, 0);     
    playBeep(600, 0.3, 400);   
    
    console.log('🔔 Son de fin de pause joué');
    
  } catch (error) {
    console.warn('⚠️ Impossible de jouer le son de fin de pause:', error);
  }
};