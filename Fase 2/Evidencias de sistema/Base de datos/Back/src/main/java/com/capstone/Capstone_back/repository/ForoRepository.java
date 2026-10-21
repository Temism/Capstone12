package com.capstone.Capstone_back.repository;

import com.capstone.Capstone_back.model.Foro;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ForoRepository extends JpaRepository<Foro, Long> {
    List<Foro> findByEstado(String estado);
}
