package com.onyx.app.controller;

import java.io.IOException;
import java.net.URL;

import com.onyx.app.service.TimersManagerService;
import javafx.fxml.FXML;
import javafx.fxml.FXMLLoader;
import javafx.scene.layout.BorderPane;
import javafx.scene.layout.Pane;
import javafx.scene.control.Button;

public class MainController {

	@FXML
	private BorderPane mainPane;
	private static final String PATH = "/com/onyx/app/view/";

	@FXML private Button dashboardButton;
	@FXML private Button timerButton;
	@FXML private Button studyDeckButton;

	private final TimersManagerService timersManagerService;

	public MainController(TimersManagerService timersManagerService) {
		this.timersManagerService = timersManagerService;
	}

	@FXML
	public void initialize() {
		handleDashboard(); // Load dashboard by default
	}

	@FXML
	public void handleDashboard() {
		mainPane.setCenter(loadFXML("TimersController-view", timersManagerService));
		setActiveMenuButton(dashboardButton);
	}

	@FXML
	public void handleTimer() {
		mainPane.setCenter(loadFXML("TimersController-view", timersManagerService));
		setActiveMenuButton(timerButton);
	}

	@FXML
	public void handleStudyDeck() {
		mainPane.setCenter(loadFXML("StudyDeck-view", timersManagerService));
		setActiveMenuButton(studyDeckButton);
	}

	private Pane loadFXML(String fxml, TimersManagerService timersManagerService) {
	    String resourcePath = PATH + fxml + ".fxml";
	    URL resource = MainController.class.getResource(resourcePath);
	    
	    if (resource == null) {
	        System.err.println("Ressource FXML introuvable : " + resourcePath);
	        return new Pane(); // Vue par défaut
	    }
	    
	    try {
	        FXMLLoader fxmlLoader = new FXMLLoader(resource);
	        fxmlLoader.setControllerFactory(controllerClass -> {
	            if (controllerClass == com.onyx.app.controller.TimersController.class) {
	                return new com.onyx.app.controller.TimersController(timersManagerService);
	            } else if (controllerClass == com.onyx.app.controller.StudyDeckController.class) {
	                return new com.onyx.app.controller.StudyDeckController(timersManagerService.getSubjectRepository());
	            } else {
	                // default behavior for other controllers
	                try {
	                    return controllerClass.newInstance();
	                } catch (Exception e) {
	                    throw new RuntimeException(e);
	                }
	            }
	        });
	        return fxmlLoader.load();
	    } catch (IOException e) {
	        System.err.println("Erreur de chargement : " + e.getMessage());
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
}
