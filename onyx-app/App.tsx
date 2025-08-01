import React, { useState } from 'react';
import { Timer, TimerTailwind } from './Timer';
import { TimerMode } from './timerService';

function App() {
  const [completedSessions, setCompletedSessions] = useState(0);
  const [currentMode, setCurrentMode] = useState<TimerMode>('work');
  const [useCSS, setUseCSS] = useState(true);

  const handleSessionComplete = (sessionCount: number) => {
    setCompletedSessions(sessionCount);
    console.log(`Session ${sessionCount} terminée !`);
  };

  const handleModeChange = (mode: TimerMode) => {
    setCurrentMode(mode);
    console.log(`Mode changé vers: ${mode}`);
  };

  const customConfig = {
    workDuration: 25 * 60,     // 25 minutes
    shortBreakDuration: 5 * 60, // 5 minutes
    longBreakDuration: 15 * 60, // 15 minutes
    longBreakInterval: 4        // pause longue toutes les 4 sessions
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '2rem',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{ 
        maxWidth: '800px', 
        margin: '0 auto',
        textAlign: 'center',
        color: 'white',
        marginBottom: '2rem'
      }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
          Onyx Timer - Démo React
        </h1>
        <p style={{ fontSize: '1.1rem', opacity: 0.9 }}>
          Migration du projet JavaFX vers React/TypeScript
        </p>
      </div>

      {/* Toggle pour changer de style */}
      <div style={{ 
        textAlign: 'center', 
        marginBottom: '2rem' 
      }}>
        <button
          onClick={() => setUseCSS(!useCSS)}
          style={{
            padding: '0.5rem 1rem',
            background: 'rgba(255, 255, 255, 0.2)',
            color: 'white',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '0.9rem'
          }}
        >
          {useCSS ? 'Passer à Tailwind' : 'Passer à CSS Module'}
        </button>
      </div>

      {/* Timer Component */}
      {useCSS ? (
        <Timer
          config={customConfig}
          showModeButtons={true}
          onSessionComplete={handleSessionComplete}
          onModeChange={handleModeChange}
        />
      ) : (
        <TimerTailwind
          config={customConfig}
          showModeButtons={true}
          onSessionComplete={handleSessionComplete}
          onModeChange={handleModeChange}
        />
      )}

      {/* Stats */}
      <div style={{
        marginTop: '2rem',
        textAlign: 'center',
        color: 'white'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          padding: '1rem',
          borderRadius: '8px',
          backdropFilter: 'blur(10px)'
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0' }}>Statistiques</h3>
          <p>Sessions terminées: {completedSessions}</p>
          <p>Mode actuel: {currentMode === 'work' ? 'Travail' : currentMode === 'break' ? 'Pause courte' : 'Pause longue'}</p>
        </div>
      </div>

      {/* Instructions */}
      <div style={{
        marginTop: '2rem',
        maxWidth: '600px',
        margin: '2rem auto 0',
        color: 'white',
        opacity: 0.8,
        fontSize: '0.9rem'
      }}>
        <h3>Instructions:</h3>
        <ul style={{ textAlign: 'left', lineHeight: '1.6' }}>
          <li>Cliquez sur "Démarrer" pour commencer une session</li>
          <li>Utilisez "Pause" pour interrompre temporairement</li>
          <li>Le timer passe automatiquement au mode suivant après chaque session</li>
          <li>Changez de mode manuellement avec les boutons en bas</li>
          <li>Basculez entre CSS Module et Tailwind pour voir les différences</li>
        </ul>
      </div>
    </div>
  );
}

export default App;