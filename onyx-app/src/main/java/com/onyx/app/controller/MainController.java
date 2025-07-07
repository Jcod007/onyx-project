package com.onyx.app.controller;

import java.io.IOException;
import java.net.URL;

import javafx.fxml.FXML;
import javafx.fxml.FXMLLoader;
import javafx.scene.layout.BorderPane;
import javafx.scene.layout.Pane;

public class MainController {

	@FXML
	private BorderPane mainPane;
	private static final String PATH = "/com/onyx/app/view/";

	@FXML
	public void handleDashboard() {
		
	}

	@FXML
	public void handleTimer() {
		mainPane.setCenter(loadFXML("Timer-view"));
	}

	@FXML
	public void handleStudyDeck() {
		mainPane.setCenter(loadFXML("StudyDeck-view"));
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
