package com.onyx.app.service;

import javafx.application.Platform;
import javafx.beans.binding.Bindings;
import javafx.beans.binding.NumberBinding;
import javafx.beans.property.DoubleProperty;
import javafx.beans.property.SimpleDoubleProperty;
import javafx.beans.value.ChangeListener;
import javafx.scene.Node;
import javafx.scene.Scene;
import javafx.scene.layout.*;
import javafx.scene.control.ScrollPane;
import javafx.stage.Stage;
import javafx.geometry.Insets;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Consumer;

/**
 * Professional ResponsiveLayoutService for JavaFX applications
 * Manages responsive behavior using native JavaFX capabilities only
 * 
 * Features:
 * - Breakpoint-based responsive behavior
 * - Dynamic layout composition
 * - Property binding for measurements
 * - Performance-optimized updates
 * - Scene graph manipulation for adaptive layouts
 */
public class ResponsiveLayoutService {
    
    // Responsive breakpoints (similar to CSS media queries)
    public enum Breakpoint {
        MOBILE(0, 480),
        TABLET(481, 768),
        DESKTOP(769, 1024),
        LARGE_DESKTOP(1025, 1440),
        ULTRA_WIDE(1441, Double.MAX_VALUE);
        
        private final double minWidth;
        private final double maxWidth;
        
        Breakpoint(double minWidth, double maxWidth) {
            this.minWidth = minWidth;
            this.maxWidth = maxWidth;
        }
        
        public boolean matches(double width) {
            return width >= minWidth && width <= maxWidth;
        }
        
        public double getMinWidth() { return minWidth; }
        public double getMaxWidth() { return maxWidth; }
    }
    
    // Layout density for professional scaling
    public enum LayoutDensity {
        COMPACT(0.8, 8, 4),
        NORMAL(1.0, 12, 8),
        COMFORTABLE(1.2, 16, 12);
        
        private final double scaleFactor;
        private final double baseSpacing;
        private final double basePadding;
        
        LayoutDensity(double scaleFactor, double baseSpacing, double basePadding) {
            this.scaleFactor = scaleFactor;
            this.baseSpacing = baseSpacing;
            this.basePadding = basePadding;
        }
        
        public double getScaleFactor() { return scaleFactor; }
        public double getSpacing() { return baseSpacing * scaleFactor; }
        public double getPadding() { return basePadding * scaleFactor; }
    }
    
    // Layout configuration for different breakpoints
    public static class ResponsiveConfig {
        private final Map<Breakpoint, LayoutConfiguration> configurations = new EnumMap<>(Breakpoint.class);
        
        public ResponsiveConfig configure(Breakpoint breakpoint, LayoutConfiguration config) {
            configurations.put(breakpoint, config);
            return this;
        }
        
        public LayoutConfiguration getConfiguration(Breakpoint breakpoint) {
            return configurations.get(breakpoint);
        }
    }
    
    public static class LayoutConfiguration {
        private int columns = 1;
        private double spacing = 12;
        private Insets padding = new Insets(12);
        private LayoutDensity density = LayoutDensity.NORMAL;
        private boolean collapseSidebar = false;
        private Consumer<Node> customizer;
        
        public LayoutConfiguration columns(int columns) {
            this.columns = columns;
            return this;
        }
        
        public LayoutConfiguration spacing(double spacing) {
            this.spacing = spacing;
            return this;
        }
        
        public LayoutConfiguration padding(Insets padding) {
            this.padding = padding;
            return this;
        }
        
        public LayoutConfiguration density(LayoutDensity density) {
            this.density = density;
            return this;
        }
        
        public LayoutConfiguration collapseSidebar(boolean collapse) {
            this.collapseSidebar = collapse;
            return this;
        }
        
        public LayoutConfiguration customize(Consumer<Node> customizer) {
            this.customizer = customizer;
            return this;
        }
        
        // Getters
        public int getColumns() { return columns; }
        public double getSpacing() { return spacing * density.getScaleFactor(); }
        public Insets getPadding() { 
            double scale = density.getScaleFactor();
            return new Insets(padding.getTop() * scale, padding.getRight() * scale, 
                            padding.getBottom() * scale, padding.getLeft() * scale);
        }
        public LayoutDensity getDensity() { return density; }
        public boolean isCollapseSidebar() { return collapseSidebar; }
        public Consumer<Node> getCustomizer() { return customizer; }
    }
    
    // Service state
    private final DoubleProperty sceneWidth = new SimpleDoubleProperty();
    private final DoubleProperty sceneHeight = new SimpleDoubleProperty();
    private Breakpoint currentBreakpoint = Breakpoint.DESKTOP;
    private final Map<Node, ResponsiveConfig> responsiveNodes = new ConcurrentHashMap<>();
    private final Map<Node, ChangeListener<Number>> widthListeners = new ConcurrentHashMap<>();
    
    // Performance optimization
    private boolean updatesPaused = false;
    private final Set<Node> pendingUpdates = ConcurrentHashMap.newKeySet();
    
