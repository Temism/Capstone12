package com.capstone.Capstone_back.controller;

import com.capstone.Capstone_back.dto.CreateInteraccionRequest;
import com.capstone.Capstone_back.dto.InteraccionActividadDTO;
import com.capstone.Capstone_back.service.InteraccionActividadService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/interacciones")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class InteraccionActividadController {

    private final InteraccionActividadService interaccionService;

    @GetMapping("/actividad/{actividadId}")
    public ResponseEntity<List<InteraccionActividadDTO>> getByActividadId(@PathVariable Long actividadId) {
        return ResponseEntity.ok(interaccionService.findByActividadId(actividadId));
    }

    @GetMapping("/usuario/{usuarioId}")
    public ResponseEntity<List<InteraccionActividadDTO>> getByUsuarioId(@PathVariable Long usuarioId) {
        return ResponseEntity.ok(interaccionService.findByUsuarioId(usuarioId));
    }

    @PostMapping
    public ResponseEntity<InteraccionActividadDTO> create(@Valid @RequestBody CreateInteraccionRequest request) {
        return new ResponseEntity<>(interaccionService.create(request), HttpStatus.CREATED);
    }
}
