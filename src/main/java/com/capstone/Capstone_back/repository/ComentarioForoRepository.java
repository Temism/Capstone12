package com.capstone.Capstone_back.repository;

import com.capstone.Capstone_back.model.ComentarioForo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ComentarioForoRepository extends JpaRepository<ComentarioForo, Long> {
    List<ComentarioForo> findByTemaIdOrderByFechaCreacionAsc(Long temaId);
    List<ComentarioForo> findByAutorId(Long autorId);
}
