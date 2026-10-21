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
public class NotificacionDTO {
    private Long id;
    private Long usuarioId;
    private String tipo;
    private String titulo;
    private String contenido;
    private LocalDateTime fechaCreacion;
    private LocalDateTime fechaLectura;
    private String estado;
}
