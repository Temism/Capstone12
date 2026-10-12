package com.capstone.Capstone_back.repository;

import com.capstone.Capstone_back.model.Entrega;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EntregaRepository extends JpaRepository<Entrega, Long> {
    List<Entrega> findByActividadId(Long actividadId);
    List<Entrega> findByAlumnoId(Long alumnoId);
    Optional<Entrega> findByActividadIdAndAlumnoId(Long actividadId, Long alumnoId);
}
