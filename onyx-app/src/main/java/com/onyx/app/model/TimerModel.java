package com.onyx.app.model;

import java.time.Duration;
import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public class TimerModel {
    @JsonCreator
    public TimerModel(
            @JsonProperty("id") String id,
            @JsonProperty("hours") byte hours,
            @JsonProperty("minutes") byte minutes,
            @JsonProperty("seconds") byte seconds,
            @JsonProperty("initHours") Byte initHours,
            @JsonProperty("initMinutes") Byte initMinutes,
            @JsonProperty("initSeconds") Byte initSeconds,
            @JsonProperty("timerType") TimerType timerType,
            @JsonProperty("linkedSubject") Subject linkedSubject) {
        this.id = id;
        this.hours = hours;
        this.minutes = minutes;
        this.seconds = seconds;
        this.timerType = timerType;
        this.linkedSubject = linkedSubject;

        // For backward compatibility with old JSON files without init values
        if (initHours == null || initMinutes == null || initSeconds == null) {
            this.initHours = hours;
            this.initMinutes = minutes;
            this.initSeconds = seconds;
        } else {
            this.initHours = initHours;
            this.initMinutes = initMinutes;
            this.initSeconds = initSeconds;
        }
    }

    private String id;
    public enum TimerType {
        STUDY_SESSION("📖 Study session"),
        FREE_SESSION("🆓 Free session");

        private final String displayName;

        TimerType(String displayName) {
            this.displayName = displayName;
        }

        @Override
        public String toString() {
            return displayName;
        }

        public static TimerType fromString(String text) {
            for (TimerType b : TimerType.values()) {
                if (b.displayName.equalsIgnoreCase(text)) {
                    return b;
                }
            }
            return FREE_SESSION; // Valeur par défaut
        }
    }

    private byte minutes;
    private byte seconds;
    private byte hours;
    private final byte initMinutes;
    private final byte initSeconds;
    private final byte initHours;

    private TimerType timerType;
    private Subject linkedSubject;

    public TimerModel(byte hours, byte minutes, byte seconds) {
        this(UUID.randomUUID().toString(), hours, minutes, seconds, TimerType.FREE_SESSION, null);
    }

    public TimerModel(String id, byte hours, byte minutes, byte seconds) {
        this(id, hours, minutes, seconds, TimerType.FREE_SESSION, null);
    }

    public TimerModel(byte hours, byte minutes, byte seconds, TimerType timerType, Subject linkedSubject) {
        this(UUID.randomUUID().toString(), hours, minutes, seconds, timerType, linkedSubject);
    }

    public TimerModel(String id, byte hours, byte minutes, byte seconds, TimerType timerType, Subject linkedSubject) {
        this.id = id;
        this.hours = hours;
        this.minutes = minutes;
        this.seconds = seconds;
        convertAndClamp();
        this.initMinutes = this.minutes;
        this.initSeconds = this.seconds;
        this.initHours = this.hours;
        this.timerType = timerType;
        this.linkedSubject = linkedSubject;
    }

    private void convertAndClamp() {
        if (seconds > 59) {
            minutes += (byte) (seconds / 60);
            seconds = (byte) (seconds % 60);
        }
        if (minutes > 59) {
            hours += (byte) (minutes / 60);
            minutes = (byte) (minutes % 60);
        }
        
        if (hours > 99) {
            hours = 99;
            minutes = 59;
            seconds = 59;
        }
        
        checkValue();
    }

    private void checkValue() {
        if (hours < 0 || minutes < 0 || seconds < 0) {
            throw new IllegalArgumentException("Invalid values: negative time not allowed");
        }
    }

    public void decrement() {
        if (hours == 0 && minutes == 0 && seconds == 0) {
            return;
        }
        if (seconds > 0) {
            seconds--;
        } else {
            seconds = 59;
            if (minutes > 0) {
                minutes--;
            } else {
                minutes = 59;
                if (hours > 0) {
                    hours--;
                }
            }
        }
    }

    public byte getMinutes() {
        return minutes;
    }

    public void setMinutes(byte minutes) {
        this.minutes = minutes;
        convertAndClamp();
    }

    public byte getSeconds() {
        return seconds;
    }

    public void setSeconds(byte seconds) {
        this.seconds = seconds;
        convertAndClamp();
    }

    public byte getHours() {
        return hours;
    }

    public void setHours(byte hours) {
        this.hours = hours;
        convertAndClamp();
    }

    public TimerType getTimerType() {
        return timerType;
    }

    public void setTimerType(TimerType timerType) {
        this.timerType = timerType;
    }

    public Subject getLinkedSubject() {
        return linkedSubject;
    }

    public void setLinkedSubject(Subject linkedSubject) {
        this.linkedSubject = linkedSubject;
    }

    public void reset() {
        hours = initHours;
        minutes = initMinutes;
        seconds = initSeconds;
    }

    public boolean isFinished() {
        return hours == 0 && minutes == 0 && seconds == 0;
    }

    public boolean isInitialValue() {
        return minutes == initMinutes && seconds == initSeconds && hours == initHours;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    /**
     * Retourne la durée initiale pour laquelle ce timer a été configuré.
     * @return La durée initiale sous forme d'objet Duration.
     */
    public Duration getInitialDuration() {
        return Duration.ofHours(this.initHours)
                       .plusMinutes(this.initMinutes)
                       .plusSeconds(this.initSeconds);
    }

    @JsonProperty("initHours")
    public byte getInitHours() {
        return initHours;
    }

    @JsonProperty("initMinutes")
    public byte getInitMinutes() {
        return initMinutes;
    }

    @JsonProperty("initSeconds")
    public byte getInitSeconds() {
        return initSeconds;
    }

    /**
     * Retourne le temps restant en secondes totales
     */
    public long getRemainingSeconds() {
        return (long)hours * 3600 + (long)minutes * 60 + (long)seconds;
    }
    
}