package com.capstone.Capstone_back.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateCursoRequest {

    @NotBlank(message = "El nombre del curso es obligatorio")
    private String nombre;

    @NotBlank(message = "El nivel es obligatorio")
    private String nivel;

    @NotNull(message = "El profesorUsuarioId es obligatorio")
    private Long profesorUsuarioId;
}
