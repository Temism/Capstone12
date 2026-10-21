package com.capstone.Capstone_back.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConversacionDTO {
    private Long id;
    private String asunto;
    private LocalDateTime fechaCreacion;
    private String estado;
    private List<UsuarioDTO> participantes;
    private List<MensajeDTO> mensajes;
}
