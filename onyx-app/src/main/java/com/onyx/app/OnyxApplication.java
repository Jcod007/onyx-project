package com.onyx.app;

import javafx.application.Application;
import javafx.fxml.FXMLLoader;
import javafx.scene.Parent;
import javafx.scene.Scene;
import javafx.stage.Stage;

import java.io.IOException;

/**
 * JavaFX App
 */
public class OnyxApplication extends Application {

    private static Scene scene;
    private final String title = "Onyx Timer";

    @Override
    public void start(Stage stage) throws IOException {
        scene = new Scene(loadFXML("/com/onyx/app/StudyDeck-view"), 640, 480);
        stage.setScene(scene);
        stage.setTitle(title);
        stage.show();
    }

    static void setRoot(String fxml) throws IOException {
        scene.setRoot(loadFXML(fxml));
    }

    private static Parent loadFXML(String fxml) throws IOException {
        FXMLLoader fxmlLoader = new FXMLLoader(OnyxApplication.class.getResource(fxml + ".fxml"));
        return fxmlLoader.load();
    }

    public static void main(String[] args) {
        launch();
    }

}