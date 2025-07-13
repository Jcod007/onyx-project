package com.onyx.app.controller;

import javafx.fxml.FXML;
import javafx.scene.control.TextField;
import javafx.scene.control.TextFormatter;

public class TimerConfigDialogController {

	@FXML
	private TextField timerTextFliedConfig;
	
	public void initialize()
	{
		timerTextFliedConfig.setTextFormatter(createShiftFormatter());
	}
	
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
}
