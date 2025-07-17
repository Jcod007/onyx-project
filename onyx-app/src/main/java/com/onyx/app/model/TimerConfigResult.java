package com.onyx.app.model;

/**
 * Résultat de la configuration du timer
 */
public class TimerConfigResult {
    private final byte hours;
    private final byte minutes;
    private final byte seconds;
    private final String timerType;
    private final String course;
    
    public TimerConfigResult(byte hours, byte minutes, byte seconds, String timerType, String course) {
        this.hours = hours;
        this.minutes = minutes;
        this.seconds = seconds;
        this.timerType = timerType;
        this.course = course;
    }
    
    // Getters
    public byte getHours() { return hours; }
    public byte getMinutes() { return minutes; }
    public byte getSeconds() { return seconds; }
    public String getTimerType() { return timerType; }
    public String getCourse() { return course; }
} 