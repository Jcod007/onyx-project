# Plan de Migration : Onyx JavaFX → React/TypeScript

## Vue d'ensemble du projet actuel

### Architecture JavaFX existante
- **MVC Pattern** avec séparation clara entre UI et logique métier
- **Services** : TimerService, TimersManagerService, TimeFormatService
- **Controllers** : MainController, TimersController, StudyDeckController, etc.
- **Models** : Subject, TimerModel, StudyDeck, TimerConfigResult
- **Repository Pattern** : JsonTimerRepository, JsonSubjectRepository
- **UI** : FXML + CSS pour les vues

### Composants principaux identifiés
1. **Timer System** : Gestion des minuteurs avec différents types
2. **Subject Management** : Gestion des matières d'étude
3. **Study Sessions** : Sessions d'étude liées aux matières
4. **Data Persistence** : Sauvegarde en JSON
5. **UI Navigation** : Interface principale avec sidebar

## Stratégie de Migration

### Phase 1: Infrastructure et Architecture de base
- [x] Service Timer de base (déjà créé)
- [ ] Architecture React avec Context API/Zustand pour le state management
- [ ] System de routing (React Router)
- [ ] Structure de dossiers TypeScript
- [ ] Configuration build (Vite/CRA + TypeScript)

### Phase 2: Models et Services TypeScript
- [ ] **models/Subject.ts** - Migration du modèle Subject Java
- [ ] **models/TimerModel.ts** - Migration du modèle Timer Java  
- [ ] **services/subjectService.ts** - Gestion des matières
- [ ] **services/studySessionService.ts** - Gestion des sessions d'étude
- [ ] **services/dataService.ts** - Persistence des données (localStorage/IndexedDB)
- [ ] **services/timersManagerService.ts** - Gestionnaire global des timers

### Phase 3: Composants React de base
- [x] **Timer.tsx** - Composant timer principal (déjà créé)
- [ ] **SubjectCard.tsx** - Carte de matière (équivalent CourseCard)
- [ ] **StudyDeck.tsx** - Liste des matières
- [ ] **TimerConfigDialog.tsx** - Configuration des timers
- [ ] **Navigation.tsx** - Sidebar de navigation
- [ ] **Layout.tsx** - Layout principal

### Phase 4: Pages et vues principales
- [ ] **Dashboard.tsx** - Page d'accueil/dashboard
- [ ] **TimersPage.tsx** - Page de gestion des timers
- [ ] **StudyPage.tsx** - Page d'étude avec matières
- [ ] **SettingsPage.tsx** - Configuration de l'application

### Phase 5: Fonctionnalités avancées
- [ ] **Responsive Design** - Adaptation mobile/desktop
- [ ] **Animations** - Transitions et feedbacks visuels
- [ ] **Audio Notifications** - Sons de fin de timer
- [ ] **Statistics** - Suivi des progrès et statistiques
- [ ] **Import/Export** - Migration des données JavaFX

## Correspondances JavaFX → React

### Services
| JavaFX | React/TypeScript |
|--------|------------------|
| TimerService | timerService.ts (✓) |
| TimersManagerService | timersManagerService.ts |
| TimeFormatService | utils/timeFormat.ts |
| JsonTimerRepository | services/dataService.ts |
| JsonSubjectRepository | services/dataService.ts |

### Controllers → Components
| JavaFX Controller | React Component |
|-------------------|-----------------|
| MainController | Layout.tsx + Navigation.tsx |
| TimersController | TimersPage.tsx |
| TimerController | Timer.tsx (✓) |
| StudyDeckController | StudyPage.tsx |
| CourseCardController | SubjectCard.tsx |
| StudyMiniTimerController | MiniTimer.tsx |
| TimerConfigDialogController | TimerConfigDialog.tsx |

### Models
| JavaFX Model | TypeScript Interface |
|--------------|---------------------|
| Subject | interfaces/Subject.ts |
| TimerModel | interfaces/TimerModel.ts |
| StudyDeck | interfaces/StudyDeck.ts |
| TimerConfigResult | interfaces/TimerConfig.ts |

## Technologies recommandées

### Core Stack
- **Framework** : React 18 + TypeScript
- **Build Tool** : Vite (plus rapide que CRA)
- **Styling** : Tailwind CSS + CSS Modules pour composants spécifiques
- **State Management** : Zustand (plus simple que Redux)
- **Routing** : React Router v6

### Utilitaires
- **Date/Time** : date-fns (léger) ou Day.js (compatible Moment.js)
- **Storage** : Localforage (IndexedDB avec fallback localStorage)
- **Animations** : Framer Motion
- **Audio** : Web Audio API ou Howler.js
- **Icons** : Lucide React (équivalent des Ikonli icons)

### Dev Tools
- **Linting** : ESLint + Prettier
- **Testing** : Vitest + React Testing Library
- **Type Checking** : TypeScript strict mode

## Structure de dossiers proposée

```
src/
├── components/          # Composants réutilisables
│   ├── ui/             # Composants UI de base
│   ├── Timer.tsx       # ✓ Déjà créé
│   ├── SubjectCard.tsx
│   └── ...
├── pages/              # Pages principales
│   ├── Dashboard.tsx
│   ├── TimersPage.tsx
│   └── StudyPage.tsx
├── services/           # Logique métier
│   ├── timerService.ts # ✓ Déjà créé
│   ├── subjectService.ts
│   └── dataService.ts
├── interfaces/         # Types TypeScript
│   ├── Subject.ts
│   └── TimerModel.ts
├── hooks/              # Custom React hooks
│   ├── useTimer.ts
│   └── useSubjects.ts
├── store/              # State management
│   └── index.ts
├── utils/              # Utilitaires
│   ├── timeFormat.ts
│   └── constants.ts
└── styles/             # Styles globaux
    └── globals.css
```

## Prochaines étapes immédiates

1. **Setup du projet React** avec Vite + TypeScript
2. **Migration des modèles** (Subject, TimerModel)
3. **Création des services** de base (subjectService, dataService)
4. **Développement des composants** principaux
5. **Integration** et tests

Veux-tu commencer par une phase spécifique ou préfères-tu que je commence par le setup complet du projet React ?