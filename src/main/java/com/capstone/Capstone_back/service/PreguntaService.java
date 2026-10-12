package com.capstone.Capstone_back.service;

import com.capstone.Capstone_back.dto.CreatePreguntaRequest;
import com.capstone.Capstone_back.dto.PreguntaDTO;
import com.capstone.Capstone_back.exception.ResourceNotFoundException;
import com.capstone.Capstone_back.model.Actividad;
import com.capstone.Capstone_back.model.Pregunta;
import com.capstone.Capstone_back.repository.ActividadRepository;
import com.capstone.Capstone_back.repository.PreguntaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PreguntaService {

    private final PreguntaRepository preguntaRepository;
    private final ActividadRepository actividadRepository;

    @Transactional(readOnly = true)
    public List<PreguntaDTO> findByActividadId(Long actividadId) {
        return preguntaRepository.findByActividadId(actividadId).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PreguntaDTO findById(Long id) {
        Pregunta pregunta = preguntaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Pregunta no encontrada con ID: " + id));
        return mapToDTO(pregunta);
    }

    @Transactional
    public PreguntaDTO create(CreatePreguntaRequest request) {
        Actividad actividad = actividadRepository.findById(request.getActividadId())
                .orElseThrow(() -> new ResourceNotFoundException("Actividad no encontrada con ID: " + request.getActividadId()));

        Pregunta pregunta = Pregunta.builder()
                .actividad(actividad)
                .enunciado(request.getEnunciado())
                .tipo(request.getTipo())
                .opciones(request.getOpciones())
                .respuestaCorrecta(request.getRespuestaCorrecta())
                .puntaje(request.getPuntaje())
                .build();

        return mapToDTO(preguntaRepository.save(pregunta));
    }

    @Transactional
    public PreguntaDTO update(Long id, CreatePreguntaRequest request) {
        Pregunta pregunta = preguntaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Pregunta no encontrada con ID: " + id));

        Actividad actividad = actividadRepository.findById(request.getActividadId())
                .orElseThrow(() -> new ResourceNotFoundException("Actividad no encontrada con ID: " + request.getActividadId()));

        pregunta.setActividad(actividad);
        pregunta.setEnunciado(request.getEnunciado());
        pregunta.setTipo(request.getTipo());
        pregunta.setOpciones(request.getOpciones());
        pregunta.setRespuestaCorrecta(request.getRespuestaCorrecta());
        pregunta.setPuntaje(request.getPuntaje());

        return mapToDTO(preguntaRepository.save(pregunta));
    }

    @Transactional
    public void delete(Long id) {
        if (!preguntaRepository.existsById(id)) {
            throw new ResourceNotFoundException("Pregunta no encontrada con ID: " + id);
        }
        preguntaRepository.deleteById(id);
    }

    public PreguntaDTO mapToDTO(Pregunta p) {
        if (p == null) return null;
        return PreguntaDTO.builder()
                .id(p.getId())
                .actividadId(p.getActividad() != null ? p.getActividad().getId() : null)
                .enunciado(p.getEnunciado())
                .tipo(p.getTipo())
                .opciones(p.getOpciones())
                .respuestaCorrecta(p.getRespuestaCorrecta())
                .puntaje(p.getPuntaje())
                .build();
    }
}
