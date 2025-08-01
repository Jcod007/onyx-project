# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Onyx WebView is a modern study timer application that combines Java backend services with a web-based frontend using JavaFX WebView. It's a refactored version of the original JavaFX FXML-based Onyx application, offering a more modern and flexible UI while maintaining robust Java business logic.

## Technology Stack

- **Backend**: Java 17 with JavaFX 23
- **Frontend**: HTML5, CSS3, JavaScript ES6+
- **Communication**: JavaFX WebView Bridge
- **Web Server**: Embedded Jetty server
- **Build Tool**: Apache Maven
- **Data Storage**: JSON files using Jackson
- **UI Components**: Modern web components with CSS animations

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
The application entry point is `com.onyx.webview.OnyxWebViewApplication`

### Web Server
- Embedded Jetty server serves web resources on `localhost:8082`
- WebView loads `http://localhost:8082/` to display the web interface
- Web resources located in `src/main/resources/webapp/`

## Architecture Overview

The project follows a **Hybrid Architecture** combining:
- **Java Backend**: Business logic, data persistence, timer services
- **Web Frontend**: Modern UI using HTML/CSS/JS
- **Bridge Communication**: Bidirectional Java ↔ JavaScript communication

### Core Packages Structure
```
src/main/java/com/onyx/webview/
├── OnyxWebViewApplication.java  # Main JavaFX application
├── WebViewBridge.java           # Java ↔ JavaScript bridge
├── BackendService.java          # Backend service facade
├── model/                       # Data models (POJOs)
├── repository/                  # Data persistence layer
├── service/                     # Business logic services
└── Constants.java               # Application constants

src/main/resources/webapp/
├── index.html                   # Main UI entry point
├── css/                         # Stylesheets
├── js/                          # JavaScript modules
└── sounds/                      # Audio resources
```

### Key Backend Components

- **OnyxWebViewApplication**: Main JavaFX application, starts embedded Jetty server and WebView
- **WebViewBridge**: Handles bidirectional communication between Java and JavaScript
- **BackendService**: Facade providing unified access to timer and subject services
- **TimerService**: Manages individual timer logic and state
- **TimersManagerService**: Manages collections of timers and global operations
- **TimeFormatService**: Utilities for time formatting and validation

### Key Frontend Components

- **index.html**: Main application layout with navigation and views
- **app.js**: Main application controller and view management
- **timers.js**: Timer management and UI interactions
- **modern-timer-cards.js**: Modern timer card components with animations
- **bridge.js**: JavaScript side of Java ↔ JS communication
- **subjects.js**: Subject/course management
- **charts.js**: Statistics and chart visualization

### Data Models

- **TimerModel**: Timer state (time remaining, initial duration, type, linked subject)
- **Subject**: Study subject/course with target time and time spent
- **StudyDeck**: Container for user's subjects (shared with onyx-app)
- **TimerConfigResult**: DTO for timer configuration

## Java ↔ JavaScript Communication

### Bridge Pattern
The application uses JavaFX WebView bridge for communication:

#### From JavaScript to Java
```javascript
// Create a timer
window.javabridge.createTimer(JSON.stringify({
    name: "Session Maths",
    initialTime: 1500000,
    linkedSubjectId: "math-001"
}));

// Control timers
window.javabridge.startTimer("timer-id");
window.javabridge.pauseTimer("timer-id");
window.javabridge.stopTimer("timer-id");
```

#### From Java to JavaScript
```java
// Notify JavaScript of events
webEngine.executeScript("window.onTimerCreated('" + timerJson + "')");
webEngine.executeScript("window.onTimerStarted('" + timerId + "')");
```

### Bridge Methods
**Java Bridge Methods** (in WebViewBridge.java):
- `createTimer(String timerDataJson)`
- `startTimer(String timerId)`
- `pauseTimer(String timerId)`
- `stopTimer(String timerId)`
- `getTimers()`
- `getSubjects()`
- `createSubject(String subjectDataJson)`

**JavaScript Callbacks** (expected in frontend):
- `window.onTimerCreated(timerJson)`
- `window.onTimerStarted(timerId)`
- `window.onTimerPaused(timerId)`
- `window.onTimerStopped(timerId)`
- `window.onTimersLoaded(timersJson)`
- `window.onSubjectsLoaded(subjectsJson)`
- `window.onError(errorMessage)`

## Key Features

### Modern Timer Cards
- **Visual States**: Idle, Running, Paused, Finished with color-coded borders
- **Progress Ring**: Circular progress indicator with smooth animations
- **Interactive Controls**: Play/Pause/Reset with hover actions
- **Quick Presets**: 5min, 15min, 25min, 45min, 1h durations
- **Subject Linking**: Optional connection to study subjects

### Study Subject Management
- **Goal Tracking**: Set target hours and track progress
- **Visual Progress**: Progress bars and percentage completion
- **Time Integration**: Automatic time addition from completed timers
- **Quick Sessions**: Start study sessions directly from subject cards

