package com.onyx.app.controller;

import java.io.IOException;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

import com.onyx.app.model.StudyDeck;
import com.onyx.app.model.Subject;
import com.onyx.app.model.TimerModel;
import com.onyx.app.repository.SubjectRepository;
import com.onyx.app.service.TimerService;

import javafx.application.Platform;
import javafx.beans.binding.Bindings;
import javafx.beans.property.BooleanProperty;
import javafx.beans.property.SimpleBooleanProperty;
import javafx.fxml.FXML;
import javafx.fxml.FXMLLoader;
import javafx.scene.control.Button;
import javafx.scene.control.ScrollPane;
import javafx.scene.control.TextField;
import javafx.scene.control.TextFormatter;
import javafx.scene.layout.VBox;

public class StudyDeckController {

    // Constantes pour la configuration des timers
    private static final double TIMER_STACK_MARGIN = 20.0;
    private static final double TIMER_STACK_MAX_HEIGHT = 400.0;
    private static final double TIMER_STACK_OPACITY = 0.95;

    @FXML private VBox coursesList;
    @FXML private VBox addCoursePane;
    @FXML private Button addCourseButton;
    @FXML private Button validateButton;
    @FXML private TextField courseNameField;
    @FXML private TextField courseDurationField;
    @FXML private TextField defaultTimerDurationField;
    @FXML private ScrollPane timerScrollPane;
    @FXML private VBox timerStackContainer;

    private final StudyDeck studyDeck = new StudyDeck();
    private final BooleanProperty formVisible = new SimpleBooleanProperty(false);
    private final SubjectRepository subjectRepository;
    
    // Multi-timer management
    private List<StudyMiniTimerController> activeTimers = new ArrayList<>();

    public StudyDeckController(SubjectRepository subjectRepository) {
        this.subjectRepository = subjectRepository;
    }

    @FXML
    public void initialize() {
        loadCourses();
        configureFormVisibility();
        setupFormValidation();
        setupInitialState();
        setupDurationField();
    }

    private void loadCourses() {
        coursesList.getChildren().clear();
        subjectRepository.findAll().forEach(subject -> {
            try {
                VBox card = createCourseCard(subject);
                coursesList.getChildren().add(card);
            } catch (IOException e) {
                e.printStackTrace();
            }
        });
        // Add the addCoursePane and addCourseButton back after loading existing courses
        coursesList.getChildren().addAll(addCoursePane, addCourseButton);
    }

    private void setupDurationField() {
        TextFormatter<String> durationFormatter = new TextFormatter<>(change -> {
            String newText = change.getControlNewText();
            if (newText.matches("\\d{0,2}h?\\d{0,2}")) { // Format "90" ou "1h30"
                return change;
            }
            return null;
        });
        courseDurationField.setTextFormatter(durationFormatter);
        courseDurationField.setPromptText("Ex: 90 ou 1h30");
        
        // Appliquer le même formateur au champ de durée par défaut du timer
        TextFormatter<String> timerDurationFormatter = new TextFormatter<>(change -> {
            String newText = change.getControlNewText();
            if (newText.matches("\\d{0,2}h?\\d{0,2}")) { // Format "90" ou "1h30"
                return change;
            }
            return null;
        });
        defaultTimerDurationField.setTextFormatter(timerDurationFormatter);
        defaultTimerDurationField.setPromptText("Ex: 25 ou 1h30");
    }

    private void configureFormVisibility() {
        addCoursePane.visibleProperty().bind(formVisible);
        addCoursePane.managedProperty().bind(formVisible);
        addCourseButton.visibleProperty().bind(formVisible.not());
        addCourseButton.managedProperty().bind(formVisible.not());
    }

    private void setupFormValidation() {
        validateButton.disableProperty().bind(Bindings.createBooleanBinding(
            () -> courseNameField.getText().trim().isEmpty() || 
                  courseDurationField.getText().trim().isEmpty() ||
                  defaultTimerDurationField.getText().trim().isEmpty(),
            courseNameField.textProperty(), courseDurationField.textProperty(), defaultTimerDurationField.textProperty()
        ));
    }

    private void setupInitialState() {
        formVisible.set(false);
    }

    @FXML
    private void handleAddCourse() {
        formVisible.set(true);
        courseNameField.requestFocus();
    }

    @FXML
    private void handleCancelAddCourse() {
        resetForm();
        formVisible.set(false);
    }

