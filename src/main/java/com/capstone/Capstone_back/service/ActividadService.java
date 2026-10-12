package com.capstone.Capstone_back.service;

import com.capstone.Capstone_back.dto.ActividadDTO;
import com.capstone.Capstone_back.dto.CreateActividadRequest;
import com.capstone.Capstone_back.exception.ResourceNotFoundException;
import com.capstone.Capstone_back.model.Actividad;
import com.capstone.Capstone_back.model.Curso;
import com.capstone.Capstone_back.model.Usuario;
import com.capstone.Capstone_back.repository.ActividadRepository;
import com.capstone.Capstone_back.repository.CursoRepository;
import com.capstone.Capstone_back.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ActividadService {

    private final ActividadRepository actividadRepository;
    private final CursoRepository cursoRepository;
    private final UsuarioRepository usuarioRepository;

    @Transactional(readOnly = true)
    public List<ActividadDTO> findAll() {
        return actividadRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ActividadDTO findById(Long id) {
        Actividad actividad = actividadRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Actividad no encontrada con ID: " + id));
        return mapToDTO(actividad);
    }

    @Transactional(readOnly = true)
    public List<ActividadDTO> findByCursoId(Long cursoId) {
        return actividadRepository.findByCursoId(cursoId).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ActividadDTO> findByProfesorId(Long profesorId) {
        return actividadRepository.findByProfesorId(profesorId).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public ActividadDTO create(CreateActividadRequest request) {
        Curso curso = cursoRepository.findById(request.getCursoId())
                .orElseThrow(() -> new ResourceNotFoundException("Curso no encontrado con ID: " + request.getCursoId()));

        Usuario profesor = usuarioRepository.findById(request.getProfesorUsuarioId())
                .orElseThrow(() -> new ResourceNotFoundException("Profesor no encontrado con ID: " + request.getProfesorUsuarioId()));

        Actividad actividad = Actividad.builder()
                .curso(curso)
                .profesor(profesor)
                .titulo(request.getTitulo())
                .descripcion(request.getDescripcion())
                .fechaEntrega(request.getFechaEntrega())
                .ponderacion(request.getPonderacion())
                .build();

        return mapToDTO(actividadRepository.save(actividad));
    }

    @Transactional
    public ActividadDTO update(Long id, CreateActividadRequest request) {
        Actividad actividad = actividadRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Actividad no encontrada con ID: " + id));

        Curso curso = cursoRepository.findById(request.getCursoId())
                .orElseThrow(() -> new ResourceNotFoundException("Curso no encontrado con ID: " + request.getCursoId()));

        Usuario profesor = usuarioRepository.findById(request.getProfesorUsuarioId())
                .orElseThrow(() -> new ResourceNotFoundException("Profesor no encontrado con ID: " + request.getProfesorUsuarioId()));

        actividad.setCurso(curso);
        actividad.setProfesor(profesor);
        actividad.setTitulo(request.getTitulo());
        actividad.setDescripcion(request.getDescripcion());
        actividad.setFechaEntrega(request.getFechaEntrega());
        actividad.setPonderacion(request.getPonderacion());

        return mapToDTO(actividadRepository.save(actividad));
    }

    @Transactional
    public void delete(Long id) {
        if (!actividadRepository.existsById(id)) {
            throw new ResourceNotFoundException("Actividad no encontrada con ID: " + id);
        }
        actividadRepository.deleteById(id);
    }

    public ActividadDTO mapToDTO(Actividad a) {
        if (a == null) return null;
        return ActividadDTO.builder()
                .id(a.getId())
                .cursoId(a.getCurso() != null ? a.getCurso().getId() : null)
                .cursoNombre(a.getCurso() != null ? a.getCurso().getNombre() : null)
                .profesorId(a.getProfesor() != null ? a.getProfesor().getId() : null)
                .profesorNombre(a.getProfesor() != null ? a.getProfesor().getNombre() : null)
                .titulo(a.getTitulo())
                .descripcion(a.getDescripcion())
                .fechaEntrega(a.getFechaEntrega())
                .ponderacion(a.getPonderacion())
                .build();
    }
}
