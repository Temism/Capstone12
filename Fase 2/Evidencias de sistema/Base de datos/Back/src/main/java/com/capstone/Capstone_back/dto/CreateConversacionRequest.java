package com.capstone.Capstone_back.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateConversacionRequest {

    @NotBlank(message = "El asunto es obligatorio")
    private String asunto;

    @NotEmpty(message = "Debe incluir al menos un participante")
    private List<Long> usuarioIds;

    private String mensajeInicial;
    private Long remitenteInicialId;
}
