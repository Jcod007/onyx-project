package com.onyx.app.controller;

import java.io.IOException;
import java.time.Duration;
import com.onyx.app.model.StudyDeck;
import com.onyx.app.model.Subject;
import javafx.beans.binding.Bindings;
import javafx.beans.property.BooleanProperty;
import javafx.beans.property.SimpleBooleanProperty;
import javafx.fxml.FXML;
import javafx.fxml.FXMLLoader;
import javafx.scene.control.Button;
import javafx.scene.control.TextField;
import javafx.scene.control.TextFormatter;
import javafx.scene.layout.VBox;

public class StudyDeckController {

    @FXML private VBox coursesList;
    @FXML private VBox addCoursePane;
    @FXML private Button addCourseButton;
    @FXML private Button validateButton;
    @FXML private TextField courseNameField;
    @FXML private TextField courseDurationField;

    private final StudyDeck studyDeck = new StudyDeck();
    private final BooleanProperty formVisible = new SimpleBooleanProperty(false);

    @FXML
    public void initialize() {
        configureFormVisibility();
        setupFormValidation();
        setupInitialState();
        setupDurationField();
    }

    private void setupDurationField() {
        TextFormatter<String> durationFormatter = new TextFormatter<>(change -> {
            String newText = change.getControlNewText();
            if (newText.matches("\\d{0,2}h?\\d{0,2}")) { // Format "90" ou "1h30"
                return change;
            }
            return null;
        });
        courseDurationField.setTextFormatter(durationFormatter);
        courseDurationField.setPromptText("Ex: 90 ou 1h30");
    }

    private void configureFormVisibility() {
        addCoursePane.visibleProperty().bind(formVisible);
        addCoursePane.managedProperty().bind(formVisible);
        addCourseButton.visibleProperty().bind(formVisible.not());
        addCourseButton.managedProperty().bind(formVisible.not());
    }

    private void setupFormValidation() {
        validateButton.disableProperty().bind(Bindings.createBooleanBinding(
            () -> courseNameField.getText().trim().isEmpty() || 
                  courseDurationField.getText().trim().isEmpty(),
            courseNameField.textProperty(), courseDurationField.textProperty()
        ));
    }

    private void setupInitialState() {
        formVisible.set(false);
    }

    @FXML
    private void handleAddCourse() {
        formVisible.set(true);
        courseNameField.requestFocus();
    }

    @FXML
    private void handleCancelAddCourse() {
        resetForm();
        formVisible.set(false);
    }

    @FXML
    private void handleValidateButton() {
        String name = courseNameField.getText().trim();
        String durationText = courseDurationField.getText().trim();

        if (!name.isEmpty() && !durationText.isEmpty()) {
            try {
                Duration duration = parseDuration(durationText);
                Subject newSubject = new Subject(name, duration);
                System.out.println(newSubject.getTargetTime().toMinutes());
                if (studyDeck.addSubject(newSubject)) {
                    VBox card = createCourseCard(newSubject);
                    addCourseCardToUI(card);
                    resetForm();
                    formVisible.set(false);
                }
                System.out.println("Juste");
            } catch (IllegalArgumentException | IOException e) {
            	e.printStackTrace();
                courseDurationField.setStyle("-fx-border-color: red;");
            }
        }
    }

    private Duration parseDuration(String durationText) {
        if (durationText.contains("h")) {
            String[] parts = durationText.split("h");
            int hours = parts[0].isEmpty() ? 0 : Integer.parseInt(parts[0]);
            int minutes = parts.length > 1 && !parts[1].isEmpty() ? Integer.parseInt(parts[1]) : 0;
            return Duration.ofHours(hours).plusMinutes(minutes);
        }
        System.out.println("PartDuration");
        return Duration.ofMinutes(Integer.parseInt(durationText));
    }

    private VBox createCourseCard(Subject subject) throws IOException {
        FXMLLoader loader = new FXMLLoader(getClass().getResource("/com/onyx/app/view/course-card.fxml"));
        VBox card = loader.load();
        
        CourseCardController controller = loader.getController();
        controller.initData(subject);
        
        return card;
    }

    private void addCourseCardToUI(VBox card) {
        // Trouve la position du panneau d'ajout
        int formIndex = coursesList.getChildren().indexOf(addCoursePane);
        if (formIndex >= 0) {
            coursesList.getChildren().add(formIndex, card); // Ajoute avant le formulaire
        } else {
            coursesList.getChildren().add(card); // Fallback : ajout à la fin
        }
    }

//    private void refreshCourseList() {
//        coursesList.getChildren().clear();
//        studyDeck.getSubjectList().forEach(subject -> {
//            try {
//                coursesList.getChildren().add(createCourseCard(subject));
//            } catch (IOException e) {
//                e.printStackTrace();
//            }
//        });
//        coursesList.getChildren().addAll(addCoursePane, addCourseButton);
//    }

    private void resetForm() {
        courseNameField.clear();
        courseDurationField.clear();
        courseDurationField.setStyle("");
    }
}