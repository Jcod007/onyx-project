package com.onyx.app.model;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public class Subject {
    public Subject() {
        this.id = UUID.randomUUID().toString();
        this.name = "";
        this.targetTime = Duration.ZERO;
        this.timeSpent = Duration.ZERO;
        this.defaultTimerDuration = Duration.ZERO; // Sera configuré par l'utilisateur
        this.status = Status.NOT_STARTED;
    }
    private String id;
    private String name;
    private Status status;
    private Duration targetTime;  // Temps objectif
    private Duration timeSpent;   // Temps déjà passé
    private Duration defaultTimerDuration; // Durée par défaut pour le démarrage rapide de timer
    private LocalDateTime lastStudyDate; // Dernière session d'étude
    
    public Subject(String name, int minutes) {
        this(UUID.randomUUID().toString(), name, Duration.ofMinutes(minutes), Duration.ZERO);
    }
    
    public Subject(String name, Duration targetTime) {
        this(UUID.randomUUID().toString(), name, targetTime, Duration.ZERO);
    }
    
    public Subject(String name, Duration targetTime, Duration defaultTimerDuration) {
        this(UUID.randomUUID().toString(), name, targetTime, defaultTimerDuration);
    }

    public Subject(String id, String name, int minutes) {
        this(id, name, Duration.ofMinutes(minutes), Duration.ZERO);
    }
    
    @JsonCreator
    public Subject(
        @JsonProperty("id") String id,
        @JsonProperty("name") String name,
        @JsonProperty("targetTime") Duration targetTime,
        @JsonProperty("defaultTimerDuration") Duration defaultTimerDuration
    ) {
        this.id = id;
        this.name = name;
        this.targetTime = targetTime;
        this.timeSpent = Duration.ZERO;
        this.defaultTimerDuration = defaultTimerDuration != null ? defaultTimerDuration : Duration.ZERO;
        this.status = Status.NOT_STARTED;
    }
    
    // Méthodes principales
    public void startStudySession() {
        this.status = Status.IN_PROGRESS;
        this.lastStudyDate = LocalDateTime.now();
    }
    
    public void endStudySession() {
        if (this.status == Status.IN_PROGRESS && lastStudyDate != null) {
            Duration sessionDuration = Duration.between(lastStudyDate, LocalDateTime.now());
            this.timeSpent = timeSpent.plus(sessionDuration);
            updateStatus();
        }
    }
    
    private void updateStatus() {
        if (timeSpent.compareTo(targetTime) >= 0) {
            this.status = Status.COMPLETED;
        }
    }

    /**
     * Ajoute une durée au temps total passé sur ce sujet.
     * @param duration La durée de la session d'étude à ajouter.
     */
    public void addTimeSpent(Duration duration) {
        if (duration != null && !duration.isNegative()) {
            this.timeSpent = this.timeSpent.plus(duration);
            updateStatus(); // Met à jour le statut (ex: COMPLETED) si nécessaire
        }
    }
    
    // Méthodes d'affichage
    @JsonIgnore
    public String getFormattedTargetTime() {
        return formatDuration(targetTime);
    }
    
    @JsonIgnore
    public String getFormattedTimeSpent() {
        return formatDuration(timeSpent);
    }
    
    public String getProgressPercentage() {
        if (targetTime.isZero()) return "0%";
        double progress = (double)timeSpent.toSeconds() / targetTime.toSeconds() * 100;
        return String.format("%.0f%%", Math.min(progress, 100));
    }
    
    private String formatDuration(Duration duration) {
        long hours = duration.toHours();
        int minutes = duration.toMinutesPart();
        return String.format("%dh%02d", hours, minutes);
    }
    
    // Getters/Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getName() { return name; }
    public Status getStatus() { return status; }
    public Duration getTargetTime() { return targetTime; }
    public Duration getTimeSpent() { return timeSpent; }
    public void setTimeSpent(Duration timeSpent) { this.timeSpent = timeSpent; }
    public Duration getDefaultTimerDuration() { return defaultTimerDuration; }
    public void setDefaultTimerDuration(Duration defaultTimerDuration) { this.defaultTimerDuration = defaultTimerDuration; }
    public LocalDateTime getLastStudyDate() { return lastStudyDate; }
    public void setLastStudyDate(LocalDateTime lastStudyDate) { this.lastStudyDate = lastStudyDate; }

    @Override
    public String toString() {
        // TODO Auto-generated method stub
        return name;
    }
    
    public enum Status {
        IN_PROGRESS("En cours"),
        COMPLETED("Terminé"),
        NOT_STARTED("Non commencé");
        
        private final String displayName;
        
        Status(String displayName) {
            this.displayName = displayName;
        }
        
        @Override
        public String toString() {
            return displayName;
        }
    }
}