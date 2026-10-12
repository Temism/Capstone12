package com.capstone.Capstone_back.dto;

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
public class CreateEntregaRequest {

    @NotNull(message = "El actividadId es obligatorio")
    private Long actividadId;

    @NotNull(message = "El alumnoId es obligatorio")
    private Long alumnoId;

    private LocalDate fechaEntrega;
    private String archivo;
    private BigDecimal calificacion;
    private String comentarios;
}
