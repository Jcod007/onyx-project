package com.onyx.app.model;

import java.time.Duration;
import java.time.LocalDateTime;

public class Subject {
    private String name;
    private Status status;
    private Duration targetTime;  // Temps objectif
    private Duration timeSpent;   // Temps déjà passé
    private LocalDateTime lastStudyDate; // Dernière session d'étude
    
    public Subject(String name, int minutes) {
        this(name, Duration.ofMinutes(minutes));
    }
    
    public Subject(String name, Duration targetTime) {
        this.name = name;
        this.targetTime = targetTime;
        this.timeSpent = Duration.ZERO;
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
    
    // Méthodes d'affichage
    public String getFormattedTargetTime() {
        return formatDuration(targetTime);
    }
    
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
        long minutes = duration.toMinutesPart();
        return String.format("%dh%02d", hours, minutes);
    }
    
    // Getters/Setters
    public String getName() { return name; }
    public Status getStatus() { return status; }
    public Duration getTargetTime() { return targetTime; }
    public Duration getTimeSpent() { return timeSpent; }
    public LocalDateTime getLastStudyDate() { return lastStudyDate; }
    
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