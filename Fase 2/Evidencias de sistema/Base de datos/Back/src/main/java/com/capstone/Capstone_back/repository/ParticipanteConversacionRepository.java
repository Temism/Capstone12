package com.capstone.Capstone_back.repository;

import com.capstone.Capstone_back.model.ParticipanteConversacion;
import com.capstone.Capstone_back.model.ParticipanteConversacionId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ParticipanteConversacionRepository extends JpaRepository<ParticipanteConversacion, ParticipanteConversacionId> {
    List<ParticipanteConversacion> findById_ConversacionId(Long conversacionId);
    List<ParticipanteConversacion> findById_UsuarioId(Long usuarioId);
    boolean existsById_ConversacionIdAndId_UsuarioId(Long conversacionId, Long usuarioId);
}
