package com.capstone.Capstone_back.service;

import com.capstone.Capstone_back.dto.CalificarEntregaRequest;
import com.capstone.Capstone_back.dto.CreateEntregaRequest;
import com.capstone.Capstone_back.dto.EntregaDTO;
import com.capstone.Capstone_back.exception.ResourceNotFoundException;
import com.capstone.Capstone_back.model.Actividad;
import com.capstone.Capstone_back.model.Alumno;
import com.capstone.Capstone_back.model.Entrega;
import com.capstone.Capstone_back.repository.ActividadRepository;
import com.capstone.Capstone_back.repository.AlumnoRepository;
import com.capstone.Capstone_back.repository.EntregaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EntregaService {

    private final EntregaRepository entregaRepository;
    private final ActividadRepository actividadRepository;
    private final AlumnoRepository alumnoRepository;

    @Transactional(readOnly = true)
    public List<EntregaDTO> findAll() {
        return entregaRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public EntregaDTO findById(Long id) {
        Entrega entrega = entregaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Entrega no encontrada con ID: " + id));
        return mapToDTO(entrega);
    }

    @Transactional(readOnly = true)
    public List<EntregaDTO> findByActividadId(Long actividadId) {
        return entregaRepository.findByActividadId(actividadId).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<EntregaDTO> findByAlumnoId(Long alumnoId) {
        return entregaRepository.findByAlumnoId(alumnoId).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public EntregaDTO create(CreateEntregaRequest request) {
        Actividad actividad = actividadRepository.findById(request.getActividadId())
                .orElseThrow(() -> new ResourceNotFoundException("Actividad no encontrada con ID: " + request.getActividadId()));

        Alumno alumno = alumnoRepository.findById(request.getAlumnoId())
                .orElseThrow(() -> new ResourceNotFoundException("Alumno no encontrado con ID: " + request.getAlumnoId()));

        Entrega entrega = Entrega.builder()
                .actividad(actividad)
                .alumno(alumno)
                .fechaEntrega(request.getFechaEntrega() != null ? request.getFechaEntrega() : LocalDate.now())
                .archivo(request.getArchivo())
                .calificacion(request.getCalificacion())
                .comentarios(request.getComentarios())
                .build();

        return mapToDTO(entregaRepository.save(entrega));
    }

    @Transactional
    public EntregaDTO calificar(Long id, CalificarEntregaRequest request) {
        Entrega entrega = entregaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Entrega no encontrada con ID: " + id));

        entrega.setCalificacion(request.getCalificacion());
        if (request.getComentarios() != null) {
            entrega.setComentarios(request.getComentarios());
        }

        return mapToDTO(entregaRepository.save(entrega));
    }

    public EntregaDTO mapToDTO(Entrega e) {
        if (e == null) return null;
        String alumnoNombre = null;
        if (e.getAlumno() != null && e.getAlumno().getUsuario() != null) {
            alumnoNombre = e.getAlumno().getUsuario().getNombre();
        }

        return EntregaDTO.builder()
                .id(e.getId())
                .actividadId(e.getActividad() != null ? e.getActividad().getId() : null)
                .actividadTitulo(e.getActividad() != null ? e.getActividad().getTitulo() : null)
                .alumnoId(e.getAlumno() != null ? e.getAlumno().getId() : null)
                .alumnoNombre(alumnoNombre)
                .fechaEntrega(e.getFechaEntrega())
                .archivo(e.getArchivo())
                .calificacion(e.getCalificacion())
                .comentarios(e.getComentarios())
                .build();
    }
}
