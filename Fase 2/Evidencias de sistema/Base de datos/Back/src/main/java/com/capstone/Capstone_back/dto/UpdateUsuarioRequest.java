package com.capstone.Capstone_back.dto;

import jakarta.validation.constraints.Email;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateUsuarioRequest {
    private String nombre;

    @Email(message = "El email debe ser válido")
    private String email;

    private String contrasena;
    private String estado;
    private Set<Long> roleIds;
}
