# Onyx React - Gestionnaire de Temps d'Étude

Version moderne en React/TypeScript de l'application Onyx JavaFX.

## 🚀 Fonctionnalités

- **Minuteurs Pomodoro** : Sessions de travail concentré avec pauses automatiques
- **Gestion des matières** : Créez et suivez vos matières d'étude
- **Suivi des progrès** : Visualisez votre progression vers vos objectifs
- **Sessions d'étude** : Timers liés aux matières pour un suivi automatique
- **Interface moderne** : Design responsive avec Tailwind CSS
- **Persistance locale** : Données sauvegardées localement avec IndexedDB

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
├── components/          # Composants réutilisables
│   ├── Timer.tsx       # Composant timer principal
│   ├── SubjectCard.tsx # Carte de matière
│   ├── Layout.tsx      # Layout principal avec navigation
│   └── TimerConfigDialog.tsx # Dialog de configuration
├── pages/              # Pages de l'application
│   ├── HomePage.tsx    # Page d'accueil avec dashboard
│   ├── TimersPage.tsx  # Gestion des minuteurs
│   └── StudyPage.tsx   # Gestion des matières
├── services/           # Services métier
│   ├── timerService.ts # Logique des timers
│   ├── subjectService.ts # Gestion des matières
│   └── dataService.ts  # Persistance des données
├── types/              # Types TypeScript
│   ├── Subject.ts      # Types pour les matières
│   ├── Timer.ts        # Types pour les timers
│   └── index.ts        # Exports centralisés
├── utils/              # Utilitaires
│   ├── timeFormat.ts   # Formatage du temps  
│   └── constants.ts    # Constantes de l'app
└── App.tsx             # Composant racine
```

## 🎯 Usage

### Créer un minuteur
1. Allez sur la page "Minuteurs"
2. Cliquez sur "Nouveau timer"
3. Configurez la durée et le type de session
4. Optionnellement, liez-le à une matière

### Gérer les matières
1. Allez sur la page "Étude"  
2. Créez une nouvelle matière avec un objectif de temps
3. Utilisez les timers rapides pour étudier
4. Suivez vos progrès automatiquement

### Sessions Pomodoro
- **Travail** : 25 minutes par défaut
- **Pause courte** : 5 minutes
- **Pause longue** : 15 minutes (toutes les 4 sessions)
- Transitions automatiques entre les modes

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

## 🔄 Migration depuis JavaFX

Cette version React reprend toute l'architecture et les fonctionnalités de la version JavaFX :

- **Modèles** : Subject, TimerModel → Types TypeScript
- **Services** : TimerService, SubjectService → Services JS/TS
- **Controllers** → Composants React avec hooks
- **FXML/CSS** → JSX avec Tailwind CSS
- **JSON Repositories** → LocalForage avec IndexedDB

### Import de données JavaFX
Les données de l'ancienne version peuvent être importées via la fonction d'export/import dans les services.

## 🐛 Dépannage

### Timer ne se lance pas
- Vérifiez que la durée est valide (> 0)
- Consultez la console pour les erreurs

### Données perdues
- Les données sont stockées localement dans IndexedDB
- Utilisez les fonctions d'export pour sauvegarder

### Problèmes de performance
- Fermez les timers inutilisés
- Vérifiez la console pour les erreurs

## 📈 Prochaines fonctionnalités

- [ ] Statistiques détaillées
- [ ] Paramètres utilisateur
- [ ] Notifications desktop
- [ ] Export/import de données
- [ ] Thème sombre
- [ ] Mode hors ligne (PWA)

## 🤝 Contribution

1. Fork le projet
2. Créez une branche feature (`git checkout -b feature/nouvelle-fonction`)
3. Commit vos changements (`git commit -m 'Ajout nouvelle fonction'`)
4. Push sur la branche (`git push origin feature/nouvelle-fonction`)
5. Ouvrez une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.