# Onyx WebView - Application de Minuteurs d'Étude

## 🎯 Description

Onyx WebView est une refactorisation moderne de l'application Onyx, combinant un backend robuste en Java avec une interface utilisateur web moderne utilisant HTML, CSS et JavaScript, le tout intégré dans une application desktop JavaFX via WebView.

## 🏗️ Architecture

### Technologies Utilisées

- **Backend**: Java 17 + JavaFX 23
- **Frontend**: HTML5 + CSS3 + JavaScript ES6+
- **Communication**: JavaFX WebView Bridge
- **Serveur Web**: Jetty embarqué
- **Build**: Maven

### Structure du Projet

```
onyx-webview/
├── src/main/java/com/onyx/webview/
│   ├── OnyxWebViewApplication.java    # Application principale JavaFX
│   ├── WebViewBridge.java             # Pont Java ↔ JavaScript
│   └── BackendService.java            # Services métier Java
├── src/main/resources/webapp/
│   ├── index.html                     # Interface principale
│   ├── css/                          # Styles CSS
│   │   ├── styles.css                # Styles globaux
│   │   ├── components.css            # Composants UI
│   │   └── animations.css            # Animations
│   └── js/                           # Scripts JavaScript
│       ├── app.js                    # Application principale
│       ├── timers.js                 # Gestion des minuteurs
│       ├── subjects.js               # Gestion des matières
│       └── bridge.js                 # Communication avec Java
└── pom.xml                           # Configuration Maven
```

## 🚀 Fonctionnalités

### Minuteurs
- ⏱️ Création de minuteurs personnalisés
- ▶️ Contrôles de lecture (démarrer, pause, arrêter)
- 🔗 Liaison avec des matières d'étude
- 📊 Suivi du temps en temps réel
- 🎵 Notifications de fin de minuteur

### Matières d'Étude
- 📚 Gestion des matières/sujets d'étude
- 🎯 Définition d'objectifs de temps
- 📈 Suivi de progression avec barres visuelles
- 🎨 Personnalisation des couleurs
- ⚡ Création rapide de minuteurs (25min par défaut)

### Interface Moderne
- 🎨 Design moderne et responsive
- 🌙 Interface sombre et claire
- ✨ Animations fluides
- 📱 Adaptation mobile
- 🖱️ Interactions intuitives

## 🛠️ Installation et Lancement

### Prérequis
- Java 17+
- Maven 3.6+

### Commandes

```bash
# Cloner et naviguer dans le projet
cd onyx-webview

# Compiler le projet
mvn clean compile

# Lancer l'application
mvn javafx:run

# Ou tout en une fois
mvn clean javafx:run
```

## 🔧 Communication Java ↔ JavaScript

### Depuis JavaScript vers Java
```javascript
// Créer un minuteur
window.javabridge.createTimer(JSON.stringify({
    name: "Session Maths",
    initialTime: 1500000,
    linkedSubjectId: "math-001"
}));

// Contrôler un minuteur
window.javabridge.startTimer("timer-id");
window.javabridge.pauseTimer("timer-id");
window.javabridge.stopTimer("timer-id");
```

### Depuis Java vers JavaScript
```java
// Notifier JavaScript d'un événement
webEngine.executeScript("window.onTimerCreated('" + timerJson + "')");
```

## 📊 Avantages de cette Architecture

### ✅ Points Forts
1. **Interface Moderne**: HTML/CSS/JS permet une UI fluide et moderne
2. **Maintenance Aisée**: Séparation claire backend Java / frontend web
3. **Performance**: Application desktop native avec rendu web
4. **Flexibilité**: Facile d'ajouter de nouvelles fonctionnalités côté UI
5. **Réutilisabilité**: Le backend Java peut être réutilisé pour d'autres interfaces

### 🔄 Migration depuis JavaFX FXML
- **Backend Conservé**: Toute la logique métier Java est préservée
- **UI Modernisée**: Interface beaucoup plus moderne et flexible
- **Performance**: WebView offre de bonnes performances pour les applications desktop
- **Maintenance**: Plus facile de maintenir du HTML/CSS/JS que du FXML/CSS

## 🎮 Utilisation

1. **Minuteurs**: Créez des minuteurs personnalisés avec durée spécifique
2. **Matières**: Organisez vos études par matière avec objectifs
3. **Suivi**: Visualisez votre progression avec des statistiques
4. **Sessions Rapides**: Démarrez rapidement des sessions de 25min (Pomodoro)

## 🔮 Évolutions Possibles

- 📱 Version web autonome (sans JavaFX)
- ☁️ Synchronisation cloud
- 📈 Statistiques avancées
- 🎵 Sons personnalisés
- 🌍 Internationalisation
- 📊 Export de données

## 🤝 Contribution

L'architecture modulaire facilite les contributions :
- **Backend**: Modifiez les services Java
- **Frontend**: Améliorez l'interface web
- **Bridge**: Étendez la communication Java ↔ JS

## 📝 Notes Techniques

- Le serveur Jetty embarqué sert les ressources web sur `localhost:8080`
- La communication bidirectionnelle utilise le WebEngine de JavaFX
- Mode développement avec données mockées si le bridge Java n'est pas disponible
- Gestion d'erreurs robuste avec notifications utilisateur