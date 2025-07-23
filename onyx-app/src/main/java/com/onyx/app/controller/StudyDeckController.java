package com.onyx.app.controller;

import java.io.IOException;
import java.time.Duration;
import com.onyx.app.model.StudyDeck;
import com.onyx.app.model.Subject;
import com.onyx.app.model.TimerModel;
import com.onyx.app.service.TimerService;
import javafx.application.Platform;
import javafx.beans.binding.Bindings;
import javafx.beans.property.BooleanProperty;
import javafx.beans.property.SimpleBooleanProperty;
import javafx.fxml.FXML;
import javafx.fxml.FXMLLoader;
import javafx.scene.control.Button;
import javafx.scene.control.TextField;
import javafx.scene.control.TextFormatter;
import javafx.scene.layout.StackPane;
import javafx.scene.layout.VBox;
import javafx.geometry.Pos;

import com.onyx.app.repository.SubjectRepository;

public class StudyDeckController {

    @FXML private VBox coursesList;
    @FXML private VBox addCoursePane;
    @FXML private Button addCourseButton;
    @FXML private Button validateButton;
    @FXML private TextField courseNameField;
    @FXML private TextField courseDurationField;
    @FXML private TextField defaultTimerDurationField;
    @FXML private VBox miniTimerContainer;

    private final StudyDeck studyDeck = new StudyDeck();
    private final BooleanProperty formVisible = new SimpleBooleanProperty(false);
    private final SubjectRepository subjectRepository;
    
    // Mini-timer management
    private StudyMiniTimerController currentMiniTimer;

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
        // Fermer le mini-timer actuel s'il existe
        if (currentMiniTimer != null) {
            closeMiniTimer();
        }

        try {
            // Charger le FXML du mini-timer pour Study
            FXMLLoader loader = new FXMLLoader(getClass().getResource("/com/onyx/app/view/StudyMiniTimer-view.fxml"));
            VBox miniTimerView = loader.load();
            
            // Obtenir le contrôleur
            currentMiniTimer = loader.getController();
            
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
            
            // Configurer le mini-timer
            currentMiniTimer.setupTimer(timerService, subject, timerDuration);
            
            // Configurer les callbacks
            currentMiniTimer.setOnTimerFinished(this::handleMiniTimerFinished);
            currentMiniTimer.setOnClose(this::handleMiniTimerClosed);
            
            // Afficher le mini-timer
            miniTimerContainer.getChildren().clear();
            miniTimerContainer.getChildren().add(miniTimerView);
            
            // Configurer les propriétés d'interaction pour un widget non-bloquant
            miniTimerContainer.setVisible(true);
            miniTimerContainer.setManaged(false); // Ne pas affecter le layout du parent
            miniTimerContainer.setMouseTransparent(false); // Permettre les interactions avec le widget
            miniTimerContainer.setPickOnBounds(false); // CRUCIAL: Ne pas capturer les clics en dehors du contenu visible
            
            // Configurer le widget pour qu'il soit interactif mais non-bloquant
            miniTimerView.setMouseTransparent(false); // Le widget lui-même doit être cliquable
            miniTimerView.setPickOnBounds(true); // Mais seulement sur son contenu visible
            
            // S'assurer que le widget ne prend pas le focus automatiquement
            miniTimerView.setFocusTraversable(false);
            
            // Empêcher le container de capturer le focus aussi
            miniTimerContainer.setFocusTraversable(false);
            
            // Ajouter un effet de transparence au container pour qu'il soit moins intrusif
            miniTimerContainer.setOpacity(0.95);
            
            // S'assurer que le focus reste sur l'élément actuel (ne pas voler le focus)
            Platform.runLater(() -> {
                // Permettre au système de terminer le layout avant de démarrer
                timerService.startTimer();
            });
            
        } catch (IOException e) {
            e.printStackTrace();
            System.err.println("Erreur lors du chargement du mini-timer: " + e.getMessage());
        }
    }

    /**
     * Ferme le mini-timer actuel
     */
    private void closeMiniTimer() {
        if (currentMiniTimer != null) {
            // Arrêter le timer s'il est en cours
            TimerService timerService = currentMiniTimer.getTimerService();
            if (timerService != null && timerService.isRunning()) {
                timerService.stopTimer();
            }
            
            // Cacher le conteneur
            miniTimerContainer.setVisible(false);
            miniTimerContainer.setManaged(false);
            miniTimerContainer.getChildren().clear();
            
            currentMiniTimer = null;
        }
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
        closeMiniTimer();
    }

    /**
     * Rafraîchit l'affichage de toutes les cartes de cours
     */
    private void refreshCourseCards() {
        // Recharger toutes les cartes pour mettre à jour les temps
        loadCourses();
    }

    /**
     * Vérifie s'il y a un mini-timer actif
     */
    public boolean hasMiniTimerActive() {
        return currentMiniTimer != null;
    }

    /**
     * Obtient le mini-timer actuel (peut être null)
     */
    public StudyMiniTimerController getCurrentMiniTimer() {
        return currentMiniTimer;
    }
}