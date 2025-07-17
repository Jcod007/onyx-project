package Test;

import java.util.Arrays;
import java.util.Optional;

import javafx.application.Application;
import javafx.geometry.Insets;
import javafx.scene.Scene;
import javafx.scene.control.Alert;
import javafx.scene.control.Button;
import javafx.scene.control.ButtonBar.ButtonData;
import javafx.scene.control.ButtonType;
import javafx.scene.control.ChoiceDialog;
import javafx.scene.control.Dialog;
import javafx.scene.control.Label;
import javafx.scene.control.PasswordField;
import javafx.scene.control.TextField;
import javafx.scene.control.TextInputDialog;
import javafx.scene.layout.GridPane;
import javafx.scene.layout.VBox;
import javafx.stage.Stage;
import javafx.util.Pair;

public class App extends Application {

    public static void main(String[] args) {
        launch(args);
    }

    @Override
    public void start(Stage primaryStage) {
        // Création des boutons
        Button btnInfo = new Button("Alerte d'information");
        Button btnErreur = new Button("Alerte d'erreur");
        Button btnConfirmation = new Button("Confirmation");
        Button btnSaisieTexte = new Button("Saisie de texte");
        Button btnChoix = new Button("Dialogue de choix");
        Button btnPersonnalise = new Button("Dialogue personnalisé");

        // Actions des boutons
        btnInfo.setOnAction(e -> showInformationAlert());
        btnErreur.setOnAction(e -> showErrorAlert());
        btnConfirmation.setOnAction(e -> showConfirmationDialog());
        btnSaisieTexte.setOnAction(e -> showTextInputDialog());
        btnChoix.setOnAction(e -> showChoiceDialog());
        btnPersonnalise.setOnAction(e -> showCustomDialog());

        // Disposition des éléments
        VBox root = new VBox(10);
        root.setPadding(new Insets(15));
        root.getChildren().addAll(
                btnInfo, btnErreur, btnConfirmation, 
                btnSaisieTexte, btnChoix, btnPersonnalise
        );

        // Configuration de la scène
        Scene scene = new Scene(root, 300, 300);
        primaryStage.setTitle("Exemples de dialogues JavaFX");
        primaryStage.setScene(scene);
        primaryStage.show();
    }

    private void showInformationAlert() {
        Alert alert = new Alert(Alert.AlertType.INFORMATION);
        alert.setTitle("Information");
        alert.setHeaderText("Ceci est un message d'information");
        alert.setContentText("L'opération s'est déroulée avec succès !");
        alert.showAndWait();
    }

    private void showErrorAlert() {
        Alert alert = new Alert(Alert.AlertType.ERROR);
        alert.setTitle("Erreur");
        alert.setHeaderText("Une erreur est survenue");
        alert.setContentText("Impossible de compléter l'opération demandée.");
        alert.showAndWait();
    }

    private void showConfirmationDialog() {
        Alert alert = new Alert(Alert.AlertType.CONFIRMATION);
        alert.setTitle("Confirmation");
        alert.setHeaderText("Voulez-vous vraiment supprimer ce fichier ?");
        alert.setContentText("Cette action est irréversible.");

        Optional<ButtonType> result = alert.showAndWait();
        if (result.isPresent() && result.get() == ButtonType.OK) {
            System.out.println("Fichier supprimé !");
        } else {
            System.out.println("Suppression annulée.");
        }
    }

    private void showTextInputDialog() {
        TextInputDialog dialog = new TextInputDialog("Jean");
        dialog.setTitle("Saisie de texte");
        dialog.setHeaderText("Veuillez entrer votre prénom");
        dialog.setContentText("Prénom:");

        Optional<String> result = dialog.showAndWait();
        result.ifPresent(name -> System.out.println("Bonjour, " + name + " !"));
    }

    private void showChoiceDialog() {
        ChoiceDialog<String> dialog = new ChoiceDialog<>("Français", 
            Arrays.asList("Français", "Anglais", "Espagnol", "Allemand"));
        dialog.setTitle("Choix de langue");
        dialog.setHeaderText("Sélectionnez votre langue préférée");
        dialog.setContentText("Langues disponibles:");

        Optional<String> result = dialog.showAndWait();
        result.ifPresent(langue -> System.out.println("Langue sélectionnée: " + langue));
    }

    private void showCustomDialog() {
        Dialog<Pair<String, String>> dialog = new Dialog<>();
        dialog.setTitle("Connexion");
        dialog.setHeaderText("Entrez vos identifiants de connexion");

        // Boutons
        ButtonType loginButtonType = new ButtonType("Se connecter", ButtonData.OK_DONE);
        dialog.getDialogPane().getButtonTypes().addAll(loginButtonType, ButtonType.CANCEL);

        // Champs de saisie
        GridPane grid = new GridPane();
        grid.setHgap(10);
        grid.setVgap(10);
        grid.setPadding(new Insets(20, 150, 10, 10));

        TextField username = new TextField();
        username.setPromptText("Nom d'utilisateur");
        PasswordField password = new PasswordField();
        password.setPromptText("Mot de passe");

        grid.add(new Label("Nom d'utilisateur:"), 0, 0);
        grid.add(username, 1, 0);
        grid.add(new Label("Mot de passe:"), 0, 1);
        grid.add(password, 1, 1);

        dialog.getDialogPane().setContent(grid);

        // Conversion du résultat
        dialog.setResultConverter(dialogButton -> {
            if (dialogButton == loginButtonType) {
                return new Pair<>(username.getText(), password.getText());
            }
            return null;
        });

        Optional<Pair<String, String>> result = dialog.showAndWait();

        result.ifPresent(credentials -> {
            System.out.println("Nom d'utilisateur=" + credentials.getKey() 
                + ", Mot de passe=" + credentials.getValue());
        });
    }
}