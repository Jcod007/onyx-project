package com.onyx.app.controller;

import java.time.Duration;
import java.util.Optional;

import com.onyx.app.model.Subject;
import com.onyx.app.model.Subject.Status;

import javafx.fxml.FXML;
import javafx.scene.control.Button;
import javafx.scene.control.Label;
import javafx.scene.control.TextInputDialog;
import javafx.scene.layout.HBox;
import javafx.scene.layout.Region;
import javafx.scene.layout.VBox;

public class CourseCardController {

	@FXML private Region headerSpacer;
    @FXML private VBox cardRoot;
    @FXML private Label courseNameLabel;
    @FXML private Label statusLabel;
    @FXML private Label objectiveLabel;
    @FXML private Label elapsedLabel;
    @FXML private HBox actions;
    @FXML private Button startButton;
    @FXML private Button quickTimerButton;
    @FXML private Button completeButton;
    @FXML private Button deleteButton;

    private Subject subject;
    private Runnable onStatusChanged;
    private StudyDeckController studyDeckController;

    public void initialize() {
    	HBox.setHgrow(headerSpacer, javafx.scene.layout.Priority.ALWAYS);
        // Set delete button graphic
        
    }

    public void initData(Subject subject, StudyDeckController studyDeckController) {
        this.subject = subject;
        this.studyDeckController = studyDeckController;
        updateUI();
    }

    private void updateUI() {
        courseNameLabel.setText(subject.getName());
        
        Status status = subject.getStatus();
        statusLabel.setText(status.toString());
        
        statusLabel.getStyleClass().removeAll(
            "status-not_started", 
            "status-in_progress", 
            "status-completed"
        );
        statusLabel.getStyleClass().add("status-" + status.name().toLowerCase());

        objectiveLabel.setText("Objectif par semaine: " + formatDuration(subject.getTargetTime()));
        elapsedLabel.setText("Passé: " + formatDuration(subject.getTimeSpent()));

        updateButtonsVisibility();
    }

    private String formatDuration(Duration duration) {
        byte hours = (byte)duration.toHours();
        byte minutes = (byte)duration.toMinutesPart();
        return String.format("%dh%02dm", hours, minutes);
    }

    private void updateButtonsVisibility() {
        switch(subject.getStatus()) {
            case NOT_STARTED:
                startButton.setVisible(true);
                completeButton.setVisible(false);
                break;
            case IN_PROGRESS:
                startButton.setVisible(false);
                completeButton.setVisible(true);
                break;
            case COMPLETED:
                startButton.setVisible(false);
                completeButton.setVisible(false);
                break;
        }
    }

    @FXML
    private void handleStart() {
        // Démarrer une session d'étude avec un mini-timer
        if (studyDeckController != null) {
            // Demander à l'utilisateur la durée du timer
            Duration sessionDuration = askForTimerDuration();
            
            if (sessionDuration != null) {
                // Démarrer le mini-timer avec durée personnalisée
                studyDeckController.startMiniTimerWithDuration(subject, sessionDuration);
                
                // Mettre à jour le statut du sujet
                subject.startStudySession();
            }
        }
        
        updateUI();
        if (onStatusChanged != null) {
            onStatusChanged.run();
        }
    }

    /**
     * Demande à l'utilisateur de saisir la durée du timer
     */
    private Duration askForTimerDuration() {
        TextInputDialog dialog = new TextInputDialog("25");
        dialog.setTitle("Durée du timer");
        dialog.setHeaderText("Configurer le timer d'étude");
        dialog.setContentText("Durée en minutes:");

        Optional<String> result = dialog.showAndWait();
        
        if (result.isPresent()) {
            try {
                int minutes = Integer.parseInt(result.get());
                if (minutes > 0 && minutes <= 180) { // Max 3 heures
                    return Duration.ofMinutes(minutes);
                }
            } catch (NumberFormatException e) {
                // En cas d'erreur, utiliser la durée par défaut
            }
        }
        
        // Durée par défaut si annulation ou erreur
        return Duration.ofMinutes(25);
    }

    @FXML
    private void handleQuickTimer() {
        // Démarrer un timer avec la durée par défaut du sujet
        if (studyDeckController != null) {
            // Utiliser la durée par défaut configurée pour ce sujet
            studyDeckController.startMiniTimer(subject);
            
            // Mettre à jour le statut du sujet
            subject.startStudySession();
            updateUI();
            if (onStatusChanged != null) {
                onStatusChanged.run();
            }
        }
    }

    @FXML
    private void handleComplete() {
        updateUI();
        if (onStatusChanged != null) {
            onStatusChanged.run();
        }
    }

    @FXML
    private void handleDeleteCourse() {
        if (studyDeckController != null) {
            studyDeckController.deleteCourse(subject, cardRoot);
        }
    }
}