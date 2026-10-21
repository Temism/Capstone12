package com.capstone.Capstone_back.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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
public class CreateActividadRequest {

    @NotNull(message = "El cursoId es obligatorio")
    private Long cursoId;

    @NotNull(message = "El profesorUsuarioId es obligatorio")
    private Long profesorUsuarioId;

    @NotBlank(message = "El título es obligatorio")
    private String titulo;

    private String descripcion;

    @NotNull(message = "La fecha de entrega es obligatoria")
    private LocalDate fechaEntrega;

    @NotNull(message = "La ponderación es obligatoria")
    @DecimalMin(value = "0.0", message = "La ponderación no puede ser negativa")
    private BigDecimal ponderacion;
}
