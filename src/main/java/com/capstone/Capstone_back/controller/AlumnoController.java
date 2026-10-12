package com.capstone.Capstone_back.controller;

import com.capstone.Capstone_back.dto.AlumnoDTO;
import com.capstone.Capstone_back.dto.CreateAlumnoRequest;
import com.capstone.Capstone_back.service.AlumnoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/alumnos")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AlumnoController {

    private final AlumnoService alumnoService;

    @GetMapping
    public ResponseEntity<List<AlumnoDTO>> getAll() {
        return ResponseEntity.ok(alumnoService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<AlumnoDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(alumnoService.findById(id));
    }

    @GetMapping("/usuario/{usuarioId}")
    public ResponseEntity<AlumnoDTO> getByUsuarioId(@PathVariable Long usuarioId) {
        return ResponseEntity.ok(alumnoService.findByUsuarioId(usuarioId));
    }

    @GetMapping("/apoderado/{apoderadoId}")
    public ResponseEntity<List<AlumnoDTO>> getByApoderadoId(@PathVariable Long apoderadoId) {
        return ResponseEntity.ok(alumnoService.findByApoderadoId(apoderadoId));
    }

    @PostMapping
    public ResponseEntity<AlumnoDTO> create(@Valid @RequestBody CreateAlumnoRequest request) {
        return new ResponseEntity<>(alumnoService.create(request), HttpStatus.CREATED);
    }

    @PostMapping("/{id}/apoderados/{apoderadoId}")
    public ResponseEntity<AlumnoDTO> addApoderado(
            @PathVariable Long id,
            @PathVariable Long apoderadoId) {
        return ResponseEntity.ok(alumnoService.addApoderado(id, apoderadoId));
    }

    @DeleteMapping("/{id}/apoderados/{apoderadoId}")
    public ResponseEntity<AlumnoDTO> removeApoderado(
            @PathVariable Long id,
            @PathVariable Long apoderadoId) {
        return ResponseEntity.ok(alumnoService.removeApoderado(id, apoderadoId));
    }
}
