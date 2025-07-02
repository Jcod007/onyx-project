package com.app.timer.controller;

import com.app.timer.model.TimerModel;

import javafx.animation.KeyFrame;
import javafx.animation.Timeline;
import javafx.fxml.FXML;
import javafx.scene.Node;
import javafx.scene.control.Button;
import javafx.scene.control.Label;
import javafx.scene.control.TextField;
import javafx.scene.control.TextFormatter;
import javafx.scene.input.MouseEvent;
import javafx.scene.media.AudioClip;
import javafx.util.Duration;

/**
 * Contrôleur principal du minuteur ONYX. Gère l'affichage, les interactions
 * utilisateur et la logique de décompte du temps.
 */
public class TimerController {
	private static final String DEMARRER_BUTTON = "demarre-button";
	private static final String PAUSE_BUTTON = "pause-button";
	private AudioClip sound;

	@FXML
	private Label timeLabel;
	@FXML
	private Button startBtn, resetBtn;
//	@FXML
//	private VBox settingsBox;
//	@FXML
//	private TextField hoursField, minutesField, secondsField;
	@FXML
	private TextField timeEditField;

	private TimerModel model;
	private Timeline timeline;
	private boolean isRunning, canReset;

	// ========================================
	// INITIALISATION ET CONFIGURATION
	// ========================================

	/**
	 * Initialise le contrôleur, configure les champs numériques, le modèle initial
	 * et la timeline.
	 */
	@FXML
	public void initialize() {
//		setNumericOnly(hoursField);
//		setNumericOnly(minutesField);
//		setNumericOnly(secondsField);
		sound = new AudioClip(TimerController.class.getResource("/sounds/timerSound.mp3").toString());
		sound.setCycleCount(AudioClip.INDEFINITE);
		timeEditField.setTextFormatter(createShiftFormatter());
		model = new TimerModel((byte) 0, (byte) 0, (byte) 5);
		timelineInitialize();
		setupClickOutsideListener();
		updateDisplay();
	}

	private void setupClickOutsideListener() {
		// Attendre que le timeEditField soit attaché à une scène
		timeEditField.sceneProperty().addListener((observable, oldScene, newScene) -> {
			if (newScene != null) {
				// Ajouter un EventFilter pour capturer TOUS les clics de souris
				newScene.addEventFilter(MouseEvent.MOUSE_PRESSED, event -> {
					// Vérifier si le timeEditField est actuellement visible (en mode édition)
					if (timeEditField.isVisible()) {
						// Obtenir le nœud qui a été cliqué
						Node clickedNode = (Node) event.getTarget();

						// Si le clic n'est pas sur le timeEditField ou ses descendants
						if (!isNodeInHierarchy(timeEditField, clickedNode)) {
							finishEditing();
//	                        event.consume(); // Optionnel : empêcher la propagation
						}
					}
				});
			}
		});
	}

	// Méthode utilitaire pour vérifier si un nœud fait partie de la hiérarchie d'un
	// parent
	private boolean isNodeInHierarchy(Node parent, Node child) {
		if (child == null)
			return false;

		Node current = child;
		while (current != null) {
			if (current == parent) {
				return true;
			}
			current = current.getParent();
		}
		return false;
	}

	/**
	 * Initialise la timeline qui gère la décrémentation.
	 */
	private void timelineInitialize() {
		timeline = new Timeline(new KeyFrame(Duration.seconds(1), e -> {
			model.decrement();
			updateDisplay();
			if (model.isFinished()) {
				sound.play();
				stopTimer();
			}

		}));
		timeline.setCycleCount(Timeline.INDEFINITE);
	}

	// ========================================
	// GESTIONNAIRES D'ÉVÉNEMENTS FXML
	// ========================================

	/**
	 * Gère le clic sur le bouton OK : lit les champs et met à jour le modèle.
	 */
//	@FXML
//	public void handleOK() {
//		try {
//			byte hours = parseByteSafe(hoursField.getText());
//			byte minutes = parseByteSafe(minutesField.getText());
//			byte seconds = parseByteSafe(secondsField.getText());
//			model = new TimerModel(hours, minutes, seconds);
//			updateDisplay();
//		} catch (NumberFormatException e) {
//			System.err.println("Erreur de saisie : " + e.getMessage());
//		}
//	}


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
		sound.stop();
		updateDisplay();
	}

	/**
	 * Affiche ou masque la boîte de réglages.
	 */
