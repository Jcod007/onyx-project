package com.onyx.app.repository.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.onyx.app.model.Subject;
import com.onyx.app.repository.SubjectRepository;

import java.io.File;
import java.io.IOException;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

public class JsonSubjectRepository implements SubjectRepository {
 
    private final String DATA_DIR;
    private final String FILE_PATH;
    private final ObjectMapper objectMapper;
    private List<Subject> subjects;

    public JsonSubjectRepository() {
        DATA_DIR = Paths.get(System.getProperty("user.home"), ".onyx", "data").toString();
        FILE_PATH = Paths.get(DATA_DIR, "subjects.json").toString();
        this.objectMapper = new ObjectMapper();
        this.objectMapper.registerModule(new JavaTimeModule());
        this.objectMapper.enable(SerializationFeature.INDENT_OUTPUT);
        loadSubjects();
    }

    private void loadSubjects() {
        File dataDir = new File(DATA_DIR);
        if (!dataDir.exists()) {
            dataDir.mkdirs();
        }

        File file = new File(FILE_PATH);
        if (file.exists() && file.length() > 0) {
            try {
                subjects = objectMapper.readValue(file, objectMapper.getTypeFactory().constructCollectionType(List.class, Subject.class));
            } catch (IOException e) {
                System.err.println("Error loading subjects from JSON: " + e.getMessage());
                subjects = new ArrayList<>();
            }
        } else {
            subjects = new ArrayList<>();
        }
    }

    private void saveSubjects() {
        try {
            objectMapper.writeValue(new File(FILE_PATH), subjects);
        } catch (IOException e) {
            System.err.println("Error saving subjects to JSON: " + e.getMessage());
        }
    }

    @Override
    public Subject save(Subject subject) {
        Optional<Subject> existingSubject = findById(subject.getId());
        if (existingSubject.isPresent()) {
            // Update existing subject
            subjects = subjects.stream()
                    .map(s -> s.getId().equals(subject.getId()) ? subject : s)
                    .collect(Collectors.toList());
        } else {
            // Add new subject
            subjects.add(subject);
        }
        saveSubjects();
        return subject;
    }

    @Override
    public Optional<Subject> findById(String id) {
        return subjects.stream()
                .filter(subject -> subject.getId().equals(id))
                .findFirst();
    }

    @Override
    public List<Subject> findAll() {
        return new ArrayList<>(subjects); // Return a copy to prevent external modification
    }

    @Override
    public void deleteById(String id) {
        subjects.removeIf(subject -> subject.getId().equals(id));
        saveSubjects();
    }
}
