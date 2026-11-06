-- MySQL dump 10.13  Distrib 8.4.9, for Win64 (x86_64)
--
-- Host: localhost    Database: plataforma_educativa
-- ------------------------------------------------------
-- Server version	8.4.9

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Current Database: `plataforma_educativa`
--

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `plataforma_educativa` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;

USE `plataforma_educativa`;

--
-- Table structure for table `actividad`
--

DROP TABLE IF EXISTS `actividad`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `actividad` (
  `id` int NOT NULL AUTO_INCREMENT,
  `curso_id` int NOT NULL,
  `profesor_usuario_id` int NOT NULL,
  `titulo` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` text COLLATE utf8mb4_unicode_ci,
  `fecha_entrega` date NOT NULL,
  `ponderacion` decimal(5,2) NOT NULL,
  `asignatura` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Matemáticas',
  `codigo_frontend` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dificultad` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '1° Básico • Inicial',
  `tiempo_estimado` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '10 min',
  `cantidad_preguntas` int NOT NULL DEFAULT '5',
  `urgente` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `fk_actividad_curso` (`curso_id`),
  KEY `fk_actividad_profesor` (`profesor_usuario_id`),
  CONSTRAINT `fk_actividad_curso` FOREIGN KEY (`curso_id`) REFERENCES `curso` (`id`),
  CONSTRAINT `fk_actividad_profesor` FOREIGN KEY (`profesor_usuario_id`) REFERENCES `usuario` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `actividad`
--

LOCK TABLES `actividad` WRITE;
/*!40000 ALTER TABLE `actividad` DISABLE KEYS */;
INSERT INTO `actividad` VALUES (1,1,2,'Sumas y restas hasta el 1000','Actividad del banco curricular de Matemática, OA5 de 3° básico.','2026-09-15',20.00,'Matemáticas',NULL,'1° Básico • Inicial','10 min',5,0),(2,1,2,'Comprensión de lectura: El bosque encantado','Actividad del banco curricular de Lenguaje, OA3 de 3° básico.','2026-09-20',15.00,'Lenguaje y Comunicación',NULL,'1° Básico • Inicial','10 min',5,0),(3,2,3,'Fracciones simples','Actividad del banco curricular de Matemática, OA8 de 4° básico.','2026-09-18',20.00,'Matemáticas',NULL,'1° Básico • Inicial','10 min',5,0),(4,3,12,'El Bosque de los Números: Sumas hasta el 10 con Voz','Adiciones progresivas hasta el 10 con apoyo pictórico y simbólico (Mineduc MA01 OA 09 - Modelo COPISI). Escucha cada problema y responde con tu voz.','2026-10-15',25.00,'Matemáticas','act-mat-2','1° Básico • MA01 OA 09','8 min',5,0),(5,3,12,'La Casa de las Letras: Identifica el sonido inicial M','Actividad fónica auditiva guiada por voz para reforzar el reconocimiento de la letra M.','2026-10-18',20.00,'Lenguaje y Comunicación',NULL,'1° Básico • Inicial','10 min',5,0),(6,4,12,'Fábulas Clásicas: El Conejo y las Uvas (Comprensión con Voz)','Escucha la narración hablada de la fábula y descubre la enseñanza de la historia respondiendo por voz.','2026-10-16',25.00,'Lenguaje y Comunicación','act-sofia-1','2° Básico • LE02 OA 18','10 min',3,0),(7,3,12,'Misión Conteo Mágico: Cuenta del 1 al 10 con Robot Leo','Desafío interactivo de voz (Mineduc MA01 OA 01). Cuenta en voz alta y en orden ascendente del uno al diez para iluminar tus tarjetas.','2026-10-16',25.00,'Matemáticas','act-conteo','1° Básico • MA01 OA 01','5 min',10,0),(8,3,12,'Caza de Sonidos: Sonido Inicial con M, P, L y S','Conciencia fonológica e identificación de fonemas y sílabas iniciales (Mineduc LE01 OA 03 - Leo Primero). Escucha y responde hablando.','2026-10-19',25.00,'Lenguaje y Comunicación','act-len-1','1° Básico • LE01 OA 03','8 min',5,0),(9,3,12,'Restas con Juguetes y Animalitos hasta el 10','Practica quitar cantidades pequeñas con la ayuda y voz cariñosa de Robot Leo.','2026-10-20',20.00,'Matemáticas',NULL,'1° Básico • Práctica','10 min',5,0),(10,3,12,'Cuentos que Hablan: El Conejo y las Uvas','Comprensión oral de textos narrados (Mineduc LE01 OA 18). Escucha la fábula y responde con tus propias palabras a través del micrófono.','2026-10-10',25.00,'Lenguaje y Comunicación','act-len-2','1° Básico • LE01 OA 18','10 min',3,0),(11,4,12,'El Reino de las Tablas: Multiplicando por 2 y por 5','Practica el conteo reiterado y las primeras tablas de multiplicar con preguntas habladas.','2026-10-18',25.00,'Matemáticas','act-sofia-2','2° Básico • MA02 OA 11','12 min',5,0),(12,4,12,'Lectura de Oraciones y Reglas de Puntuación','Identificación de mayúsculas al inicio y punto final al terminar una idea.','2026-10-19',25.00,'Lenguaje y Comunicación','act-sofia-3','2° Básico • LE02 OA 21','12 min',5,0),(13,4,12,'Resolución de Problemas: Sumas con Reserva hasta el 50','Ejercicios guiados de cálculo mental y sumas con canje hasta el número 50.','2026-10-11',25.00,'Matemáticas','act-sofia-4','2° Básico • MA02 OA 09','14 min',5,0);
/*!40000 ALTER TABLE `actividad` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `alumno`
--

DROP TABLE IF EXISTS `alumno`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `alumno` (
  `id` int NOT NULL AUTO_INCREMENT,
  `usuario_id` int NOT NULL,
  `fecha_nacimiento` date NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_alumno_usuario` (`usuario_id`),
  CONSTRAINT `fk_alumno_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuario` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `alumno`
--

LOCK TABLES `alumno` WRITE;
/*!40000 ALTER TABLE `alumno` DISABLE KEYS */;
INSERT INTO `alumno` VALUES (1,7,'2018-03-12'),(2,8,'2018-07-25'),(3,9,'2017-11-02'),(4,10,'2018-01-19'),(5,14,'2019-04-12'),(6,15,'2018-06-25');
/*!40000 ALTER TABLE `alumno` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `alumno_apoderado`
--

DROP TABLE IF EXISTS `alumno_apoderado`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `alumno_apoderado` (
  `alumno_id` int NOT NULL,
  `apoderado_usuario_id` int NOT NULL,
  PRIMARY KEY (`alumno_id`,`apoderado_usuario_id`),
  KEY `fk_aa_apoderado` (`apoderado_usuario_id`),
  CONSTRAINT `fk_aa_alumno` FOREIGN KEY (`alumno_id`) REFERENCES `alumno` (`id`),
  CONSTRAINT `fk_aa_apoderado` FOREIGN KEY (`apoderado_usuario_id`) REFERENCES `usuario` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `alumno_apoderado`
--

LOCK TABLES `alumno_apoderado` WRITE;
/*!40000 ALTER TABLE `alumno_apoderado` DISABLE KEYS */;
INSERT INTO `alumno_apoderado` VALUES (2,4),(1,5),(3,6),(4,6),(5,13),(6,13);
/*!40000 ALTER TABLE `alumno_apoderado` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `comentario_foro`
--

DROP TABLE IF EXISTS `comentario_foro`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `comentario_foro` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tema_id` int NOT NULL,
  `autor_usuario_id` int NOT NULL,
  `contenido` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `fecha_creacion` datetime NOT NULL,
  `fecha_edicion` datetime DEFAULT NULL,
  `estado` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_comentario_tema` (`tema_id`),
  KEY `fk_comentario_autor` (`autor_usuario_id`),
  CONSTRAINT `fk_comentario_autor` FOREIGN KEY (`autor_usuario_id`) REFERENCES `usuario` (`id`),
  CONSTRAINT `fk_comentario_tema` FOREIGN KEY (`tema_id`) REFERENCES `tema_foro` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `comentario_foro`
--

LOCK TABLES `comentario_foro` WRITE;
/*!40000 ALTER TABLE `comentario_foro` DISABLE KEYS */;
INSERT INTO `comentario_foro` VALUES (1,1,5,'Gracias por el aviso, ¿será presencial o vía videollamada?','2026-09-01 11:30:00',NULL,'ACTIVO'),(2,1,2,'Será vía videollamada, el enlace se enviará por este medio.','2026-09-01 12:00:00',NULL,'ACTIVO');
/*!40000 ALTER TABLE `comentario_foro` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `conversacion`
--

DROP TABLE IF EXISTS `conversacion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `conversacion` (
  `id` int NOT NULL AUTO_INCREMENT,
  `asunto` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fecha_creacion` datetime NOT NULL,
  `estado` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `conversacion`
--

LOCK TABLES `conversacion` WRITE;
/*!40000 ALTER TABLE `conversacion` DISABLE KEYS */;
INSERT INTO `conversacion` VALUES (1,'Seguimiento pedagógico de Mateo (1° Básico B)','2026-10-10 10:37:56','ABIERTA'),(2,'Rendimiento y lectura comprensiva de Sofía (2° Básico A)','2026-10-08 14:37:56','ABIERTA'),(3,'Coordinación y Apoyo Escolar - Dirección Académica','2026-10-06 14:37:56','ABIERTA'),(4,'Avance de Martina en Matemática','2026-10-02 14:37:56','ABIERTA');
/*!40000 ALTER TABLE `conversacion` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `curso`
--

DROP TABLE IF EXISTS `curso`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `curso` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nivel` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `profesor_usuario_id` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_curso_profesor` (`profesor_usuario_id`),
  CONSTRAINT `fk_curso_profesor` FOREIGN KEY (`profesor_usuario_id`) REFERENCES `usuario` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `curso`
--

LOCK TABLES `curso` WRITE;
/*!40000 ALTER TABLE `curso` DISABLE KEYS */;
INSERT INTO `curso` VALUES (1,'3° Básico A','3basico',2),(2,'4° Básico B','4basico',3),(3,'1° Básico B','1basico',12),(4,'2° Básico A','2basico',12);
/*!40000 ALTER TABLE `curso` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `entrega`
--

DROP TABLE IF EXISTS `entrega`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `entrega` (
  `id` int NOT NULL AUTO_INCREMENT,
  `actividad_id` int NOT NULL,
  `alumno_id` int NOT NULL,
  `fecha_entrega` date NOT NULL,
  `archivo` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `calificacion` decimal(4,2) DEFAULT NULL,
  `comentarios` text COLLATE utf8mb4_unicode_ci,
  `estado` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Entregada',
  `progreso` int NOT NULL DEFAULT '100',
  `tiempo_minutos` int NOT NULL DEFAULT '12',
  PRIMARY KEY (`id`),
  KEY `fk_entrega_actividad` (`actividad_id`),
  KEY `fk_entrega_alumno` (`alumno_id`),
  CONSTRAINT `fk_entrega_actividad` FOREIGN KEY (`actividad_id`) REFERENCES `actividad` (`id`),
  CONSTRAINT `fk_entrega_alumno` FOREIGN KEY (`alumno_id`) REFERENCES `alumno` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `entrega`
--

LOCK TABLES `entrega` WRITE;
/*!40000 ALTER TABLE `entrega` DISABLE KEYS */;
INSERT INTO `entrega` VALUES (1,1,1,'2026-09-14',NULL,6.20,'Buen manejo de sumas con reserva.','Entregada',100,12),(2,1,2,'2026-09-15',NULL,5.50,'Revisar restas con reserva.','Entregada',100,12),(3,2,1,'2026-09-19',NULL,6.80,'Excelente comprensión lectora.','Entregada',100,12),(4,3,3,'2026-09-17',NULL,NULL,NULL,'Entregada',100,12),(5,4,5,'2026-10-20',NULL,7.00,'Escalera de Sumas con los 5 peldaños resueltos correctamente (MA01 OA 09).','Entregada',100,8),(6,5,5,'2026-10-12',NULL,6.50,'Muy buena discriminación auditiva de la letra M.','Entregada',100,12),(7,6,6,'2026-10-17',NULL,7.00,'Comprensión oral del relato El Conejo y las Uvas completada por voz (LE01 OA 18).','Entregada',100,8),(8,7,5,'2026-10-23',NULL,7.00,'Actividad Cuenta al Ritmo completada (Nivel 1: 1 al 5).','Entregada',100,8),(9,8,5,'2026-10-20',NULL,7.00,'Aplaude las Sílabas y Caza de Sonidos completada en las 5 palabras (LE01 OA 03).','Entregada',100,8),(10,9,5,'2026-10-20',NULL,NULL,'Avance parcial registrado (50%).','En progreso',50,10),(11,10,5,'2026-10-23',NULL,NULL,'Avance en comprensión oral (1 de 3 preguntas respondidas por voz).','En progreso',33,8),(12,11,6,'2026-10-18',NULL,NULL,'Pendiente de realizar.','Pendiente',0,15),(13,12,6,'2026-10-19',NULL,NULL,'En desarrollo por la alumna (60%).','En progreso',60,12),(14,13,6,'2026-10-11',NULL,6.40,'Ejercicios completados correctamente.','Entregada',100,14);
/*!40000 ALTER TABLE `entrega` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `foro`
--

DROP TABLE IF EXISTS `foro`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `foro` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` text COLLATE utf8mb4_unicode_ci,
  `fecha_creacion` datetime NOT NULL,
  `estado` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `foro`
--

LOCK TABLES `foro` WRITE;
/*!40000 ALTER TABLE `foro` DISABLE KEYS */;
INSERT INTO `foro` VALUES (1,'Comunidad 3° Básico A','Foro informativo para profesores y apoderados del curso 3° Básico A.','2026-03-01 08:00:00','ACTIVO');
/*!40000 ALTER TABLE `foro` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `interaccion_actividad`
--

DROP TABLE IF EXISTS `interaccion_actividad`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `interaccion_actividad` (
  `id` int NOT NULL AUTO_INCREMENT,
  `actividad_id` int NOT NULL,
  `usuario_id` int NOT NULL,
  `tipo_interaccion` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  `detalle` text COLLATE utf8mb4_unicode_ci,
  `fecha_hora` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_interaccion_actividad` (`actividad_id`),
  KEY `fk_interaccion_usuario` (`usuario_id`),
  CONSTRAINT `fk_interaccion_actividad` FOREIGN KEY (`actividad_id`) REFERENCES `actividad` (`id`),
  CONSTRAINT `fk_interaccion_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuario` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=64 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `interaccion_actividad`
--

LOCK TABLES `interaccion_actividad` WRITE;
/*!40000 ALTER TABLE `interaccion_actividad` DISABLE KEYS */;
INSERT INTO `interaccion_actividad` VALUES (1,1,7,'inicio_actividad','El alumno inició la actividad.','2026-09-14 15:00:00'),(2,1,7,'consulta_tutor_ia','Resumen: el alumno preguntó cómo sumar con reserva.','2026-09-14 15:05:00'),(3,1,7,'respuesta','El alumno completó la actividad.','2026-09-14 15:20:00'),(4,3,9,'consulta_tutor_ia','Resumen: el alumno preguntó qué es una fracción.','2026-09-16 11:00:00'),(5,7,14,'actividad_completada','Prueba de integracion','2026-10-16 22:40:31'),(6,7,14,'reinicio_actividad','Actividad pendiente de realizar con Robot Leo.','2026-10-16 22:40:32'),(7,7,14,'en_progreso','Avance de conteo por voz (9 de 10 numeros).','2026-10-16 22:42:19'),(8,7,14,'actividad_completada','Conteo del 1 al 10 en orden completado correctamente con voz: \"10.\"','2026-10-16 22:43:51'),(9,7,14,'actividad_completada','Conteo del 1 al 10 en orden completado correctamente con voz (10/10).','2026-10-16 22:44:12'),(10,4,14,'en_progreso','Avance en Sumas hasta el 10 (1 de 5 resueltas).','2026-10-16 23:23:33'),(11,4,14,'en_progreso','Avance en Sumas hasta el 10 (2 de 5 resueltas).','2026-10-16 23:23:56'),(12,4,14,'en_progreso','Avance en Sumas hasta el 10 (3 de 5 resueltas).','2026-10-16 23:24:17'),(13,4,14,'en_progreso','Avance en Sumas hasta el 10 (4 de 5 resueltas).','2026-10-16 23:25:18'),(14,4,14,'actividad_completada','Los 5 problemas de adición hasta el 10 (MA01 OA 09) fueron resueltos correctamente.','2026-10-16 23:25:49'),(15,4,14,'actividad_completada','Los 5 problemas de suma hasta el 10 fueron resueltos correctamente (MA01 OA 09).','2026-10-16 23:26:00'),(16,10,14,'en_progreso','Avance en comprensión oral (1 de 3 preguntas respondidas por voz).','2026-10-16 23:27:46'),(17,10,14,'en_progreso','Avance en comprensión oral (2 de 3 preguntas respondidas por voz).','2026-10-16 23:28:24'),(18,10,14,'actividad_completada','Comprensión oral de relato (LE01 OA 18) completada por voz (3/3 respuestas validadas como correctas).','2026-10-16 23:29:00'),(19,10,14,'actividad_completada','Comprensión oral del relato El Conejo y las Uvas completada por voz (LE01 OA 18).','2026-10-16 23:29:19'),(20,7,14,'en_progreso','Avance de conteo por voz (9 de 10 numeros).','2026-10-17 10:23:49'),(21,7,14,'actividad_completada','Conteo del 1 al 10 en orden completado correctamente con voz: \"10.\"','2026-10-17 10:23:59'),(22,7,14,'actividad_completada','Conteo del 1 al 10 en orden completado correctamente con voz (MA01 OA 01).','2026-10-17 10:24:11'),(23,4,14,'en_progreso','Avance en Sumas hasta el 10 (1 de 5 resueltas).','2026-10-17 10:24:45'),(24,4,14,'en_progreso','Avance en Sumas hasta el 10 (2 de 5 resueltas).','2026-10-17 10:25:15'),(25,4,14,'en_progreso','Avance en Sumas hasta el 10 (3 de 5 resueltas).','2026-10-17 10:25:32'),(26,4,14,'en_progreso','Avance en Sumas hasta el 10 (4 de 5 resueltas).','2026-10-17 10:25:48'),(27,4,14,'en_progreso','Avance parcial guardado (80% completado).','2026-10-17 10:25:49'),(28,6,15,'en_progreso','Actividad reiniciada por el estudiante.','2026-10-17 17:38:40'),(29,6,15,'en_progreso','Avance en comprensión oral (1 de 3 preguntas respondidas por voz).','2026-10-17 17:40:39'),(30,6,15,'en_progreso','Avance en comprensión oral (2 de 3 preguntas respondidas por voz).','2026-10-17 17:41:31'),(31,6,15,'actividad_completada','Comprensión oral de relato (LE01 OA 18) completada por voz (3/3 respuestas validadas como correctas).','2026-10-17 17:42:36'),(32,6,15,'actividad_completada','Comprensión oral del relato El Conejo y las Uvas completada por voz (LE01 OA 18).','2026-10-17 17:43:32'),(33,7,14,'en_progreso','Avance parcial de conteo por voz (1 de 10 numeros).','2026-10-20 21:17:34'),(34,7,14,'actividad_completada','Conteo del 1 al 10 en orden completado correctamente con voz: \"2, 3, 4, 5, 6, 7, 8, 9, 10.\"','2026-10-20 21:17:50'),(35,7,14,'actividad_completada','Actividad Cuenta al Ritmo completada en español (Nivel 1: 1 al 5).','2026-10-20 21:40:49'),(36,7,14,'actividad_completada','Actividad Cuenta al Ritmo completada en español (Nivel 1: 1 al 5).','2026-10-20 21:41:21'),(37,7,14,'actividad_completada','Actividad Cuenta al Ritmo completada en español (Nivel 1: 1 al 5).','2026-10-20 21:41:55'),(38,7,14,'actividad_completada','Actividad Cuenta al Ritmo completada en español (Nivel 1: 1 al 5).','2026-10-20 21:42:25'),(39,7,14,'actividad_completada','Actividad Cuenta al Ritmo completada (Nivel 1: 1 al 5).','2026-10-20 22:06:36'),(40,7,14,'actividad_completada','Actividad Cuenta al Ritmo completada (Nivel 1: 1 al 5).','2026-10-20 22:08:05'),(41,7,14,'actividad_completada','Actividad Cuenta al Ritmo completada (Nivel 1: 1 al 5).','2026-10-20 22:10:01'),(42,7,14,'en_progreso','Práctica en Cuenta al Ritmo Nivel 1 (4 de 5 números dichos).','2026-10-20 22:17:33'),(43,7,14,'actividad_completada','Actividad Cuenta al Ritmo completada (Nivel 1: 1 al 5).','2026-10-20 22:18:03'),(44,7,14,'actividad_completada','Actividad Cuenta al Ritmo completada (Nivel 1: 1 al 5).','2026-10-20 22:19:07'),(45,7,14,'actividad_completada','Actividad Cuenta al Ritmo completada (Nivel 1: 1 al 5).','2026-10-20 22:19:35'),(46,8,14,'en_progreso','Avance en Caza de Sonidos (1 de 5 palabras).','2026-10-20 23:09:57'),(47,8,14,'en_progreso','Avance en Caza de Sonidos (2 de 5 palabras).','2026-10-20 23:10:19'),(48,8,14,'en_progreso','Avance en Caza de Sonidos (3 de 5 palabras).','2026-10-20 23:10:32'),(49,8,14,'en_progreso','Avance en Caza de Sonidos (4 de 5 palabras).','2026-10-20 23:10:42'),(50,8,14,'actividad_completada','Las 5 palabras de conciencia fonológica (LE01 OA 03) fueron completadas correctamente.','2026-10-20 23:10:54'),(51,8,14,'actividad_completada','Aplaude las Sílabas y Caza de Sonidos completada en las 5 palabras (LE01 OA 03).','2026-10-20 23:10:58'),(52,4,14,'en_progreso','Avance en Sumas hasta el 10 (1 de 5 resueltas).','2026-10-20 23:11:37'),(53,4,14,'en_progreso','Avance en Sumas hasta el 10 (2 de 5 resueltas).','2026-10-20 23:11:43'),(54,4,14,'en_progreso','Avance en Sumas hasta el 10 (3 de 5 resueltas).','2026-10-20 23:11:49'),(55,4,14,'en_progreso','Avance en Sumas hasta el 10 (4 de 5 resueltas).','2026-10-20 23:11:55'),(56,4,14,'actividad_completada','Los 5 problemas de adición hasta el 10 (MA01 OA 09) fueron resueltos correctamente.','2026-10-20 23:12:04'),(57,4,14,'actividad_completada','Escalera de Sumas con los 5 peldaños resueltos correctamente (MA01 OA 09).','2026-10-20 23:12:08'),(58,10,14,'en_progreso','Avance en comprensión oral (1 de 3 preguntas respondidas por voz).','2026-10-20 23:12:23'),(59,10,14,'en_progreso','Avance en comprensión oral (2 de 3 preguntas respondidas por voz).','2026-10-20 23:12:34'),(60,10,14,'actividad_completada','Comprensión oral de relato (LE01 OA 18) completada por voz (3/3 respuestas validadas como correctas).','2026-10-20 23:12:45'),(61,10,14,'actividad_completada','Rompecabezas de comprensión oral Detective de Cuentos completado por voz (LE01 OA 18).','2026-10-20 23:12:58'),(62,7,14,'actividad_completada','Actividad Cuenta al Ritmo completada (Nivel 1: 1 al 5).','2026-10-23 21:45:30'),(63,10,14,'en_progreso','Avance en comprensión oral (1 de 3 preguntas respondidas por voz).','2026-10-23 22:20:20');
/*!40000 ALTER TABLE `interaccion_actividad` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mensaje`
--

DROP TABLE IF EXISTS `mensaje`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mensaje` (
  `id` int NOT NULL AUTO_INCREMENT,
  `conversacion_id` int NOT NULL,
  `remitente_usuario_id` int NOT NULL,
  `contenido` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `fecha_envio` datetime NOT NULL,
  `leido` tinyint(1) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_mensaje_conversacion` (`conversacion_id`),
  KEY `fk_mensaje_remitente` (`remitente_usuario_id`),
  CONSTRAINT `fk_mensaje_conversacion` FOREIGN KEY (`conversacion_id`) REFERENCES `conversacion` (`id`),
  CONSTRAINT `fk_mensaje_remitente` FOREIGN KEY (`remitente_usuario_id`) REFERENCES `usuario` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mensaje`
--

LOCK TABLES `mensaje` WRITE;
/*!40000 ALTER TABLE `mensaje` DISABLE KEYS */;
INSERT INTO `mensaje` VALUES (1,1,12,'Estimada Carolina, buenas tardes. Le comento que Mateo hoy realizó su primera actividad con el Agente de Voz IA en la sala. Como él aún está afianzando la lectura de textos largos, le ayudó muchísimo que el robot le leyera los problemas hablados con las frutas.','2026-10-10 10:47:56',1),(2,1,13,'Excelente noticia Tía Marcela. En la casa Mateo me contó muy entusiasmado que Robot Leo le hizo preguntas y que él le respondió hablando. Nos da mucha tranquilidad saber que no se frustra con la lectura.','2026-10-10 11:42:56',1),(3,1,12,'Así es, esa es la meta de la IA por voz en 1° básico. Mañana continuaremos con la actividad de conteo lúdico y la próxima semana con la letra S. Saludos cordiales.','2026-10-10 12:07:56',1),(4,1,13,'Muchas gracias por su dedicación Tía Marcela. Estaremos practicando los 15 minutos diarios recomendados en la plataforma familiar.','2026-10-12 11:37:56',1),(5,2,12,'Estimada apoderada, le informo que Sofía obtuvo nota 6.5 en su comprensión lectora de fábulas. Ha mostrado excelente participación oral y comprensión de moralejas.','2026-10-08 16:37:56',1),(6,2,13,'Muchas gracias por informarme profesora. Sofía disfrutó mucho la historia del conejo y las uvas. Continuaremos reforzando la lectura compartida los fines de semana.','2026-10-08 18:37:56',1),(7,2,12,'Perfecto, esa constancia en el hogar se nota de inmediato en su vocabulario y dicción.','2026-10-08 19:37:56',1),(8,3,11,'Estimadas familias: Les recordamos que este jueves tendremos la sesión informativa virtual sobre las nuevas herramientas de aprendizaje asistido por voz para el ciclo inicial.','2026-10-06 15:37:56',1),(9,3,13,'Buenas tardes Director, muchas gracias por la invitación. Ya pudimos probar la plataforma con Mateo y los resultados han sido muy positivos.','2026-10-06 17:37:56',1),(10,3,11,'Nos alegra mucho escuchar eso. En la reunión profundizaremos en el impacto pedagógico y responderemos consultas de los apoderados.','2026-10-11 12:37:56',1),(11,4,2,'Estimado apoderado, Martina ha mostrado buen avance en la actividad de sumas y restas.','2026-10-02 14:42:56',1),(12,4,5,'Muchas gracias por avisar profesora, seguiremos reforzando en casa.','2026-10-02 15:37:56',1),(13,1,13,'Mensaje de prueba de integración en vivo: la mensajería ya está conectada a la base de datos MySQL.','2026-10-12 14:43:10',0),(14,1,13,'Hola','2026-10-22 23:13:03',0),(15,1,13,'Holaaaaaa','2026-10-22 23:13:57',0),(16,1,12,'Hola que quiere','2026-10-22 23:14:09',0),(17,1,13,'A usted','2026-10-22 23:14:20',0),(18,1,12,'Mish','2026-10-22 23:14:35',0),(19,1,12,'hola','2026-10-22 23:53:35',0),(20,1,12,'enviado desde la web en pc','2026-10-22 23:54:06',0),(21,1,13,'Celular','2026-10-22 23:54:18',0),(22,1,12,'Hola po','2026-10-23 21:57:15',0),(23,1,13,'Hola','2026-10-23 21:57:27',0),(24,1,12,'K pasa','2026-10-23 21:57:33',0),(25,1,12,'Ya','2026-10-23 21:57:44',0);
/*!40000 ALTER TABLE `mensaje` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notificacion`
--

DROP TABLE IF EXISTS `notificacion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notificacion` (
  `id` int NOT NULL AUTO_INCREMENT,
  `usuario_id` int NOT NULL,
  `tipo` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  `titulo` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `contenido` text COLLATE utf8mb4_unicode_ci,
  `fecha_creacion` datetime NOT NULL,
  `fecha_lectura` datetime DEFAULT NULL,
  `estado` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_notificacion_usuario` (`usuario_id`),
  CONSTRAINT `fk_notificacion_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuario` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notificacion`
--

LOCK TABLES `notificacion` WRITE;
/*!40000 ALTER TABLE `notificacion` DISABLE KEYS */;
INSERT INTO `notificacion` VALUES (1,5,'calificacion','Nueva calificación disponible','Martina obtuvo un 6.2 en Sumas y restas hasta el 1000.','2026-09-14 12:00:00','2026-09-14 18:30:00','LEIDA'),(2,4,'plazo_proximo','Actividad próxima a vencer','La actividad \"Sumas y restas hasta el 1000\" vence el 2026-09-15.','2026-09-13 08:00:00',NULL,'PENDIENTE'),(3,6,'nueva_tarea','Nueva actividad asignada','Se asignó la actividad \"Fracciones simples\" al curso 4° Básico B.','2026-09-05 07:30:00',NULL,'PENDIENTE'),(4,13,'reunion','Citación: Primera Reunión de Apoderados 1° y 2° Básico','Se invita a todos los apoderados a la reunión informativa del segundo semestre el día jueves a las 18:00 hrs.','2026-10-04 20:59:06','2026-10-22 23:32:27','LEIDA');
/*!40000 ALTER TABLE `notificacion` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `participante_conversacion`
--

DROP TABLE IF EXISTS `participante_conversacion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `participante_conversacion` (
  `conversacion_id` int NOT NULL,
  `usuario_id` int NOT NULL,
  `fecha_union` datetime NOT NULL,
  PRIMARY KEY (`conversacion_id`,`usuario_id`),
  KEY `fk_pc_usuario` (`usuario_id`),
  CONSTRAINT `fk_pc_conversacion` FOREIGN KEY (`conversacion_id`) REFERENCES `conversacion` (`id`),
  CONSTRAINT `fk_pc_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuario` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `participante_conversacion`
--

LOCK TABLES `participante_conversacion` WRITE;
/*!40000 ALTER TABLE `participante_conversacion` DISABLE KEYS */;
INSERT INTO `participante_conversacion` VALUES (1,12,'2026-10-10 10:37:56'),(1,13,'2026-10-10 10:37:56'),(2,12,'2026-10-08 14:37:56'),(2,13,'2026-10-08 14:37:56'),(3,11,'2026-10-06 14:37:56'),(3,13,'2026-10-06 14:37:56'),(4,2,'2026-10-02 14:37:56'),(4,5,'2026-10-02 14:37:56');
/*!40000 ALTER TABLE `participante_conversacion` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pregunta`
--

DROP TABLE IF EXISTS `pregunta`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pregunta` (
  `id` int NOT NULL AUTO_INCREMENT,
  `actividad_id` int NOT NULL,
  `enunciado` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipo` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `opciones` text COLLATE utf8mb4_unicode_ci,
  `respuesta_correcta` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `puntaje` decimal(5,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_pregunta_actividad` (`actividad_id`),
  CONSTRAINT `fk_pregunta_actividad` FOREIGN KEY (`actividad_id`) REFERENCES `actividad` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pregunta`
--

LOCK TABLES `pregunta` WRITE;
/*!40000 ALTER TABLE `pregunta` DISABLE KEYS */;
INSERT INTO `pregunta` VALUES (1,1,'¿Cuánto es 350 + 420?','seleccion_multiple','670;770;870;970','770',2.00),(2,1,'¿Cuánto es 900 - 260?','seleccion_multiple','540;640;740;840','640',2.00),(3,2,'¿Cuál era el problema principal del bosque encantado en el cuento?','seleccion_multiple','La sequía;La tala de árboles;Un incendio;La nieve','La tala de árboles',2.00),(4,3,'¿Qué fracción representa la mitad de una pizza?','seleccion_multiple','1/4;1/2;2/3;3/4','1/2',2.00),(5,4,'Si tienes 3 manzanas rojas y recoges 2 verdes, ¿cuántas manzanas tienes en total?','seleccion_multiple','3;4;5;6','5',2.00);
/*!40000 ALTER TABLE `pregunta` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rol`
--

DROP TABLE IF EXISTS `rol`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rol` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rol`
--

LOCK TABLES `rol` WRITE;
/*!40000 ALTER TABLE `rol` DISABLE KEYS */;
INSERT INTO `rol` VALUES (1,'ADMINISTRADOR'),(2,'PROFESOR'),(3,'APODERADO'),(4,'ALUMNO');
/*!40000 ALTER TABLE `rol` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tema_foro`
--

DROP TABLE IF EXISTS `tema_foro`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tema_foro` (
  `id` int NOT NULL AUTO_INCREMENT,
  `foro_id` int NOT NULL,
  `autor_usuario_id` int NOT NULL,
  `titulo` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `contenido` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `fecha_creacion` datetime NOT NULL,
  `estado` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_tema_foro` (`foro_id`),
  KEY `fk_tema_autor` (`autor_usuario_id`),
  CONSTRAINT `fk_tema_autor` FOREIGN KEY (`autor_usuario_id`) REFERENCES `usuario` (`id`),
  CONSTRAINT `fk_tema_foro` FOREIGN KEY (`foro_id`) REFERENCES `foro` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tema_foro`
--

LOCK TABLES `tema_foro` WRITE;
/*!40000 ALTER TABLE `tema_foro` DISABLE KEYS */;
INSERT INTO `tema_foro` VALUES (1,1,2,'Reunión de apoderados - Septiembre','Se informa que la reunión de apoderados será el 25 de septiembre a las 18:00 hrs.','2026-09-01 10:00:00','ACTIVO');
/*!40000 ALTER TABLE `tema_foro` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuario`
--

DROP TABLE IF EXISTS `usuario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuario` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `contrasena` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `estado` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuario`
--

LOCK TABLES `usuario` WRITE;
/*!40000 ALTER TABLE `usuario` DISABLE KEYS */;
INSERT INTO `usuario` VALUES (1,'Marco Palma','marco.palma@duocuc.cl','$2b$12$examplehash0000000000000000000000000000000000000001','ACTIVO'),(2,'Carolina Muñoz','carolina.munoz@colegio.cl','$2b$12$examplehash0000000000000000000000000000000000000002','ACTIVO'),(3,'Felipe Rojas','felipe.rojas@colegio.cl','$2b$12$examplehash0000000000000000000000000000000000000003','ACTIVO'),(4,'Daniela Soto','daniela.soto@gmail.com','$2b$12$examplehash0000000000000000000000000000000000000004','ACTIVO'),(5,'Rodrigo Fuentes','rodrigo.fuentes@gmail.com','$2b$12$examplehash0000000000000000000000000000000000000005','ACTIVO'),(6,'Javiera Contreras','javiera.contreras@gmail.com','$2b$12$examplehash0000000000000000000000000000000000000006','ACTIVO'),(7,'Martina Fuentes','martina.fuentes@colegio.cl','$2b$12$examplehash0000000000000000000000000000000000000007','ACTIVO'),(8,'Benjamín Soto','benjamin.soto@colegio.cl','$2b$12$examplehash0000000000000000000000000000000000000008','ACTIVO'),(9,'Antonia Rojas','antonia.rojas@colegio.cl','$2b$12$examplehash0000000000000000000000000000000000000009','ACTIVO'),(10,'Vicente Contreras','vicente.contreras@colegio.cl','$2b$12$examplehash0000000000000000000000000000000000000010','ACTIVO'),(11,'Rodrigo Valenzuela Lagos','admin@sanandres.cl','admin123','ACTIVO'),(12,'Marcela Soto Valenzuela','profesora@sanandres.cl','profe123','ACTIVO'),(13,'Carolina Tapia Morales','apoderado@sanandres.cl','apoderado123','ACTIVO'),(14,'Mateo González Tapia','alumno@sanandres.cl','alumno123','ACTIVO'),(15,'Sofía González Tapia','sofia@sanandres.cl','alumno123','ACTIVO');
/*!40000 ALTER TABLE `usuario` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuario_rol`
--

DROP TABLE IF EXISTS `usuario_rol`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuario_rol` (
  `usuario_id` int NOT NULL,
  `rol_id` int NOT NULL,
  PRIMARY KEY (`usuario_id`,`rol_id`),
  KEY `fk_usuario_rol_rol` (`rol_id`),
  CONSTRAINT `fk_usuario_rol_rol` FOREIGN KEY (`rol_id`) REFERENCES `rol` (`id`),
  CONSTRAINT `fk_usuario_rol_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuario` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuario_rol`
--

LOCK TABLES `usuario_rol` WRITE;
/*!40000 ALTER TABLE `usuario_rol` DISABLE KEYS */;
INSERT INTO `usuario_rol` VALUES (1,1),(11,1),(2,2),(3,2),(12,2),(4,3),(5,3),(6,3),(13,3),(7,4),(8,4),(9,4),(10,4),(14,4),(15,4);
/*!40000 ALTER TABLE `usuario_rol` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-10-23 22:37:03
