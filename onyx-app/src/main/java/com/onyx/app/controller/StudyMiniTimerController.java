package com.onyx.app.controller;

import java.util.function.Consumer;

import org.kordamp.ikonli.javafx.FontIcon;

import com.onyx.app.model.Subject;
import com.onyx.app.service.TimerService;

import javafx.animation.FadeTransition;
import javafx.animation.KeyFrame;
import javafx.animation.ScaleTransition;
import javafx.animation.Timeline;
import javafx.animation.TranslateTransition;
import javafx.application.Platform;
import javafx.fxml.FXML;
import javafx.scene.control.Button;
import javafx.scene.control.Label;
import javafx.scene.control.ProgressBar;
import javafx.scene.layout.VBox;
import javafx.util.Duration;

/**
 * Contrôleur pour le mini-timer widget de la section Study.
 * Ce widget apparaît en bas de la StudyDeck-view lors du démarrage d'une session d'étude.
 */
public class StudyMiniTimerController {

    @FXML private VBox miniTimerContainer;
    @FXML private Label subjectNameLabel;
    @FXML private Label timeRemainingLabel;
    @FXML private ProgressBar progressBar;
    @FXML private Button playPauseButton;
    @FXML private Button stopButton;
    @FXML private Button resetButton;
    @FXML private Button closeButton;
    @FXML private FontIcon playPauseIcon;
    @FXML private Label sessionTimeLabel;

    private TimerService timerService;
    private Subject linkedSubject;
    private java.time.Duration initialDuration;
    private Consumer<StudyMiniTimerController> onTimerFinished;
    private Consumer<StudyMiniTimerController> onClose;

    @FXML
    public void initialize() {
        setupAnimations();
        updatePlayPauseIcon(false);
        // Initialiser la barre de progression
        progressBar.setProgress(0.0);
    }

    /**
     * Configure le mini-timer avec un timer service et un sujet lié
     */
    public void setupTimer(TimerService timerService, Subject linkedSubject, java.time.Duration duration) {
        this.timerService = timerService;
        this.linkedSubject = linkedSubject;
        this.initialDuration = duration;
        
        // Configurer l'affichage
        updateSubjectName();
        updateTimeDisplay();
        updateProgressBar();
        
        // Configurer les callbacks du timer service
        if (this.timerService != null) {
            this.timerService.setOnStateChanged(this::handleTimerStateChanged);
            this.timerService.setOnTimerFinished(this::handleTimerCompleted);
        }
    }

    private void setupAnimations() {
        // Animation d'apparition
        showWithAnimation();
    }

    public void showWithAnimation() {
        // Animation de glissement vers le haut avec fade in
        TranslateTransition slideIn = new TranslateTransition(Duration.millis(300), miniTimerContainer);
        slideIn.setFromY(50);
        slideIn.setToY(0);
        
        FadeTransition fadeIn = new FadeTransition(Duration.millis(300), miniTimerContainer);
        fadeIn.setFromValue(0.0);
        fadeIn.setToValue(1.0);
        
        slideIn.play();
        fadeIn.play();
    }

    public void hideWithAnimation(Runnable onComplete) {
        // Animation de disparition
        TranslateTransition slideOut = new TranslateTransition(Duration.millis(250), miniTimerContainer);
        slideOut.setFromY(0);
        slideOut.setToY(30);
        
        FadeTransition fadeOut = new FadeTransition(Duration.millis(250), miniTimerContainer);
        fadeOut.setFromValue(1.0);
        fadeOut.setToValue(0.0);
        
        fadeOut.setOnFinished(e -> {
            if (onComplete != null) {
                onComplete.run();
            }
        });
        
        slideOut.play();
        fadeOut.play();
    }

    @FXML
    private void handlePlayPause() {
        if (timerService != null) {
            timerService.toggleTimer();
            updatePlayPauseIcon(timerService.isRunning());
            updateButtonStyles();
        }
    }

