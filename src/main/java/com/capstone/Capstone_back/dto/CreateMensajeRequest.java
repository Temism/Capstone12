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
public class CreateMensajeRequest {

    @NotNull(message = "El conversacionId es obligatorio")
    private Long conversacionId;

    @NotNull(message = "El remitenteUsuarioId es obligatorio")
    private Long remitenteUsuarioId;

    @NotBlank(message = "El contenido del mensaje no puede estar vacío")
    private String contenido;
}
