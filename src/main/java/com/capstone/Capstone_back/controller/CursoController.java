package com.capstone.Capstone_back.controller;

import com.capstone.Capstone_back.dto.CreateCursoRequest;
import com.capstone.Capstone_back.dto.CursoDTO;
import com.capstone.Capstone_back.service.CursoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/cursos")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CursoController {

    private final CursoService cursoService;

    @GetMapping
    public ResponseEntity<List<CursoDTO>> getAll() {
        return ResponseEntity.ok(cursoService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<CursoDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(cursoService.findById(id));
    }

    @GetMapping("/profesor/{profesorId}")
    public ResponseEntity<List<CursoDTO>> getByProfesorId(@PathVariable Long profesorId) {
        return ResponseEntity.ok(cursoService.findByProfesorId(profesorId));
    }

    @PostMapping
    public ResponseEntity<CursoDTO> create(@Valid @RequestBody CreateCursoRequest request) {
        return new ResponseEntity<>(cursoService.create(request), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<CursoDTO> update(@PathVariable Long id, @Valid @RequestBody CreateCursoRequest request) {
        return ResponseEntity.ok(cursoService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        cursoService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
