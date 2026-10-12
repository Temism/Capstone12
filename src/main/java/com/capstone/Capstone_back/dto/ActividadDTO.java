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
public class ActividadDTO {
    private Long id;
    private Long cursoId;
    private String cursoNombre;
    private Long profesorId;
    private String profesorNombre;
    private String titulo;
    private String descripcion;
    private LocalDate fechaEntrega;
    private BigDecimal ponderacion;
}
