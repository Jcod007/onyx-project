package com.onyx.app.model;

/**
 * Résultat de la configuration du timer
 */
public record TimerConfigResult(byte hours, byte minutes, byte seconds, TimerModel.TimerType timerType, Subject subject) {

    public TimerConfigResult(byte hours, byte minutes, byte seconds, String timerTypeStr, Subject subject) {
        this(hours, minutes, seconds,
             TimerModel.TimerType.fromString(timerTypeStr),
             subject);
    }
} 