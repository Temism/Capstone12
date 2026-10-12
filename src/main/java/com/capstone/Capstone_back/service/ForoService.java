package com.capstone.Capstone_back.service;

import com.capstone.Capstone_back.dto.*;
import com.capstone.Capstone_back.exception.ResourceNotFoundException;
import com.capstone.Capstone_back.model.ComentarioForo;
import com.capstone.Capstone_back.model.Foro;
import com.capstone.Capstone_back.model.TemaForo;
import com.capstone.Capstone_back.model.Usuario;
import com.capstone.Capstone_back.repository.ComentarioForoRepository;
import com.capstone.Capstone_back.repository.ForoRepository;
import com.capstone.Capstone_back.repository.TemaForoRepository;
import com.capstone.Capstone_back.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ForoService {

    private final ForoRepository foroRepository;
    private final TemaForoRepository temaForoRepository;
    private final ComentarioForoRepository comentarioForoRepository;
    private final UsuarioRepository usuarioRepository;

    // --- FORO ---
    @Transactional(readOnly = true)
    public List<ForoDTO> findAllForos() {
        return foroRepository.findAll().stream()
                .map(this::mapForoToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ForoDTO findForoById(Long id) {
        Foro foro = foroRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Foro no encontrado con ID: " + id));
        return mapForoToDTO(foro);
    }

    @Transactional
    public ForoDTO createForo(CreateForoRequest request) {
        Foro foro = Foro.builder()
                .nombre(request.getNombre())
                .descripcion(request.getDescripcion())
                .fechaCreacion(LocalDateTime.now())
                .estado(request.getEstado() != null ? request.getEstado() : "ACTIVO")
                .build();

        return mapForoToDTO(foroRepository.save(foro));
    }

    // --- TEMA ---
    @Transactional(readOnly = true)
    public List<TemaForoDTO> findTemasByForoId(Long foroId) {
        return temaForoRepository.findByForoId(foroId).stream()
                .map(this::mapTemaToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public TemaForoDTO findTemaById(Long id) {
        TemaForo tema = temaForoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tema no encontrado con ID: " + id));
        return mapTemaToDTO(tema);
    }

    @Transactional
    public TemaForoDTO createTema(CreateTemaForoRequest request) {
        Foro foro = foroRepository.findById(request.getForoId())
                .orElseThrow(() -> new ResourceNotFoundException("Foro no encontrado con ID: " + request.getForoId()));

        Usuario autor = usuarioRepository.findById(request.getAutorUsuarioId())
                .orElseThrow(() -> new ResourceNotFoundException("Usuario autor no encontrado con ID: " + request.getAutorUsuarioId()));

        TemaForo tema = TemaForo.builder()
                .foro(foro)
                .autor(autor)
                .titulo(request.getTitulo())
                .contenido(request.getContenido())
                .fechaCreacion(LocalDateTime.now())
                .estado(request.getEstado() != null ? request.getEstado() : "ACTIVO")
                .build();

        return mapTemaToDTO(temaForoRepository.save(tema));
    }

    // --- COMENTARIO ---
    @Transactional(readOnly = true)
    public List<ComentarioForoDTO> findComentariosByTemaId(Long temaId) {
        return comentarioForoRepository.findByTemaIdOrderByFechaCreacionAsc(temaId).stream()
                .map(this::mapComentarioToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public ComentarioForoDTO createComentario(CreateComentarioForoRequest request) {
        TemaForo tema = temaForoRepository.findById(request.getTemaId())
                .orElseThrow(() -> new ResourceNotFoundException("Tema no encontrado con ID: " + request.getTemaId()));

        Usuario autor = usuarioRepository.findById(request.getAutorUsuarioId())
                .orElseThrow(() -> new ResourceNotFoundException("Usuario autor no encontrado con ID: " + request.getAutorUsuarioId()));

        ComentarioForo comentario = ComentarioForo.builder()
                .tema(tema)
                .autor(autor)
                .contenido(request.getContenido())
                .fechaCreacion(LocalDateTime.now())
                .estado(request.getEstado() != null ? request.getEstado() : "ACTIVO")
                .build();

        return mapComentarioToDTO(comentarioForoRepository.save(comentario));
    }

    public ForoDTO mapForoToDTO(Foro f) {
        if (f == null) return null;
        return ForoDTO.builder()
                .id(f.getId())
                .nombre(f.getNombre())
                .descripcion(f.getDescripcion())
                .fechaCreacion(f.getFechaCreacion())
                .estado(f.getEstado())
                .build();
    }

    public TemaForoDTO mapTemaToDTO(TemaForo t) {
        if (t == null) return null;
        return TemaForoDTO.builder()
                .id(t.getId())
                .foroId(t.getForo() != null ? t.getForo().getId() : null)
                .autorId(t.getAutor() != null ? t.getAutor().getId() : null)
                .autorNombre(t.getAutor() != null ? t.getAutor().getNombre() : null)
                .titulo(t.getTitulo())
                .contenido(t.getContenido())
                .fechaCreacion(t.getFechaCreacion())
                .estado(t.getEstado())
                .build();
    }

    public ComentarioForoDTO mapComentarioToDTO(ComentarioForo c) {
        if (c == null) return null;
        return ComentarioForoDTO.builder()
                .id(c.getId())
                .temaId(c.getTema() != null ? c.getTema().getId() : null)
                .autorId(c.getAutor() != null ? c.getAutor().getId() : null)
                .autorNombre(c.getAutor() != null ? c.getAutor().getNombre() : null)
                .contenido(c.getContenido())
                .fechaCreacion(c.getFechaCreacion())
                .fechaEdicion(c.getFechaEdicion())
                .estado(c.getEstado())
                .build();
    }
}
