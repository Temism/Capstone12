package com.capstone.Capstone_back.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AddParticipanteRequest {

    @NotNull(message = "El usuarioId es obligatorio")
    private Long usuarioId;
}
