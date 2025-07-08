package com.onyx.app.controller;

import java.io.IOException;
import java.net.URL;

import javafx.fxml.FXML;
import javafx.fxml.FXMLLoader;
import javafx.scene.layout.Pane;
import javafx.scene.layout.StackPane;

public class MainController {

	@FXML
	private StackPane mainContent;
	private static final String PATH = "/com/onyx/app/view/";

	@FXML
	public void handleDashboard() {
		
	}

	@FXML
	public void handleTimer() {
		mainContent.getChildren().setAll(loadFXML("TimersController-view"));
	}

	@FXML
	public void handleStudyDeck() {
		mainContent.getChildren().setAll(loadFXML("StudyDeck-view"));
	}

	private Pane loadFXML(String fxml) {
	    String resourcePath = PATH +fxml + ".fxml";
	    URL resource = MainController.class.getResource(resourcePath);
	    
	    if (resource == null) {
	        System.err.println("Ressource FXML introuvable : " + resourcePath);
	        return new Pane(); // Vue par défaut
	    }
	    
	    try {
	        return FXMLLoader.load(resource);
	    } catch (IOException e) {
	        System.err.println("Erreur de chargement : " + e.getMessage());
	        return new Pane();
	    }
	}
}
