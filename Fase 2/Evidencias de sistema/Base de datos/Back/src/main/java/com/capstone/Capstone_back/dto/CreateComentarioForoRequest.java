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
public class CreateComentarioForoRequest {

    @NotNull(message = "El temaId es obligatorio")
    private Long temaId;

    @NotNull(message = "El autorUsuarioId es obligatorio")
    private Long autorUsuarioId;

    @NotBlank(message = "El contenido es obligatorio")
    private String contenido;

    @Builder.Default
    private String estado = "ACTIVO";
}
