package com.capstone.Capstone_back;

import com.capstone.Capstone_back.dto.*;
import com.capstone.Capstone_back.service.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class CapstoneBackApplicationTests {

	@Autowired
	private UsuarioService usuarioService;

	@Autowired
	private RolService rolService;

	@Autowired
	private CursoService cursoService;

	@Autowired
	private ActividadService actividadService;

	@Autowired
	private PreguntaService preguntaService;

	@Autowired
	private EntregaService entregaService;

	@Autowired
	private ConversacionService conversacionService;

	@Autowired
	private NotificacionService notificacionService;

	@Autowired
	private ForoService foroService;

	@Autowired
	private AuthService authService;

	@Test
	void contextLoads() {
		assertNotNull(usuarioService);
		assertNotNull(rolService);
		assertNotNull(cursoService);
	}

	@Test
	@DisplayName("Verificar que los roles de prueba cargados desde bd.txt existen")
	void testRolesExist() {
		List<RolDTO> roles = rolService.findAll();
		assertFalse(roles.isEmpty());
		assertTrue(roles.stream().anyMatch(r -> "ADMINISTRADOR".equalsIgnoreCase(r.getNombre())));
		assertTrue(roles.stream().anyMatch(r -> "PROFESOR".equalsIgnoreCase(r.getNombre())));
	}

	@Test
	@DisplayName("Verificar que los usuarios de prueba cargados desde bd.txt existen")
	void testUsuariosExist() {
		List<UsuarioDTO> usuarios = usuarioService.findAll();
		assertFalse(usuarios.isEmpty());
		UsuarioDTO admin = usuarioService.findByEmail("marco.palma@duocuc.cl");
		assertNotNull(admin);
		assertEquals("Marco Palma", admin.getNombre());
	}

	@Test
	@DisplayName("Verificar cursos y actividades existentes")
	void testCursosYActividades() {
		List<CursoDTO> cursos = cursoService.findAll();
		assertFalse(cursos.isEmpty());

		List<ActividadDTO> actividades = actividadService.findAll();
		assertFalse(actividades.isEmpty());
	}

	@Test
	@DisplayName("Verificar login con hash de prueba cargado en bd")
	void testLoginConUsuarioDePrueba() {
		LoginRequest request = LoginRequest.builder()
				.email("marco.palma@duocuc.cl")
				.contrasena("$2b$12$examplehash0000000000000000000000000000000000000001")
				.build();

		LoginResponse response = authService.login(request);
		assertNotNull(response);
		assertEquals("Autenticación exitosa", response.getMessage());
		assertEquals("Marco Palma", response.getUsuario().getNombre());
	}

	@Test
	@DisplayName("Verificar creación de actividad y preguntas")
	void testCrearActividadYPregunta() {
		List<CursoDTO> cursos = cursoService.findAll();
		assertFalse(cursos.isEmpty());
		Long cursoId = cursos.get(0).getId();
		Long profesorId = cursos.get(0).getProfesor().getId();

		CreateActividadRequest actReq = CreateActividadRequest.builder()
				.cursoId(cursoId)
				.profesorUsuarioId(profesorId)
				.titulo("Actividad Test Automatizada")
				.descripcion("Descripción de prueba")
				.fechaEntrega(LocalDate.now().plusDays(7))
				.ponderacion(new BigDecimal("10.00"))
				.build();

		ActividadDTO actividad = actividadService.create(actReq);
		assertNotNull(actividad);
		assertNotNull(actividad.getId());

		CreatePreguntaRequest pregReq = CreatePreguntaRequest.builder()
				.actividadId(actividad.getId())
				.enunciado("¿Cuál es la capital de Chile?")
				.tipo("seleccion_multiple")
				.opciones("Santiago;Valparaíso;Concepción")
				.respuestaCorrecta("Santiago")
				.puntaje(new BigDecimal("1.00"))
				.build();

		PreguntaDTO pregunta = preguntaService.create(pregReq);
		assertNotNull(pregunta);
		assertEquals(actividad.getId(), pregunta.getActividadId());
	}
}
