package com.onyx.app.controller;

import com.onyx.app.model.TimerConfigResult;
import com.onyx.app.service.TimerService;

import javafx.fxml.FXML;
import javafx.scene.control.Button;
import javafx.scene.control.Label;
import javafx.scene.control.TextField;

/**
 * Contrôleur principal du minuteur ONYX. Gère l'affichage et les interactions
 * utilisateur. La logique métier est déléguée au TimerService.
 */
public class TimerController {
	private static final String DEMARRER_BUTTON = "demarre-button";
	private static final String PAUSE_BUTTON = "pause-button";

	@FXML
	private Label timeLabel;
	@FXML
	private Label courseLabel;
	@FXML
	private Button startBtn, resetBtn;
	@FXML
	private TextField timeEditField;

	private TimerService timerService;
	private TimersController parentController;
	private String linkedCourse = null;

	// ========================================
	// INITIALISATION ET CONFIGURATION
	// ========================================

	/**
	 * Initialise le contrôleur avec le service Timer
	 */
	@FXML
	public void initialize() {
		// Le service sera défini via setTimerService()
		// Configurer le champ de saisie
		// timeEditField.setTextFormatter(TimeFormatService.createTimeFormatter());
		
		// setupClickOutsideListener();
		updateCourseDisplay();
	}

	/**
	 * Définit un modèle de timer existant
	 */
	// public void setModel(TimerModel model) {
	// 	timerService.setTimerModel(model);
	// 	updateDisplay();
	// }

	/**
	 * Définit le service Timer à utiliser
	 */
	public void setTimerService(TimerService service) {
		this.timerService = service;
		// Un seul callback pour toute la synchronisation
		timerService.setOnStateChanged(this::updateDisplay);
		timerService.setOnTimerFinished(this::handleTimerFinished);
		updateDisplay();
	}
	
	/**
	 * Configure l'écouteur pour détecter les clics en dehors du champ d'édition
	 */
	// private void setupClickOutsideListener() {
	// 	timeEditField.sceneProperty().addListener((observable, oldScene, newScene) -> {
	// 		if (newScene != null) {
	// 			newScene.addEventFilter(MouseEvent.MOUSE_PRESSED, event -> {
	// 				if (timeEditField.isVisible()) {
	// 					Node clickedNode = (Node) event.getTarget();
	// 					if (!isNodeInHierarchy(timeEditField, clickedNode)) {
	// 						finishEditing();
	// 					}
	// 				}
	// 			});
	// 		}
	// 	});
	// }

	/**
	 * Vérifie si un nœud fait partie de la hiérarchie d'un parent
	 */
	// private boolean isNodeInHierarchy(Node parent, Node child) {
	// 	if (child == null) return false;

	// 	Node current = child;
	// 	while (current != null) {
	// 		if (current == parent) {
	// 			return true;
	// 		}
	// 		current = current.getParent();
	// 	}
	// 	return false;
	// }

	// ========================================
	// GESTIONNAIRES D'ÉVÉNEMENTS FXML
	// ========================================

	/**
	 * Ouvre la boîte de dialogue de configuration moderne (style Windows Clock)
	 */
	@FXML
	private void openConfigDialog() {
		if (parentController != null) {
			parentController.showTimerConfigDialog(this);
		} else {
			System.err.println("Parent controller not found!");
		}
	}

	public void handleDialogResult(TimerConfigResult result) {
		if (result != null) {
			// Appliquer la configuration
			timerService.setTimer(result.getHours(), result.getMinutes(), result.getSeconds());
			
			// Mettre à jour le cours lié
			linkedCourse = result.getCourse();
			updateCourseDisplay();
			
			updateDisplay();
		}
	}

	/**
	 * Met à jour l'affichage du cours lié
	 */
	private void updateCourseDisplay() {
		if (linkedCourse != null && !linkedCourse.isEmpty()) {
			courseLabel.setText("Lié à : " + linkedCourse);
		} else {
			courseLabel.setText("Aucun cours lié");
		}
	}

