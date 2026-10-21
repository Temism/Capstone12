package com.capstone.Capstone_back.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EntregaDTO {
    private Long id;
    private Long actividadId;
    private String actividadTitulo;
    private Long alumnoId;
    private String alumnoNombre;
    private LocalDate fechaEntrega;
    private String archivo;
    private BigDecimal calificacion;
    private String comentarios;
}
