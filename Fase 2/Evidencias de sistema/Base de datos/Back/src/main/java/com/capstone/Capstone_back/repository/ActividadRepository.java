package com.capstone.Capstone_back.repository;

import com.capstone.Capstone_back.model.Actividad;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ActividadRepository extends JpaRepository<Actividad, Long> {
    List<Actividad> findByCursoId(Long cursoId);
    List<Actividad> findByProfesorId(Long profesorId);
}
