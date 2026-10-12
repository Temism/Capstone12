package com.capstone.Capstone_back.repository;

import com.capstone.Capstone_back.model.Alumno;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AlumnoRepository extends JpaRepository<Alumno, Long> {
    Optional<Alumno> findByUsuarioId(Long usuarioId);
    List<Alumno> findByApoderados_Id(Long apoderadoId);
}
