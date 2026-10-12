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
public class ComentarioForoDTO {
    private Long id;
    private Long temaId;
    private Long autorId;
    private String autorNombre;
    private String contenido;
    private LocalDateTime fechaCreacion;
    private LocalDateTime fechaEdicion;
    private String estado;
}
