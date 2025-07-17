package com.onyx.app.service;

import com.onyx.app.Constants;
import javafx.scene.control.TextFormatter;

/**
 * Service utilitaire pour le formatage et la validation du temps
 * Centralise la logique de formatage pour éviter la duplication de code
 */
public class TimeFormatService {
    
    /**
     * Crée un formateur de texte pour les champs de temps
     * Gère le format HH:MM:SS avec décalage automatique
     */
    public static TextFormatter<String> createTimeFormatter() {
        return new TextFormatter<>(change -> {
            String oldText = change.getControlText();
            String newText = change.getControlNewText();

            // Détecter le type de changement
            boolean isDeletion = newText.length() < oldText.length();
            boolean isInsertion = !change.getText().isEmpty();

            if (isDeletion) {
                return handleDeletion(change, oldText);
            }

            if (isInsertion) {
                return handleInsertion(change, oldText);
            }

            // Rejeter les autres types de changements
            return null;
        });
    }
    
    /**
     * Gère la suppression de caractères
     */
    private static TextFormatter.Change handleDeletion(TextFormatter.Change change, String oldText) {
        String oldDigits = oldText.replace(":", "");

        // Si on a encore des chiffres à décaler
        if (oldDigits.length() > 0) {
            // Décalage à DROITE : enlever le dernier chiffre et ajouter un 0 au début
            String newDigits = "0" + oldDigits.substring(0, oldDigits.length() - 1);
            String rebuilt = formatDigits(newDigits);

            change.setText(rebuilt);
            change.setRange(0, oldText.length());
            change.setCaretPosition(rebuilt.length());
            change.setAnchor(rebuilt.length());

            return change;
        } else {
            // Si plus de chiffres, remettre à zéro
            change.setText("00:00:00");
            change.setRange(0, oldText.length());
            change.setCaretPosition(8);
            change.setAnchor(8);

            return change;
        }
    }
    
    /**
     * Gère l'insertion de caractères
     */
    private static TextFormatter.Change handleInsertion(TextFormatter.Change change, String oldText) {
        String insertedText = change.getText();

        // Filtrer uniquement les chiffres
        String onlyDigits = insertedText.replaceAll("\\D", "");

        if (onlyDigits.isEmpty()) {
            return null; // Rien à insérer
        }

        String currentDigits = oldText.replace(":", "");
        String newDigits = currentDigits + onlyDigits;

        // Limiter à 6 chiffres
        if (newDigits.length() > 6) {
            newDigits = newDigits.substring(newDigits.length() - 6);
        }

        String rebuilt = formatDigits(newDigits);

        change.setText(rebuilt);
        change.setRange(0, oldText.length());
        change.setCaretPosition(rebuilt.length());
        change.setAnchor(rebuilt.length());

        return change;
    }
    
    /**
     * Formate une chaîne de chiffres en format HH:MM:SS
     */
    public static String formatDigits(String digits) {
        while (digits.length() < Constants.TIME_FORMAT_LENGTH) {
            digits = "0" + digits;
        }
        return digits.substring(0, 2) + ":" + digits.substring(2, 4) + ":" + digits.substring(4, 6);
    }
    
    /**
     * Formate un temps en format lisible selon la durée
     */
    public static String formatTime(byte hours, byte minutes, byte seconds) {
        if (hours > 0) {
            return String.format("%02d:%02d:%02d", hours, minutes, seconds);
        } else if (minutes > 0) {
            return String.format("%02d:%02d", minutes, seconds);
        } else {
            return String.format("%d", seconds);
        }
    }
    
    /**
     * Formate un temps en format complet HH:MM:SS
     */
    public static String formatTimeFull(byte hours, byte minutes, byte seconds) {
        return String.format("%02d:%02d:%02d", hours, minutes, seconds);
    }
    
    /**
     * Parse un texte au format HH:MM:SS en valeurs numériques
     */
    public static TimeValues parseTimeFromText(String text) {
        if (text == null || !text.matches(Constants.TIME_FORMAT_PATTERN)) {
            return null;
        }
        
        String[] parts = text.split(":");
        int h = Integer.parseInt(parts[0]);
        int m = Integer.parseInt(parts[1]);
        int s = Integer.parseInt(parts[2]);
        
        // Clamp dans les bornes valides
        h = clamp(h, 0, Constants.MAX_HOURS);
        m = clamp(m, 0, Constants.MAX_MINUTES);
        s = clamp(s, 0, Constants.MAX_SECONDS);
        
        return new TimeValues((byte) h, (byte) m, (byte) s);
    }
    
    /**
     * Valide si un texte représente un temps valide
     */
    public static boolean isValidTimeFormat(String text) {
        return text != null && text.matches(Constants.TIME_FORMAT_PATTERN);
    }
    
    /**
     * Valide si les valeurs de temps sont dans les bornes acceptables
     */
    public static boolean isValidTimeValues(byte hours, byte minutes, byte seconds) {
        return hours >= 0 && hours <= Constants.MAX_HOURS && 
               minutes >= 0 && minutes <= Constants.MAX_MINUTES && 
               seconds >= 0 && seconds <= Constants.MAX_SECONDS;
    }
    
    /**
     * Limite une valeur entre min et max
     */
    public static int clamp(int value, int min, int max) {
        if (value < min) return min;
        if (value > max) return max;
        return value;
    }
    
    /**
     * Convertit des secondes en format HH:MM:SS
     */
    public static String formatSecondsToTime(int totalSeconds) {
        if (totalSeconds < 0) totalSeconds = 0;
        
        int hours = totalSeconds / Constants.SECONDS_PER_HOUR;
        int minutes = (totalSeconds % Constants.SECONDS_PER_HOUR) / Constants.SECONDS_PER_MINUTE;
        int seconds = totalSeconds % Constants.SECONDS_PER_MINUTE;
        
        return formatTime((byte) hours, (byte) minutes, (byte) seconds);
    }
    
    /**
     * Convertit un temps en secondes totales
     */
    public static int timeToSeconds(byte hours, byte minutes, byte seconds) {
        return hours * Constants.SECONDS_PER_HOUR + minutes * Constants.SECONDS_PER_MINUTE + seconds;
    }
    
    /**
     * Classe pour encapsuler les valeurs de temps
     */
    public static class TimeValues {
        private final byte hours;
        private final byte minutes;
        private final byte seconds;
        
        public TimeValues(byte hours, byte minutes, byte seconds) {
            this.hours = hours;
            this.minutes = minutes;
            this.seconds = seconds;
        }
        
        public byte getHours() { return hours; }
        public byte getMinutes() { return minutes; }
        public byte getSeconds() { return seconds; }
    }
} 