package com.capstone.Capstone_back.controller;

import com.capstone.Capstone_back.dto.CreateMensajeRequest;
import com.capstone.Capstone_back.dto.MensajeDTO;
import com.capstone.Capstone_back.service.MensajeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/mensajes")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class MensajeController {

    private final MensajeService mensajeService;

    @GetMapping("/conversacion/{conversacionId}")
    public ResponseEntity<List<MensajeDTO>> getByConversacionId(@PathVariable Long conversacionId) {
        return ResponseEntity.ok(mensajeService.findByConversacionId(conversacionId));
    }

    @PostMapping
    public ResponseEntity<MensajeDTO> create(@Valid @RequestBody CreateMensajeRequest request) {
        return new ResponseEntity<>(mensajeService.create(request), HttpStatus.CREATED);
    }

    @PatchMapping("/{id}/leido")
    public ResponseEntity<Void> markAsRead(@PathVariable Long id) {
        mensajeService.markAsRead(id);
        return ResponseEntity.noContent().build();
    }
}