//	@FXML
//	public void toggleSettingsBox() {
//		boolean isVisible = settingsBox.isVisible();
//		settingsBox.setVisible(!isVisible);
//		settingsBox.setManaged(!isVisible);
//	}

	// ========================================
	// GESTION DE L'ÉDITION DE TEMPS
	// ========================================

	@FXML
	public void startEditing() {
		if (isRunning) {
			timeline.pause();
			isRunning = false;
			updateButtonStates(); // Mettre à jour l'état des boutons
		}

		timeEditField.setText(model.getFormattedTime());
		timeEditField.setManaged(true);
		timeEditField.setVisible(true);
		timeLabel.setVisible(false);
		timeLabel.setManaged(false);

		timeEditField.requestFocus();
		timeEditField.selectAll();
	}

	@FXML
	private void finishEditing() {
		String text = timeEditField.getText();

		if (text != null && text.matches("\\d{2}:\\d{2}:\\d{2}")) {
			parseTextToModel(text);
			updateDisplay();
		}
		timeEditField.setVisible(false);
		timeEditField.setManaged(false);
		timeLabel.setVisible(true);
		timeLabel.setManaged(true);

	}

	private void parseTextToModel(String text) {
		String[] parts = text.split(":");
		byte h, m, s;

		if (parts.length == 3) {
			// Format HH:MM:SS
			h = Byte.parseByte(parts[0]);
			m = Byte.parseByte(parts[1]);
			s = Byte.parseByte(parts[2]);
		} else if (parts.length == 2) {
			// Format MM:SS (pas d'heures)
			h = 0;
			m = Byte.parseByte(parts[0]);
			s = Byte.parseByte(parts[1]);
		} else if (parts.length == 1) {
			// Format SS (que des secondes)
			h = 0;
			m = 0;
			s = Byte.parseByte(parts[0]);
		} else {
			// Format invalide, garder les valeurs actuelles
			return;
		}

		model = new TimerModel(h, m, s);
	}

	// ========================================
	// GESTION DU MINUTEUR
	// ========================================

	/**
	 * Arrête le minuteur et réinitialise les indicateurs d'état.
	 */
	private void stopTimer() {
		timeline.stop();
		isRunning = false;
		canReset = false;
	}

	// ========================================
	// MISE À JOUR DE L'AFFICHAGE
	// ========================================

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

	// ========================================
	// FORMATAGE ET VALIDATION DES CHAMPS
	// ========================================

	/**
	 * Applique une restriction sur le champ de texte pour n'accepter que des
	 * chiffres (max 2).
	 * 
	 * @param field le champ de texte à restreindre
	 */
//	private void setNumericOnly(TextField field) {
//		field.setTextFormatter(new TextFormatter<>(change -> {
//			String newText = change.getControlNewText();
//			return newText.matches("\\d{0,2}") ? change : null;
//		}));
//	}

	private TextFormatter<String> createShiftFormatter() {
		return new TextFormatter<>(change -> {
			String oldText = change.getControlText();
			String newText = change.getControlNewText();

			// Détecter le type de changement
			boolean isDeletion = newText.length() < oldText.length();
			boolean isInsertion = !change.getText().isEmpty();

			if (isDeletion) {
				// Gestion de la suppression
				String oldDigits = oldText.replace(":", "");

				// Si on a encore des chiffres à décaler
				if (oldDigits.length() > 0) {
					// Décalage à DROITE : enlever le dernier chiffre et ajouter un 0 au début
					String newDigits = "0" + oldDigits.substring(0, oldDigits.length() - 1);
					String rebuilt = formatDigits(newDigits);

					change.setText(rebuilt);
					change.setRange(0, oldText.length());
					change.setCaretPosition(rebuilt.length());
					change.setAnchor(rebuilt.length());

					return change;
				} else {
					// Si plus de chiffres, remettre à zéro
					change.setText("00:00:00");
					change.setRange(0, oldText.length());
					change.setCaretPosition(8);
					change.setAnchor(8);

					return change;
				}
			}

			if (isInsertion) {
				String insertedText = change.getText();

				// Filtrer uniquement les chiffres
				String onlyDigits = insertedText.replaceAll("\\D", "");

				if (onlyDigits.isEmpty()) {
					return null; // Rien à insérer
				}

				String currentDigits = oldText.replace(":", "");
				String newDigits = currentDigits + onlyDigits;

				// Limiter à 6 chiffres
				if (newDigits.length() > 6) {
					newDigits = newDigits.substring(newDigits.length() - 6);
				}

				String rebuilt = formatDigits(newDigits);

				// Validation
//	            if (!isValidTime(rebuilt)) {
//	                return null;
//	            }

				change.setText(rebuilt);
				change.setRange(0, oldText.length());
				change.setCaretPosition(rebuilt.length());
				change.setAnchor(rebuilt.length());

				return change;
			}

			// Rejeter les autres types de changements
			return null;
		});
	}

	private String formatDigits(String digits) {
		while (digits.length() < 6) {
			digits = "0" + digits;
		}
		return digits.substring(0, 2) + ":" + digits.substring(2, 4) + ":" + digits.substring(4, 6);
	}

	// ========================================
	// UTILITAIRES DE PARSING
	// ========================================

	/**
	 * Transforme une saisie en byte, retourne 0 si vide.
	 * 
	 * @param input la saisie de l'utilisateur
	 * @return la valeur en byte
	 */
//	private byte parseByteSafe(String input) {
//		if (input == null || input.trim().isEmpty())
//			return 0;
//		return Byte.parseByte(input.trim());
//	}
}
