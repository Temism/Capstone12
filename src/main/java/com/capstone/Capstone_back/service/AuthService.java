package com.capstone.Capstone_back.service;

import com.capstone.Capstone_back.dto.LoginRequest;
import com.capstone.Capstone_back.dto.LoginResponse;
import com.capstone.Capstone_back.exception.BadRequestException;
import com.capstone.Capstone_back.model.Usuario;
import com.capstone.Capstone_back.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final UsuarioService usuarioService;

    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {
        Usuario usuario = usuarioRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadRequestException("Credenciales inválidas"));

        if (!"ACTIVO".equalsIgnoreCase(usuario.getEstado())) {
            throw new BadRequestException("El usuario se encuentra inactivo");
        }

        boolean passwordMatches = false;
        try {
            passwordMatches = passwordEncoder.matches(request.getContrasena(), usuario.getContrasena());
        } catch (Exception ignored) {
        }

        // Support direct match for seed data / placeholder hashes
        if (!passwordMatches && usuario.getContrasena().equals(request.getContrasena())) {
            passwordMatches = true;
        }

        if (!passwordMatches) {
            throw new BadRequestException("Credenciales inválidas");
        }

        return LoginResponse.builder()
                .message("Autenticación exitosa")
                .usuario(usuarioService.mapToDTO(usuario))
                .build();
    }
}
