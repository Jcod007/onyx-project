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

- **MainController**: Main navigation and view management
- **TimersController**: Manages multiple timer display and creation
- **TimerController**: Controls individual timer cards (display, buttons, animations)
- **TimerConfigDialogController**: Handles timer configuration dialog

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

## Subject Linking Feature

The core functionality allows timers to be linked to study subjects:
- When a timer finishes, the elapsed time is automatically added to the linked subject's `timeSpent`
- Users can track progress toward study goals for each subject
- Configuration happens through the timer config dialog

## Resource Structure

### FXML Views
Located in `src/main/resources/com/onyx/app/view/`:
- Main application window and timer management views
- Individual timer card templates
- Configuration dialogs

### CSS Styles
Located in `src/main/resources/com/onyx/app/styles/`:
- Component-specific stylesheets for each view
- Consistent theming across the application

### Assets
- Icons: Various timer icon sizes in `src/main/resources/images/`
- Sounds: Timer completion sound in `src/main/resources/sounds/`

## Testing Strategy

Services are designed to be testable independently of JavaFX UI components. The business logic is completely separated from UI concerns, making unit testing straightforward.

## Data Persistence

The application uses JSON files for data persistence:
- Timer configurations and states are automatically saved/loaded
- Subject data and study progress are persisted
- Repository pattern abstracts storage implementation