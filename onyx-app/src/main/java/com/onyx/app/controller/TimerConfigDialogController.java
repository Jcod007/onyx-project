package com.onyx.app.controller;

import javafx.fxml.FXML;
import javafx.scene.control.TextField;
import com.onyx.app.service.TimeFormatService;
import com.onyx.app.model.TimerConfigResult;
import javafx.scene.control.ComboBox;
import javafx.scene.control.Button;
import javafx.scene.layout.VBox;
import javafx.stage.Stage;
import com.onyx.app.controller.TimerController;
import javafx.scene.control.Label;

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
	@FXML
	private Label statusLabel;
	
	public void initialize()
	{
		timerTextFliedConfig.setTextFormatter(TimeFormatService.createTimeFormatter());
		
		// Écouter les changements de sélection du type de timer
		timerTypeComboBox.valueProperty().addListener((observable, oldValue, newValue) -> {
			updateAssociatedCourseVisibility(newValue);
			updateStatusLabel();
		});
		// Écouter les changements de sélection du cours
		courseComboBox.valueProperty().addListener((observable, oldValue, newValue) -> {
			updateStatusLabel();
		});
		// Configurer le bouton Cancel
		cancelButton.setOnAction(e -> handleCancel());
		// Initialiser le label
		updateStatusLabel();
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

	public void setExistingTimerData(TimerController existingTimerController) {
		// On suppose que le TimerController expose le type et le cours lié
		// (il faut que ces infos soient stockées dans TimerController)
		try {
			// Récupérer le type de timer et le cours lié
			String timerType = null;
			String course = null;
			// Si TimerController expose des getters, utilisez-les ici
			java.lang.reflect.Field typeField = existingTimerController.getClass().getDeclaredField("linkedCourse");
			typeField.setAccessible(true);
			course = (String) typeField.get(existingTimerController);
			// On suppose que le type de timer est "Study session" si un cours est lié
			if (course != null && !course.isEmpty()) {
				timerType = "📖 Study session";
			} else {
				timerType = "🆓 Free session";
			}
			// Pré-remplir les ComboBox
			timerTypeComboBox.setValue(timerType);
			updateAssociatedCourseVisibility(timerType);
			if (course != null && !course.isEmpty()) {
				courseComboBox.setValue(course);
			}
			updateStatusLabel();
		} catch (Exception e) {
			e.printStackTrace();
		}
	}

	private void updateStatusLabel() {
		String timerType = timerTypeComboBox.getValue();
		String course = courseComboBox.getValue();
		if (timerType != null && timerType.contains("Study session")) {
			if (course != null && !course.isEmpty()) {
				statusLabel.setText("Lié à : " + course);
			} else {
				statusLabel.setText("Aucun cours lié");
			}
			statusLabel.setVisible(true);
			statusLabel.setManaged(true);
		} else {
			statusLabel.setText("");
			statusLabel.setVisible(false);
			statusLabel.setManaged(false);
		}
	}
}
		