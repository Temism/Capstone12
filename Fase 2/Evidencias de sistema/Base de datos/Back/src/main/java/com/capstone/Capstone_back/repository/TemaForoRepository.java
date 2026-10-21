package com.capstone.Capstone_back.repository;

import com.capstone.Capstone_back.model.TemaForo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TemaForoRepository extends JpaRepository<TemaForo, Long> {
    List<TemaForo> findByForoId(Long foroId);
    List<TemaForo> findByAutorId(Long autorId);
}
