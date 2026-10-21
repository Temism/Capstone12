package com.capstone.Capstone_back.service;

import com.capstone.Capstone_back.dto.CreateNotificacionRequest;
import com.capstone.Capstone_back.dto.NotificacionDTO;
import com.capstone.Capstone_back.exception.ResourceNotFoundException;
import com.capstone.Capstone_back.model.Notificacion;
import com.capstone.Capstone_back.model.Usuario;
import com.capstone.Capstone_back.repository.NotificacionRepository;
import com.capstone.Capstone_back.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificacionService {

    private final NotificacionRepository notificacionRepository;
    private final UsuarioRepository usuarioRepository;

    @Transactional(readOnly = true)
    public List<NotificacionDTO> findByUsuarioId(Long usuarioId) {
        return notificacionRepository.findByUsuarioIdOrderByFechaCreacionDesc(usuarioId).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public NotificacionDTO create(CreateNotificacionRequest request) {
        Usuario usuario = usuarioRepository.findById(request.getUsuarioId())
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado con ID: " + request.getUsuarioId()));

        Notificacion notificacion = Notificacion.builder()
                .usuario(usuario)
                .tipo(request.getTipo())
                .titulo(request.getTitulo())
                .contenido(request.getContenido())
                .fechaCreacion(LocalDateTime.now())
                .estado("PENDIENTE")
                .build();

        return mapToDTO(notificacionRepository.save(notificacion));
    }

    @Transactional
    public NotificacionDTO markAsRead(Long id) {
        Notificacion notificacion = notificacionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notificación no encontrada con ID: " + id));

        notificacion.setFechaLectura(LocalDateTime.now());
        notificacion.setEstado("LEIDA");
        return mapToDTO(notificacionRepository.save(notificacion));
    }

    public NotificacionDTO mapToDTO(Notificacion n) {
        if (n == null) return null;
        return NotificacionDTO.builder()
                .id(n.getId())
                .usuarioId(n.getUsuario() != null ? n.getUsuario().getId() : null)
                .tipo(n.getTipo())
                .titulo(n.getTitulo())
                .contenido(n.getContenido())
                .fechaCreacion(n.getFechaCreacion())
                .fechaLectura(n.getFechaLectura())
                .estado(n.getEstado())
                .build();
    }
}
