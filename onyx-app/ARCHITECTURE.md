# Architecture Onyx App - Séparation Frontend/Backend

## Vue d'ensemble

Cette refactorisation sépare clairement la logique métier (backend) de l'interface utilisateur (frontend) en utilisant le pattern Service Layer.

## Structure des packages

```
src/main/java/com/onyx/app/
├── controller/          # Frontend - Interface utilisateur
│   ├── TimerController.java          # Refactorisé pour utiliser les services
│   ├── TimersController.java         # Refactorisé pour utiliser les services
│   └── ...
├── service/            # Backend - Logique métier
│   ├── TimerService.java
│   ├── TimersManagerService.java
│   └── TimeFormatService.java
├── model/              # Modèles de données
│   ├── TimerModel.java
│   └── ...
└── OnyxApplication.java
```

## Services (Backend)

### 1. TimerService
**Responsabilité** : Gère la logique métier d'un timer individuel

**Fonctionnalités** :
- Décompte du temps
- Gestion des états (en cours, en pause, terminé)
- Alarme sonore
- Formatage du temps
- Callbacks pour notifier l'interface

**Méthodes principales** :
```java
public void startTimer()
public void pauseTimer()
public void resetTimer()
public void toggleTimer()
public String getFormattedTime()
```

### 2. TimersManagerService
**Responsabilité** : Gère une collection de timers

**Fonctionnalités** :
- Création/suppression de timers
- Gestion des timers actifs
- Contrôle global (pause/stop tous)
- Statistiques

**Méthodes principales** :
```java
public TimerService createTimer()
public void removeTimer(TimerService timer)
public void pauseAllTimers()
public int getRunningTimersCount()
```

### 3. TimeFormatService
**Responsabilité** : Utilitaires pour le formatage et validation du temps

**Fonctionnalités** :
- Formatage HH:MM:SS
- Validation des entrées
- Parsing de texte
- TextFormatter pour JavaFX

**Méthodes principales** :
```java
public static TextFormatter<String> createTimeFormatter()
public static String formatTime(byte hours, byte minutes, byte seconds)
public static TimeValues parseTimeFromText(String text)
```

## Contrôleurs (Frontend)

### 1. TimerController
**Responsabilité** : Interface utilisateur pour un timer individuel

**Fonctionnalités** :
- Affichage du temps
- Gestion des boutons (Start/Pause/Reset)
- Mode édition du temps
- Interaction utilisateur

**Séparation des responsabilités** :
- **Frontend** : Affichage, événements utilisateur, validation UI
- **Backend** : Délégué au TimerService

### 2. TimersController
**Responsabilité** : Interface pour gérer plusieurs timers

**Fonctionnalités** :
- Liste des timers
- Création de nouveaux timers
- Contrôles globaux

## Avantages de cette architecture

### 1. Séparation des responsabilités
- **Frontend** : Interface utilisateur uniquement
- **Backend** : Logique métier pure
- **Modèles** : Données

### 2. Réutilisabilité
- Les services peuvent être utilisés par différents contrôleurs
- Tests unitaires plus faciles
- Logique métier indépendante de l'interface

### 3. Maintenabilité
- Code plus organisé
- Modifications isolées
- Debugging plus simple

### 4. Extensibilité
- Ajout de nouvelles fonctionnalités sans toucher à l'interface
- Possibilité d'ajouter d'autres interfaces (console, API, etc.)

## Pattern de communication

```
Interface Utilisateur (Controller)
           ↓ (appels de méthodes)
    Service (Logique métier)
           ↓ (callbacks)
Interface Utilisateur (Mise à jour)
```

## Exemple d'utilisation

```java
// Dans un contrôleur
TimerService timerService = new TimerService();
timerService.setOnTimeUpdate(this::updateDisplay);
timerService.setOnStateChanged(this::updateButtons);

// L'interface se contente d'appeler les méthodes du service
@FXML
public void handleStartPause() {
    timerService.toggleTimer(); // Logique métier dans le service
}
```

## Migration depuis l'ancienne architecture

1. **Remplacer** `TimerController` par `TimerControllerRefactored`
2. **Remplacer** `TimersController` par `TimersControllerRefactored`
3. **Utiliser** les services pour toute logique métier
4. **Supprimer** la logique métier des contrôleurs

## Tests

Les services peuvent être testés indépendamment :

```java
@Test
public void testTimerService() {
    TimerService service = new TimerService(0, 1, 0);
    service.startTimer();
    assertTrue(service.isRunning());
}
```

## Prochaines étapes

1. Créer des services pour les autres modules (StudyDeck, etc.)
2. Ajouter des tests unitaires pour les services
3. Implémenter la persistance des données
4. Ajouter des validations métier dans les services 