package com.capstone.Capstone_back.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateForoRequest {

    @NotBlank(message = "El nombre del foro es obligatorio")
    private String nombre;

    private String descripcion;

    @Builder.Default
    private String estado = "ACTIVO";
}
