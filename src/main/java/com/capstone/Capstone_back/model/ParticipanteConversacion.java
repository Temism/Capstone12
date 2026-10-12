package com.capstone.Capstone_back.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "participante_conversacion")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ParticipanteConversacion {

    @EmbeddedId
    private ParticipanteConversacionId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("conversacionId")
    @JoinColumn(name = "conversacion_id", nullable = false)
    private Conversacion conversacion;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("usuarioId")
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @Column(name = "fecha_union", nullable = false)
    private LocalDateTime fechaUnion;
}
