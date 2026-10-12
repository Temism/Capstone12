package com.capstone.Capstone_back.service;

import com.capstone.Capstone_back.dto.CreateMensajeRequest;
import com.capstone.Capstone_back.dto.MensajeDTO;
import com.capstone.Capstone_back.exception.ResourceNotFoundException;
import com.capstone.Capstone_back.model.Conversacion;
import com.capstone.Capstone_back.model.Mensaje;
import com.capstone.Capstone_back.model.Usuario;
import com.capstone.Capstone_back.repository.ConversacionRepository;
import com.capstone.Capstone_back.repository.MensajeRepository;
import com.capstone.Capstone_back.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MensajeService {

    private final MensajeRepository mensajeRepository;
    private final ConversacionRepository conversacionRepository;
    private final UsuarioRepository usuarioRepository;

    @Transactional(readOnly = true)
    public List<MensajeDTO> findByConversacionId(Long conversacionId) {
        return mensajeRepository.findByConversacionIdOrderByFechaEnvioAsc(conversacionId).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public MensajeDTO create(CreateMensajeRequest request) {
        Conversacion conversacion = conversacionRepository.findById(request.getConversacionId())
                .orElseThrow(() -> new ResourceNotFoundException("Conversación no encontrada con ID: " + request.getConversacionId()));

        Usuario remitente = usuarioRepository.findById(request.getRemitenteUsuarioId())
                .orElseThrow(() -> new ResourceNotFoundException("Remitente no encontrado con ID: " + request.getRemitenteUsuarioId()));

        Mensaje mensaje = Mensaje.builder()
                .conversacion(conversacion)
                .remitente(remitente)
                .contenido(request.getContenido())
                .fechaEnvio(LocalDateTime.now())
                .leido(false)
                .build();

        return mapToDTO(mensajeRepository.save(mensaje));
    }

    @Transactional
    public void markAsRead(Long mensajeId) {
        Mensaje mensaje = mensajeRepository.findById(mensajeId)
                .orElseThrow(() -> new ResourceNotFoundException("Mensaje no encontrado con ID: " + mensajeId));
        mensaje.setLeido(true);
        mensajeRepository.save(mensaje);
    }

    public MensajeDTO mapToDTO(Mensaje m) {
        if (m == null) return null;
        return MensajeDTO.builder()
                .id(m.getId())
                .conversacionId(m.getConversacion() != null ? m.getConversacion().getId() : null)
                .remitenteId(m.getRemitente() != null ? m.getRemitente().getId() : null)
                .remitenteNombre(m.getRemitente() != null ? m.getRemitente().getNombre() : null)
                .contenido(m.getContenido())
                .fechaEnvio(m.getFechaEnvio())
                .leido(m.getLeido())
                .build();
    }
}
