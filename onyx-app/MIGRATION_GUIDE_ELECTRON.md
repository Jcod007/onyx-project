# Guide de Migration ONYX : JavaFX vers Electron

## Vue d'ensemble de l'Architecture Actuelle

### État Actuel
- **Framework**: JavaFX 23 avec Java 17
- **Architecture**: MVC avec couche Service
- **Persistance**: JSON via Jackson (TimerRepository, SubjectRepository)
- **UI**: FXML + CSS avec responsive system
- **Fonctionnalités**: Timers Pomodoro, gestion de matières, statistiques de temps

### Modèles de Données Identifiés
```java
TimerModel: id, heures/minutes/secondes, type, matière liée
Subject: id, nom, temps objectif, temps passé, durée par défaut
StudyDeck: conteneur de matières
```

## Stratégies de Migration

### Option 1: Migration Complète vers Electron + Node.js (Recommandée)
**Architecture**: Electron (Renderer) + Node.js (Main Process)
**Avantages**: Stack homogène, écosystème riche, facilité de maintenance
**Inconvénients**: Réécriture complète du backend

### Option 2: Migration Hybride (Electron + Backend Java)
**Architecture**: Electron (Frontend) + Spring Boot REST API (Backend)
**Avantages**: Conservation de la logique métier Java
**Inconvénients**: Complexité supplémentaire, deux stacks à maintenir

### Option 3: Migration Progressive avec Tauri (Alternative)
**Architecture**: Tauri + React/Vue + Rust backend
**Avantages**: Performance native, bundle plus léger
**Inconvénients**: Écosystème moins mature qu'Electron

## Plan de Migration Détaillé (Option 1 - Recommandée)

### Phase 1: Architecture et Setup (Semaine 1-2)

#### 1.1 Structure du Projet
```
onyx-electron/
├── src/
│   ├── main/           # Main process (Node.js)
│   │   ├── main.ts     # Point d'entrée Electron
│   │   ├── services/   # Services métier (Timer, Subject)
│   │   └── data/       # Repositories et persistance
│   ├── renderer/       # Renderer process (Frontend)
│   │   ├── components/ # Composants UI
│   │   ├── views/      # Vues principales
│   │   ├── stores/     # État global (Zustand/Redux)
│   │   └── styles/     # CSS/SCSS modulaire
│   └── preload/        # Scripts preload (sécurité)
├── dist/              # Build artifacts
└── assets/           # Resources (icons, sounds)
```

#### 1.2 Technologies Recommandées
- **Frontend**: React + TypeScript + Vite
- **State Management**: Zustand (léger) ou Redux Toolkit
- **Styling**: CSS Modules + Tailwind CSS
- **Charts**: Chart.js ou Recharts
- **Icons**: Lucide React ou Heroicons

#### 1.3 Setup Initial
```bash
npm create electron-app@latest onyx-electron -- --template=vite-typescript
cd onyx-electron
npm install react react-dom @types/react @types/react-dom
npm install tailwindcss lucide-react chart.js zustand
```

### Phase 2: Migration des Modèles et Services (Semaine 2-3)

#### 2.1 Modèles TypeScript
```typescript
// types/Timer.ts
export interface Timer {
  id: string;
  hours: number;
  minutes: number;
  seconds: number;
  initialDuration: Duration;
  type: 'STUDY_SESSION' | 'FREE_SESSION';
  linkedSubject?: Subject;
}

// types/Subject.ts
export interface Subject {
  id: string;
  name: string;
  targetTime: Duration;
  timeSpent: Duration;
  defaultTimerDuration: Duration;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  lastStudyDate?: Date;
}
```

#### 2.2 Services Main Process
```typescript
// main/services/TimerService.ts
export class TimerService {
  private timers: Map<string, Timer> = new Map();
  private intervals: Map<string, NodeJS.Timeout> = new Map();

  createTimer(config: TimerConfig): Timer { /* ... */ }
  startTimer(id: string): void { /* ... */ }
  pauseTimer(id: string): void { /* ... */ }
  resetTimer(id: string): void { /* ... */ }
}

// main/data/Repository.ts avec SQLite
import Database from 'better-sqlite3';
export class TimerRepository {
  private db: Database.Database;
  
  save(timer: Timer): void { /* ... */ }
  findAll(): Timer[] { /* ... */ }
  delete(id: string): void { /* ... */ }
}
```

### Phase 3: Interface Utilisateur (Semaine 3-5)

#### 3.1 Composants de Base
```typescript
// renderer/components/TimerCard.tsx
export const TimerCard: React.FC<{timer: Timer}> = ({timer}) => {
  return (
    <div className="timer-card animate-fade-in">
      <div className="timer-display">{formatTime(timer)}</div>
      <TimerControls timer={timer} />
    </div>
  );
};

// renderer/components/StudyDashboard.tsx
export const StudyDashboard: React.FC = () => {
  const subjects = useSubjectStore(state => state.subjects);
  
  return (
    <div className="dashboard-grid">
      {subjects.map(subject => 
        <SubjectCard key={subject.id} subject={subject} />
      )}
    </div>
  );
};
```

