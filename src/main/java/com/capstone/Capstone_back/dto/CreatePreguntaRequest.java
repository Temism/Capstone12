package com.capstone.Capstone_back.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreatePreguntaRequest {

    @NotNull(message = "El actividadId es obligatorio")
    private Long actividadId;

    @NotBlank(message = "El enunciado es obligatorio")
    private String enunciado;

    @NotBlank(message = "El tipo de pregunta es obligatorio")
    private String tipo;

    private String opciones;

    @NotBlank(message = "La respuesta correcta es obligatoria")
    private String respuestaCorrecta;

    @NotNull(message = "El puntaje es obligatorio")
    @DecimalMin(value = "0.0", message = "El puntaje no puede ser negativo")
    private BigDecimal puntaje;
}
