package com.capstone.Capstone_back.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "tema_foro")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TemaForo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "foro_id", nullable = false)
    private Foro foro;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "autor_usuario_id", nullable = false)
    private Usuario autor;

    @Column(nullable = false, length = 150)
    private String titulo;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String contenido;

    @Column(name = "fecha_creacion", nullable = false)
    private LocalDateTime fechaCreacion;

    @Column(nullable = false, length = 20)
    private String estado;
}
