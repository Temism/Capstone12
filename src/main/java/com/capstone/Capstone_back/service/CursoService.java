package com.capstone.Capstone_back.service;

import com.capstone.Capstone_back.dto.CreateCursoRequest;
import com.capstone.Capstone_back.dto.CursoDTO;
import com.capstone.Capstone_back.exception.ResourceNotFoundException;
import com.capstone.Capstone_back.model.Curso;
import com.capstone.Capstone_back.model.Usuario;
import com.capstone.Capstone_back.repository.CursoRepository;
import com.capstone.Capstone_back.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CursoService {

    private final CursoRepository cursoRepository;
    private final UsuarioRepository usuarioRepository;
    private final UsuarioService usuarioService;

    @Transactional(readOnly = true)
    public List<CursoDTO> findAll() {
        return cursoRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CursoDTO findById(Long id) {
        Curso curso = cursoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Curso no encontrado con ID: " + id));
        return mapToDTO(curso);
    }

    @Transactional(readOnly = true)
    public List<CursoDTO> findByProfesorId(Long profesorId) {
        return cursoRepository.findByProfesorId(profesorId).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public CursoDTO create(CreateCursoRequest request) {
        Usuario profesor = usuarioRepository.findById(request.getProfesorUsuarioId())
                .orElseThrow(() -> new ResourceNotFoundException("Profesor no encontrado con ID: " + request.getProfesorUsuarioId()));

        Curso curso = Curso.builder()
                .nombre(request.getNombre())
                .nivel(request.getNivel())
                .profesor(profesor)
                .build();

        return mapToDTO(cursoRepository.save(curso));
    }

    @Transactional
    public CursoDTO update(Long id, CreateCursoRequest request) {
        Curso curso = cursoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Curso no encontrado con ID: " + id));

        Usuario profesor = usuarioRepository.findById(request.getProfesorUsuarioId())
                .orElseThrow(() -> new ResourceNotFoundException("Profesor no encontrado con ID: " + request.getProfesorUsuarioId()));

        curso.setNombre(request.getNombre());
        curso.setNivel(request.getNivel());
        curso.setProfesor(profesor);

        return mapToDTO(cursoRepository.save(curso));
    }

    @Transactional
    public void delete(Long id) {
        if (!cursoRepository.existsById(id)) {
            throw new ResourceNotFoundException("Curso no encontrado con ID: " + id);
        }
        cursoRepository.deleteById(id);
    }

    public CursoDTO mapToDTO(Curso curso) {
        if (curso == null) return null;
        return CursoDTO.builder()
                .id(curso.getId())
                .nombre(curso.getNombre())
                .nivel(curso.getNivel())
                .profesor(usuarioService.mapToDTO(curso.getProfesor()))
                .build();
    }
}
