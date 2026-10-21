package com.capstone.Capstone_back.service;

import com.capstone.Capstone_back.dto.CreateUsuarioRequest;
import com.capstone.Capstone_back.dto.RolDTO;
import com.capstone.Capstone_back.dto.UpdateUsuarioRequest;
import com.capstone.Capstone_back.dto.UsuarioDTO;
import com.capstone.Capstone_back.exception.BadRequestException;
import com.capstone.Capstone_back.exception.ResourceNotFoundException;
import com.capstone.Capstone_back.model.Rol;
import com.capstone.Capstone_back.model.Usuario;
import com.capstone.Capstone_back.repository.RolRepository;
import com.capstone.Capstone_back.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public List<UsuarioDTO> findAll() {
        return usuarioRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public UsuarioDTO findById(Long id) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado con ID: " + id));
        return mapToDTO(usuario);
    }

    @Transactional(readOnly = true)
    public UsuarioDTO findByEmail(String email) {
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado con email: " + email));
        return mapToDTO(usuario);
    }

    @Transactional
    public UsuarioDTO create(CreateUsuarioRequest request) {
        if (usuarioRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Ya existe un usuario registrado con el email: " + request.getEmail());
        }

        Set<Rol> roles = new HashSet<>();
        if (request.getRoleIds() != null && !request.getRoleIds().isEmpty()) {
            roles.addAll(rolRepository.findAllById(request.getRoleIds()));
        }

        Usuario usuario = Usuario.builder()
                .nombre(request.getNombre())
                .email(request.getEmail())
                .contrasena(passwordEncoder.encode(request.getContrasena()))
                .estado(request.getEstado() != null ? request.getEstado() : "ACTIVO")
                .roles(roles)
                .build();

        return mapToDTO(usuarioRepository.save(usuario));
    }

    @Transactional
    public UsuarioDTO update(Long id, UpdateUsuarioRequest request) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado con ID: " + id));

        if (request.getEmail() != null && !request.getEmail().equalsIgnoreCase(usuario.getEmail())) {
            if (usuarioRepository.existsByEmail(request.getEmail())) {
                throw new BadRequestException("El email ya está en uso por otro usuario: " + request.getEmail());
            }
            usuario.setEmail(request.getEmail());
        }

        if (request.getNombre() != null) {
            usuario.setNombre(request.getNombre());
        }

        if (request.getContrasena() != null && !request.getContrasena().isBlank()) {
            usuario.setContrasena(passwordEncoder.encode(request.getContrasena()));
        }

        if (request.getEstado() != null) {
            usuario.setEstado(request.getEstado());
        }

        if (request.getRoleIds() != null) {
            Set<Rol> roles = new HashSet<>(rolRepository.findAllById(request.getRoleIds()));
            usuario.setRoles(roles);
        }

        return mapToDTO(usuarioRepository.save(usuario));
    }

    @Transactional
    public void delete(Long id) {
        if (!usuarioRepository.existsById(id)) {
            throw new ResourceNotFoundException("Usuario no encontrado con ID: " + id);
        }
        usuarioRepository.deleteById(id);
    }

    public UsuarioDTO mapToDTO(Usuario usuario) {
        if (usuario == null) return null;
        Set<RolDTO> rolDTOs = usuario.getRoles() != null
                ? usuario.getRoles().stream()
                .map(r -> RolDTO.builder().id(r.getId()).nombre(r.getNombre()).build())
                .collect(Collectors.toSet())
                : new HashSet<>();

        return UsuarioDTO.builder()
                .id(usuario.getId())
                .nombre(usuario.getNombre())
                .email(usuario.getEmail())
                .estado(usuario.getEstado())
                .roles(rolDTOs)
                .build();
    }
}
