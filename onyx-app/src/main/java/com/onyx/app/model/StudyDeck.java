package com.onyx.app.model;

import java.time.Duration;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

public class StudyDeck {
    private final List<Subject> subjects = new ArrayList<>();

    public boolean addSubject(Subject subject) {
        if (subjects.stream().noneMatch(s -> s.getName().equalsIgnoreCase(subject.getName()))) {
            return subjects.add(subject);
        }
        return false;
    }

    public boolean removeSubject(Subject subject) {
        return subjects.remove(subject);
    }

    public boolean removeSubject(String name) {
        Optional<Subject> subject = findByName(name);
        return subject.map(this::removeSubject).orElse(false);
    }

    public Optional<Subject> findByName(String name) {
        return subjects.stream()
                .filter(s -> s.getName().equalsIgnoreCase(name))
                .findFirst();
    }

    public List<Subject> getSubjectList() {
        return Collections.unmodifiableList(subjects);
    }

    public Duration getTotalStudyTime() {
        return subjects.stream()
                .map(Subject::getTargetTime)
                .reduce(Duration.ZERO, Duration::plus);
    }

    public Duration getTotalTimeSpent() {
        return subjects.stream()
                .map(Subject::getTimeSpent)
                .reduce(Duration.ZERO, Duration::plus);
    }
}