	/**
	 * Gère le bouton Démarrer/Pause
	 */
	@FXML
	public void handleStartPause() {
		timerService.toggleTimer();
	}

	/**
	 * Réinitialise le minuteur
	 */
	@FXML
	public void handleReset() {
		timerService.resetTimer();
		//updateDisplay();
	}

	// ========================================
	// GESTION DE L'ÉDITION DE TEMPS
	// ========================================

	/**
	 * Démarre le mode édition du temps
	 */
	// @FXML
	// public void startEditing() {
	// 	if (timerService.isRunning()) {
	// 		timerService.pauseTimer();
	// 	}

	// 	timeEditField.setText(timerService.getFormattedTime());
	// 	timeEditField.setManaged(true);
	// 	timeEditField.setVisible(true);
	// 	timeLabel.setVisible(false);
	// 	timeLabel.setManaged(false);

	// 	timeEditField.requestFocus();
	// 	timeEditField.selectAll();
	// }

	/**
	 * Termine le mode édition du temps
	 */
	// @FXML
	// private void finishEditing() {
	// 	String text = timeEditField.getText();

	// 	if (TimeFormatService.isValidTimeFormat(text)) {
	// 		TimeFormatService.TimeValues timeValues = TimeFormatService.parseTimeFromText(text);
	// 		if (timeValues != null) {
	// 			timerService.setTimer(timeValues.getHours(), timeValues.getMinutes(), timeValues.getSeconds());
	// 		}
	// 	}
		
	// 	timeEditField.setVisible(false);
	// 	timeEditField.setManaged(false);
	// 	timeLabel.setVisible(true);
	// 	timeLabel.setManaged(true);
	// }

	// ========================================
	// MISE À JOUR DE L'AFFICHAGE
	// ========================================

	/**
	 * Met à jour l'affichage du timer
	 */
	private void updateDisplay() {
		timeLabel.setText(timerService.getFormattedTime());
		updateButtonStates();
	}

	/**
	 * Met à jour l'état des boutons selon l'état du timer
	 */
	private void updateButtonStates() {
		boolean isFinished = timerService.isFinished();
		boolean isRunning = timerService.isRunning();
		boolean canReset = timerService.canReset();
		
		// Bouton Start/Pause
		startBtn.setDisable(isFinished);
		startBtn.setVisible(!isFinished);
		startBtn.setManaged(!isFinished);
		startBtn.getStyleClass().removeAll(DEMARRER_BUTTON, PAUSE_BUTTON);
		startBtn.getStyleClass().add(isRunning ? PAUSE_BUTTON : DEMARRER_BUTTON);
		startBtn.setText(isRunning ? "Pause" : "Démarrer");
		
		// Bouton Reset
		resetBtn.setDisable(!canReset);
		resetBtn.setVisible(canReset);
		resetBtn.setManaged(canReset);
	}

	/**
	 * Gère la fin du timer
	 */
	private void handleTimerFinished() {
		// Le service gère déjà l'alarme sonore
		// Ici on peut ajouter des actions spécifiques à l'UI si nécessaire
		System.out.println("Timer termine !");
		updateButtonStates();
	}

	// ========================================
	// GETTERS POUR L'INTERFACE
	// ========================================

	/**
	 * Retourne le temps formaté pour l'affichage
	 */
	public String getFormattedTime() {
		return timerService.getFormattedTime();
	}

	/**
	 * Retourne le service Timer pour accès externe
	 */
	public TimerService getTimerService() {
		return timerService;
	}

	/**
	 * Nettoie les ressources
	 */
	public void dispose() {
		if (timerService != null) {
			timerService.dispose();
		}
	}

	/**
	 * Définit le contrôleur parent (TimersController)
	 */
	public void setParentController(TimersController parent) {
		this.parentController = parent;
	}
}
