package com.onyx.app.service;

import com.onyx.app.model.TimerModel;
import javafx.animation.KeyFrame;
import javafx.animation.Timeline;
import javafx.scene.media.AudioClip;
import javafx.util.Duration;

/**
 * Service pour gérer la logique métier des timers
 * Sépare la logique de l'interface utilisateur (principe de séparation des responsabilités)
 */
public class TimerService {
    
    private TimerModel timerModel;
    private Timeline timeline;
    private AudioClip sound;
    private boolean isRunning;
    private boolean canReset;
    
    // Callbacks pour notifier l'interface utilisateur
    //private Runnable onTimeUpdate;
    private Runnable onTimerFinished;
    private Runnable onStateChanged;
    
    public  TimerService() {
        initializeSound();
        initializeTimeline();
        setDefaultTimer();
    }
    
    public TimerService(byte hours, byte minutes, byte seconds) {
        initializeSound();
        initializeTimeline();
        setTimer(hours, minutes, seconds);
    }
    
    /**
     * Initialise le son d'alarme
     */
    private void initializeSound() {
        sound = new AudioClip(TimerService.class.getResource("/sounds/timerSound.mp3").toString());
        sound.setCycleCount(AudioClip.INDEFINITE);
    }
    
    /**
     * Initialise la timeline pour le décompte
     */
    private void initializeTimeline() {
        timeline = new Timeline(new KeyFrame(Duration.seconds(1), e -> {
            decrementTimer();
            if (onStateChanged != null) {
                onStateChanged.run();
            }
            
            if (timerModel.isFinished()) {
                handleTimerFinished();
            }
        }));
        timeline.setCycleCount(Timeline.INDEFINITE);
    }
    
    /**
     * Définit un timer par défaut (5 secondes)
     */
    private void setDefaultTimer() {
        setTimer((byte) 0, (byte) 0, (byte) 5);
    }
    
    /**
     * Définit un nouveau timer
     */
    public void setTimer(byte hours, byte minutes, byte seconds) {
        this.timerModel = new TimerModel(hours, minutes, seconds);
        this.isRunning = false;
        this.canReset = false;
        stopTimeline();
        notifyStateChanged();
    }
    
    /**
     * Définit un timer à partir d'un modèle existant
     */
    public void setTimerModel(TimerModel model) {
        this.timerModel = model;
        this.isRunning = false;
        this.canReset = false;
        stopTimeline();
        notifyStateChanged();
    }
    
    /**
     * Démarre ou met en pause le timer
     */
    public void toggleTimer() {
        if (!isRunning && !timerModel.isFinished()) {
            startTimer();
        } else {
            pauseTimer();
        }
    }
    
    /**
     * Démarre le timer
     */
    public void startTimer() {
        if (!timerModel.isFinished()) {
            timeline.play();
            isRunning = true;
            canReset = true;
            notifyStateChanged();
        }
    }
    
    /**
     * Met en pause le timer
     */
    public void pauseTimer() {
        timeline.pause();
        isRunning = false;
        notifyStateChanged();
    }
    
    /**
     * Arrête complètement le timer
     */
    public void stopTimer() {
        timeline.stop();
        isRunning = false;
        canReset = false;
        notifyStateChanged();
        
    }
    
    /**
     * Réinitialise le timer à sa valeur initiale
     */
    public void resetTimer() {
        stopTimer();
        timerModel.reset();
        sound.stop();
        notifyStateChanged();
        
    }
    
    /**
     * Décompte d'une seconde
     */
    private void decrementTimer() {
        timerModel.decrement();
    }
    
    /**
     * Gère la fin du timer
     */
    private void handleTimerFinished() {
        sound.play();
        stopTimer();
        canReset = true;
        if (onTimerFinished != null) {
            onTimerFinished.run();
        }
        
    }
    
    /**
     * Arrête la timeline
     */
    private void stopTimeline() {
        if (timeline != null) {
            timeline.stop();
        }
    }
    
    /**
     * Notifie le changement d'état des boutons et des valeurs booléennes
     */
    private void notifyStateChanged() {
        if (onStateChanged != null) onStateChanged.run();
    }
    
    // Getters pour l'état du timer
    public boolean isRunning() {
        return isRunning;
    }
    
    public boolean canReset() {
        return canReset;
    }
    
    public boolean isFinished() {
        return timerModel.isFinished();
    }
    
    public TimerModel getTimerModel() {
        return timerModel;
    }
    
    // Getters pour l'affichage
    public byte getHours() {
        return timerModel.getHours();
    }
    
    public byte getMinutes() {
        return timerModel.getMinutes();
    }
    
    public byte getSeconds() {
        return timerModel.getSeconds();
    }
    
    /**
     * Retourne le temps formaté pour l'affichage
     */
    public String getFormattedTime() {
        if (timerModel.getHours() > 0) {
            return String.format("%02d:%02d:%02d",
                    timerModel.getHours(),
                    timerModel.getMinutes(),
                    timerModel.getSeconds());
        } else if (timerModel.getMinutes() > 0) {
            return String.format("%02d:%02d",
                    timerModel.getMinutes(),
                    timerModel.getSeconds());
        } else {
            return String.format("%d", timerModel.getSeconds());
        }
    }
    
    /**
     * Parse un texte au format HH:MM:SS en TimerModel
     */
    public void parseTimeFromText(String text) {
        if (text != null && text.matches("\\d{2}:\\d{2}:\\d{2}")) {
            String[] parts = text.split(":");
            int h = Integer.parseInt(parts[0]);
            int m = Integer.parseInt(parts[1]);
            int s = Integer.parseInt(parts[2]);
            
            // Clamp dans les bornes valides
            h = clamp(h, 0, 99);
            m = clamp(m, 0, 59);
            s = clamp(s, 0, 59);
            
            setTimer((byte) h, (byte) m, (byte) s);
        }
    }
    
    /**
     * Utilitaire pour limiter une valeur entre min et max
     */
    private int clamp(int value, int min, int max) {
        if (value < min) return min;
        if (value > max) return max;
        return value;
    }
    
    // Setters pour les callbacks
    // public void setOnTimeUpdate(Runnable callback) {
    //     this.onTimeUpdate = callback;
    // }
    
    public void setOnTimerFinished(Runnable callback) {
        this.onTimerFinished = callback;
    }
    
    public void setOnStateChanged(Runnable callback) {
        this.onStateChanged = callback;
    }
    
    /**
     * Nettoie les ressources
     */
    public void dispose() {
        if (timeline != null) {
            timeline.stop();
        }
        if (sound != null) {
            sound.stop();
        }
    }
} 