    /**
     * Initialize the responsive service with a Scene
     */
    public void initialize(Scene scene) {
        sceneWidth.bind(scene.widthProperty());
        sceneHeight.bind(scene.heightProperty());
        
        // Listen for width changes to update breakpoints
        sceneWidth.addListener((obs, oldWidth, newWidth) -> {
            updateBreakpoint(newWidth.doubleValue());
            if (!updatesPaused) {
                Platform.runLater(this::updateAllLayouts);
            }
        });
    }
    
    /**
     * Register a node for responsive behavior
     */
    public void registerResponsiveNode(Node node, ResponsiveConfig config) {
        responsiveNodes.put(node, config);
        
        // Apply initial configuration
        applyResponsiveLayout(node, config);
    }
    
    /**
     * Create responsive FlowPane-based grid system
     */
    public FlowPane createResponsiveGrid(ResponsiveConfig config) {
        FlowPane flowPane = new FlowPane();
        flowPane.getStyleClass().add("responsive-grid");
        
        // Configure initial layout
        LayoutConfiguration currentConfig = config.getConfiguration(currentBreakpoint);
        if (currentConfig != null) {
            configureFlowPane(flowPane, currentConfig);
        }
        
        // Register for responsive updates
        registerResponsiveNode(flowPane, config);
        
        return flowPane;
    }
    
    /**
     * Create responsive BorderPane with adaptive regions
     */
    public BorderPane createResponsiveBorderPane(ResponsiveConfig config) {
        BorderPane borderPane = new BorderPane();
        borderPane.getStyleClass().add("responsive-border-pane");
        
        // Apply initial configuration
        LayoutConfiguration currentConfig = config.getConfiguration(currentBreakpoint);
        if (currentConfig != null) {
            configureBorderPane(borderPane, currentConfig);
        }
        
        registerResponsiveNode(borderPane, config);
        return borderPane;
    }
    
    /**
     * Create responsive card container with professional scaling
     */
    public VBox createResponsiveCardContainer(ResponsiveConfig config) {
        VBox container = new VBox();
        container.getStyleClass().addAll("responsive-card-container", "modern-card");
        
        // Apply responsive configuration
        LayoutConfiguration currentConfig = config.getConfiguration(currentBreakpoint);
        if (currentConfig != null) {
            configureVBox(container, currentConfig);
        }
        
        registerResponsiveNode(container, config);
        return container;
    }
    
    /**
     * Create adaptive sidebar that collapses on smaller screens
     */
    public VBox createAdaptiveSidebar(ResponsiveConfig config, Node content) {
        VBox sidebar = new VBox();
        sidebar.getStyleClass().addAll("adaptive-sidebar", "sidebar-modern");
        sidebar.getChildren().add(content);
        
        // Configure based on current breakpoint
        LayoutConfiguration currentConfig = config.getConfiguration(currentBreakpoint);
        if (currentConfig != null) {
            configureSidebar(sidebar, currentConfig);
        }
        
        registerResponsiveNode(sidebar, config);
        return sidebar;
    }
    
    /**
     * Property binding utilities for responsive measurements
     */
    public NumberBinding createResponsiveWidth(double baseWidth) {
        return Bindings.createDoubleBinding(() -> {
            double scale = currentBreakpoint == Breakpoint.MOBILE ? 0.8 :
                          currentBreakpoint == Breakpoint.TABLET ? 0.9 : 1.0;
            return baseWidth * scale;
        }, sceneWidth);
    }
    
    public NumberBinding createResponsiveSpacing() {
        return Bindings.createDoubleBinding(() -> {
            return switch (currentBreakpoint) {
                case MOBILE -> 8.0;
                case TABLET -> 12.0;
                case DESKTOP -> 16.0;
                case LARGE_DESKTOP -> 20.0;
                case ULTRA_WIDE -> 24.0;
            };
        }, sceneWidth);
    }
    
    public NumberBinding createResponsiveFontSize(double baseSize) {
        return Bindings.createDoubleBinding(() -> {
            double scale = currentBreakpoint == Breakpoint.MOBILE ? 0.9 :
                          currentBreakpoint == Breakpoint.ULTRA_WIDE ? 1.1 : 1.0;
            return baseSize * scale;
        }, sceneWidth);
    }
    
    /**
     * Performance optimization: batch layout updates
     */
    public void pauseLayoutUpdates() {
        updatesPaused = true;
    }
    
    public void resumeLayoutUpdates() {
        updatesPaused = false;
        if (!pendingUpdates.isEmpty()) {
            Platform.runLater(() -> {
                pendingUpdates.forEach(node -> {
                    ResponsiveConfig config = responsiveNodes.get(node);
                    if (config != null) {
                        applyResponsiveLayout(node, config);
                    }
                });
                pendingUpdates.clear();
            });
        }
    }
    
