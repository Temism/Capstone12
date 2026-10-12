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
public class MensajeDTO {
    private Long id;
    private Long conversacionId;
    private Long remitenteId;
    private String remitenteNombre;
    private String contenido;
    private LocalDateTime fechaEnvio;
    private Boolean leido;
}
