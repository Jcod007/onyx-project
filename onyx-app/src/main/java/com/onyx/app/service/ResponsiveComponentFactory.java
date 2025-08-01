package com.onyx.app.service;

import javafx.fxml.FXMLLoader;
import javafx.scene.Node;
import javafx.scene.control.*;
import javafx.scene.layout.*;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import org.kordamp.ikonli.javafx.FontIcon;

import java.io.IOException;
import java.util.function.Consumer;

/**
 * Professional ResponsiveComponentFactory for JavaFX applications
 * Creates responsive UI components using native JavaFX capabilities
 * 
 * Features:
 * - Dynamic component creation with responsive behavior
 * - Professional styling and consistent design
 * - Scene graph manipulation for adaptive layouts
 * - Property binding integration
 * - Template-based component loading
 */
public class ResponsiveComponentFactory {
    
    private final ResponsiveLayoutService layoutService;
    
    public ResponsiveComponentFactory(ResponsiveLayoutService layoutService) {
        this.layoutService = layoutService;
    }
    
    /**
     * Create a responsive card component with professional styling
     */
    public VBox createResponsiveCard(String title, String content, Consumer<VBox> customizer) {
        VBox card = new VBox();
        card.getStyleClass().addAll("responsive-card-item", "responsive-scale-animation");
        
        // Configure based on current breakpoint
        ResponsiveLayoutService.ResponsiveConfig config = new ResponsiveLayoutService.ResponsiveConfig()
            .configure(ResponsiveLayoutService.Breakpoint.MOBILE, 
                new ResponsiveLayoutService.LayoutConfiguration()
                    .spacing(8)
                    .padding(new Insets(12))
                    .customize(node -> {
                        VBox vbox = (VBox) node;
                        vbox.setPrefWidth(280);
                        vbox.setMaxWidth(320);
                    }))
            .configure(ResponsiveLayoutService.Breakpoint.TABLET,
                new ResponsiveLayoutService.LayoutConfiguration()
                    .spacing(12)
                    .padding(new Insets(16))
                    .customize(node -> {
                        VBox vbox = (VBox) node;
                        vbox.setPrefWidth(300);
                        vbox.setMaxWidth(340);
                    }))
            .configure(ResponsiveLayoutService.Breakpoint.DESKTOP,
                new ResponsiveLayoutService.LayoutConfiguration()
                    .spacing(16)
                    .padding(new Insets(20))
                    .customize(node -> {
                        VBox vbox = (VBox) node;
                        vbox.setPrefWidth(320);
                        vbox.setMaxWidth(380);
                    }));
        
        // Create card content
        Label titleLabel = new Label(title);
        titleLabel.getStyleClass().add("title-small");
        
        Label contentLabel = new Label(content);
        contentLabel.getStyleClass().add("body-text");
        contentLabel.setWrapText(true);
        
        card.getChildren().addAll(titleLabel, contentLabel);
        
        // Register with responsive service
        layoutService.registerResponsiveNode(card, config);
        
        // Apply custom configuration
        if (customizer != null) {
            customizer.accept(card);
        }
        
        return card;
    }
    
    /**
     * Create a responsive button with adaptive sizing
     */
    public Button createResponsiveButton(String text, String iconLiteral, ButtonStyle style) {
        Button button = new Button(text);
        
        // Add icon if provided
        if (iconLiteral != null && !iconLiteral.isEmpty()) {
            FontIcon icon = new FontIcon(iconLiteral);
            icon.getStyleClass().add("icon-responsive");
            button.setGraphic(icon);
        }
        
        // Apply style
        switch (style) {
            case PRIMARY -> button.getStyleClass().addAll("btn-primary", "btn-responsive");
            case SECONDARY -> button.getStyleClass().addAll("btn-secondary", "btn-responsive");
            case ACCENT -> button.getStyleClass().addAll("btn-accent", "btn-responsive");
            case GLASS -> button.getStyleClass().addAll("btn-glass", "btn-responsive");
            case CIRCLE -> button.getStyleClass().addAll("btn-circle", "btn-responsive");
        }
        
        button.getStyleClass().add("responsive-scale-animation");
        
        return button;
    }
    
    /**
     * Create a responsive text field with proper styling
     */
    public TextField createResponsiveTextField(String promptText) {
        TextField textField = new TextField();
        textField.setPromptText(promptText);
        textField.getStyleClass().addAll("responsive-form-field", "text-field-modern");
        
        // Bind font size to current breakpoint
        textField.styleProperty().bind(layoutService.createResponsiveFontSize(14)
            .asString("-fx-font-size: %.0fpx;"));
        
        return textField;
    }
    
