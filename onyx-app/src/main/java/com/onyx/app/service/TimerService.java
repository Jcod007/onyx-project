package com.onyx.app.service;

import com.onyx.app.Constants;
import com.onyx.app.model.TimerModel;
import com.onyx.app.model.Subject;
import com.onyx.app.repository.SubjectRepository;
import java.time.Duration;

/**
 * Service pour gérer la logique métier des timers
 * Sépare la logique de l'interface utilisateur (principe de séparation des responsabilités)
 */
public class TimerService {
    
    private TimerModel timerModel;
    private boolean isRunning;
    private boolean canReset;
    private SubjectRepository subjectRepository;
    
    // Callbacks pour notifier l'interface utilisateur
    private Runnable onTimerFinished;
    private Runnable onStateChanged;
    
    public TimerService(SubjectRepository subjectRepository) {
        this.subjectRepository = subjectRepository;
        setDefaultTimer();
    }
    
    public TimerService(byte hours, byte minutes, byte seconds, TimerModel.TimerType timerType, Subject linkedSubject, SubjectRepository subjectRepository) {
        this(subjectRepository); // Call primary constructor to set subjectRepository
        setTimer(hours, minutes, seconds, timerType, linkedSubject, subjectRepository);
    }
    
    /**
     * Définit un timer par défaut (5 secondes)
     */
    private void setDefaultTimer() {
        setTimer((byte) Constants.DEFAULT_HOURS, (byte) Constants.DEFAULT_MINUTES, (byte) Constants.DEFAULT_SECONDS, TimerModel.TimerType.FREE_SESSION, null, this.subjectRepository);
    }
    
    /**
     * Définit un nouveau timer
     */
        public void setTimer(byte hours, byte minutes, byte seconds, TimerModel.TimerType timerType, Subject linkedSubject, SubjectRepository subjectRepository) {
        this.subjectRepository = subjectRepository;
        this.timerModel = new TimerModel(hours, minutes, seconds, timerType, linkedSubject);
        this.isRunning = false;
        this.canReset = false;
        notifyStateChanged();
    }
    
    /**
     * Définit un timer à partir d'un modèle existant
     */
    public void setTimerModel(TimerModel model) {
        this.timerModel = model;
        this.isRunning = false;
        this.canReset = false;
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
            isRunning = true;
            canReset = true;
            notifyStateChanged();
        }
    }
    
    /**
     * Met en pause le timer
     */
    public void pauseTimer() {
        isRunning = false;
        notifyStateChanged();
    }
    
    /**
     * Arrête complètement le timer
     */
    public void stopTimer() {
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
        notifyStateChanged();
    }
    
    /**
     * Décrémente le temps du timer d'une seconde.
     * Cette méthode doit être appelée par un mécanisme externe (ex: Timeline)
     */
    public void decrement() {
        if (isRunning) {
            timerModel.decrement();
            if (timerModel.isFinished()) {
                handleTimerFinished();
            }
            notifyStateChanged();
        }
    }
    
    /**
     * Gère la fin du timer
     */
    private void handleTimerFinished() {
        stopTimer();
        canReset = true;

        Subject linkedSubject = timerModel.getLinkedSubject();
        if (linkedSubject != null) {
            Duration sessionDuration = timerModel.getInitialDuration();
            linkedSubject.addTimeSpent(sessionDuration);
            if (subjectRepository != null) {
                subjectRepository.save(linkedSubject);
            }
            System.out.println("Mise à jour du temps pour le cours : " + linkedSubject.getName() + ". Temps ajouté : " + sessionDuration.toString());
        }

        if (onTimerFinished != null) {
            onTimerFinished.run();
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
        return switch (timerModel.getHours()) {
            case 0 -> String.format("%02d:%02d", timerModel.getMinutes(), timerModel.getSeconds());
            default -> String.format("%02d:%02d:%02d", timerModel.getHours(), timerModel.getMinutes(), timerModel.getSeconds());
        };
    }
    
    /**
     * Parse un texte au format HH:MM:SS en TimerModel
     */
    public void parseTimeFromText(String text) {
        if (text != null && text.matches(Constants.TIME_FORMAT_PATTERN)) {
            String[] parts = text.split(":");
            int h = Integer.parseInt(parts[0]);
            int m = Integer.parseInt(parts[1]);
            int s = Integer.parseInt(parts[2]);
            
            // Clamp dans les bornes valides
            h = clamp(h, 0, Constants.MAX_HOURS);
            m = clamp(m, 0, Constants.MAX_MINUTES);
            s = clamp(s, 0, Constants.MAX_SECONDS);
            
            setTimer((byte) h, (byte) m, (byte) s, TimerModel.TimerType.FREE_SESSION, null, subjectRepository);
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
    public void setOnTimerFinished(Runnable callback) {
        this.onTimerFinished = callback;
    }
    
    public void setOnStateChanged(Runnable callback) {
        this.onStateChanged = callback;
    }
    
    // Accès direct au type et au cours lié via TimerModel
    public TimerModel.TimerType getTimerType() {
        return timerModel != null ? timerModel.getTimerType() : null;
    }
    public void setTimerType(TimerModel.TimerType timerType) {
        if (timerModel != null) timerModel.setTimerType(timerType);
    }
    public Subject getLinkedSubject() {
        return timerModel != null ? timerModel.getLinkedSubject() : null;
    }
    public void setLinkedSubject(Subject subject) {
        if (timerModel != null) timerModel.setLinkedSubject(subject);
    }
    
    /**
     * Nettoie les ressources
     */
    public void dispose() {
        // Plus rien à nettoyer ici
    }
} 