    /**
     * Handle content overflow with ScrollPane integration
     */
    public ScrollPane createResponsiveScrollPane(Node content, ResponsiveConfig config) {
        ScrollPane scrollPane = new ScrollPane(content);
        scrollPane.getStyleClass().add("responsive-scroll-pane");
        scrollPane.setFitToWidth(true);
        scrollPane.setHbarPolicy(ScrollPane.ScrollBarPolicy.NEVER);
        scrollPane.setVbarPolicy(ScrollPane.ScrollBarPolicy.AS_NEEDED);
        
        // Configure based on breakpoint
        LayoutConfiguration currentConfig = config.getConfiguration(currentBreakpoint);
        if (currentConfig != null && currentConfig.getCustomizer() != null) {
            currentConfig.getCustomizer().accept(scrollPane);
        }
        
        registerResponsiveNode(scrollPane, config);
        return scrollPane;
    }
    
    // Private helper methods
    
    private void updateBreakpoint(double width) {
        Breakpoint newBreakpoint = Arrays.stream(Breakpoint.values())
                .filter(bp -> bp.matches(width))
                .findFirst()
                .orElse(Breakpoint.DESKTOP);
        
        if (newBreakpoint != currentBreakpoint) {
            currentBreakpoint = newBreakpoint;
            // Add CSS class for current breakpoint
            Platform.runLater(() -> updateBreakpointStyles());
        }
    }
    
    private void updateBreakpointStyles() {
        // This would be handled by CSS media-query-like behavior
        // We can add/remove CSS classes based on current breakpoint
    }
    
    private void updateAllLayouts() {
        responsiveNodes.forEach((node, config) -> {
            if (updatesPaused) {
                pendingUpdates.add(node);
            } else {
                applyResponsiveLayout(node, config);
            }
        });
    }
    
    private void applyResponsiveLayout(Node node, ResponsiveConfig config) {
        LayoutConfiguration layoutConfig = config.getConfiguration(currentBreakpoint);
        if (layoutConfig == null) return;
        
        if (node instanceof FlowPane flowPane) {
            configureFlowPane(flowPane, layoutConfig);
        } else if (node instanceof BorderPane borderPane) {
            configureBorderPane(borderPane, layoutConfig);
        } else if (node instanceof VBox vbox) {
            configureVBox(vbox, layoutConfig);
        } else if (node instanceof HBox hbox) {
            configureHBox(hbox, layoutConfig);
        }
        
        // Apply custom configuration
        if (layoutConfig.getCustomizer() != null) {
            layoutConfig.getCustomizer().accept(node);
        }
    }
    
    private void configureFlowPane(FlowPane flowPane, LayoutConfiguration config) {
        flowPane.setHgap(config.getSpacing());
        flowPane.setVgap(config.getSpacing());
        flowPane.setPadding(config.getPadding());
        
        // Set preferred tile width based on columns
        double availableWidth = sceneWidth.get() - config.getPadding().getLeft() - config.getPadding().getRight();
        double tileWidth = (availableWidth - (config.getColumns() - 1) * config.getSpacing()) / config.getColumns();
        flowPane.setPrefWrapLength(Math.max(200, tileWidth)); // Minimum tile width
    }
    
    private void configureBorderPane(BorderPane borderPane, LayoutConfiguration config) {
        borderPane.setPadding(config.getPadding());
        
        // Handle sidebar collapse
        if (config.isCollapseSidebar() && borderPane.getLeft() != null) {
            borderPane.getLeft().setVisible(false);
            borderPane.getLeft().setManaged(false);
        } else if (!config.isCollapseSidebar() && borderPane.getLeft() != null) {
            borderPane.getLeft().setVisible(true);
            borderPane.getLeft().setManaged(true);
        }
    }
    
    private void configureVBox(VBox vbox, LayoutConfiguration config) {
        vbox.setSpacing(config.getSpacing());
        vbox.setPadding(config.getPadding());
    }
    
    private void configureHBox(HBox hbox, LayoutConfiguration config) {
        hbox.setSpacing(config.getSpacing());
        hbox.setPadding(config.getPadding());
    }
    
    private void configureSidebar(VBox sidebar, LayoutConfiguration config) {
        if (config.isCollapseSidebar()) {
            // Collapse to icon-only mode
            sidebar.setPrefWidth(60);
            sidebar.setMaxWidth(60);
            sidebar.getStyleClass().add("sidebar-collapsed");
        } else {
            // Full sidebar
            sidebar.setPrefWidth(220);
            sidebar.setMaxWidth(Region.USE_PREF_SIZE);
            sidebar.getStyleClass().remove("sidebar-collapsed");
        }
        
        sidebar.setSpacing(config.getSpacing());
        sidebar.setPadding(config.getPadding());
    }
    
    // Getters for current state
    public Breakpoint getCurrentBreakpoint() { return currentBreakpoint; }
    public double getSceneWidth() { return sceneWidth.get(); }
    public double getSceneHeight() { return sceneHeight.get(); }
    public DoubleProperty sceneWidthProperty() { return sceneWidth; }
    public DoubleProperty sceneHeightProperty() { return sceneHeight; }
    
    /**
     * Cleanup method to remove listeners and references
     */
    public void cleanup() {
        responsiveNodes.clear();
        widthListeners.forEach((node, listener) -> {
            // Remove listeners if needed
        });
        widthListeners.clear();
        pendingUpdates.clear();
    }
}