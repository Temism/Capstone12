package com.capstone.Capstone_back.repository;

import com.capstone.Capstone_back.model.Conversacion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ConversacionRepository extends JpaRepository<Conversacion, Long> {
    List<Conversacion> findByEstado(String estado);
}
