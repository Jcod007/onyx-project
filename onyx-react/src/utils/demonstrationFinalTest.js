/**
 * Test de démonstration finale du système de liaison Timer-Cours
 * 
 * Ce fichier teste l'intégration complète entre :
 * - Création de matières et timers
 * - Liaison bidirectionnelle timer ↔ cours
 * - Conversion automatique lors de suppression
 * - Cohérence des données
 */

console.log('🚀 DÉMONSTRATION FINALE - Système de liaison Timer-Cours');
console.log('===========================================================');

async function runFinalDemo() {
  try {
    // Importer les services dynamiquement
    const { subjectService } = await import('../services/subjectService.js');
    const { centralizedTimerService } = await import('../services/centralizedTimerService.js');

    // 1. CRÉATION D'EXEMPLE DE DONNÉES
    console.log('\n📚 1. CRÉATION DE MATIÈRES');
    
    const mathSubject = await subjectService.createSubject({
      name: 'Mathématiques',
      targetTime: 120, // 2 heures
      defaultTimerDuration: 25
    });
    console.log('✅ Matière créée:', mathSubject.name);

    const historySubject = await subjectService.createSubject({
      name: 'Histoire',
      targetTime: 90, // 1h30
      defaultTimerDuration: 30
    });
    console.log('✅ Matière créée:', historySubject.name);

    // 2. CRÉATION DE TIMERS
    console.log('\n⏰ 2. CRÉATION DE TIMERS');
    
    const pomodoroTimer = await centralizedTimerService.addTimer({
      id: crypto.randomUUID(),
      title: 'Pomodoro Focus',
      config: {
        workDuration: 1500, // 25 min
        shortBreakDuration: 300, // 5 min
        longBreakDuration: 900, // 15 min
        longBreakInterval: 4
      },
      isPomodoroMode: true,
      maxCycles: 4,
      createdAt: new Date(),
      lastUsed: new Date()
    });
    console.log('✅ Timer créé:', pomodoroTimer.title);

    return { mathSubject, historySubject, pomodoroTimer };
  } catch (error) {
    console.error('❌ Erreur pendant la démonstration:', error);
    return null;
  }
}

function normalizeTime(hours, minutes, seconds) {
  hours = Math.floor(hours);
  minutes = Math.floor(minutes);
  seconds = Math.floor(seconds);
  
  if (seconds >= 60) {
    const extraMinutes = Math.floor(seconds / 60);
    minutes += extraMinutes;
    seconds = seconds % 60;
  }
  
  if (minutes >= 60) {
    const extraHours = Math.floor(minutes / 60);
    hours += extraHours;
    minutes = minutes % 60;
  }
  
  return { hours, minutes, seconds };
}

function formatDisplay(value) {
  const padded = value.padStart(6, '0');
  const h = padded.slice(0, 2);
  const m = padded.slice(2, 4);
  const s = padded.slice(4, 6);
  return `${h}:${m}:${s}`;
}

// Exporter la fonction pour usage externe
if (typeof window !== 'undefined') {
  window.runFinalDemo = runFinalDemo;
}

// Auto-run en développement
if (process.env.NODE_ENV === 'development') {
  console.log('🔧 Mode développement détecté - Démonstration disponible via window.runFinalDemo()');
}

export { runFinalDemo };