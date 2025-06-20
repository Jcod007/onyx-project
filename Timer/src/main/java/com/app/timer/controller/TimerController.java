package com.app.timer.controller;

import com.app.timer.model.TimerModel;

import javafx.animation.KeyFrame;
import javafx.animation.Timeline;
import javafx.fxml.FXML;
import javafx.scene.control.Button;
import javafx.scene.control.Label;
import javafx.scene.control.TextField;
import javafx.scene.control.TextFormatter;
import javafx.scene.layout.VBox;
import javafx.util.Duration;

/**
 * Contrôleur principal du minuteur ONYX.
 * Gère l'affichage, les interactions utilisateur et la logique de décompte du temps.
 */
public class TimerController {
	private static final String DEMARRER_BUTTON = "demarre-button";
	private static final String PAUSE_BUTTON = "pause-button";

	@FXML private Label timeLabel;
	@FXML private Button startBtn, resetBtn;
	@FXML private VBox settingsBox;
	@FXML private TextField hoursField, minutesField, secondsField;

	private TimerModel model;
	private Timeline timeline;
	private boolean isRunning, canReset;

	/**
	 * Initialise le contrôleur, configure les champs numériques,
	 * le modèle initial et la timeline.
	 */
	@FXML
	public void initialize() {
		setNumericOnly(hoursField);
		setNumericOnly(minutesField);
		setNumericOnly(secondsField);
//		hoursField.setStyle("-fx-text-fill: red; -fx-font-size: 16px;");
//		minutesField.setStyle("-fx-text-fill: red; -fx-font-size: 16px;");
//		secondsField.setStyle("-fx-text-fill: red; -fx-font-size: 16px;");
		model = new TimerModel((byte) 0, (byte) 0, (byte) 12);
		timelineInitialize();
		updateDisplay();
	}

	/**
	 * Gère le clic sur le bouton OK : lit les champs et met à jour le modèle.
	 */
	@FXML
	public void handleOK() {
		try {
			byte hours = parseByteSafe(hoursField.getText());
			byte minutes = parseByteSafe(minutesField.getText());
			byte seconds = parseByteSafe(secondsField.getText());
			model = new TimerModel(hours, minutes, seconds);
			updateDisplay();
		} catch (NumberFormatException e) {
			System.err.println("Erreur de saisie : " + e.getMessage());
		}
	}

	/**
	 * Gère le bouton Démarrer/Pause en fonction de l'état du minuteur.
	 */
	@FXML
	public void handleStartPause() {
		if (!isRunning && !model.isFinished()) {
			timeline.play();
			isRunning = true;
			canReset = true;
		} else {
			timeline.pause();
			isRunning = false;
		}
		updateButtonStates();
	}

	/**
	 * Réinitialise le minuteur et l'affichage.
	 */
	@FXML
	public void handleReset() {
		stopTimer();
		model.reset();
		updateDisplay();
	}

	/**
	 * Affiche ou masque la boîte de réglages.
	 */
	@FXML
	public void toggleSettingsBox() {
		boolean isVisible = settingsBox.isVisible();
		settingsBox.setVisible(!isVisible);
		settingsBox.setManaged(!isVisible);
	}

	/**
	 * Arrête le minuteur et réinitialise les indicateurs d'état.
	 */
	private void stopTimer() {
		timeline.stop();
		isRunning = false;
		canReset = false;
	}

	/**
	 * Initialise la timeline qui gère la décrémentation.
	 */
	private void timelineInitialize() {
		timeline = new Timeline(new KeyFrame(Duration.seconds(1), e -> {
			model.decrement();
			updateDisplay();
			if (model.isFinished()) stopTimer();
		}));
		timeline.setCycleCount(Timeline.INDEFINITE);
	}

	/**
	 * Met à jour l'affichage du label et les boutons.
	 */
	private void updateDisplay() {
		updateButtonStates();
		timeLabel.setText(model.toString());
	}

	/**
	 * Active/désactive et met à jour les boutons selon l'état du minuteur.
	 */
	private void updateButtonStates() {
		boolean isFinished = model.isFinished();
		startBtn.setDisable(isFinished);
		startBtn.setVisible(!isFinished);
		startBtn.setManaged(!isFinished);
		startBtn.getStyleClass().removeAll(DEMARRER_BUTTON, PAUSE_BUTTON);
		startBtn.getStyleClass().add(isRunning ? PAUSE_BUTTON : DEMARRER_BUTTON);
		startBtn.setText(isRunning ? "Pause" : "Démarrer");
		resetBtn.setDisable(!canReset);
		resetBtn.setVisible(canReset);
		resetBtn.setManaged(canReset);
	}

	/**
	 * Applique une restriction sur le champ de texte pour n'accepter que des chiffres (max 2).
	 * @param field le champ de texte à restreindre
	 */
	private void setNumericOnly(TextField field) {
		field.setTextFormatter(new TextFormatter<>(change -> {
			String newText = change.getControlNewText();
			return newText.matches("\\d{0,2}") ? change : null;
		}));
	}

	/**
	 * Transforme une saisie en byte, retourne 0 si vide.
	 * @param input la saisie de l'utilisateur
	 * @return la valeur en byte
	 */
	private byte parseByteSafe(String input) {
		if (input == null || input.trim().isEmpty()) return 0;
		return Byte.parseByte(input.trim());
	}
}