#### 3.2 Gestion d'État avec Zustand
```typescript
// renderer/stores/timerStore.ts
interface TimerState {
  timers: Timer[];
  activeTimer?: Timer;
  addTimer: (timer: Timer) => void;
  updateTimer: (id: string, updates: Partial<Timer>) => void;
  removeTimer: (id: string) => void;
}

export const useTimerStore = create<TimerState>((set) => ({
  timers: [],
  addTimer: (timer) => set((state) => ({
    timers: [...state.timers, timer]
  })),
  // ...
}));
```

### Phase 4: Communication IPC et Sécurité (Semaine 4)

#### 4.1 API IPC Sécurisée
```typescript
// preload/index.ts
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  timers: {
    create: (config: TimerConfig) => ipcRenderer.invoke('timer:create', config),
    start: (id: string) => ipcRenderer.invoke('timer:start', id),
    getAll: () => ipcRenderer.invoke('timer:getAll'),
    onUpdate: (callback: Function) => ipcRenderer.on('timer:updated', callback)
  },
  subjects: {
    create: (subject: Subject) => ipcRenderer.invoke('subject:create', subject),
    getAll: () => ipcRenderer.invoke('subject:getAll'),
    update: (id: string, updates: Partial<Subject>) => 
      ipcRenderer.invoke('subject:update', id, updates)
  }
});
```

#### 4.2 Handlers Main Process
```typescript
// main/handlers/timerHandlers.ts
import { ipcMain } from 'electron';

ipcMain.handle('timer:create', async (_, config: TimerConfig) => {
  const timer = timerService.createTimer(config);
  await timerRepository.save(timer);
  return timer;
});

ipcMain.handle('timer:start', async (_, id: string) => {
  timerService.startTimer(id);
  // Broadcast to all windows
  BrowserWindow.getAllWindows().forEach(win => {
    win.webContents.send('timer:updated', timerService.getTimer(id));
  });
});
```

### Phase 5: Fonctionnalités Avancées (Semaine 5-6)

#### 5.1 Système de Notifications
```typescript
// main/services/NotificationService.ts
export class NotificationService {
  showTimerComplete(timer: Timer): void {
    new Notification('Timer Terminé!', {
      body: `Session de ${timer.linkedSubject?.name || 'travail'} terminée`,
      icon: path.join(__dirname, '../assets/icon.png')
    });
  }
}
```

#### 5.2 Raccourcis Clavier Globaux
```typescript
// main/main.ts
import { globalShortcut } from 'electron';

app.whenReady().then(() => {
  globalShortcut.register('CommandOrControl+Alt+S', () => {
    // Start/Stop timer rapide
    timerService.toggleActiveTimer();
  });
});
```

#### 5.3 Graphiques et Statistiques
```typescript
// renderer/components/StatisticsChart.tsx
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Bar } from 'react-chartjs-2';

export const WeeklyProgressChart: React.FC = () => {
  const data = useSubjectStore(state => state.getWeeklyData());
  
  return (
    <div className="chart-container">
      <Bar data={chartData} options={chartOptions} />
    </div>
  );
};
```

## Persistance des Données

### Option A: SQLite (Recommandée pour Desktop)
```typescript
// main/data/Database.ts
import Database from 'better-sqlite3';

export class DatabaseManager {
  private db: Database.Database;

  constructor() {
    this.db = new Database(path.join(app.getPath('userData'), 'onyx.db'));
    this.initTables();
  }

  private initTables(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS timers (
        id TEXT PRIMARY KEY,
        hours INTEGER NOT NULL,
        minutes INTEGER NOT NULL,
        seconds INTEGER NOT NULL,
        type TEXT NOT NULL,
        subject_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }
}
```

### Option B: JSON Files (Migration Simple)
```typescript
// main/data/JsonRepository.ts
export class JsonTimerRepository {
  private filePath = path.join(app.getPath('userData'), 'timers.json');

  async save(timer: Timer): Promise<void> {
    const timers = await this.findAll();
    const index = timers.findIndex(t => t.id === timer.id);
    
    if (index >= 0) {
      timers[index] = timer;
    } else {
      timers.push(timer);
    }
    
    await fs.writeFile(this.filePath, JSON.stringify(timers, null, 2));
  }
}
```

## Optimisation des Performances

### 1. Bundle Size Optimization
```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      external: ['electron'],
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'chart-vendor': ['chart.js'],
        }
      }
    }
  }
});
```

### 2. Memory Management
```typescript
// renderer/hooks/useTimer.ts
export const useTimer = (id: string) => {
  const [timer, setTimer] = useState<Timer | null>(null);

  useEffect(() => {
    const unsubscribe = window.electronAPI.timers.onUpdate((updatedTimer) => {
      if (updatedTimer.id === id) {
        setTimer(updatedTimer);
      }
    });

    return unsubscribe; // Cleanup
  }, [id]);
};
```

### 3. Lazy Loading
```typescript
// renderer/App.tsx
const TimerView = lazy(() => import('./views/TimerView'));
const StatsView = lazy(() => import('./views/StatsView'));

export const App: React.FC = () => {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/timers" element={<TimerView />} />
        <Route path="/stats" element={<StatsView />} />
      </Routes>
    </Suspense>
  );
};
```