### Multi-View Interface
- **Dashboard**: Overview with today's courses and statistics
- **Calendar**: Weekly calendar view for planning
- **Timers**: Modern timer cards with creation and management
- **Subjects**: Subject/course management with progress tracking
- **Statistics**: Charts and analytics for study patterns

## Data Persistence

### Repository Pattern
- **JsonTimerRepository**: Persists timer data to JSON files
- **JsonSubjectRepository**: Persists subject data to JSON files
- **Jackson Integration**: JSON serialization/deserialization with JavaTimeModule
- **Cross-Project Compatibility**: Shares data models with onyx-app project

### Storage Location
- JSON files stored in user's data directory
- Automatic creation of default subjects on first run
- Repositories injected into services via dependency injection

## Development Patterns

### Frontend Development
- **Modern CSS**: CSS Grid, Flexbox, CSS Variables for theming
- **Vanilla JavaScript**: No external dependencies, ES6+ features
- **Module Organization**: Separate JS files for different concerns
- **Responsive Design**: Mobile-friendly with CSS media queries

### Bridge Communication Pattern
```javascript
// Always wrap bridge calls with error handling
try {
    if (window.javabridge) {
        window.javabridge.createTimer(timerData);
    } else {
        console.warn('Java bridge not available - using mock data');
        // Fallback to local development mode
    }
} catch (error) {
    console.error('Bridge communication error:', error);
}
```

### Service Initialization
```java
// Backend services are initialized in BackendService constructor
private final TimersManagerService timersManager;
private final SubjectRepository subjectRepository;

public BackendService() {
    this.timerRepository = new JsonTimerRepository();
    this.subjectRepository = new JsonSubjectRepository();
    this.timersManager = new TimersManagerService(timerRepository, subjectRepository);
    initializeDefaultData(); // Create default subjects if none exist
}
```

## CSS Architecture

### Styling Organization
- **styles.css**: Global styles, layout, navigation
- **components.css**: Reusable UI components (buttons, forms, modals)
- **animations.css**: CSS animations and transitions
- **timer-cards-modern.css**: Modern timer card specific styles
- **timer-components.css**: Additional timer component styles

### Design System
- **Color Palette**: Turquoise ONYX (#00D4AA), dark surfaces, subtle gradients
- **Typography**: System fonts with monospace for timers
- **Spacing**: Consistent spacing using CSS custom properties
- **Animations**: Smooth micro-interactions and state transitions

## Important Implementation Notes

### JavaFX Threading
- All JavaFX UI updates must happen on JavaFX Application Thread
- Bridge methods use `Platform.runLater()` for thread-safe execution
- WebEngine script execution is asynchronous

### Error Handling
- Bridge methods include try-catch blocks with JavaScript error callbacks
- WebEngine load worker state monitoring for connection issues
- Graceful fallback to development mode when bridge unavailable

### Development Mode
- JavaScript detects bridge availability and falls back to mock data
- Console logging for debugging bridge communication
- Local storage for frontend-only development testing

## Cross-Project Relationships

### Shared with onyx-app
- **Data Models**: TimerModel, Subject, StudyDeck classes
- **Repository Interfaces**: SubjectRepository, TimerRepository
- **Service Logic**: TimeFormatService, TimerService core logic
- **JSON Storage**: Compatible data format for seamless migration

### Migration Benefits
- **Modern UI**: Web-based interface with better UX than FXML
- **Easier Maintenance**: HTML/CSS/JS easier to modify than FXML
- **Performance**: WebView provides good performance for desktop apps
- **Flexibility**: Easy to add new features and animations

## Constants and Configuration

Key constants defined in `Constants.java`:
- **Application**: Window dimensions (1200x800), application title
- **Server**: Web server port (8082)
- **Timer**: Default durations, update intervals
- **UI**: Animation durations, color schemes

## Testing and Development

### Local Development
- Web resources served from `src/main/resources/webapp/`
- Hot reload by refreshing WebView (Ctrl+R in running application)
- Browser developer tools available in WebView for debugging
- Console logging for bridge communication debugging

### No Automated Tests
- Services designed to be testable independently
- Manual testing through UI interactions
- Bridge communication can be tested via browser console

## Best Practices

### Frontend Development
- Use semantic HTML and ARIA labels for accessibility
- Implement CSS transitions for smooth user experience
- Handle bridge unavailability gracefully
- Maintain responsive design principles

### Backend Development
- Keep business logic in services, not in bridge methods
- Use proper exception handling with user-friendly error messages
- Maintain JSON data format compatibility
- Follow repository pattern for data access

### Bridge Communication
- Always stringify complex objects before sending to Java
- Handle asynchronous responses with callbacks
- Implement error handling on both sides
- Use meaningful method and callback names