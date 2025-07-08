package com.onyx.app.controller;

import java.time.Duration;

import com.onyx.app.model.Subject;
import com.onyx.app.model.Subject.Status;

import javafx.fxml.FXML;
import javafx.scene.control.Button;
import javafx.scene.control.Label;
import javafx.scene.layout.HBox;
import javafx.scene.layout.Region;
import javafx.scene.layout.VBox;

public class CourseCardController {

	@FXML private Region headerSpacer;
    @FXML private VBox cardRoot;
    @FXML private Label courseNameLabel;
    @FXML private Label statusLabel;
   // @FXML private Label durationLabel;
    @FXML private Label objectiveLabel;
    @FXML private Label elapsedLabel;

//    @FXML private Label progressLabel;
    @FXML private HBox actions;
    @FXML private Button startButton;
    @FXML private Button completeButton;

    private Subject subject;
    private Runnable onStatusChanged;

    public void initialize() {
        // Style initial des boutons
    	HBox.setHgrow(headerSpacer, javafx.scene.layout.Priority.ALWAYS);
//        startButton.getStyleClass().add("session-button");
//        completeButton.getStyleClass().add("complete-button");
    }

    public void initData(Subject subject) {
        this.subject = subject;
       // this.onStatusChanged = statusChangeCallback;
        updateUI();
    }

    private void updateUI() {
        courseNameLabel.setText(subject.getName());
        
        // Mise à jour du statut
        Status status = subject.getStatus();
        statusLabel.setText(status.toString());
        
        // Reset des classes de style avant d'ajouter la nouvelle
        statusLabel.getStyleClass().removeAll(
            "status-not_started", 
            "status-in_progress", 
            "status-completed"
        );
        statusLabel.getStyleClass().add("status-" + status.name().toLowerCase());

        // Formatage de la durée
//        durationLabel.setText(String.format(
//            "Objectif: %s | Passé: %s",
//            formatDuration(subject.getTargetTime()),
//            formatDuration(subject.getTimeSpent())
//        ));
        objectiveLabel.setText("Objectif par semaine: " + formatDuration(subject.getTargetTime()));
        elapsedLabel.setText("Passé: " + formatDuration(subject.getTimeSpent()));

        // Progression
        //progressLabel.setText(subject.getProgressPercentage());
        
        // Gestion de la visibilité des boutons
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
//        subject.startSession();
        updateUI();
        if (onStatusChanged != null) {
            onStatusChanged.run();
        }
    }

    @FXML
    private void handleComplete() {
        //subject.endSession();
        updateUI();
        if (onStatusChanged != null) {
            onStatusChanged.run();
        }
    }
}