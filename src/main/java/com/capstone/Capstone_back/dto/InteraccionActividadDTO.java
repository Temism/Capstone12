package com.capstone.Capstone_back.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InteraccionActividadDTO {
    private Long id;
    private Long actividadId;
    private Long usuarioId;
    private String usuarioNombre;
    private String tipoInteraccion;
    private String detalle;
    private LocalDateTime fechaHora;
}
