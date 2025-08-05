import React from 'react';
import { Timer } from './Timer';

export const TimerDemo: React.FC = () => {
  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          🎯 Timer ONYX - Démonstration
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Timer simple */}
          <Timer
            id="1"
            duration={25 * 60} // 25 minutes
            title="Timer Focus"
            linkedCourse="Mathématiques"
            enableSounds={true}
          />
          
          {/* Timer avec Pomodoro */}
          <Timer
            id="2"
            duration={25 * 60} // 25 minutes
            title="Timer Pomodoro"
            linkedCourse="Histoire"
            isPomodoroMode={true}
            maxCycles={4}
            enableSounds={true}
          />
          
          {/* Timer sans cours lié */}
          <Timer
            id="3"
            duration={15 * 60} // 15 minutes
            title="Timer Libre"
            enableSounds={false}
          />
        </div>
        
        <div className="mt-12 p-6 bg-white rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            ✨ Fonctionnalités du Timer
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">🎨 Interface</h3>
              <ul className="space-y-1">
                <li>• Design moderne et épuré</li>
                <li>• États visuels clairs (IDLE, EN COURS, PAUSE, TERMINÉ)</li>
                <li>• Barre de progression dynamique</li>
                <li>• Affichage temps en grand format</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">⚙️ Fonctionnalités</h3>
              <ul className="space-y-1">
                <li>• Démarrer / Pause / Reprendre</li>
                <li>• Reset et recommencer</li>
                <li>• Contrôle du son activé/désactivé</li>
                <li>• Support mode Pomodoro</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">📚 Intégration</h3>
              <ul className="space-y-1">
                <li>• Liaison avec cours spécifique</li>
                <li>• Compteur de sessions</li>
                <li>• Support cycles Pomodoro</li>
                <li>• Callbacks personnalisables</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">🎯 Ergonomie</h3>
              <ul className="space-y-1">
                <li>• Boutons larges et accessibles</li>
                <li>• Couleurs adaptées à l'état</li>
                <li>• Responsive design</li>
                <li>• Hiérarchie visuelle claire</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};