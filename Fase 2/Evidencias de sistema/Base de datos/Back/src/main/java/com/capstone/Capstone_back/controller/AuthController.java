package com.capstone.Capstone_back.controller;

import com.capstone.Capstone_back.dto.CreateUsuarioRequest;
import com.capstone.Capstone_back.dto.LoginRequest;
import com.capstone.Capstone_back.dto.LoginResponse;
import com.capstone.Capstone_back.dto.UsuarioDTO;
import com.capstone.Capstone_back.service.AuthService;
import com.capstone.Capstone_back.service.UsuarioService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AuthController {

    private final AuthService authService;
    private final UsuarioService usuarioService;

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/register")
    public ResponseEntity<UsuarioDTO> register(@Valid @RequestBody CreateUsuarioRequest request) {
        return new ResponseEntity<>(usuarioService.create(request), HttpStatus.CREATED);
    }
}
