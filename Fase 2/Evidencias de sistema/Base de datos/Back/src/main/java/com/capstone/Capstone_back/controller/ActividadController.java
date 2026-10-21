package com.capstone.Capstone_back.controller;

import com.capstone.Capstone_back.dto.ActividadDTO;
import com.capstone.Capstone_back.dto.CreateActividadRequest;
import com.capstone.Capstone_back.service.ActividadService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/actividades")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ActividadController {

    private final ActividadService actividadService;

    @GetMapping
    public ResponseEntity<List<ActividadDTO>> getAll() {
        return ResponseEntity.ok(actividadService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ActividadDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(actividadService.findById(id));
    }

    @GetMapping("/curso/{cursoId}")
    public ResponseEntity<List<ActividadDTO>> getByCursoId(@PathVariable Long cursoId) {
        return ResponseEntity.ok(actividadService.findByCursoId(cursoId));
    }

    @GetMapping("/profesor/{profesorId}")
    public ResponseEntity<List<ActividadDTO>> getByProfesorId(@PathVariable Long profesorId) {
        return ResponseEntity.ok(actividadService.findByProfesorId(profesorId));
    }

    @PostMapping
    public ResponseEntity<ActividadDTO> create(@Valid @RequestBody CreateActividadRequest request) {
        return new ResponseEntity<>(actividadService.create(request), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ActividadDTO> update(@PathVariable Long id, @Valid @RequestBody CreateActividadRequest request) {
        return ResponseEntity.ok(actividadService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        actividadService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