    @FXML
    private void handleStop() {
        if (timerService != null) {
            timerService.stopTimer();
            updatePlayPauseIcon(false);
            updateButtonStyles();
        }
    }

    @FXML
    private void handleReset() {
        if (timerService != null) {
            timerService.resetTimer();
            updatePlayPauseIcon(false);
            updateProgressBar();
            updateTimeDisplay();
            updateButtonStyles();
        }
    }

    @FXML
    private void handleClose() {
        // Arrêter le timer s'il est en cours
        if (timerService != null && timerService.isRunning()) {
            timerService.stopTimer();
        }
        
        // Animation de fermeture
        hideWithAnimation(() -> {
            if (onClose != null) {
                onClose.accept(this);
            }
        });
    }

    private void handleTimerStateChanged() {
        Platform.runLater(() -> {
            updateTimeDisplay();
            updateProgressBar();
            updatePlayPauseIcon(timerService != null && timerService.isRunning());
            updateButtonStyles();
        });
    }

    private void handleTimerCompleted() {
        Platform.runLater(() -> {
            // Ajouter le temps au sujet lié si disponible
            if (linkedSubject != null && initialDuration != null) {
                linkedSubject.addTimeSpent(initialDuration);
            }
            
            // Animation de completion (pulse)
            ScaleTransition pulse = new ScaleTransition(Duration.millis(200), miniTimerContainer);
            pulse.setFromX(1.0);
            pulse.setFromY(1.0);
            pulse.setToX(1.05);
            pulse.setToY(1.05);
            pulse.setCycleCount(2);
            pulse.setAutoReverse(true);
            
            pulse.setOnFinished(e -> {
                // Notifier la fin du timer
                if (onTimerFinished != null) {
                    onTimerFinished.accept(this);
                }
                
                // Auto-fermeture après 3 secondes avec Timeline pour éviter les threads
                Timeline autoClose = new Timeline(
                    new KeyFrame(Duration.seconds(3), event -> handleClose())
                );
                autoClose.play();
            });
            
            pulse.play();
        });
    }

    private void updateSubjectName() {
        if (linkedSubject != null) {
            subjectNameLabel.setText(linkedSubject.getName());
        } else {
            subjectNameLabel.setText("Timer libre");
        }
    }

    private void updateTimeDisplay() {
        if (timerService != null) {
            timeRemainingLabel.setText(timerService.getFormattedTime());
        }
    }

    private void updateProgressBar() {
        if (timerService != null && initialDuration != null) {
            long totalSeconds = initialDuration.getSeconds();
            long remainingSeconds = timerService.getTimerModel().getRemainingSeconds();
            
            if (totalSeconds > 0) {
                double progress = 1.0 - ((double) remainingSeconds / totalSeconds);
                progressBar.setProgress(Math.max(0.0, Math.min(1.0, progress)));
            }
        }
    }

    private void updatePlayPauseIcon(boolean isRunning) {
        if (playPauseIcon != null) {
            if (isRunning) {
                playPauseIcon.setIconLiteral("mdi2p-pause");
            } else {
                playPauseIcon.setIconLiteral("mdi2p-play");
            }
        }
    }

    private void updateButtonStyles() {
        if (playPauseButton != null && timerService != null) {
            if (timerService.isRunning()) {
                if (!playPauseButton.getStyleClass().contains("playing")) {
                    playPauseButton.getStyleClass().add("playing");
                }
            } else {
                playPauseButton.getStyleClass().remove("playing");
            }
        }
    }

    // Setters pour les callbacks
    public void setOnTimerFinished(Consumer<StudyMiniTimerController> callback) {
        this.onTimerFinished = callback;
    }

    public void setOnClose(Consumer<StudyMiniTimerController> callback) {
        this.onClose = callback;
    }

    // Getters
    public Subject getLinkedSubject() {
        return linkedSubject;
    }

    public TimerService getTimerService() {
        return timerService;
    }

    public VBox getContainer() {
        return miniTimerContainer;
    }
}