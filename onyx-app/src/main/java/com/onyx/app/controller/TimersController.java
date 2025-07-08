package com.onyx.app.controller;

import java.io.IOException;

import com.onyx.app.model.TimerModel;

import javafx.fxml.FXML;
import javafx.fxml.FXMLLoader;
import javafx.scene.layout.FlowPane;
import javafx.scene.layout.VBox;

public class TimersController {

	@FXML
	private FlowPane timersList;

	@FXML
	private void handleCreateTimer() throws IOException {
	    FXMLLoader loader = new FXMLLoader(
	        getClass().getResource("/com/onyx/app/view/timer-view.fxml")
	    );
	    VBox timerCard = loader.load();

//	    // Optionnel : personnaliser le timer
	    TimerController timerController = loader.getController();
	    TimerModel timer = new TimerModel((byte)0,(byte)3,(byte)5);
	    
	    timerController.setModel(timer);
	    timersList.getChildren().add(timerCard);
	}

}
