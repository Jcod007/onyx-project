import React, { useState } from 'react';
import { ModernTimerCard } from '@/components/ModernTimerCard';
import { DailySummary } from '@/components/DailySummary';
import { SubjectConfigCard } from '@/components/SubjectConfigCard';
import { TimerConfigDialog } from '@/components/TimerConfigDialog';
import { Subject } from '@/types/Subject';
import { ActiveTimer } from '@/types/ActiveTimer';
import { TimerConfig } from '@/services/timerService';
import { Play, Settings, Eye } from 'lucide-react';

export const ConfigDemoPage: React.FC = () => {
  const [showTimerConfig, setShowTimerConfig] = useState(false);
  const [activeDemo, setActiveDemo] = useState<'cards' | 'summary' | 'subject-config'>('subject-config');

  // Données de démonstration
  const demoSubject: Subject = {
    id: '1',
    name: 'Mathématiques',
    targetTime: 7200, // 2 heures
    defaultTimerDuration: 1500, // 25 minutes
    timeSpent: 3600, // 1 heure étudiée
    status: 'IN_PROGRESS',
    weeklyTimeGoal: 240, // 4h par semaine
    studyDays: ['MONDAY', 'WEDNESDAY', 'FRIDAY'],
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const demoTimers: ActiveTimer[] = [
    {
      id: 'timer1',
      title: 'Timer Focus 25min',
      config: { workDuration: 1500, shortBreakDuration: 300, longBreakDuration: 900, longBreakInterval: 4 },
      isPomodoroMode: false,
      maxCycles: 0,
      linkedSubject: null,
      createdAt: new Date(),
      lastUsedAt: new Date()
    },
    {
      id: 'timer2',
      title: 'Pomodoro Classique',
      config: { workDuration: 1500, shortBreakDuration: 300, longBreakDuration: 900, longBreakInterval: 4 },
      isPomodoroMode: true,
      maxCycles: 4,
      linkedSubject: null,
      createdAt: new Date(),
      lastUsedAt: new Date()
    }
  ];

  const demoSessions = [
    {
      id: '1',
      subject: demoSubject,
      plannedDuration: 3600,
      studiedTime: 1800,
      isCompleted: false,
      progress: 50
    },
    {
      id: '2',
      subject: { ...demoSubject, name: 'Histoire', timeSpent: 3600 },
      plannedDuration: 3600,
      studiedTime: 3600,
      isCompleted: true,
      progress: 100
    }
  ];

  const handleTimerConfigConfirm = (config: any) => {
    console.log('Timer config:', config);
    setShowTimerConfig(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Démonstration des Interfaces ONYX
          </h1>
          <p className="text-gray-600">
            Interface moderne pour la gestion des timers, sessions d'étude et configuration des cours
          </p>
        </div>

        {/* Navigation des démos */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setActiveDemo('cards')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeDemo === 'cards'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Cartes Modernes
            </button>
            <button
              onClick={() => setActiveDemo('summary')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeDemo === 'summary'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Résumé Journalier
            </button>
            <button
              onClick={() => setActiveDemo('subject-config')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeDemo === 'subject-config'
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Config Matière
            </button>
            <button
              onClick={() => setShowTimerConfig(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              Nouveau Timer
            </button>
          </div>
        </div>

        {/* Contenu selon la démo active */}
        <div className="space-y-8">
          {activeDemo === 'cards' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Play className="text-blue-600" size={24} />
                Cartes Timer Modernes
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <ModernTimerCard
                  id="demo1"
                  title="Session Mathématiques"
                  duration={1500}
                  state="idle"
                  timeRemaining={1500}
                  linkedSubject={demoSubject}
                  isPomodoroMode={false}
                  sessionCount={3}
                  progress={0}
                  onStart={() => console.log('Start timer')}
                  onPause={() => console.log('Pause timer')}
                  onReset={() => console.log('Reset timer')}
                  onEdit={() => console.log('Edit timer')}
                  onDelete={() => console.log('Delete timer')}
                  onLinkSubject={() => console.log('Link subject')}
                />
                
                <ModernTimerCard
                  id="demo2"
                  title="Pomodoro Focus"
                  duration={1500}
                  state="running"
                  timeRemaining={892}
                  linkedSubject={null}
                  isPomodoroMode={true}
                  sessionCount={1}
                  maxCycles={4}
                  progress={42}
                  onStart={() => console.log('Start timer')}
                  onPause={() => console.log('Pause timer')}
                  onReset={() => console.log('Reset timer')}
                  onEdit={() => console.log('Edit timer')}
                  onDelete={() => console.log('Delete timer')}
                  onLinkSubject={() => console.log('Link subject')}
                />
                
                <ModernTimerCard
                  id="demo3"
                  title="Session terminée"
                  duration={2700}
                  state="finished"
                  timeRemaining={0}
                  linkedSubject={{ ...demoSubject, name: 'Histoire' }}
                  isPomodoroMode={false}
                  sessionCount={1}
                  progress={100}
                  onStart={() => console.log('Start timer')}
                  onPause={() => console.log('Pause timer')}
                  onReset={() => console.log('Reset timer')}
                  onEdit={() => console.log('Edit timer')}
                  onDelete={() => console.log('Delete timer')}
                  onLinkSubject={() => console.log('Link subject')}
                />
              </div>
            </div>
          )}

          {activeDemo === 'summary' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Settings className="text-green-600" size={24} />
                Résumé Journalier
              </h2>
              <div className="max-w-4xl">
                <DailySummary
                  sessions={demoSessions}
                  onStartSession={(sessionId) => console.log('Start session:', sessionId)}
                />
              </div>
            </div>
          )}


          {activeDemo === 'subject-config' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Settings className="text-purple-600" size={24} />
                Nouvelle Configuration de Matière
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <SubjectConfigCard
                  subject={demoSubject}
                  availableTimers={demoTimers}
                  linkedTimer={null}
                  onTimeAllocationChange={(subjectId, time) => 
                    console.log('Time allocation:', subjectId, time)
                  }
                  onStudyDaysChange={(subjectId, days) => 
                    console.log('Study days:', subjectId, days)
                  }
                  onLinkTimer={(subjectId, timerId) => 
                    console.log('Link timer:', subjectId, timerId)
                  }
                  onUnlinkTimer={(subjectId) => 
                    console.log('Unlink timer:', subjectId)
                  }
                  onCreateQuickTimer={(subjectId, config) => 
                    console.log('Create quick timer:', subjectId, config)
                  }
                />
                
                <SubjectConfigCard
                  subject={{ ...demoSubject, name: 'Histoire', timeSpent: 5400 }}
                  availableTimers={[demoTimers[1]]}
                  linkedTimer={demoTimers[0]}
                  onTimeAllocationChange={(subjectId, time) => 
                    console.log('Time allocation:', subjectId, time)
                  }
                  onStudyDaysChange={(subjectId, days) => 
                    console.log('Study days:', subjectId, days)
                  }
                  onLinkTimer={(subjectId, timerId) => 
                    console.log('Link timer:', subjectId, timerId)
                  }
                  onUnlinkTimer={(subjectId) => 
                    console.log('Unlink timer:', subjectId)
                  }
                  onCreateQuickTimer={(subjectId, config) => 
                    console.log('Create quick timer:', subjectId, config)
                  }
                />
                
                <SubjectConfigCard
                  subject={{ ...demoSubject, name: 'Physique', timeSpent: 1800, targetTime: 10800 }}
                  availableTimers={[]}
                  linkedTimer={null}
                  onTimeAllocationChange={(subjectId, time) => 
                    console.log('Time allocation:', subjectId, time)
                  }
                  onStudyDaysChange={(subjectId, days) => 
                    console.log('Study days:', subjectId, days)
                  }
                  onLinkTimer={(subjectId, timerId) => 
                    console.log('Link timer:', subjectId, timerId)
                  }
                  onUnlinkTimer={(subjectId) => 
                    console.log('Unlink timer:', subjectId)
                  }
                  onCreateQuickTimer={(subjectId, config) => 
                    console.log('Create quick timer:', subjectId, config)
                  }
                />
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            🚀 Fonctionnalités implémentées
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Saisie de temps intelligente (1→2→3 = 00:01:23)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Cartes timer uniformes et responsives</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Configuration avec sliders verticaux tactiles exclusivement</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Interface de liaison cours-timer</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Résumé journalier avec métriques</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Sélection de jours d'étude avec calcul de moyenne</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Timer rapide vs Timer lié (exclusifs)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Design moderne et cohérent</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Liaison bidirectionnelle 1:1 cours-timer</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Calcul automatique de moyenne quotidienne</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dialog de configuration de timer */}
      <TimerConfigDialog
        isOpen={showTimerConfig}
        onClose={() => setShowTimerConfig(false)}
        onConfirm={handleTimerConfigConfirm}
      />
    </div>
  );
};