    /**
     * Create a responsive modal dialog
     */
    public StackPane createResponsiveModal(String title, Node content, 
                                         Consumer<Button> onConfirm, Consumer<Button> onCancel) {
        StackPane overlay = new StackPane();
        overlay.getStyleClass().addAll("responsive-overlay-container");
        overlay.setAlignment(Pos.CENTER);
        
        VBox modal = new VBox();
        modal.getStyleClass().addAll("responsive-modal-content");
        
        // Header
        HBox header = new HBox();
        header.getStyleClass().addAll("spacing-base");
        header.setAlignment(Pos.CENTER_LEFT);
        
        Label titleLabel = new Label(title);
        titleLabel.getStyleClass().add("title-medium");
        HBox.setHgrow(titleLabel, Priority.ALWAYS);
        
        Button closeButton = createResponsiveButton("", "fas-times", ButtonStyle.CIRCLE);
        
        header.getChildren().addAll(titleLabel, closeButton);
        
        // Content
        ScrollPane contentScroll = new ScrollPane(content);
        contentScroll.getStyleClass().add("responsive-scroll-container");
        contentScroll.setFitToWidth(true);
        contentScroll.setHbarPolicy(ScrollPane.ScrollBarPolicy.NEVER);
        VBox.setVgrow(contentScroll, Priority.ALWAYS);
        
        // Footer
        HBox footer = new HBox();
        footer.getStyleClass().add("spacing-sm");
        footer.setAlignment(Pos.CENTER_RIGHT);
        
        Button cancelButton = createResponsiveButton("Cancel", null, ButtonStyle.GLASS);
        Button confirmButton = createResponsiveButton("Confirm", null, ButtonStyle.PRIMARY);
        
        footer.getChildren().addAll(cancelButton, confirmButton);
        
        modal.getChildren().addAll(header, contentScroll, footer);
        overlay.getChildren().add(modal);
        
        // Configure responsive behavior
        ResponsiveLayoutService.ResponsiveConfig config = new ResponsiveLayoutService.ResponsiveConfig()
            .configure(ResponsiveLayoutService.Breakpoint.MOBILE,
                new ResponsiveLayoutService.LayoutConfiguration()
                    .customize(node -> {
                        VBox modalBox = (VBox) ((StackPane) node).getChildren().get(0);
                        modalBox.setPrefWidth(300);
                        modalBox.setMaxWidth(300);
                    }))
            .configure(ResponsiveLayoutService.Breakpoint.DESKTOP,
                new ResponsiveLayoutService.LayoutConfiguration()
                    .customize(node -> {
                        VBox modalBox = (VBox) ((StackPane) node).getChildren().get(0);
                        modalBox.setPrefWidth(500);
                        modalBox.setMaxWidth(500);
                    }));
        
        layoutService.registerResponsiveNode(overlay, config);
        
        // Event handlers
        closeButton.setOnAction(e -> {
            if (onCancel != null) onCancel.accept(cancelButton);
        });
        cancelButton.setOnAction(e -> {
            if (onCancel != null) onCancel.accept(cancelButton);
        });
        confirmButton.setOnAction(e -> {
            if (onConfirm != null) onConfirm.accept(confirmButton);
        });
        
        return overlay;
    }
    
    /**
     * Create a responsive navigation bar
     */
    public VBox createResponsiveNavigation(NavigationItem... items) {
        VBox navigation = new VBox();
        navigation.getStyleClass().addAll("responsive-nav-menu", "adaptive-responsive-sidebar");
        
        // App title
        HBox titleContainer = new HBox();
        titleContainer.getStyleClass().add("padding-lg");
        titleContainer.setAlignment(Pos.CENTER_LEFT);
        
        FontIcon logo = new FontIcon("mdi2d-diamond-outline");
        logo.setIconSize(24);
        logo.setIconColor(javafx.scene.paint.Color.web("#00B4A6"));
        
        Label appTitle = new Label("ONYX");
        appTitle.getStyleClass().add("title-medium");
        
        titleContainer.getChildren().addAll(logo, new Region(), appTitle);
        
        // Navigation items
        VBox navItems = new VBox();
        navItems.getStyleClass().add("spacing-sm");
        
        for (NavigationItem item : items) {
            Button navButton = createResponsiveButton(item.text, item.iconLiteral, ButtonStyle.GLASS);
            navButton.getStyleClass().addAll("responsive-nav-button", "menu-button");
            navButton.setOnAction(e -> {
                if (item.action != null) item.action.run();
            });
            navItems.getChildren().add(navButton);
        }
        
        navigation.getChildren().addAll(titleContainer, navItems);
        
        // Configure responsive behavior for sidebar
        ResponsiveLayoutService.ResponsiveConfig config = new ResponsiveLayoutService.ResponsiveConfig()
            .configure(ResponsiveLayoutService.Breakpoint.MOBILE,
                new ResponsiveLayoutService.LayoutConfiguration()
                    .collapseSidebar(true))
            .configure(ResponsiveLayoutService.Breakpoint.TABLET,
                new ResponsiveLayoutService.LayoutConfiguration()
                    .collapseSidebar(true))
            .configure(ResponsiveLayoutService.Breakpoint.DESKTOP,
                new ResponsiveLayoutService.LayoutConfiguration()
                    .collapseSidebar(false));
        
        layoutService.registerResponsiveNode(navigation, config);
        
        return navigation;
    }
    