    @FXML
    private void handleValidateButton() {
        String name = courseNameField.getText().trim();
        String durationText = courseDurationField.getText().trim();
        String defaultTimerText = defaultTimerDurationField.getText().trim();

        if (!name.isEmpty() && !durationText.isEmpty() && !defaultTimerText.isEmpty()) {
            try {
                Duration targetDuration = parseDuration(durationText);
                Duration defaultTimerDuration = parseDuration(defaultTimerText);
                Subject newSubject = new Subject(name, targetDuration, defaultTimerDuration);
                subjectRepository.save(newSubject); // Save the new subject
                VBox card = createCourseCard(newSubject);
                addCourseCardToUI(card);
                resetForm();
                formVisible.set(false);
            } catch (IllegalArgumentException | IOException e) {
            	e.printStackTrace();
                courseDurationField.setStyle("-fx-border-color: red;");
                defaultTimerDurationField.setStyle("-fx-border-color: red;");
            }
        }
    }

    private Duration parseDuration(String durationText) {
        if (durationText.contains("h")) {
            String[] parts = durationText.split("h");
            int hours = parts[0].isEmpty() ? 0 : Integer.parseInt(parts[0]);
            int minutes = parts.length > 1 && !parts[1].isEmpty() ? Integer.parseInt(parts[1]) : 0;
            return Duration.ofHours(hours).plusMinutes(minutes);
        }
        return Duration.ofMinutes(Integer.parseInt(durationText));
    }

    private VBox createCourseCard(Subject subject) throws IOException {
        FXMLLoader loader = new FXMLLoader(getClass().getResource("/com/onyx/app/view/Course-card.fxml"));
        VBox card = loader.load();
        
        CourseCardController controller = loader.getController();
        controller.initData(subject, this); // Pass this controller for deletion
        
        return card;
    }

    private void addCourseCardToUI(VBox card) {
        // Find the position of the addCoursePane
        int formIndex = coursesList.getChildren().indexOf(addCoursePane);
        if (formIndex >= 0) {
            coursesList.getChildren().add(formIndex, card); // Add before the form
        } else {
            coursesList.getChildren().add(card); // Fallback: add to the end
        }
    }

    public void deleteCourse(Subject subject, VBox card) {
        subjectRepository.deleteById(subject.getId());
        coursesList.getChildren().remove(card);
    }

    private void resetForm() {
        courseNameField.clear();
        courseDurationField.clear();
        defaultTimerDurationField.clear();
        courseDurationField.setStyle("");
        defaultTimerDurationField.setStyle("");
    }


    /**
     * Démarre un mini-timer pour un sujet donné avec sa durée par défaut
     */
    public void startMiniTimer(Subject subject) {
        Duration timerDuration = subject.getDefaultTimerDuration();
        if (timerDuration == null || timerDuration.isZero()) {
            // Fallback : utiliser 25 minutes par défaut si aucune durée n'est configurée
            timerDuration = Duration.ofMinutes(25);
        }
        startMiniTimerWithDuration(subject, timerDuration);
    }
    
    /**
     * Démarre un mini-timer pour un sujet donné avec une durée spécifique
     */
    public void startMiniTimerWithDuration(Subject subject, Duration timerDuration) {
        try {
            // Charger le FXML du mini-timer pour Study
            FXMLLoader loader = new FXMLLoader(getClass().getResource("/com/onyx/app/view/StudyMiniTimer-view.fxml"));
            VBox miniTimerView = loader.load();
            
            // Obtenir le contrôleur
            StudyMiniTimerController newMiniTimer = loader.getController();
            
            // Créer un TimerService pour ce mini-timer
            TimerService timerService = new TimerService(subjectRepository);
            TimerModel timerModel = new TimerModel(
                (byte) timerDuration.toHours(),
                (byte) timerDuration.toMinutesPart(),
                (byte) timerDuration.toSecondsPart(),
                TimerModel.TimerType.STUDY_SESSION,
                subject
            );
            timerService.setTimerModel(timerModel);
            
            // Configurer le mini-timer et ses callbacks
            setupMiniTimer(newMiniTimer, timerService, subject, timerDuration);
            
            // Ajouter le timer à la pile et à la liste active
            addTimerToStack(newMiniTimer, miniTimerView);
            
            // Démarrer le timer après configuration complète
            Platform.runLater(timerService::startTimer);
            
        } catch (IOException e) {
            e.printStackTrace();
            System.err.println("Erreur lors du chargement du mini-timer: " + e.getMessage());
        }
    }

    /**
     * Configure un mini-timer avec le service et les callbacks
     */
    private void setupMiniTimer(StudyMiniTimerController miniTimer, TimerService timerService, 
                               Subject subject, Duration timerDuration) {
        miniTimer.setupTimer(timerService, subject, timerDuration);
        miniTimer.setOnTimerFinished(this::handleMiniTimerFinished);
        miniTimer.setOnClose(this::handleMiniTimerClosed);
    }
    
