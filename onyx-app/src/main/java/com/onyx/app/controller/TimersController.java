package com.onyx.app.controller;

import java.io.IOException;

import com.onyx.app.model.TimerConfigResult;
import com.onyx.app.service.TimerService;
import com.onyx.app.service.TimersManagerService;

import javafx.fxml.FXML;
import javafx.fxml.FXMLLoader;
import javafx.scene.Parent;
import javafx.scene.control.Button;
import javafx.scene.control.TextField;
import javafx.scene.layout.FlowPane;
import javafx.scene.layout.StackPane;
import javafx.scene.layout.VBox;

import com.onyx.app.model.Subject;

/**
 * Contrôleur pour gérer plusieurs timers
 * Utilise le TimersManagerService pour la logique métier
 */
public class TimersController {

	@FXML
	private FlowPane timersList;
	
	private final TimersManagerService timersManager;

	@FXML
	private StackPane configOverlay;

	public TimersController(TimersManagerService timersManager) {
		this.timersManager = timersManager;
	}

	/**
	 * Initialise le contrôleur avec le service de gestion des timers
	 */
	@FXML
	public void initialize() {
		// Load existing timers from the service
		for (TimerService timerService : timersManager.getAllTimers()) {
			try {
				VBox newTimerCard = createTimerCard(timerService);
				timersList.getChildren().add(newTimerCard);
			} catch (IOException e) {
				e.printStackTrace();
			}
		}

		// Configurer les callbacks pour les changements de liste
		timersManager.setOnTimersListChanged(this::refreshTimersList);
		timersManager.setOnActiveTimersChanged(this::updateActiveTimersDisplay);
	}

	/**
	 * Crée un nouveau timer et l'ajoute à l'interface
	 */
	@FXML
	private void handleCreateTimer() throws IOException {
		// Afficher d'abord la configuration pour créer un nouveau timer
		showTimerConfigDialog(null);
	}

	/**
	 * Crée l'interface utilisateur pour un timer
	 */
	private VBox createTimerCard(TimerService timerService) throws IOException {
		FXMLLoader loader = new FXMLLoader(
			getClass().getResource("/com/onyx/app/view/Timer-card-view.fxml")
		);
		VBox newTimerCard = (VBox) loader.load();

		// Configurer le contrôleur avec le service
		TimerController newTimerController = loader.<TimerController>getController();
		newTimerController.setTimerService(timerService);
		newTimerController.setParentController(this);
		newTimerController.setSubjectRepository(timersManager.getSubjectRepository());
		newTimerController.setTimerCardVBox(newTimerCard);
		
		return newTimerCard;
	}

	/**
	 * Met en pause tous les timers actifs
	 */
	@FXML
	private void handlePauseAllTimers() {
		timersManager.pauseAllTimers();
	}

	/**
	 * Arrête tous les timers
	 */
	@FXML
	private void handleStopAllTimers() {
		timersManager.stopAllTimers();
	}

	/**
	 * Supprime tous les timers
	 */
	@FXML
	private void handleClearAllTimers() {
		timersList.getChildren().clear();
		timersManager.removeAllTimers();
	}

	/**
	 * Rafraîchit la liste des timers dans l'interface
	 */
	private void refreshTimersList() {
		// Cette méthode peut être appelée quand la liste des timers change
		System.out.println("Nombre total de timers: " + timersManager.getTimersCount());
		System.out.println("Timers actifs: " + timersManager.getActiveTimersCount());
		System.out.println("Timers en cours: " + timersManager.getRunningTimersCount());
	}

	/**
	 * Met à jour l'affichage des timers actifs
	 */
	private void updateActiveTimersDisplay() {
		if (timersManager.hasRunningTimers()) {
			System.out.println("Il y a des timers en cours d'exécution");
		} else {
			System.out.println("Aucun timer en cours d'exécution");
		}
	}

	/**
	 * Retourne le service de gestion des timers
	 */
	public TimersManagerService getTimersManager() {
		return timersManager;
	}

	/**
	 * Nettoie les ressources
	 */
	public void dispose() {
		if (timersManager != null) {
			timersManager.dispose();
		}
	}

	/**
	 * Affiche la configuration du timer dans l'overlay
	 * @param existingTimerController Si non-null, modifie le timer existant. Si null, crée un nouveau timer.
	 */
	public void showTimerConfigDialog(TimerController existingTimerController) {
		try {
			FXMLLoader loader = new FXMLLoader(getClass().getResource("/com/onyx/app/view/Timer-config-dialog-view.fxml"));
			Parent configContent = loader.load();

			TimerConfigDialogController controller = loader.<TimerConfigDialogController>getController();
			controller.setSubjectRepository(timersManager.getSubjectRepository()); // Pass the SubjectRepository
			
			// Si on modifie un timer existant, pré-remplir les valeurs actuelles
			if (existingTimerController != null) {
				controller.setExistingTimerData(existingTimerController);
			}
			
			Button okButton = (Button) configContent.lookup("#okButton");
			Button cancelButton = (Button) configContent.lookup("#cancelButton");
			
			okButton.setOnAction(e -> {
				controller.forceCommitFields();
				TimerConfigResult result = controller.getResult();
				if (result != null) {
					if (existingTimerController != null) {
						// Modifier le timer existant
						existingTimerController.handleDialogResult(result);
					} else {
						// Créer un nouveau timer avec les paramètres configurés
						TimerService timerService = timersManager.createTimer(
							result.hours(),
							result.minutes(),
							result.seconds(),
							result.timerType(),
							result.subject()
						);
						// Créer l'interface utilisateur pour ce timer
						try {
							VBox newTimerCard = createTimerCard(timerService);
							// Ajouter à l'interface
							timersList.getChildren().add(newTimerCard);
						} catch (IOException ex) {
							ex.printStackTrace();
						}
					}
				}
				hideTimerConfigDialog();
			});
			
			cancelButton.setOnAction(e -> {
				hideTimerConfigDialog();
			});

			configOverlay.getChildren().setAll(configContent);
			configOverlay.setVisible(true);
			configOverlay.setManaged(true);
			configOverlay.setPickOnBounds(true);
		} catch (IOException e) {
			e.printStackTrace();
		}
	}

	/**
	 * Masque l'overlay de configuration
	 */
	/**
	 * Masque l'overlay de configuration
	 */
	public void hideTimerConfigDialog() {
		configOverlay.setVisible(false);
		configOverlay.setPickOnBounds(false);
		configOverlay.setManaged(false);
		configOverlay.getChildren().clear();
	}

	public void removeTimerCard(TimerController timerController) {
		TimerService timerServiceToRemove = timerController.getTimerService();
		if (timerServiceToRemove != null) {
			timersManager.removeTimer(timerServiceToRemove);
			// Remove the VBox from the FlowPane
			timersList.getChildren().remove(timerController.getTimerCard());
		}
	}
}