    /**
     * Load a responsive template from FXML
     */
    public <T> T loadResponsiveTemplate(String templateName, Class<T> rootType) throws IOException {
        String templatePath = "/com/onyx/app/view/templates/" + templateName + ".fxml";
        FXMLLoader loader = new FXMLLoader(getClass().getResource(templatePath));
        
        T root = loader.load();
        
        // Apply current breakpoint styling
        if (root instanceof Node node) {
            node.getStyleClass().add(getCurrentBreakpointClass());
        }
        
        return root;
    }
    
    /**
     * Create a responsive grid container
     */
    public FlowPane createResponsiveGrid() {
        FlowPane grid = layoutService.createResponsiveGrid(createDefaultGridConfig());
        grid.getStyleClass().addAll("responsive-flow-grid", "responsive-card-grid");
        return grid;
    }
    
    /**
     * Create a responsive scroll container
     */
    public ScrollPane createResponsiveScrollPane(Node content) {
        ScrollPane scrollPane = layoutService.createResponsiveScrollPane(content, createDefaultScrollConfig());
        scrollPane.getStyleClass().add("responsive-scroll-container");
        return scrollPane;
    }
    
    // Helper methods
    
    private ResponsiveLayoutService.ResponsiveConfig createDefaultGridConfig() {
        return new ResponsiveLayoutService.ResponsiveConfig()
            .configure(ResponsiveLayoutService.Breakpoint.MOBILE,
                new ResponsiveLayoutService.LayoutConfiguration()
                    .columns(1)
                    .spacing(8)
                    .padding(new Insets(8)))
            .configure(ResponsiveLayoutService.Breakpoint.TABLET,
                new ResponsiveLayoutService.LayoutConfiguration()
                    .columns(2)
                    .spacing(12)
                    .padding(new Insets(12)))
            .configure(ResponsiveLayoutService.Breakpoint.DESKTOP,
                new ResponsiveLayoutService.LayoutConfiguration()
                    .columns(3)
                    .spacing(16)
                    .padding(new Insets(16)))
            .configure(ResponsiveLayoutService.Breakpoint.LARGE_DESKTOP,
                new ResponsiveLayoutService.LayoutConfiguration()
                    .columns(4)
                    .spacing(20)
                    .padding(new Insets(20)))
            .configure(ResponsiveLayoutService.Breakpoint.ULTRA_WIDE,
                new ResponsiveLayoutService.LayoutConfiguration()
                    .columns(5)
                    .spacing(24)
                    .padding(new Insets(24)));
    }
    
    private ResponsiveLayoutService.ResponsiveConfig createDefaultScrollConfig() {
        return new ResponsiveLayoutService.ResponsiveConfig()
            .configure(ResponsiveLayoutService.Breakpoint.MOBILE,
                new ResponsiveLayoutService.LayoutConfiguration()
                    .padding(new Insets(8)))
            .configure(ResponsiveLayoutService.Breakpoint.DESKTOP,
                new ResponsiveLayoutService.LayoutConfiguration()
                    .padding(new Insets(16)));
    }
    
    private String getCurrentBreakpointClass() {
        return switch (layoutService.getCurrentBreakpoint()) {
            case MOBILE -> "mobile-layout";
            case TABLET -> "tablet-layout";
            case DESKTOP -> "desktop-layout";
            case LARGE_DESKTOP -> "large-desktop-layout";
            case ULTRA_WIDE -> "ultra-wide-layout";
        };
    }
    
    // Supporting classes
    
    public enum ButtonStyle {
        PRIMARY, SECONDARY, ACCENT, GLASS, CIRCLE
    }
    
    public static class NavigationItem {
        public final String text;
        public final String iconLiteral;
        public final Runnable action;
        
        public NavigationItem(String text, String iconLiteral, Runnable action) {
            this.text = text;
            this.iconLiteral = iconLiteral;
            this.action = action;
        }
    }
}