package com.capstone.Capstone_back.service;

import com.capstone.Capstone_back.dto.ConversacionDTO;
import com.capstone.Capstone_back.dto.CreateConversacionRequest;
import com.capstone.Capstone_back.dto.MensajeDTO;
import com.capstone.Capstone_back.dto.UsuarioDTO;
import com.capstone.Capstone_back.exception.BadRequestException;
import com.capstone.Capstone_back.exception.ResourceNotFoundException;
import com.capstone.Capstone_back.model.*;
import com.capstone.Capstone_back.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ConversacionService {

    private final ConversacionRepository conversacionRepository;
    private final ParticipanteConversacionRepository participanteRepository;
    private final MensajeRepository mensajeRepository;
    private final UsuarioRepository usuarioRepository;
    private final UsuarioService usuarioService;

    @Transactional(readOnly = true)
    public List<ConversacionDTO> findAll() {
        return conversacionRepository.findAll().stream()
                .map(this::mapToDTOWithoutMessages)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ConversacionDTO findById(Long id) {
        Conversacion conversacion = conversacionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Conversación no encontrada con ID: " + id));
        return mapToDTOWithDetails(conversacion);
    }

    @Transactional(readOnly = true)
    public List<ConversacionDTO> findByUsuarioId(Long usuarioId) {
        List<ParticipanteConversacion> participaciones = participanteRepository.findById_UsuarioId(usuarioId);
        return participaciones.stream()
                .map(p -> mapToDTOWithoutMessages(p.getConversacion()))
                .collect(Collectors.toList());
    }

    @Transactional
    public ConversacionDTO create(CreateConversacionRequest request) {
        LocalDateTime now = LocalDateTime.now();

        Conversacion conversacion = Conversacion.builder()
                .asunto(request.getAsunto())
                .fechaCreacion(now)
                .estado("ABIERTA")
                .build();

        Conversacion savedConversacion = conversacionRepository.save(conversacion);

        for (Long usuarioId : request.getUsuarioIds()) {
            Usuario usuario = usuarioRepository.findById(usuarioId)
                    .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado con ID: " + usuarioId));

            ParticipanteConversacion pc = ParticipanteConversacion.builder()
                    .id(new ParticipanteConversacionId(savedConversacion.getId(), usuario.getId()))
                    .conversacion(savedConversacion)
                    .usuario(usuario)
                    .fechaUnion(now)
                    .build();
            participanteRepository.save(pc);
        }

        if (request.getMensajeInicial() != null && !request.getMensajeInicial().isBlank()) {
            Long remitenteId = request.getRemitenteInicialId() != null
                    ? request.getRemitenteInicialId()
                    : request.getUsuarioIds().get(0);

            Usuario remitente = usuarioRepository.findById(remitenteId)
                    .orElseThrow(() -> new ResourceNotFoundException("Remitente no encontrado con ID: " + remitenteId));

            Mensaje mensaje = Mensaje.builder()
                    .conversacion(savedConversacion)
                    .remitente(remitente)
                    .contenido(request.getMensajeInicial())
                    .fechaEnvio(now)
                    .leido(false)
                    .build();
            mensajeRepository.save(mensaje);
        }

        return mapToDTOWithDetails(savedConversacion);
    }

    @Transactional
    public void addParticipante(Long conversacionId, Long usuarioId) {
        Conversacion conversacion = conversacionRepository.findById(conversacionId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversación no encontrada con ID: " + conversacionId));

        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado con ID: " + usuarioId));

        if (participanteRepository.existsById_ConversacionIdAndId_UsuarioId(conversacionId, usuarioId)) {
            throw new BadRequestException("El usuario ya es participante de esta conversación");
        }

        ParticipanteConversacion pc = ParticipanteConversacion.builder()
                .id(new ParticipanteConversacionId(conversacionId, usuarioId))
                .conversacion(conversacion)
                .usuario(usuario)
                .fechaUnion(LocalDateTime.now())
                .build();
        participanteRepository.save(pc);
    }

    @Transactional
    public void removeParticipante(Long conversacionId, Long usuarioId) {
        ParticipanteConversacionId id = new ParticipanteConversacionId(conversacionId, usuarioId);
        if (!participanteRepository.existsById(id)) {
            throw new ResourceNotFoundException("Participación no encontrada");
        }
        participanteRepository.deleteById(id);
    }

    private ConversacionDTO mapToDTOWithoutMessages(Conversacion c) {
        if (c == null) return null;
        List<ParticipanteConversacion> participaciones = participanteRepository.findById_ConversacionId(c.getId());
        List<UsuarioDTO> participantes = participaciones.stream()
                .map(p -> usuarioService.mapToDTO(p.getUsuario()))
                .collect(Collectors.toList());

        return ConversacionDTO.builder()
                .id(c.getId())
                .asunto(c.getAsunto())
                .fechaCreacion(c.getFechaCreacion())
                .estado(c.getEstado())
                .participantes(participantes)
                .mensajes(new ArrayList<>())
                .build();
    }

    private ConversacionDTO mapToDTOWithDetails(Conversacion c) {
        if (c == null) return null;
        List<ParticipanteConversacion> participaciones = participanteRepository.findById_ConversacionId(c.getId());
        List<UsuarioDTO> participantes = participaciones.stream()
                .map(p -> usuarioService.mapToDTO(p.getUsuario()))
                .collect(Collectors.toList());

        List<Mensaje> mensajes = mensajeRepository.findByConversacionIdOrderByFechaEnvioAsc(c.getId());
        List<MensajeDTO> mensajeDTOs = mensajes.stream()
                .map(m -> MensajeDTO.builder()
                        .id(m.getId())
                        .conversacionId(c.getId())
                        .remitenteId(m.getRemitente() != null ? m.getRemitente().getId() : null)
                        .remitenteNombre(m.getRemitente() != null ? m.getRemitente().getNombre() : null)
                        .contenido(m.getContenido())
                        .fechaEnvio(m.getFechaEnvio())
                        .leido(m.getLeido())
                        .build())
                .collect(Collectors.toList());

        return ConversacionDTO.builder()
                .id(c.getId())
                .asunto(c.getAsunto())
                .fechaCreacion(c.getFechaCreacion())
                .estado(c.getEstado())
                .participantes(participantes)
                .mensajes(mensajeDTOs)
                .build();
    }
}