## Migration des Fonctionnalités Spécifiques

### 1. Système de Timer
```typescript
// renderer/hooks/usePomodoro.ts
export const usePomodoro = () => {
  const [phase, setPhase] = useState<'work' | 'break' | 'longBreak'>('work');
  const [cycle, setCycle] = useState(1);

  const startWork = () => {
    window.electronAPI.timers.create({
      duration: 25 * 60, // 25 minutes
      type: 'STUDY_SESSION',
      onComplete: () => {
        if (cycle % 4 === 0) {
          setPhase('longBreak');
        } else {
          setPhase('break');
        }
      }
    });
  };
};
```

### 2. Gestion des Matières
```typescript
// renderer/components/SubjectManager.tsx
export const SubjectManager: React.FC = () => {
  const { subjects, addSubject, updateSubject } = useSubjectStore();

  const handleCreateSubject = async (data: SubjectFormData) => {
    const subject = await window.electronAPI.subjects.create({
      name: data.name,
      targetTime: data.targetHours * 3600,
      defaultTimerDuration: data.defaultDuration
    });
    
    addSubject(subject);
  };
};
```

## Préparation Cloud (Bonus)

### 1. Architecture pour Sync Cloud
```typescript
// main/services/SyncService.ts
export class SyncService {
  private apiClient: CloudAPIClient;

  async syncData(): Promise<void> {
    const localData = await this.getLocalData();
    const cloudData = await this.apiClient.getData();
    
    const merged = this.mergeData(localData, cloudData);
    
    await this.saveLocalData(merged.local);
    await this.apiClient.updateData(merged.cloud);
  }

  private mergeData(local: any, cloud: any) {
    // Conflict resolution logic
    return {
      local: /* merged data for local */,
      cloud: /* changes to push to cloud */
    };
  }
}
```

### 2. Offline-First avec Queue
```typescript
// main/services/OfflineQueue.ts
export class OfflineQueue {
  private queue: SyncOperation[] = [];

  addOperation(operation: SyncOperation): void {
    this.queue.push(operation);
    this.persistQueue();
  }

  async processQueue(): Promise<void> {
    while (this.queue.length > 0 && navigator.onLine) {
      const operation = this.queue.shift()!;
      try {
        await this.executeOperation(operation);
      } catch (error) {
        this.queue.unshift(operation); // Retry later
        break;
      }
    }
  }
}
```

## Timeline de Migration

### Semaine 1-2: Setup et Architecture
- Configuration projet Electron + React
- Structure des dossiers et outils de build
- Migration des modèles de données

### Semaine 3-4: Core Features
- Interface utilisateur de base
- Système de timers
- Gestion des matières

### Semaine 5-6: Features Avancées
- Statistiques et graphiques
- Notifications système
- Raccourcis clavier

### Semaine 7-8: Polish et Optimisation
- Tests et debugging
- Optimisation des performances
- Packaging pour distribution

## Commandes et Scripts

### Development
```bash
# Setup initial
npm install
npm run setup-dev

# Development
npm run dev          # Lance en mode développement
npm run dev:debug    # Avec outils de debug
npm run type-check   # Vérification TypeScript

# Build
npm run build        # Build de production
npm run build:win    # Build Windows
npm run build:mac    # Build macOS
npm run build:linux  # Build Linux

# Tests
npm run test         # Tests unitaires
npm run test:e2e     # Tests end-to-end
```

### Configuration Vite
```typescript
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  base: process.env.ELECTRON_IS_DEV ? '/' : './',
  build: {
    outDir: 'dist-electron/renderer'
  },
  server: {
    port: 3000
  }
});
```

## Stratégie de Transition Progressive

Si vous souhaitez migrer progressivement :

### Phase 1: Interface Electron + Backend Java
1. Créer une API REST Spring Boot autour de vos services Java
2. Développer l'interface Electron qui consomme cette API
3. Utiliser HTTP/WebSocket pour la communication

### Phase 2: Migration Backend par Module
1. Migrer TimerService vers Node.js
2. Migrer SubjectRepository vers SQLite/Node.js
3. Désactiver progressivement les endpoints Java

### Phase 3: Finalisation
1. Supprimer le backend Java
2. Optimiser la communication IPC
3. Intégrer complètement les fonctionnalités

## Conclusion

Cette migration vers Electron vous permettra de créer une application moderne avec une interface fluide similaire à Notion ou Toggl. La stack React + TypeScript + Electron offre un excellent équilibre entre productivité de développement et performance utilisateur.

**Recommandations prioritaires:**
1. Commencer par l'Option 1 (migration complète) pour une architecture propre
2. Utiliser SQLite pour la persistance (plus robuste que JSON)
3. Implémenter un système de notifications riche
4. Préparer dès le début l'architecture pour le cloud sync

La durée estimée totale est de 6-8 semaines pour une migration complète avec toutes les fonctionnalités actuelles, plus les améliorations UX.