    /**
     * Ajoute un timer à la pile et configure ses propriétés d'interaction
     */
    private void addTimerToStack(StudyMiniTimerController miniTimer, VBox miniTimerView) {
        // Configurer les propriétés d'interaction du widget
        configureTimerViewInteraction(miniTimerView);
        
        // Ajouter aux collections
        activeTimers.add(miniTimer);
        timerStackContainer.getChildren().add(miniTimerView);
        
        // Mettre à jour l'affichage
        updateTimerStackVisibility();
    }
    
    /**
     * Configure les propriétés d'interaction d'un widget timer
     */
    private void configureTimerViewInteraction(VBox timerView) {
        timerView.setMouseTransparent(false);
        timerView.setPickOnBounds(true);
        timerView.setFocusTraversable(false);
    }

    /**
     * Met à jour la visibilité et le positionnement du conteneur de pile de timers
     */
    private void updateTimerStackVisibility() {
        if (activeTimers.isEmpty()) {
            hideTimerStack();
        } else {
            showTimerStack();
        }
    }
    
    /**
     * Affiche le conteneur de timers et le positionne en bas à gauche
     */
    private void showTimerStack() {
        timerScrollPane.setVisible(true);
        configureScrollPaneProperties();
        positionTimerStack();
    }
    
    /**
     * Masque le conteneur de timers
     */
    private void hideTimerStack() {
        timerScrollPane.setVisible(false);
    }
    
    /**
     * Configure les propriétés du ScrollPane
     */
    private void configureScrollPaneProperties() {
        timerScrollPane.setVisible(true);
        timerScrollPane.setMouseTransparent(false);
        timerScrollPane.setPickOnBounds(false);
        timerScrollPane.setFocusTraversable(false);
        timerScrollPane.setOpacity(TIMER_STACK_OPACITY);
    }
    
    /**
     * Calcule et applique la position du conteneur de timers en bas à gauche
     */
    private void positionTimerStack() {
        // Le positionnement se fait maintenant via le FXML avec StackPane.alignment et margin
        // Pas de positionnement manuel nécessaire
    }
    
    /**
     * Supprime un timer spécifique de la pile
     */
    private void removeTimer(StudyMiniTimerController timerToRemove) {
        // Arrêter le timer s'il est en cours
        TimerService timerService = timerToRemove.getTimerService();
        if (timerService != null && timerService.isRunning()) {
            timerService.stopTimer();
        }
        
        // Retirer de la liste des timers actifs
        activeTimers.remove(timerToRemove);
        
        // Retirer l'interface du conteneur
        VBox timerView = timerToRemove.getContainer();
        if (timerView != null) {
            timerStackContainer.getChildren().remove(timerView);
        }
        
        // Mettre à jour la visibilité
        updateTimerStackVisibility();
    }

    /**
     * Gère la fin d'un mini-timer
     */
    private void handleMiniTimerFinished(StudyMiniTimerController miniTimer) {
        // Mettre à jour l'affichage du sujet concerné
        Subject subject = miniTimer.getLinkedSubject();
        if (subject != null) {
            // Sauvegarder les changements dans le repository
            subjectRepository.save(subject);
            
            // Rafraîchir l'affichage des cartes
            refreshCourseCards();
        }
    }

    /**
     * Gère la fermeture manuelle d'un mini-timer
     */
    private void handleMiniTimerClosed(StudyMiniTimerController miniTimer) {
        removeTimer(miniTimer);
    }

    /**
     * Rafraîchit l'affichage de toutes les cartes de cours
     */
    private void refreshCourseCards() {
        // Recharger toutes les cartes pour mettre à jour les temps
        loadCourses();
    }

    /**
     * Vérifie s'il y a des mini-timers actifs
     */
    public boolean hasMiniTimerActive() {
        return !activeTimers.isEmpty();
    }

    /**
     * Obtient la liste des mini-timers actifs
     */
    public List<StudyMiniTimerController> getActiveTimers() {
        return new ArrayList<>(activeTimers);
    }
    
    /**
     * Ferme tous les timers actifs
     */
    public void closeAllTimers() {
        // Créer une copie de la liste pour éviter ConcurrentModificationException
        List<StudyMiniTimerController> timersToClose = new ArrayList<>(activeTimers);
        for (StudyMiniTimerController timer : timersToClose) {
            removeTimer(timer);
        }
    }
}