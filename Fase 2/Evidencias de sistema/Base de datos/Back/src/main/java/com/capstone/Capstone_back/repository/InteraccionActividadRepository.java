package com.capstone.Capstone_back.repository;

import com.capstone.Capstone_back.model.InteraccionActividad;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InteraccionActividadRepository extends JpaRepository<InteraccionActividad, Long> {
    List<InteraccionActividad> findByActividadId(Long actividadId);
    List<InteraccionActividad> findByUsuarioId(Long usuarioId);
}
