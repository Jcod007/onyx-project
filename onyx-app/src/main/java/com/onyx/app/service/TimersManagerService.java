package com.onyx.app.service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import com.onyx.app.Constants;
import com.onyx.app.model.Subject;
import com.onyx.app.model.TimerModel;
import com.onyx.app.model.TimerModel.TimerType;
import com.onyx.app.repository.SubjectRepository;
import com.onyx.app.repository.TimerRepository;
import com.onyx.app.repository.impl.JsonSubjectRepository;
import com.onyx.app.repository.impl.JsonTimerRepository;

/**
 * Service pour gérer plusieurs timers
 * Permet de créer, supprimer et gérer une collection de timers
 */
public class TimersManagerService {
    
    private final TimerRepository timerRepository;
    private final SubjectRepository subjectRepository;
    private List<TimerService> timers;
    private List<TimerService> activeTimers;
    
    // Callbacks pour notifier l'interface utilisateur
    private Runnable onTimersListChanged;
    private Runnable onActiveTimersChanged;
    
    public TimersManagerService() {
        // Default constructor for convenience, uses JSON implementation
        this(new JsonTimerRepository(), new JsonSubjectRepository());
    }

    public TimersManagerService(TimerRepository timerRepository, SubjectRepository subjectRepository) {
        this.timerRepository = timerRepository;
        this.subjectRepository = subjectRepository;
        this.timers = timerRepository.findAll().stream()
                            .map(model -> {
                                TimerService timerService = new TimerService(subjectRepository);
                                timerService.setTimerModel(model);
                                return timerService;
                            })
                            .collect(Collectors.toList());
        this.activeTimers = new ArrayList<>();
        updateActiveTimers(); // Initialize active timers based on loaded data
    }
    
    /**
     * Crée un nouveau timer avec les valeurs par défaut
     */
    public TimerService createTimer() {
        return createTimer((byte) Constants.DEFAULT_HOURS, (byte) Constants.DEFAULT_MINUTES, (byte) Constants.DEFAULT_SECONDS, TimerType.FREE_SESSION,null);
    }
    
    /**
     * Crée un nouveau timer avec des valeurs spécifiques
     */
    public TimerService createTimer(byte hours, byte minutes, byte seconds, TimerModel.TimerType timerType, Subject subject) {
        TimerModel newModel = new TimerModel(hours, minutes, seconds, timerType, subject);
        timerRepository.save(newModel); // Save the new timer model
        return createTimerServiceFromModel(newModel);
    }
    
    /**
     * Crée un timer à partir d'un modèle existant
     */
    public TimerService createTimerFromModel(TimerModel model) {
        timerRepository.save(model); // Ensure the model is saved/updated in the repository
        return createTimerServiceFromModel(model);
    }

    private TimerService createTimerServiceFromModel(TimerModel model) {
        TimerService timerService = new TimerService(subjectRepository);
        timerService.setTimerModel(model);
        
        // Configurer les callbacks pour ce timer
        timerService.setOnStateChanged(() -> {
            updateActiveTimers();
            notifyTimersListChanged();
            timerRepository.save(timerService.getTimerModel()); // Save state changes
        });
        
        timerService.setOnTimerFinished(() -> {
            updateActiveTimers();
            notifyTimersListChanged();
            timerRepository.save(timerService.getTimerModel()); // Save final state
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
            timerRepository.deleteById(timerService.getTimerModel().getId()); // Delete from repository
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
            timerRepository.deleteById(timer.getTimerModel().getId()); // Delete from repository
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
    
    public SubjectRepository getSubjectRepository() {
        return subjectRepository;
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