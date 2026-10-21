package com.capstone.Capstone_back.model;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.*;

import java.io.Serializable;
import java.util.Objects;

@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ParticipanteConversacionId implements Serializable {

    @Column(name = "conversacion_id")
    private Long conversacionId;

    @Column(name = "usuario_id")
    private Long usuarioId;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        ParticipanteConversacionId that = (ParticipanteConversacionId) o;
        return Objects.equals(conversacionId, that.conversacionId) &&
                Objects.equals(usuarioId, that.usuarioId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(conversacionId, usuarioId);
    }
}
