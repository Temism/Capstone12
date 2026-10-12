package com.capstone.Capstone_back.service;

import com.capstone.Capstone_back.dto.CreateInteraccionRequest;
import com.capstone.Capstone_back.dto.InteraccionActividadDTO;
import com.capstone.Capstone_back.exception.ResourceNotFoundException;
import com.capstone.Capstone_back.model.Actividad;
import com.capstone.Capstone_back.model.InteraccionActividad;
import com.capstone.Capstone_back.model.Usuario;
import com.capstone.Capstone_back.repository.ActividadRepository;
import com.capstone.Capstone_back.repository.InteraccionActividadRepository;
import com.capstone.Capstone_back.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InteraccionActividadService {

    private final InteraccionActividadRepository interaccionRepository;
    private final ActividadRepository actividadRepository;
    private final UsuarioRepository usuarioRepository;

    @Transactional(readOnly = true)
    public List<InteraccionActividadDTO> findByActividadId(Long actividadId) {
        return interaccionRepository.findByActividadId(actividadId).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<InteraccionActividadDTO> findByUsuarioId(Long usuarioId) {
        return interaccionRepository.findByUsuarioId(usuarioId).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public InteraccionActividadDTO create(CreateInteraccionRequest request) {
        Actividad actividad = actividadRepository.findById(request.getActividadId())
                .orElseThrow(() -> new ResourceNotFoundException("Actividad no encontrada con ID: " + request.getActividadId()));

        Usuario usuario = usuarioRepository.findById(request.getUsuarioId())
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado con ID: " + request.getUsuarioId()));

        InteraccionActividad interaccion = InteraccionActividad.builder()
                .actividad(actividad)
                .usuario(usuario)
                .tipoInteraccion(request.getTipoInteraccion())
                .detalle(request.getDetalle())
                .fechaHora(LocalDateTime.now())
                .build();

        return mapToDTO(interaccionRepository.save(interaccion));
    }

    public InteraccionActividadDTO mapToDTO(InteraccionActividad i) {
        if (i == null) return null;
        return InteraccionActividadDTO.builder()
                .id(i.getId())
                .actividadId(i.getActividad() != null ? i.getActividad().getId() : null)
                .usuarioId(i.getUsuario() != null ? i.getUsuario().getId() : null)
                .usuarioNombre(i.getUsuario() != null ? i.getUsuario().getNombre() : null)
                .tipoInteraccion(i.getTipoInteraccion())
                .detalle(i.getDetalle())
                .fechaHora(i.getFechaHora())
                .build();
    }
}
