package com.capstone.Capstone_back.repository;

import com.capstone.Capstone_back.model.Curso;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CursoRepository extends JpaRepository<Curso, Long> {
    List<Curso> findByProfesorId(Long profesorId);
    List<Curso> findByNivel(String nivel);
}
