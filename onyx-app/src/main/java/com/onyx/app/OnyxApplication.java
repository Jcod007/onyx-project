package com.onyx.app;

import com.onyx.app.repository.impl.JsonSubjectRepository;
import com.onyx.app.repository.impl.JsonTimerRepository;
import com.onyx.app.service.TimersManagerService;
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
    private TimersManagerService timersManagerService;

    @Override
    public void init() throws Exception {
        super.init();
        // Initialize repositories and service here
        JsonTimerRepository timerRepository = new JsonTimerRepository();
        JsonSubjectRepository subjectRepository = new JsonSubjectRepository();
        timersManagerService = new TimersManagerService(timerRepository, subjectRepository);
    }

    @Override
    public void start(Stage stage) throws IOException {
        FXMLLoader fxmlLoader = new FXMLLoader(OnyxApplication.class.getResource("/com/onyx/app/view/Main-view.fxml"));
        // Set the controller factory to inject the service
        fxmlLoader.setControllerFactory(controllerClass -> {
            if (controllerClass == com.onyx.app.controller.MainController.class) {
                return new com.onyx.app.controller.MainController(timersManagerService);
            } else {
                // default behavior for other controllers
                try {
                    return controllerClass.newInstance();
                } catch (Exception e) {
                    throw new RuntimeException(e);
                }
            }
        });

        scene = new Scene(fxmlLoader.load(), 1000, 700);
        stage.setMinWidth(1000);
        stage.setMinHeight(700);
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