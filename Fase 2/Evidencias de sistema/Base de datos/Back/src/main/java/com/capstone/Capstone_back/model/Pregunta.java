package com.capstone.Capstone_back.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "pregunta")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Pregunta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "actividad_id", nullable = false)
    private Actividad actividad;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String enunciado;

    @Column(nullable = false, length = 30)
    private String tipo;

    @Column(columnDefinition = "TEXT")
    private String opciones;

    @Column(name = "respuesta_correcta", nullable = false, columnDefinition = "TEXT")
    private String respuestaCorrecta;

    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal puntaje;
}
