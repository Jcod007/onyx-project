package com.onyx.app.repository.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.onyx.app.model.TimerModel;
import com.onyx.app.repository.TimerRepository;

import java.io.File;
import java.io.IOException;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

public class JsonTimerRepository implements TimerRepository {

    private final String DATA_DIR;
    private final String FILE_PATH;
    private final ObjectMapper objectMapper;
    private List<TimerModel> timers;

    public JsonTimerRepository() {
        DATA_DIR = Paths.get(System.getProperty("user.home"), ".onyx", "data").toString();
        FILE_PATH = Paths.get(DATA_DIR, "timers.json").toString();
        this.objectMapper = new ObjectMapper();
        this.objectMapper.registerModule(new JavaTimeModule());
        this.objectMapper.enable(SerializationFeature.INDENT_OUTPUT);
        loadTimers();
    }

    private void loadTimers() {
        File dataDir = new File(DATA_DIR);
        if (!dataDir.exists()) {
            dataDir.mkdirs();
        }

        File file = new File(FILE_PATH);
        if (file.exists() && file.length() > 0) {
            try {
                timers = objectMapper.readValue(file, objectMapper.getTypeFactory().constructCollectionType(List.class, TimerModel.class));
            } catch (IOException e) {
                System.err.println("Error loading timers from JSON: " + e.getMessage());
                timers = new ArrayList<>();
            }
        } else {
            timers = new ArrayList<>();
        }
    }

    private void saveTimers() {
        try {
            objectMapper.writeValue(new File(FILE_PATH), timers);
        } catch (IOException e) {
            System.err.println("Error saving timers to JSON: " + e.getMessage());
        }
    }

    @Override
    public TimerModel save(TimerModel timer) {
        Optional<TimerModel> existingTimer = findById(timer.getId());
        if (existingTimer.isPresent()) {
            // Update existing timer
            timers = timers.stream()
                    .map(t -> t.getId().equals(timer.getId()) ? timer : t)
                    .collect(Collectors.toList());
        } else {
            // Add new timer
            timers.add(timer);
        }
        saveTimers();
        return timer;
    }

    @Override
    public Optional<TimerModel> findById(String id) {
        return timers.stream()
                .filter(timer -> timer.getId().equals(id))
                .findFirst();
    }

    @Override
    public List<TimerModel> findAll() {
        return new ArrayList<>(timers); // Return a copy to prevent external modification
    }

    @Override
    public void deleteById(String id) {
        timers.removeIf(timer -> timer.getId().equals(id));
        saveTimers();
    }
}
