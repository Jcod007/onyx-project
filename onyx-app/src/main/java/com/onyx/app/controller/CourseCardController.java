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
    @FXML private Label objectiveLabel;
    @FXML private Label elapsedLabel;
    @FXML private HBox actions;
    @FXML private Button startButton;
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
        updateUI();
        if (onStatusChanged != null) {
            onStatusChanged.run();
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