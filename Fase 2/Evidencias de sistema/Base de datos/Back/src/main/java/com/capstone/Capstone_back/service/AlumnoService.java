package com.capstone.Capstone_back.service;

import com.capstone.Capstone_back.dto.AlumnoDTO;
import com.capstone.Capstone_back.dto.CreateAlumnoRequest;
import com.capstone.Capstone_back.dto.UsuarioDTO;
import com.capstone.Capstone_back.exception.BadRequestException;
import com.capstone.Capstone_back.exception.ResourceNotFoundException;
import com.capstone.Capstone_back.model.Alumno;
import com.capstone.Capstone_back.model.Usuario;
import com.capstone.Capstone_back.repository.AlumnoRepository;
import com.capstone.Capstone_back.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AlumnoService {

    private final AlumnoRepository alumnoRepository;
    private final UsuarioRepository usuarioRepository;
    private final UsuarioService usuarioService;

    @Transactional(readOnly = true)
    public List<AlumnoDTO> findAll() {
        return alumnoRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public AlumnoDTO findById(Long id) {
        Alumno alumno = alumnoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Alumno no encontrado con ID: " + id));
        return mapToDTO(alumno);
    }

    @Transactional(readOnly = true)
    public AlumnoDTO findByUsuarioId(Long usuarioId) {
        Alumno alumno = alumnoRepository.findByUsuarioId(usuarioId)
                .orElseThrow(() -> new ResourceNotFoundException("Alumno no encontrado para usuario ID: " + usuarioId));
        return mapToDTO(alumno);
    }

    @Transactional(readOnly = true)
    public List<AlumnoDTO> findByApoderadoId(Long apoderadoId) {
        return alumnoRepository.findByApoderados_Id(apoderadoId).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public AlumnoDTO create(CreateAlumnoRequest request) {
        Usuario usuario = usuarioRepository.findById(request.getUsuarioId())
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado con ID: " + request.getUsuarioId()));

        if (alumnoRepository.findByUsuarioId(request.getUsuarioId()).isPresent()) {
            throw new BadRequestException("El usuario ya está registrado como alumno");
        }

        Set<Usuario> apoderados = new HashSet<>();
        if (request.getApoderadoIds() != null && !request.getApoderadoIds().isEmpty()) {
            apoderados.addAll(usuarioRepository.findAllById(request.getApoderadoIds()));
        }

        Alumno alumno = Alumno.builder()
                .usuario(usuario)
                .fechaNacimiento(request.getFechaNacimiento())
                .apoderados(apoderados)
                .build();

        return mapToDTO(alumnoRepository.save(alumno));
    }

    @Transactional
    public AlumnoDTO addApoderado(Long alumnoId, Long apoderadoUsuarioId) {
        Alumno alumno = alumnoRepository.findById(alumnoId)
                .orElseThrow(() -> new ResourceNotFoundException("Alumno no encontrado con ID: " + alumnoId));

        Usuario apoderado = usuarioRepository.findById(apoderadoUsuarioId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario apoderado no encontrado con ID: " + apoderadoUsuarioId));

        alumno.getApoderados().add(apoderado);
        return mapToDTO(alumnoRepository.save(alumno));
    }

    @Transactional
    public AlumnoDTO removeApoderado(Long alumnoId, Long apoderadoUsuarioId) {
        Alumno alumno = alumnoRepository.findById(alumnoId)
                .orElseThrow(() -> new ResourceNotFoundException("Alumno no encontrado con ID: " + alumnoId));

        Usuario apoderado = usuarioRepository.findById(apoderadoUsuarioId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario apoderado no encontrado con ID: " + apoderadoUsuarioId));

        alumno.getApoderados().remove(apoderado);
        return mapToDTO(alumnoRepository.save(alumno));
    }

    public AlumnoDTO mapToDTO(Alumno alumno) {
        if (alumno == null) return null;
        List<UsuarioDTO> apoderadosDTO = alumno.getApoderados() != null
                ? alumno.getApoderados().stream()
                .map(usuarioService::mapToDTO)
                .collect(Collectors.toList())
                : List.of();

        return AlumnoDTO.builder()
                .id(alumno.getId())
                .usuario(usuarioService.mapToDTO(alumno.getUsuario()))
                .fechaNacimiento(alumno.getFechaNacimiento())
                .apoderados(apoderadosDTO)
                .build();
    }
}
