package com.capstone.Capstone_back.controller;

import com.capstone.Capstone_back.dto.CalificarEntregaRequest;
import com.capstone.Capstone_back.dto.CreateEntregaRequest;
import com.capstone.Capstone_back.dto.EntregaDTO;
import com.capstone.Capstone_back.service.EntregaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/entregas")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class EntregaController {

    private final EntregaService entregaService;

    @GetMapping
    public ResponseEntity<List<EntregaDTO>> getAll() {
        return ResponseEntity.ok(entregaService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<EntregaDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(entregaService.findById(id));
    }

    @GetMapping("/actividad/{actividadId}")
    public ResponseEntity<List<EntregaDTO>> getByActividadId(@PathVariable Long actividadId) {
        return ResponseEntity.ok(entregaService.findByActividadId(actividadId));
    }

    @GetMapping("/alumno/{alumnoId}")
    public ResponseEntity<List<EntregaDTO>> getByAlumnoId(@PathVariable Long alumnoId) {
        return ResponseEntity.ok(entregaService.findByAlumnoId(alumnoId));
    }

    @PostMapping
    public ResponseEntity<EntregaDTO> create(@Valid @RequestBody CreateEntregaRequest request) {
        return new ResponseEntity<>(entregaService.create(request), HttpStatus.CREATED);
    }

    @PatchMapping("/{id}/calificar")
    public ResponseEntity<EntregaDTO> calificar(
            @PathVariable Long id,
            @Valid @RequestBody CalificarEntregaRequest request) {
        return ResponseEntity.ok(entregaService.calificar(id, request));
    }
}
