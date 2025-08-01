package com.onyx.app.controller;

import java.io.IOException;

import com.onyx.app.service.ResponsiveService;
import com.onyx.app.service.TimersManagerService;

import javafx.fxml.FXML;
import javafx.fxml.FXMLLoader;
import javafx.scene.control.Button;
import javafx.scene.control.Label;
import javafx.scene.layout.BorderPane;
import javafx.scene.layout.HBox;
import javafx.scene.layout.Pane;
import javafx.scene.layout.StackPane;
import javafx.scene.layout.VBox;
import javafx.stage.Stage;
import org.kordamp.ikonli.javafx.FontIcon;

public class MainController {

	@FXML private BorderPane mainPane;
	@FXML private VBox sidebarContainer;
	@FXML private HBox titleContainer;
	@FXML private FontIcon titleIcon;
	@FXML private Label titleLabel;
	@FXML private VBox navigationContainer;
	@FXML private Button dashboardButton;
	@FXML private Button timerButton;
	@FXML private Button studyDeckButton;
	@FXML private VBox sidebarFooter;
	@FXML private StackPane contentWrapper;
	@FXML private Pane contentPane;

	private static final String PATH = "/com/onyx/app/view/";
	private final TimersManagerService timersManagerService;
	private ResponsiveService responsiveService;

	public MainController(TimersManagerService timersManagerService) {
		this.timersManagerService = timersManagerService;
	}

	@FXML
	public void initialize() {
		setupResponsiveComponents();
		handleDashboard(); // Load dashboard by default
	}

	/**
	 * Initialize responsive service when stage becomes available
	 */
	public void initializeResponsiveService(Stage stage) {
		if (responsiveService == null && stage != null) {
			responsiveService = new ResponsiveService(stage, mainPane);
			
			// Register all components for responsive updates
			responsiveService.registerComponent(mainPane);
			responsiveService.registerComponent(sidebarContainer);
			responsiveService.registerComponent(titleContainer);
			responsiveService.registerComponent(navigationContainer);
			responsiveService.registerComponent(contentWrapper);
			
			// Add breakpoint listener for sidebar behavior
			responsiveService.addBreakpointListener(this::handleBreakpointChange);
		}
	}

	/**
	 * Setup responsive component configurations
	 */
	private void setupResponsiveComponents() {
		// Ensure buttons can grow to fill available width
		dashboardButton.setMaxWidth(Double.MAX_VALUE);
		timerButton.setMaxWidth(Double.MAX_VALUE);
		studyDeckButton.setMaxWidth(Double.MAX_VALUE);
		
		// Set VBox grow priorities
		VBox.setVgrow(navigationContainer, javafx.scene.layout.Priority.ALWAYS);
		
		// Configure content area
		contentPane.prefWidthProperty().bind(contentWrapper.widthProperty());
		contentPane.prefHeightProperty().bind(contentWrapper.heightProperty());
	}

	/**
	 * Handle responsive breakpoint changes
	 */
	private void handleBreakpointChange(ResponsiveService.Breakpoint breakpoint) {
		switch (breakpoint) {
			case MOBILE:
				// Hide title text and show only icons
				titleLabel.setVisible(false);
				titleLabel.setManaged(false);
				setButtonsIconOnly(true);
				break;
			case TABLET:
				// Hide title text but show larger icons
				titleLabel.setVisible(false);
				titleLabel.setManaged(false);
				setButtonsIconOnly(true);
				break;
			case DESKTOP:
			case LARGE_DESKTOP:
			case ULTRA_WIDE:
				// Show full title and button text
				titleLabel.setVisible(true);
				titleLabel.setManaged(true);
				setButtonsIconOnly(false);
				break;
		}
	}

	/**
	 * Configure navigation buttons for icon-only or full display
	 */
	private void setButtonsIconOnly(boolean iconOnly) {
		if (iconOnly) {
			dashboardButton.setText("");
			timerButton.setText("");
			studyDeckButton.setText("");
			dashboardButton.setContentDisplay(javafx.scene.control.ContentDisplay.GRAPHIC_ONLY);
			timerButton.setContentDisplay(javafx.scene.control.ContentDisplay.GRAPHIC_ONLY);
			studyDeckButton.setContentDisplay(javafx.scene.control.ContentDisplay.GRAPHIC_ONLY);
		} else {
			dashboardButton.setText("Dashboard");
			timerButton.setText("Timer");
			studyDeckButton.setText("Study Deck");
			dashboardButton.setContentDisplay(javafx.scene.control.ContentDisplay.LEFT);
			timerButton.setContentDisplay(javafx.scene.control.ContentDisplay.LEFT);
			studyDeckButton.setContentDisplay(javafx.scene.control.ContentDisplay.LEFT);
		}
	}

	@FXML
	public void handleDashboard() {
		Pane view = loadFXML("TimersController-view", timersManagerService);
		contentWrapper.getChildren().clear();
		contentWrapper.getChildren().add(view);
		setActiveMenuButton(dashboardButton);
	}

	@FXML
	public void handleTimer() {
		Pane view = loadFXML("TimersController-view", timersManagerService);
		contentWrapper.getChildren().clear();
		contentWrapper.getChildren().add(view);
		setActiveMenuButton(timerButton);
	}

	@FXML
	public void handleStudyDeck() {
		Pane view = loadFXML("StudyDeck-view", timersManagerService);
		contentWrapper.getChildren().clear();
		contentWrapper.getChildren().add(view);
		setActiveMenuButton(studyDeckButton);
	}

	private Pane loadFXML(String fxml, TimersManagerService timersManagerService) {
        try {
            FXMLLoader fxmlLoader = new FXMLLoader(getClass().getResource("/com/onyx/app/view/" + fxml + ".fxml"));
            fxmlLoader.setControllerFactory(controllerClass -> {
                if (controllerClass == com.onyx.app.controller.TimersController.class) {
                    TimersController controller = new TimersController(timersManagerService);
                    // Pass responsive service if available
                    if (responsiveService != null) {
                        controller.setResponsiveService(responsiveService);
                    }
                    return controller;
                } else if (controllerClass == com.onyx.app.controller.StudyDeckController.class) {
                    return new com.onyx.app.controller.StudyDeckController(timersManagerService.getSubjectRepository());
                } else {
                    // default behavior for other controllers
                    try {
                        return controllerClass.getDeclaredConstructor().newInstance();
                    } catch (Exception e) {
                        throw new RuntimeException(e);
                    }
                }
            });
            
            Pane loadedPane = fxmlLoader.load();
            
            // Register loaded content with responsive service
            if (responsiveService != null && loadedPane instanceof javafx.scene.Parent) {
                responsiveService.registerComponent((javafx.scene.Parent) loadedPane);
            }
            
            return loadedPane;
        } catch (IOException e) {
            System.err.println("Ressource FXML introuvable : " + "/com/onyx/app/view/" + fxml + ".fxml");
            e.printStackTrace();
            return new Pane();
        }
    }

	private void setActiveMenuButton(Button activeButton) {
        dashboardButton.getStyleClass().remove("active");
        timerButton.getStyleClass().remove("active");
        studyDeckButton.getStyleClass().remove("active");
        if (!activeButton.getStyleClass().contains("active")) {
            activeButton.getStyleClass().add("active");
        }
    }

	/**
	 * Get responsive service instance
	 */
	public ResponsiveService getResponsiveService() {
		return responsiveService;
	}

	/**
	 * Cleanup resources
	 */
	public void cleanup() {
		if (responsiveService != null) {
			responsiveService.cleanup();
		}
	}
}
