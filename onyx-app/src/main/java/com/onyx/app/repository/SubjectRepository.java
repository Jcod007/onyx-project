package com.onyx.app.repository;

import com.onyx.app.model.Subject;
import java.util.List;
import java.util.Optional;

public interface SubjectRepository {
    Subject save(Subject subject);
    Optional<Subject> findById(String id);
    List<Subject> findAll();
    void deleteById(String id);
}
