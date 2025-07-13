package com.onyx.app.controller;

import java.io.IOException;

import com.onyx.app.model.TimerModel;
import com.onyx.app.service.TimersManagerService;
import com.onyx.app.service.TimerService;

import javafx.fxml.FXML;
import javafx.fxml.FXMLLoader;
import javafx.scene.layout.FlowPane;
import javafx.scene.layout.VBox;

/**
 * Contrôleur pour gérer plusieurs timers
 * Utilise le TimersManagerService pour la logique métier
 */
public class TimersController {

	@FXML
	private FlowPane timersList;
	
	private TimersManagerService timersManager;

	/**
	 * Initialise le contrôleur avec le service de gestion des timers
	 */
	@FXML
	public void initialize() {
		timersManager = new TimersManagerService();
		
		// Configurer les callbacks pour les changements de liste
		timersManager.setOnTimersListChanged(this::refreshTimersList);
		timersManager.setOnActiveTimersChanged(this::updateActiveTimersDisplay);
	}

	/**
	 * Crée un nouveau timer et l'ajoute à l'interface
	 */
	@FXML
	private void handleCreateTimer() throws IOException {
		// Créer un nouveau timer via le service
		TimerService timerService = timersManager.createTimer();
		
		// Créer l'interface utilisateur pour ce timer
		VBox timerCard = createTimerCard(timerService);
		
		// Ajouter à l'interface
		timersList.getChildren().add(timerCard);
	}

	/**
	 * Crée l'interface utilisateur pour un timer
	 */
	private VBox createTimerCard(TimerService timerService) throws IOException {
		FXMLLoader loader = new FXMLLoader(
			getClass().getResource("/com/onyx/app/view/Timer-card-view.fxml")
		);
		VBox timerCard = loader.load();

		// Configurer le contrôleur avec le service
		TimerController timerController = loader.getController();
		timerController.setModel(timerService.getTimerModel());
		
		return timerCard;
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
}
