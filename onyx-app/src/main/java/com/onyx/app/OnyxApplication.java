package com.onyx.app;

import com.onyx.app.repository.impl.JsonSubjectRepository;
import com.onyx.app.repository.impl.JsonTimerRepository;
import com.onyx.app.service.TimersManagerService;
import com.onyx.app.service.ResponsiveService;
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
    private ResponsiveService responsiveService;

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
        
        // Set the controller factory to inject services
        fxmlLoader.setControllerFactory(controllerClass -> {
            if (controllerClass == com.onyx.app.controller.MainController.class) {
                return new com.onyx.app.controller.MainController(timersManagerService);
            } else {
                // default behavior for other controllers
                try {
                    return controllerClass.getDeclaredConstructor().newInstance();
                } catch (Exception e) {
                    throw new RuntimeException(e);
                }
            }
        });

        Parent root = fxmlLoader.load();
        scene = new Scene(root, Constants.DEFAULT_WINDOW_WIDTH, Constants.DEFAULT_WINDOW_HEIGHT);
        
        // Add all responsive CSS stylesheets
        scene.getStylesheets().addAll(
                getClass().getResource("/com/onyx/app/styles/global.css").toExternalForm(),
                getClass().getResource("/com/onyx/app/styles/responsive-system.css").toExternalForm(),
                getClass().getResource("/com/onyx/app/styles/responsive-extensions.css").toExternalForm(),
                getClass().getResource("/com/onyx/app/styles/responsive-layout.css").toExternalForm()
        );
        
        // Configure stage with responsive constraints
        stage.setMinWidth(Constants.MIN_WINDOW_WIDTH);
        stage.setMinHeight(Constants.MIN_WINDOW_HEIGHT);
        stage.setScene(scene);
        stage.setTitle(title);
        
        // Initialize responsive service BEFORE showing the stage
        responsiveService = new ResponsiveService(stage, root);
        
        // Get MainController and initialize responsive service
        com.onyx.app.controller.MainController mainController = 
            (com.onyx.app.controller.MainController) fxmlLoader.getController();
        mainController.initializeResponsiveService(stage);
        
        stage.show();
    }

    static void setRoot(String fxml) throws IOException {
        scene.setRoot(loadFXML(fxml));
    }

    private static Parent loadFXML(String fxml) throws IOException {
        FXMLLoader fxmlLoader = new FXMLLoader(OnyxApplication.class.getResource(fxml + ".fxml"));
        return fxmlLoader.load();
    }

    @Override
    public void stop() throws Exception {
        // Cleanup responsive service resources
        if (responsiveService != null) {
            responsiveService.cleanup();
        }
        super.stop();
    }

    public static void main(String[] args) {
        launch();
    }

}