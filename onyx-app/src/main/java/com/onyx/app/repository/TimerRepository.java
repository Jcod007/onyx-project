package com.onyx.app.repository;

import com.onyx.app.model.TimerModel;
import java.util.List;
import java.util.Optional;

public interface TimerRepository {
    TimerModel save(TimerModel timer);
    Optional<TimerModel> findById(String id);
    List<TimerModel> findAll();
    void deleteById(String id);
    // Ajoutez d'autres méthodes si nécessaire, ex: findBySubjectId
}
