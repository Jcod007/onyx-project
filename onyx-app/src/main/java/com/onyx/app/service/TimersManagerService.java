package com.onyx.app.service;

import com.onyx.app.model.TimerModel;
import java.util.ArrayList;
import java.util.List;

/**
 * Service pour gérer plusieurs timers
 * Permet de créer, supprimer et gérer une collection de timers
 */
public class TimersManagerService {
    
    private List<TimerService> timers;
    private List<TimerService> activeTimers;
    
    // Callbacks pour notifier l'interface utilisateur
    private Runnable onTimersListChanged;
    private Runnable onActiveTimersChanged;
    
    public TimersManagerService() {
        this.timers = new ArrayList<>();
        this.activeTimers = new ArrayList<>();
    }
    
    /**
     * Crée un nouveau timer avec les valeurs par défaut
     */
    public TimerService createTimer() {
        return createTimer((byte) 0, (byte) 3, (byte) 5);
    }
    
    /**
     * Crée un nouveau timer avec des valeurs spécifiques
     */
    public TimerService createTimer(byte hours, byte minutes, byte seconds) {
        TimerService timerService = new TimerService(hours, minutes, seconds);
        
        // Configurer les callbacks pour ce timer
        timerService.setOnStateChanged(() -> {
            updateActiveTimers();
            notifyTimersListChanged();
        });
        
        timerService.setOnTimerFinished(() -> {
            updateActiveTimers();
            notifyTimersListChanged();
        });
        
        timers.add(timerService);
        updateActiveTimers();
        notifyTimersListChanged();
       
        
        return timerService;
    }
    
    /**
     * Crée un timer à partir d'un modèle existant
     */
    public TimerService createTimerFromModel(TimerModel model) {
        TimerService timerService = new TimerService();
        timerService.setTimerModel(model);
        
        // Configurer les callbacks pour ce timer
        timerService.setOnStateChanged(() -> {
            updateActiveTimers();
            notifyTimersListChanged();
        });
        
        timerService.setOnTimerFinished(() -> {
            updateActiveTimers();
            notifyTimersListChanged();
        });
        
        timers.add(timerService);
        updateActiveTimers();
        notifyTimersListChanged();
        
        return timerService;
    }
    
    /**
     * Supprime un timer de la liste
     */
    public void removeTimer(TimerService timerService) {
        if (timerService != null) {
            timerService.dispose();
            timers.remove(timerService);
            updateActiveTimers();
            notifyTimersListChanged();
        }
    }
    
    /**
     * Supprime tous les timers
     */
    public void removeAllTimers() {
        for (TimerService timer : timers) {
            timer.dispose();
        }
        timers.clear();
        activeTimers.clear();
        notifyTimersListChanged();
        notifyActiveTimersChanged();
    }
    
    /**
     * Met en pause tous les timers actifs
     */
    public void pauseAllTimers() {
        for (TimerService timer : activeTimers) {
            if (timer.isRunning()) {
                timer.pauseTimer();
            }
        }
    }
    
    /**
     * Arrête tous les timers
     */
    public void stopAllTimers() {
        for (TimerService timer : timers) {
            timer.stopTimer();
        }
        updateActiveTimers();
    }
    
    /**
     * Met à jour la liste des timers actifs
     */
    private void updateActiveTimers() {
        activeTimers.clear();
        for (TimerService timer : timers) {
            if (timer.isRunning() || !timer.isFinished()) {
                activeTimers.add(timer);
            }
        }
        notifyActiveTimersChanged();
    }
    
    /**
     * Retourne tous les timers
     */
    public List<TimerService> getAllTimers() {
        return new ArrayList<>(timers);
    }
    
    /**
     * Retourne seulement les timers actifs (en cours ou non terminés)
     */
    public List<TimerService> getActiveTimers() {
        return new ArrayList<>(activeTimers);
    }
    
    /**
     * Retourne le nombre total de timers
     */
    public int getTimersCount() {
        return timers.size();
    }
    
    /**
     * Retourne le nombre de timers actifs
     */
    public int getActiveTimersCount() {
        return activeTimers.size();
    }
    
    /**
     * Retourne le nombre de timers en cours d'exécution
     */
    public int getRunningTimersCount() {
        int count = 0;
        for (TimerService timer : timers) {
            if (timer.isRunning()) {
                count++;
            }
        }
        return count;
    }
    
    /**
     * Vérifie s'il y a des timers en cours d'exécution
     */
    public boolean hasRunningTimers() {
        return getRunningTimersCount() > 0;
    }
    
    /**
     * Notifie le changement dans la liste des timers
     */
    private void notifyTimersListChanged() {
        if (onTimersListChanged != null) {
            onTimersListChanged.run();
        }
    }
    
    /**
     * Notifie le changement dans la liste des timers actifs
     */
    private void notifyActiveTimersChanged() {
        if (onActiveTimersChanged != null) {
            onActiveTimersChanged.run();
        }
    }
    
    // Setters pour les callbacks
    public void setOnTimersListChanged(Runnable callback) {
        this.onTimersListChanged = callback;
    }
    
    public void setOnActiveTimersChanged(Runnable callback) {
        this.onActiveTimersChanged = callback;
    }
    
    /**
     * Nettoie toutes les ressources
     */
    public void dispose() {
        removeAllTimers();
    }
} 