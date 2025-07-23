# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Onyx is a JavaFX desktop application for study time management. Users can create customizable timers linked to specific subjects/courses to track study time against predefined goals.

## Technology Stack

- **Language**: Java 17
- **UI Framework**: OpenJFX (JavaFX) 23
- **Build Tool**: Apache Maven
- **UI Definition**: FXML files with CSS styling
- **Icons**: Kordamp Ikonli (Material Design 2, Font Awesome 5)
- **Data Storage**: JSON files using Jackson

## Common Development Commands

### Build and Run
```bash
# Clean and compile the project
mvn clean compile

# Run the application
mvn javafx:run

# Clean, compile and run in one command
mvn clean javafx:run
```

### Main Class
The application entry point is `com.onyx.app.OnyxApplication`

### Testing
No specific test framework is currently configured. Services are designed to be testable independently of JavaFX UI components.

## Architecture Overview

The project follows a **Model-View-Controller (MVC)** pattern enhanced with a **Service Layer** for clear separation of concerns:

### Core Packages Structure
```
src/main/java/com/onyx/app/
├── controller/          # Frontend - UI controllers
├── service/            # Backend - Business logic
├── model/              # Data models (POJOs)
├── repository/         # Data persistence layer
└── OnyxApplication.java # Main application class
```

### Key Services (Business Logic)

- **TimerService**: Manages individual timer logic, state management, countdown, and callbacks
- **TimersManagerService**: Manages collections of timers, creation/deletion, and global operations
- **TimeFormatService**: Utilities for time formatting and validation

### Key Controllers (UI Layer)

- **MainController**: Main navigation and view management, receives services via dependency injection
- **TimersController**: Manages multiple timer display and creation using overlay-based config dialogs
- **TimerController**: Controls individual timer cards (display, buttons, animations) - owns JavaFX Timeline and AudioClip
- **TimerConfigDialogController**: Handles timer configuration dialog
- **StudyDeckController**: Manages study subjects and integrates study session mini-timers
- **StudyMiniTimerController**: Widget-based timer (not popup) for study sessions with animations
- **CourseCardController**: Individual course/subject display cards with quick timer functionality

### Data Models

- **TimerModel**: Timer state (time remaining, initial duration, type, linked subject)
- **Subject**: Study subject/course with target time and time spent
- **StudyDeck**: Container for user's subjects
- **TimerConfigResult**: DTO for timer configuration

### Repository Pattern

- **JsonTimerRepository**: Persists timer data to JSON files
- **JsonSubjectRepository**: Persists subject data to JSON files
- Uses Jackson for JSON serialization/deserialization

## Key Architectural Patterns

### Service-Controller Communication
Controllers delegate all business logic to services and use callbacks for UI updates:

```java
// Controllers call service methods
timerService.toggleTimer();

// Services notify controllers via callbacks
timerService.setOnStateChanged(this::updateDisplay);
```

### Dependency Injection
The main application class (`OnyxApplication`) initializes services and injects them into controllers via a controller factory.

### Timer Lifecycle
1. User interaction triggers controller method
2. Controller calls appropriate service method
3. Service updates business logic and model
4. Service executes callback to notify controller
5. Controller updates UI display

## Critical Architecture Patterns

### UI Responsibility Separation
- **Controllers**: Handle JavaFX-specific concerns (Timeline, AudioClip, animations, FXML event handlers)
- **Services**: Pure business logic, completely independent of JavaFX, communicate via callbacks
- **Timeline Management**: Each TimerController owns its JavaFX Timeline that calls `timerService.decrement()` every second

### Service-Controller Communication Pattern
```java
// Services notify controllers via callbacks - never the reverse
timerService.setOnStateChanged(this::updateDisplay);
timerService.setOnTimerFinished(this::handleTimerFinished);
```

### Dependency Injection via Controller Factory
`OnyxApplication` creates services and injects them via `fxmlLoader.setControllerFactory()`. Services are passed down through constructor parameters, not created by controllers.

### Two Distinct Timer Implementations
1. **Timer Cards**: Traditional timer cards in TimersController with popup-like config dialogs (overlay-based)
2. **Study Mini-Timers**: Widget-based embedded timers in StudyDeckController (NOT popup windows)

### No Actual Popup Windows
Despite comments mentioning "popup flottant", the application uses embedded widgets and overlays within the main window, not separate Stage/Window instances.

## Subject Linking Feature

The core functionality allows timers to be linked to study subjects:
- When a timer finishes, the elapsed time is automatically added to the linked subject's `timeSpent`
- Users can track progress toward study goals for each subject
- Configuration happens through the timer config dialog
- Study session timers automatically link to subjects when started from CourseCard

## Resource Structure

### FXML Views
Located in `src/main/resources/com/onyx/app/view/`:
- `Main-view.fxml`: Main application window with navigation
- `TimersController-view.fxml`: Timer management with overlay configuration
- `Timer-card-view.fxml`: Individual timer card template
- `Timer-config-dialog-view.fxml`: Timer configuration overlay
- `StudyDeck-view.fxml`: Study subjects management
- `StudyMiniTimer-view.fxml`: Study session widget timer
- `Course-card.fxml`: Individual course/subject cards

### CSS Styles
Located in `src/main/resources/com/onyx/app/styles/`:
- Component-specific stylesheets for each view
- Consistent theming across the application

### Assets
- Icons: Various timer icon sizes in `src/main/resources/images/`
- Sounds: Timer completion sound in `src/main/resources/sounds/`

## Data Persistence

The application uses JSON files for data persistence:
- Timer configurations and states are automatically saved/loaded via JsonTimerRepository
- Subject data and study progress are persisted via JsonSubjectRepository  
- Repository pattern abstracts storage implementation using Jackson for JSON serialization
- Repositories are injected into services, services are injected into controllers

## Constants and Configuration

Key constants are defined in `Constants.java`:
- Timer limits and defaults
- UI dimensions (main window: 1000x700)
- Update intervals (1 second timer updates)
- Time format patterns

## Important Implementation Notes

### JavaFX Threading
- All JavaFX UI updates must happen on JavaFX Application Thread
- Services use `Platform.runLater()` for callback execution
- Timeline animations are owned by controllers, not services

### Study Session Workflow
1. User interacts with CourseCard (quick timer button or start with duration)
2. StudyDeckController creates TimerService and loads StudyMiniTimer-view.fxml
3. Widget appears embedded in StudyDeck (not popup) with animations
4. Timer completion automatically adds time to linked Subject
5. Widget auto-closes after completion animation

### Timer vs Study Session Distinction
- **Timers**: General-purpose, created in TimersController, can be linked to subjects optionally
- **Study Sessions**: Subject-specific, always linked, created from course cards, use embedded widgets