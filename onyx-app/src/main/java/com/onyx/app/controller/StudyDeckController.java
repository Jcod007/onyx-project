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

import com.onyx.app.repository.SubjectRepository;

public class StudyDeckController {

    @FXML private VBox coursesList;
    @FXML private VBox addCoursePane;
    @FXML private Button addCourseButton;
    @FXML private Button validateButton;
    @FXML private TextField courseNameField;
    @FXML private TextField courseDurationField;

    private final StudyDeck studyDeck = new StudyDeck();
    private final BooleanProperty formVisible = new SimpleBooleanProperty(false);
    private final SubjectRepository subjectRepository;

    public StudyDeckController(SubjectRepository subjectRepository) {
        this.subjectRepository = subjectRepository;
    }

    @FXML
    public void initialize() {
        loadCourses();
        configureFormVisibility();
        setupFormValidation();
        setupInitialState();
        setupDurationField();
    }

    private void loadCourses() {
        coursesList.getChildren().clear();
        subjectRepository.findAll().forEach(subject -> {
            try {
                VBox card = createCourseCard(subject);
                coursesList.getChildren().add(card);
            } catch (IOException e) {
                e.printStackTrace();
            }
        });
        // Add the addCoursePane and addCourseButton back after loading existing courses
        coursesList.getChildren().addAll(addCoursePane, addCourseButton);
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
                subjectRepository.save(newSubject); // Save the new subject
                VBox card = createCourseCard(newSubject);
                addCourseCardToUI(card);
                resetForm();
                formVisible.set(false);
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
        return Duration.ofMinutes(Integer.parseInt(durationText));
    }

    private VBox createCourseCard(Subject subject) throws IOException {
        FXMLLoader loader = new FXMLLoader(getClass().getResource("/com/onyx/app/view/Course-card.fxml"));
        VBox card = loader.load();
        
        CourseCardController controller = loader.getController();
        controller.initData(subject, this); // Pass this controller for deletion
        
        return card;
    }

    private void addCourseCardToUI(VBox card) {
        // Find the position of the addCoursePane
        int formIndex = coursesList.getChildren().indexOf(addCoursePane);
        if (formIndex >= 0) {
            coursesList.getChildren().add(formIndex, card); // Add before the form
        } else {
            coursesList.getChildren().add(card); // Fallback: add to the end
        }
    }

    public void deleteCourse(Subject subject, VBox card) {
        subjectRepository.deleteById(subject.getId());
        coursesList.getChildren().remove(card);
    }

    private void resetForm() {
        courseNameField.clear();
        courseDurationField.clear();
        courseDurationField.setStyle("");
    }
}