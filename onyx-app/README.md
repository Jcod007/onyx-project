# Onyx Application - README

## 1. Vue d'ensemble

Onyx est une application de bureau conçue pour aider les utilisateurs à gérer leur temps d'étude de manière efficace. Elle permet de créer des minuteurs (timers) personnalisables qui peuvent être liés à des "Sujets" (ou cours) spécifiques. L'objectif principal est de suivre le temps passé sur chaque sujet afin d'atteindre des objectifs d'étude prédéfinis.

L'application est développée en Java et utilise le framework JavaFX pour son interface graphique.

## 2. Technologies et Environnement

- **Langage** : Java 11
- **Framework UI** : OpenJFX (JavaFX) 23
- **Gestion de projet et dépendances** : Apache Maven
- **Interfaces graphiques** : FXML pour la structure, CSS pour le style
- **Icônes** : [Kordamp Ikonli](https://kordamp.org/ikonli/) (Material Design 2, Font Awesome 5)

## 3. Comment lancer l'application

Assurez-vous d'avoir **Java 11 (ou supérieur)** et **Apache Maven** installés et configurés sur votre système.

1.  **Compiler le projet** :
    Ouvrez un terminal à la racine du projet et exécutez la commande suivante pour télécharger les dépendances et compiler le code source.
    ```sh
    mvn clean compile
    ```

2.  **Lancer l'application** :
    Après une compilation réussie, utilisez la commande du plugin JavaFX pour démarrer l'application.
    ```sh
    mvn javafx:run
    ```

## 4. Architecture du Projet

Le projet suit une architecture **Modèle-Vue-Contrôleur (MVC)** améliorée par une **couche de Service**. Cette séparation stricte des responsabilités rend le code modulaire, testable et facile à maintenir.

### 4.1. Couche Modèle (`src/main/java/com/onyx/app/model`)

Cette couche représente les objets de données de l'application. Les classes du modèle sont pures (POJOs) et ne contiennent aucune logique métier ou de présentation.

-   `Subject.java` : Représente un cours ou un sujet d'étude. Il contient un nom, un temps d'étude cible (`targetTime`), et le temps déjà passé (`timeSpent`).
-   `StudyDeck.java` : Agit comme un conteneur ou un référentiel pour une liste d'objets `Subject`. Il représente l'ensemble des cours créés par l'utilisateur.
-   `TimerModel.java` : Contient l'état d'un seul timer : temps restant, temps initial, type de timer, et surtout, une référence vers le `Subject` auquel il peut être lié (`linkedSubject`).
-   `TimerConfigResult.java` : Un objet de transfert de données (DTO) utilisé pour passer la configuration d'un timer depuis la boîte de dialogue de configuration vers les contrôleurs.

### 4.2. Couche Vue (`src/main/resources/com/onyx/app/view`)

La vue est définie par des fichiers FXML et stylisée par des fichiers CSS.

-   **FXML** (`.fxml`) : Définit la structure hiérarchique des composants de l'interface (fenêtres, boutons, labels).
    -   `Main-view.fxml` : La fenêtre principale de l'application.
    -   `TimersController-view.fxml` : La vue qui contient la liste des cartes de timers.
    -   `Timer-card-view.fxml` : Le template pour une seule carte de timer.
    -   `Timer-config-dialog-view.fxml` : La boîte de dialogue pour créer ou modifier un timer.
-   **CSS** (`.css`) : Définit l'apparence (couleurs, polices, espacements) des éléments définis dans le FXML.

### 4.3. Couche Contrôleur (`src/main/java/com/onyx/app/controller`)

Les contrôleurs agissent comme un pont entre la Vue (FXML) et la couche de Service. Ils gèrent les interactions de l'utilisateur, mettent à jour la vue avec les données du modèle et délèguent toute la logique métier aux services.

-   `MainController.java` : Gère la navigation principale de l'application (ex: changer de vue entre le tableau de bord et les timers).
-   `TimersController.java` : Gère l'affichage de plusieurs timers. Il interagit avec le `TimersManagerService` pour créer, supprimer ou modifier des timers.
-   `TimerController.java` : Contrôle une seule carte de timer (`Timer-card-view.fxml`). Il est responsable de la mise à jour de l'affichage du temps, des boutons (Démarrer/Pause/Reset) et du nom du cours lié. **C'est lui qui gère l'animation (`Timeline`) et le son (`AudioClip`)**, qui sont des préoccupations de l'interface utilisateur.
-   `TimerConfigDialogController.java` : Gère la logique de la boîte de dialogue de configuration.

### 4.4. Couche Service (`src/main/java/com/onyx/app/service`)

C'est le cerveau de l'application. Cette couche contient toute la logique métier et est **totalement indépendante de l'interface utilisateur (JavaFX)**. Cela signifie qu'elle pourrait être réutilisée dans une application web ou mobile.

-   `TimerService.java` : Contient la logique pour un seul timer. Il gère son état (en cours, en pause, terminé), le décompte du temps, et exécute des actions à la fin du timer. Il utilise un système de callbacks (`Runnable`) pour notifier le contrôleur des changements d'état.
-   `TimersManagerService.java` : Gère une collection de `TimerService`. Il permet de créer, supprimer et contrôler plusieurs timers de manière centralisée.

## 5. Fonctionnement Détaillé et Flux de Données

### 5.1. Cycle de vie d'un Timer

1.  **Interaction UI** : L'utilisateur clique sur le bouton "Démarrer" d'une carte de timer.
2.  **Contrôleur UI** : `TimerController.handleStartPause()` est appelé.
3.  **Logique de Contrôle** : Le `TimerController` appelle `timerService.toggleTimer()` pour changer l'état logique du timer (ex: `isRunning = true`). Simultanément, il démarre sa propre `Timeline` JavaFX.
4.  **Animation** : À chaque seconde, la `Timeline` du `TimerController` se déclenche et appelle `timerService.decrement()`.
5.  **Logique Métier** : Le `TimerService` décrémente le temps dans son `TimerModel`.
6.  **Notification** : Après la décrémentation, `TimerService` appelle `notifyStateChanged()`, ce qui exécute le callback `onStateChanged`.
7.  **Mise à jour UI** : Ce callback, défini dans `TimerController`, pointe vers la méthode `updateDisplay()`. Cette méthode met à jour le label du temps, l'état des boutons et le nom du cours lié, assurant une synchronisation parfaite entre le modèle et la vue.

### 5.2. Liaison d'un Timer à un Sujet

C'est la fonctionnalité clé de l'application.

1.  **Configuration** : L'utilisateur ouvre la boîte de dialogue de configuration. Le `TimerConfigDialogController` reçoit l'objet `StudyDeck` (contenant tous les `Subject`) et l'utilise pour peupler un `ComboBox`.
2.  **Sélection** : L'utilisateur sélectionne un `Subject` dans la liste et valide.
3.  **Création** : Le `TimersController` reçoit un `TimerConfigResult` contenant le `Subject` sélectionné. Il demande alors au `TimersManagerService` de créer un nouveau `TimerService` en lui passant ce `Subject`.
4.  **Stockage** : Le `TimerService` stocke le `Subject` dans son `TimerModel` (`linkedSubject`).
5.  **Fin du Timer** : Lorsque le timer atteint zéro, la méthode `handleTimerFinished()` dans `TimerService` est appelée.
6.  **Mise à jour du Sujet** : Cette méthode vérifie si `timerModel.getLinkedSubject()` n'est pas nul.
    -   Si un `Subject` est lié, elle récupère la durée initiale du timer (`timerModel.getInitialDuration()`).
    -   Elle appelle ensuite la méthode `linkedSubject.addTimeSpent(duration)` pour ajouter le temps de la session au temps total passé sur le sujet.
7.  **Persistance implicite** : La mise à jour est faite sur l'objet `Subject` qui est stocké dans le `StudyDeck`. L'état de l'application est donc cohérent. La vue qui affiche les détails du `Subject` doit ensuite être rafraîchie pour montrer le nouveau temps passé.
