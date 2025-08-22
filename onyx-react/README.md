# Onyx React - Gestionnaire de Temps d'Étude

Version moderne en React/TypeScript de l'application Onyx JavaFX avec architecture refactorisée et optimisée.

## 🚀 Fonctionnalités

### ⏱️ **Système de Timers Avancé**
- **Minuteurs Pomodoro** : Sessions de travail concentré avec pauses automatiques
- **Timers Éphémères** : Création instantanée pour sessions rapides depuis le calendrier
- **Timers Liés** : Association permanente avec les matières d'étude
- **Widget Flottant** : Contrôle des timers actifs depuis n'importe quelle page
- **Formats Intelligents** : HH:MM:SS pour timers longs, MM:SS pour sessions courtes

### 📚 **Gestion des Matières**
- **Planification Hebdomadaire** : Définition d'objectifs et jours d'étude
- **Suivi Automatique** : Comptabilisation du temps d'étude en temps réel
- **Liaison Timer-Matière** : Association bidirectionnelle robuste
- **Statuts Dynamiques** : Progression automatique (Non commencé → En cours → Terminé)

### 📅 **Calendrier Intelligent**
- **Vue Hebdomadaire/Journalière** : Planification visuelle des sessions
- **Génération Automatique** : Sessions créées selon les jours d'étude configurés
- **Lancement Direct** : Démarrage de timers depuis le calendrier
- **Statistiques Temps Réel** : Temps planifié vs étudié

### 🔄 **Synchronisation Temps Réel**
- **Notifications Automatiques** : Mise à jour instantanée de l'interface
- **Cohérence des Données** : Diagnostic et réparation automatique des liaisons
- **Persistance Intelligente** : Sauvegarde optimisée avec IndexedDB

## 🛠️ Technologies

- **React 18** avec TypeScript
- **Vite** pour le build et le développement
- **Tailwind CSS** pour le styling
- **React Router** pour la navigation
- **Localforage** pour la persistance des données
- **Lucide React** pour les icônes

## 📋 Prérequis

- Node.js 18+ 
- npm ou yarn

## 🔧 Installation

1. **Cloner le projet**
   ```bash
   cd onyx-react
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Démarrer en mode développement**
   ```bash
   npm run dev
   ```

4. **Ouvrir dans le navigateur**
   ```
   http://localhost:3000
   ```

## 📁 Structure du projet

```
src/
├── components/                      # Composants réutilisables
│   ├── Layout.tsx                  # Layout principal avec navigation
│   ├── Timer.tsx                   # Composant timer principal
│   ├── ModernTimerCard.tsx         # Carte timer moderne
│   ├── SubjectCard.tsx             # Carte de matière d'étude
│   ├── SubjectConfigCard.tsx       # Configuration de matière
│   ├── TimerConfigDialog.tsx       # Dialog de configuration timer
│   ├── SimpleActiveTimerWidget.tsx # Widget flottant des timers actifs
│   ├── TopTimerIndicator.tsx       # Indicateur timer en en-tête
│   ├── SmartTimeInput.tsx          # Saisie intelligente de temps
│   └── Modal.tsx                   # Composant modal générique
├── pages/                          # Pages de l'application
│   ├── HomePage.tsx                # Dashboard principal
│   ├── TimersPage.tsx              # Gestion avancée des minuteurs
│   ├── StudyPage.tsx               # Gestion des matières et suivi
│   ├── CalendarPage.tsx            # Calendrier intelligent
│   └── SettingsPage.tsx            # Paramètres utilisateur
├── services/                       # Architecture des services
│   ├── dataService.ts              # Persistance IndexedDB/LocalForage
│   ├── storageService.ts           # Gestion stockage local
│   ├── subjectService.ts           # Logique métier matières
│   ├── timerService.ts             # Service timers de base
│   ├── centralizedTimerService.ts  # Service timer centralisé
│   ├── integratedTimerService.ts   # Service timer intégré
│   ├── timerSubjectLinkService.ts  # Liaison timer-matière
│   └── calendarRenderer.ts         # Rendu calendrier
├── contexts/                       # Contexts React
│   └── ThemeContext.tsx            # Gestion thème sombre/clair
├── hooks/                          # Hooks personnalisés
│   └── useReactiveTimers.ts        # Hook timers réactifs
├── types/                          # Types TypeScript
│   ├── Subject.ts                  # Types matières d'étude
│   ├── Timer.ts                    # Types timers et sessions
│   ├── ActiveTimer.ts              # Types timers actifs
│   └── index.ts                    # Exports centralisés
├── utils/                          # Utilitaires
│   ├── timeFormat.ts               # Formatage intelligent du temps
│   └── constants.ts                # Constantes application
└── App.tsx                         # Composant racine
```

## 🎯 Usage

### 🏠 Dashboard et Navigation
- **Page d'accueil** : Vue d'ensemble avec statistiques temps réel
- **Widget flottant** : Contrôle des timers actifs depuis toute l'application
- **Indicateur en-tête** : Suivi du timer principal en cours

### ⏱️ Gestion des Minuteurs
1. **Timers Standards** : Créez des minuteurs personnalisés avec durées flexibles
2. **Timers Éphémères** : Lancez instantanément depuis le calendrier
3. **Timers Liés** : Association permanente avec vos matières d'étude
4. **Mode Pomodoro** : Cycles automatiques travail/pause avec transitions

### 📚 Matières et Suivi
1. **Création** : Définissez objectifs hebdomadaires et planification
2. **Suivi temps réel** : Progression automatique via timers liés
3. **Synchronisation** : Mise à jour instantanée des données
4. **Statuts dynamiques** : Non commencé → En cours → Terminé

### 📅 Calendrier Intelligent
- **Génération automatique** : Sessions créées selon vos jours d'étude
- **Timers éphémères** : Démarrage direct depuis la vue calendaire
- **Statistiques visuelles** : Temps planifié vs temps étudié
- **Navigation intuitive** : Vue hebdomadaire et quotidienne

### 🔄 Fonctionnalités Avancées
- **Format temps adaptatif** : MM:SS pour sessions courtes, HH:MM:SS pour longues
- **Notifications temps réel** : Synchronisation automatique entre pages
- **Persistance robuste** : Sauvegarde intelligente avec récupération
- **Diagnostic automatique** : Réparation des liaisons timer-matière

## 🔧 Scripts disponibles

```bash
# Développement
npm run dev

