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

    // Dimensions UI principales (pour référence, pas pour contraintes fixes)
    public static final int DEFAULT_WINDOW_WIDTH = 1000;
    public static final int DEFAULT_WINDOW_HEIGHT = 700;
    public static final int MIN_WINDOW_WIDTH = 600;
    public static final int MIN_WINDOW_HEIGHT = 500;
    
    // Responsive breakpoints (consistent with ResponsiveService)
    public static final int MOBILE_MAX_WIDTH = 767;
    public static final int TABLET_MAX_WIDTH = 1023;
    public static final int DESKTOP_MAX_WIDTH = 1439;
    public static final int LARGE_DESKTOP_MAX_WIDTH = 1919;
    
    // Dimensions relatives pour les composants
    public static final double DIALOG_WIDTH_RATIO = 0.4;  // 40% de la largeur de la fenêtre
    public static final double DIALOG_HEIGHT_RATIO = 0.5; // 50% de la hauteur de la fenêtre

    private Constants() {}
} 