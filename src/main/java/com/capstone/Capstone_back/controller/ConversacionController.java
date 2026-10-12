package com.capstone.Capstone_back.controller;

import com.capstone.Capstone_back.dto.AddParticipanteRequest;
import com.capstone.Capstone_back.dto.ConversacionDTO;
import com.capstone.Capstone_back.dto.CreateConversacionRequest;
import com.capstone.Capstone_back.service.ConversacionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/conversaciones")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ConversacionController {

    private final ConversacionService conversacionService;

    @GetMapping
    public ResponseEntity<List<ConversacionDTO>> getAll() {
        return ResponseEntity.ok(conversacionService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ConversacionDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(conversacionService.findById(id));
    }

    @GetMapping("/usuario/{usuarioId}")
    public ResponseEntity<List<ConversacionDTO>> getByUsuarioId(@PathVariable Long usuarioId) {
        return ResponseEntity.ok(conversacionService.findByUsuarioId(usuarioId));
    }

    @PostMapping
    public ResponseEntity<ConversacionDTO> create(@Valid @RequestBody CreateConversacionRequest request) {
        return new ResponseEntity<>(conversacionService.create(request), HttpStatus.CREATED);
    }

    @PostMapping("/{id}/participantes")
    public ResponseEntity<Void> addParticipante(
            @PathVariable Long id,
            @Valid @RequestBody AddParticipanteRequest request) {
        conversacionService.addParticipante(id, request.getUsuarioId());
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @DeleteMapping("/{id}/participantes/{usuarioId}")
    public ResponseEntity<Void> removeParticipante(
            @PathVariable Long id,
            @PathVariable Long usuarioId) {
        conversacionService.removeParticipante(id, usuarioId);
        return ResponseEntity.noContent().build();
    }
}
