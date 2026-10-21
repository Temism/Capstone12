package com.capstone.Capstone_back.controller;

import com.capstone.Capstone_back.dto.CreateNotificacionRequest;
import com.capstone.Capstone_back.dto.NotificacionDTO;
import com.capstone.Capstone_back.service.NotificacionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notificaciones")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class NotificacionController {

    private final NotificacionService notificacionService;

    @GetMapping("/usuario/{usuarioId}")
    public ResponseEntity<List<NotificacionDTO>> getByUsuarioId(@PathVariable Long usuarioId) {
        return ResponseEntity.ok(notificacionService.findByUsuarioId(usuarioId));
    }

    @PostMapping
    public ResponseEntity<NotificacionDTO> create(@Valid @RequestBody CreateNotificacionRequest request) {
        return new ResponseEntity<>(notificacionService.create(request), HttpStatus.CREATED);
    }

    @PatchMapping("/{id}/leer")
    public ResponseEntity<NotificacionDTO> markAsRead(@PathVariable Long id) {
        return ResponseEntity.ok(notificacionService.markAsRead(id));
    }
}
