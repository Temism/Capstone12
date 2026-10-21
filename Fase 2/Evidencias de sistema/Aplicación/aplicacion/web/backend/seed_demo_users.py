import mysql.connector
import os
from dotenv import load_dotenv

load_dotenv()

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = int(os.getenv("DB_PORT", "3306"))
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "root123")
DB_NAME = os.getenv("DB_NAME", "plataforma_educativa")

def seed_demo_data():
    conn = mysql.connector.connect(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME,
        charset="utf8mb4",
        collation="utf8mb4_unicode_ci"
    )
    cur = conn.cursor(dictionary=True)
    
    # 1. Verificar si ya existen los usuarios demo
    cur.execute("SELECT id, email FROM USUARIO WHERE email = 'apoderado@sanandres.cl'")
    if cur.fetchone():
        print("Los usuarios demo ya existen en la base de datos.")
        conn.close()
        return

    print("Insertando usuarios demo de Colegio San Andrés...")

    # Insertar usuarios
    usuarios = [
        ("Rodrigo Valenzuela Lagos", "admin@sanandres.cl", "admin123", "ACTIVO", 1), # Admin
        ("Marcela Soto Valenzuela", "profesora@sanandres.cl", "profe123", "ACTIVO", 2), # Profe
        ("Carolina Tapia Morales", "apoderado@sanandres.cl", "apoderado123", "ACTIVO", 3), # Apoderado
        ("Mateo González Tapia", "alumno@sanandres.cl", "alumno123", "ACTIVO", 4), # Alumno
        ("Sofía González Tapia", "sofia@sanandres.cl", "alumno123", "ACTIVO", 4) # Alumno
    ]

    user_ids = {}
    for nombre, email, password, estado, rol_id in usuarios:
        cur.execute(
            "INSERT INTO USUARIO (nombre, email, contrasena, estado) VALUES (%s, %s, %s, %s)",
            (nombre, email, password, estado)
        )
        uid = cur.lastrowid
        user_ids[email] = uid
        cur.execute(
            "INSERT INTO USUARIO_ROL (usuario_id, rol_id) VALUES (%s, %s)",
            (uid, rol_id)
        )

    # 2. Cursos
    print("Insertando cursos de 1° y 2° Básico...")
    cur.execute(
        "INSERT INTO CURSO (nombre, nivel, profesor_usuario_id) VALUES (%s, %s, %s)",
        ("1° Básico B", "1basico", user_ids["profesora@sanandres.cl"])
    )
    curso_1b_id = cur.lastrowid

    cur.execute(
        "INSERT INTO CURSO (nombre, nivel, profesor_usuario_id) VALUES (%s, %s, %s)",
        ("2° Básico A", "2basico", user_ids["profesora@sanandres.cl"])
    )
    curso_2a_id = cur.lastrowid

    # 3. Alumnos y relación Apoderado
    print("Registrando alumnos y vinculación familiar...")
    cur.execute(
        "INSERT INTO ALUMNO (usuario_id, fecha_nacimiento) VALUES (%s, %s)",
        (user_ids["alumno@sanandres.cl"], "2019-04-12")
    )
    alumno_mateo_id = cur.lastrowid

    cur.execute(
        "INSERT INTO ALUMNO (usuario_id, fecha_nacimiento) VALUES (%s, %s)",
        (user_ids["sofia@sanandres.cl"], "2018-06-25")
    )
    alumno_sofia_id = cur.lastrowid

    # Vinculación de ambos alumnos a la apoderada Carolina Tapia
    cur.execute(
        "INSERT INTO ALUMNO_APODERADO (alumno_id, apoderado_usuario_id) VALUES (%s, %s)",
        (alumno_mateo_id, user_ids["apoderado@sanandres.cl"])
    )
    cur.execute(
        "INSERT INTO ALUMNO_APODERADO (alumno_id, apoderado_usuario_id) VALUES (%s, %s)",
        (alumno_sofia_id, user_ids["apoderado@sanandres.cl"])
    )

    # 4. Actividades y Preguntas
    print("Insertando actividades interactivas con voz...")
    cur.execute(
        """INSERT INTO ACTIVIDAD (curso_id, profesor_usuario_id, titulo, descripcion, fecha_entrega, ponderacion)
           VALUES (%s, %s, %s, %s, %s, %s)""",
        (
            curso_1b_id,
            user_ids["profesora@sanandres.cl"],
            "El Bosque de los Números: Sumas con Frutas hasta el 10",
            "Misión interactiva con Robot Leo para practicar cálculo mental inicial con apoyo sonoro.",
            "2026-10-15",
            20.0
        )
    )
    act_mateo_1 = cur.lastrowid

    cur.execute(
        """INSERT INTO PREGUNTA (actividad_id, enunciado, tipo, opciones, respuesta_correcta, puntaje)
           VALUES (%s, %s, %s, %s, %s, %s)""",
        (act_mateo_1, "Si tienes 3 manzanas rojas y recoges 2 verdes, ¿cuántas manzanas tienes en total?", "seleccion_multiple", "3;4;5;6", "5", 2.0)
    )

    cur.execute(
        """INSERT INTO ACTIVIDAD (curso_id, profesor_usuario_id, titulo, descripcion, fecha_entrega, ponderacion)
           VALUES (%s, %s, %s, %s, %s, %s)""",
        (
            curso_1b_id,
            user_ids["profesora@sanandres.cl"],
            "La Casa de las Letras: Identifica el sonido inicial M",
            "Actividad fónica auditiva guiada por voz para reforzar el reconocimiento de la letra M.",
            "2026-10-18",
            20.0
        )
    )
    act_mateo_2 = cur.lastrowid

    cur.execute(
        """INSERT INTO ACTIVIDAD (curso_id, profesor_usuario_id, titulo, descripcion, fecha_entrega, ponderacion)
           VALUES (%s, %s, %s, %s, %s, %s)""",
        (
            curso_2a_id,
            user_ids["profesora@sanandres.cl"],
            "Fábulas Clásicas: La Zorra y las Uvas (Comprensión con Voz)",
            "Lectura comprensiva donde el tutor IA formula preguntas para extraer la moraleja de la historia.",
            "2026-10-16",
            25.0
        )
    )
    act_sofia_1 = cur.lastrowid

    # 5. Entregas y Calificaciones
    print("Registrando calificaciones y semáforo escolar...")
    cur.execute(
        """INSERT INTO ENTREGA (actividad_id, alumno_id, fecha_entrega, calificacion, comentarios)
           VALUES (%s, %s, %s, %s, %s)""",
        (act_mateo_1, alumno_mateo_id, "2026-10-10", 6.8, "¡Excelente trabajo! Resolvió los ejercicios con apoyo auditivo rápido y seguro.")
    )
    cur.execute(
        """INSERT INTO ENTREGA (actividad_id, alumno_id, fecha_entrega, calificacion, comentarios)
           VALUES (%s, %s, %s, %s, %s)""",
        (act_mateo_2, alumno_mateo_id, "2026-10-12", 6.5, "Muy buena discriminación auditiva de la letra M.")
    )

    cur.execute(
        """INSERT INTO ENTREGA (actividad_id, alumno_id, fecha_entrega, calificacion, comentarios)
           VALUES (%s, %s, %s, %s, %s)""",
        (act_sofia_1, alumno_sofia_id, "2026-10-11", 6.5, "Gran comprensión lectora y excelente vocabulario.")
    )

    # 6. Conversación de Mensajería
    print("Registrando hilo de mensajería docente-apoderada...")
    cur.execute(
        "INSERT INTO CONVERSACION (asunto, fecha_creacion, estado) VALUES (%s, NOW(), 'ABIERTA')",
        ("Seguimiento de Mateo en Actividades con Voz",)
    )
    conv_id = cur.lastrowid

    cur.execute(
        "INSERT INTO PARTICIPANTE_CONVERSACION (conversacion_id, usuario_id, fecha_union) VALUES (%s, %s, NOW())",
        (conv_id, user_ids["profesora@sanandres.cl"])
    )
    cur.execute(
        "INSERT INTO PARTICIPANTE_CONVERSACION (conversacion_id, usuario_id, fecha_union) VALUES (%s, %s, NOW())",
        (conv_id, user_ids["apoderado@sanandres.cl"])
    )

    cur.execute(
        """INSERT INTO MENSAJE (conversacion_id, remitente_usuario_id, contenido, fecha_envio, leido)
           VALUES (%s, %s, %s, NOW(), TRUE)""",
        (
            conv_id,
            user_ids["profesora@sanandres.cl"],
            "Estimada Carolina, buenas tardes. Le comento que Mateo hoy realizó su primera actividad con el Agente de Voz IA en la sala. Como él aún está afianzando la lectura de textos largos, le ayudó muchísimo que el robot le leyera los problemas hablados con las frutas."
        )
    )
    cur.execute(
        """INSERT INTO MENSAJE (conversacion_id, remitente_usuario_id, contenido, fecha_envio, leido)
           VALUES (%s, %s, %s, NOW(), TRUE)""",
        (
            conv_id,
            user_ids["apoderado@sanandres.cl"],
            "Excelente noticia Tía Marcela. En la casa Mateo me contó muy entusiasmado que Robot Leo le hizo preguntas y que él le respondió hablando. Nos da mucha tranquilidad saber que no se frustra con la lectura."
        )
    )

    # 7. Alertas / Notificaciones
    print("Registrando notificaciones y alertas...")
    cur.execute(
        """INSERT INTO NOTIFICACION (usuario_id, tipo, titulo, contenido, fecha_creacion, estado)
           VALUES (%s, %s, %s, %s, NOW(), 'PENDIENTE')""",
        (
            user_ids["apoderado@sanandres.cl"],
            "reunion",
            "Citación: Primera Reunión de Apoderados 1° y 2° Básico",
            "Se invita a todos los apoderados a la reunión informativa del segundo semestre el día jueves a las 18:00 hrs."
        )
    )

    conn.commit()
    conn.close()
    print("¡Seed completado con éxito! Todos los usuarios y datos del Colegio San Andrés están sincronizados en MySQL.")

if __name__ == "__main__":
    seed_demo_data()
