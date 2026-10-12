package com.capstone.Capstone_back.controller;

import com.capstone.Capstone_back.dto.CreatePreguntaRequest;
import com.capstone.Capstone_back.dto.PreguntaDTO;
import com.capstone.Capstone_back.service.PreguntaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/preguntas")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class PreguntaController {

    private final PreguntaService preguntaService;

    @GetMapping("/actividad/{actividadId}")
    public ResponseEntity<List<PreguntaDTO>> getByActividadId(@PathVariable Long actividadId) {
        return ResponseEntity.ok(preguntaService.findByActividadId(actividadId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PreguntaDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(preguntaService.findById(id));
    }

    @PostMapping
    public ResponseEntity<PreguntaDTO> create(@Valid @RequestBody CreatePreguntaRequest request) {
        return new ResponseEntity<>(preguntaService.create(request), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<PreguntaDTO> update(@PathVariable Long id, @Valid @RequestBody CreatePreguntaRequest request) {
        return ResponseEntity.ok(preguntaService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        preguntaService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
