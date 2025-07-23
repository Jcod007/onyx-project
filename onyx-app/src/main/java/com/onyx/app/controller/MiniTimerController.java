package com.onyx.app.controller;

import com.onyx.app.service.TimerService;
import javafx.fxml.FXML;
import javafx.scene.control.Label;
import javafx.scene.layout.StackPane;
import javafx.stage.Stage;

/**
 * Contrôleur simple pour le mini-timer de la partie Timer (popup flottant).
 * Garde l'ancienne API pour ne pas casser le TimerController existant.
 */
public class MiniTimerController {

    @FXML
    private Label miniTimeLabel;

    @FXML
    private StackPane rootPane;

    private TimerService timerService;
    private Stage stage;

    @FXML
    public void initialize() {
        // Initialization logic here if needed
    }

    public void setTimerService(TimerService timerService) {
        this.timerService = timerService;
        this.timerService.setOnStateChanged(this::updateDisplay);
        this.timerService.setOnTimerFinished(this::handleTimerFinished);
        updateDisplay();
    }

    public void setStage(Stage stage) {
        this.stage = stage;
    }

    private void updateDisplay() {
        if (timerService != null) {
            miniTimeLabel.setText(timerService.getFormattedTime());
        }
    }

    private void handleTimerFinished() {
        // Close the pop-up when the timer is finished
        if (stage != null) {
            stage.close();
        }
    }
}