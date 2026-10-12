package com.capstone.Capstone_back.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PreguntaDTO {
    private Long id;
    private Long actividadId;
    private String enunciado;
    private String tipo;
    private String opciones;
    private String respuestaCorrecta;
    private BigDecimal puntaje;
}