# Build de production  
npm run build

# Preview du build
npm run preview

# Linting
npm run lint
```

## 🎨 Personnalisation

### Thème
Les couleurs sont définies dans `tailwind.config.js` et peuvent être personnalisées :

```javascript
colors: {
  primary: {
    500: '#3b82f6', // Bleu principal
    600: '#2563eb',
    // ...
  }
}
```

### Configuration Pomodoro
Les durées par défaut sont dans `src/utils/constants.ts` :

```typescript
export const POMODORO_CONFIG = {
  WORK_DURATION: 25 * 60,      // 25 minutes
  SHORT_BREAK_DURATION: 5 * 60, // 5 minutes
  LONG_BREAK_DURATION: 15 * 60, // 15 minutes
  LONG_BREAK_INTERVAL: 4,       // Pause longue toutes les 4 sessions
} as const;
```

## 🏗️ Architecture et Design

### Architecture des Services
L'application suit une architecture en couches avec séparation claire des responsabilités :

- **Services Métier** : Logique applicative centralisée (timer, subject, data)
- **Hooks Réactifs** : Gestion d'état avec synchronisation temps réel
- **Composants Modulaires** : Interface utilisateur réutilisable et composable
- **Système de Notifications** : Pattern Observer pour la synchronisation

### Gestion d'État Avancée
- **Synchronisation Temps Réel** : Mise à jour automatique entre composants
- **Persistance Intelligente** : Sauvegarde optimisée avec IndexedDB
- **Récupération d'Erreur** : Diagnostic et réparation automatique des données
- **Performance** : Optimisations pour les longues sessions d'étude

### Migration depuis JavaFX
Evolution complète de l'architecture JavaFX vers React moderne :

- **Modèles** : Subject, TimerModel → Types TypeScript robustes
- **Services** : Refactorisation avec patterns modernes (Observer, Singleton)
- **Controllers** → Hooks personnalisés et composants React
- **FXML/CSS** → JSX avec Tailwind CSS et design system
- **Repositories** → Services avec LocalForage et IndexedDB

## 🐛 Dépannage

### Timers et Synchronisation
- **Timer ne démarre pas** : Vérifiez la durée (> 0) et consultez la console
- **Données non synchronisées** : Le système se répare automatiquement au redémarrage
- **Widget flottant invisible** : Vérifiez qu'au moins un timer est actif (running/paused)

### Persistance et Données
- **Données perdues** : Stockage local IndexedDB avec sauvegarde automatique
- **Liaisons timer-matière cassées** : Diagnostic automatique au chargement
- **Sessions non comptabilisées** : Vérifiez les logs de synchronisation dans la console

### Performance et Interface
- **Interface lente** : Fermez les timers inactifs et vérifiez la console
- **Format temps incorrect** : Le formatage s'adapte automatiquement au contexte
- **Affichage mobile** : Interface responsive avec support tactile optimisé

## 📈 Fonctionnalités Disponibles

- [x] **Timers éphémères** : Création instantanée depuis le calendrier
- [x] **Synchronisation temps réel** : Pattern Observer avec notifications
- [x] **Format temps adaptatif** : MM:SS / HH:MM:SS selon contexte
- [x] **Widget flottant** : Contrôle universel des timers actifs
- [x] **Diagnostic automatique** : Réparation des liaisons cassées
- [x] **Calendrier intelligent** : Génération et gestion des sessions

## 🚀 Améliorations Récentes

- **Widget flottant optimisé** : Interface compacte avec gestion multi-timers
- **Formatage temps intelligent** : Contextuel selon l'usage (timer/planning/stats)
- **Synchronisation robuste** : Notifications temps réel entre composants
- **Architecture refactorisée** : Services centralisés avec patterns modernes

## 🤝 Contribution

1. Fork le projet
2. Créez une branche feature (`git checkout -b feature/nouvelle-fonction`)
3. Commit vos changements (`git commit -m 'Ajout nouvelle fonction'`)
4. Push sur la branche (`git push origin feature/nouvelle-fonction`)
5. Ouvrez une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.