package com.capstone.Capstone_back.repository;

import com.capstone.Capstone_back.model.Pregunta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PreguntaRepository extends JpaRepository<Pregunta, Long> {
    List<Pregunta> findByActividadId(Long actividadId);
}
