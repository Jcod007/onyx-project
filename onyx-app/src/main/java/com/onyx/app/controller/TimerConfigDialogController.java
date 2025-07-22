package com.onyx.app.controller;

import com.onyx.app.model.TimerConfigResult;
import com.onyx.app.model.TimerModel;
import com.onyx.app.model.Subject;
import com.onyx.app.service.TimeFormatService;
import com.onyx.app.service.TimerService;

import javafx.application.Platform;
import javafx.fxml.FXML;
import javafx.scene.control.Button;
import javafx.scene.control.ComboBox;
import javafx.scene.control.Label;
import javafx.scene.control.TextField;
import javafx.scene.layout.VBox;
import javafx.stage.Stage;

import java.util.List;
import com.onyx.app.model.StudyDeck;

import com.onyx.app.repository.SubjectRepository;

public class TimerConfigDialogController {

	@FXML
	private TextField timerTextFliedConfig;
	@FXML
	private ComboBox<String> timerTypeComboBox;
	@FXML
	private ComboBox<Subject> courseComboBox;
	@FXML
	private VBox associatedCourseSection;
	@FXML
	private Button cancelButton;
	@FXML
	private Button okButton;
	@FXML
	private Label statusLabel;

	private StudyDeck studyDeck;
	private SubjectRepository subjectRepository;
	
	public void initialize() {
		timerTextFliedConfig.setTextFormatter(TimeFormatService.createTimeFormatter());
		Platform.runLater(() -> {
            timerTextFliedConfig.requestFocus();
            if (!timerTextFliedConfig.getText().isEmpty()) {
                timerTextFliedConfig.positionCaret(1);
            }
        });
		// Désactivation dynamique du bouton OK selon la validité des champs
		timerTextFliedConfig.textProperty().addListener((obs, oldVal, newVal) -> validateForm());
		timerTypeComboBox.valueProperty().addListener((obs, oldVal, newVal) -> validateForm());
		courseComboBox.valueProperty().addListener((obs, oldVal, newVal) -> validateForm());
		validateForm();
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

	public void setStudyDeck(StudyDeck studyDeck) {
        this.studyDeck = studyDeck;
        courseComboBox.getItems().setAll(studyDeck.getSubjectList());
    }

	public void setSubjectRepository(SubjectRepository subjectRepository) {
		this.subjectRepository = subjectRepository;
		// Load all subjects into the courseComboBox
		if (subjectRepository != null) {
			courseComboBox.getItems().setAll(subjectRepository.findAll());
		}
	}
	
	/**
	 * Gère le clic sur le bouton Cancel
	 */
	@FXML
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
            (byte) (timeValues != null ? timeValues.hours() : 0),
            (byte) (timeValues != null ? timeValues.minutes() : 0),
            (byte) (timeValues != null ? timeValues.seconds() : 0),
            timerTypeComboBox.getValue(),
            courseComboBox.getValue()
        );
    }

	public void setExistingTimerData(TimerController existingTimerController) {
		try {
			TimerService timerService = existingTimerController.getTimerService();
			if (timerService != null && timerService.getTimerModel() != null) {
				TimerModel model = timerService.getTimerModel();
				// Pré-remplir le champ de temps
				String formattedTime = timerService.getFormattedTime();
				timerTextFliedConfig.setText(formattedTime);
				Platform.runLater(() -> {
					timerTextFliedConfig.requestFocus();
					if (!formattedTime.isEmpty()) {
						timerTextFliedConfig.positionCaret(1);
					}
				});
				// Pré-remplir le type de timer
				TimerModel.TimerType timerType = model.getTimerType();
				if (timerType != null) {
					timerTypeComboBox.setValue(timerType.toString());
					updateAssociatedCourseVisibility(timerType.toString());
				}
				// Pré-remplir le cours associé
				Subject subject = model.getLinkedSubject();
				if (subject != null) {
					courseComboBox.setValue(subject);
				}
				updateStatusLabel();
			}
		} catch (Exception e) {
			e.printStackTrace();
		}
	}

	private void updateStatusLabel() {
		String timerType = timerTypeComboBox.getValue();
		Subject course = courseComboBox.getValue();
	
		String s = "No associated course";
		if (timerType != null && timerType.contains("Study session")) {
			if (course != null) {
				statusLabel.setText("Lié à : " + course.getName());
			} else {
				statusLabel.setText(s);
			}
		} else if (timerType != null && timerType.contains("Free session")) {
			statusLabel.setText(s);
		} else {
			statusLabel.setText("");
		}
	
		statusLabel.setVisible(true);
		statusLabel.setManaged(true);
	}
	

	private void validateForm() {
		boolean timeEmpty = timerTextFliedConfig.getText().trim().isEmpty();
		boolean isTimeZero = timerTextFliedConfig.getText().trim().equals("00:00:00");
		boolean typeEmpty = timerTypeComboBox.getValue() == null || timerTypeComboBox.getValue().trim().isEmpty();
		boolean studySession = !typeEmpty && timerTypeComboBox.getValue().contains("Study session");
		boolean courseEmpty = courseComboBox.getValue() == null;
		boolean disable = timeEmpty || isTimeZero || typeEmpty || (studySession && courseEmpty);
		okButton.setDisable(disable);
	}

    public void forceCommitFields() {
        // Force la validation de la saisie en retirant le focus du champ
        if (timerTextFliedConfig != null && timerTextFliedConfig.getParent() != null) {
            timerTextFliedConfig.getParent().requestFocus();
        }
    }
}
		