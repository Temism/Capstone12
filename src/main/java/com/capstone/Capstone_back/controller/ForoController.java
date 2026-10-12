package com.capstone.Capstone_back.controller;

import com.capstone.Capstone_back.dto.*;
import com.capstone.Capstone_back.service.ForoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/foros")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ForoController {

    private final ForoService foroService;

    // --- FOROS ---
    @GetMapping
    public ResponseEntity<List<ForoDTO>> getAllForos() {
        return ResponseEntity.ok(foroService.findAllForos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ForoDTO> getForoById(@PathVariable Long id) {
        return ResponseEntity.ok(foroService.findForoById(id));
    }

    @PostMapping
    public ResponseEntity<ForoDTO> createForo(@Valid @RequestBody CreateForoRequest request) {
        return new ResponseEntity<>(foroService.createForo(request), HttpStatus.CREATED);
    }

    // --- TEMAS ---
    @GetMapping("/{foroId}/temas")
    public ResponseEntity<List<TemaForoDTO>> getTemasByForoId(@PathVariable Long foroId) {
        return ResponseEntity.ok(foroService.findTemasByForoId(foroId));
    }

    @GetMapping("/temas/{id}")
    public ResponseEntity<TemaForoDTO> getTemaById(@PathVariable Long id) {
        return ResponseEntity.ok(foroService.findTemaById(id));
    }

    @PostMapping("/temas")
    public ResponseEntity<TemaForoDTO> createTema(@Valid @RequestBody CreateTemaForoRequest request) {
        return new ResponseEntity<>(foroService.createTema(request), HttpStatus.CREATED);
    }

    // --- COMENTARIOS ---
    @GetMapping("/temas/{temaId}/comentarios")
    public ResponseEntity<List<ComentarioForoDTO>> getComentariosByTemaId(@PathVariable Long temaId) {
        return ResponseEntity.ok(foroService.findComentariosByTemaId(temaId));
    }

    @PostMapping("/comentarios")
    public ResponseEntity<ComentarioForoDTO> createComentario(@Valid @RequestBody CreateComentarioForoRequest request) {
        return new ResponseEntity<>(foroService.createComentario(request), HttpStatus.CREATED);
    }
}
