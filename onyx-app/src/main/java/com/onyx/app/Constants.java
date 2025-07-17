package com.onyx.app;

public final class Constants {
    // Limites de temps
    public static final int MAX_HOURS = 99;
    public static final int MAX_MINUTES = 59;
    public static final int MAX_SECONDS = 59;

    // Timer par défaut
    public static final int DEFAULT_HOURS = 0;
    public static final int DEFAULT_MINUTES = 3;
    public static final int DEFAULT_SECONDS = 5;

    // Intervalle de mise à jour du timer (en secondes)
    public static final int TIMER_UPDATE_INTERVAL = 1;

    // Format de temps
    public static final int TIME_FORMAT_LENGTH = 6; // HHMMSS
    public static final String TIME_FORMAT_PATTERN = "\\d{2}:\\d{2}:\\d{2}";
    public static final int SECONDS_PER_MINUTE = 60;
    public static final int SECONDS_PER_HOUR = 3600;

    // Dimensions UI principales
    public static final int MAIN_WINDOW_WIDTH = 1000;
    public static final int MAIN_WINDOW_HEIGHT = 700;
    public static final int DIALOG_WIDTH = 400;
    public static final int DIALOG_HEIGHT = 350;

    private Constants() {}
} 