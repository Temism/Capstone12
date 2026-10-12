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
public class TemaForoDTO {
    private Long id;
    private Long foroId;
    private Long autorId;
    private String autorNombre;
    private String titulo;
    private String contenido;
    private LocalDateTime fechaCreacion;
    private String estado;
}
