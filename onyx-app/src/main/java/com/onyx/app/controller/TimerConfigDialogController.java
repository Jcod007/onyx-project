package com.onyx.app.controller;

import javafx.fxml.FXML;
import javafx.scene.control.TextField;
import com.onyx.app.service.TimeFormatService;
import com.onyx.app.model.TimerConfigResult;
import javafx.scene.control.ComboBox;
import javafx.scene.control.Button;
import javafx.scene.layout.VBox;
import javafx.stage.Stage;

public class TimerConfigDialogController {

	@FXML
	private TextField timerTextFliedConfig;
	@FXML
	private ComboBox<String> timerTypeComboBox;
	@FXML
	private ComboBox<String> courseComboBox;
	@FXML
	private VBox associatedCourseSection;
	@FXML
	private Button cancelButton;
	@FXML
	private Button okButton;
	
	public void initialize()
	{
		timerTextFliedConfig.setTextFormatter(TimeFormatService.createTimeFormatter());
		
		// Écouter les changements de sélection du type de timer
		timerTypeComboBox.valueProperty().addListener((observable, oldValue, newValue) -> {
			updateAssociatedCourseVisibility(newValue);
		});
		
		// Configurer le bouton Cancel
		cancelButton.setOnAction(e -> handleCancel());
	}
	
	/**
	 * Gère le clic sur le bouton Cancel
	 */
	private void handleCancel() {
		// Fermer la fenêtre/overlay
		Stage stage = (Stage) cancelButton.getScene().getWindow();
		if (stage != null) {
			stage.close();
		}
	}
	
	/**
	 * Met à jour la visibilité de la section "Associated course"
	 */
	private void updateAssociatedCourseVisibility(String selectedType) {
		if (selectedType != null && selectedType.contains("Study session")) {
			associatedCourseSection.setVisible(true);
			associatedCourseSection.setManaged(true);
		} else {
			associatedCourseSection.setVisible(false);
			associatedCourseSection.setManaged(false);
		}
	}

	public TimerConfigResult getResult() {
        String timeText = timerTextFliedConfig.getText();
        TimeFormatService.TimeValues timeValues = TimeFormatService.parseTimeFromText(timeText);
        
        return new TimerConfigResult(
            timeValues != null ? timeValues.getHours() : 0,
            timeValues != null ? timeValues.getMinutes() : 0,
            timeValues != null ? timeValues.getSeconds() : 0,
            timerTypeComboBox.getValue(),
            courseComboBox.getValue()
        );
    }
}
		