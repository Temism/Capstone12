import mysql.connector
import os
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = int(os.getenv("DB_PORT", "3306"))
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "root123")
DB_NAME = os.getenv("DB_NAME", "plataforma_educativa")

def seed_messaging():
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

    print("Obteniendo usuarios del sistema...")
    cur.execute("SELECT id, email, nombre FROM USUARIO")
    usuarios_db = {u["email"]: u["id"] for u in cur.fetchall()}
    
    # IDs de usuarios principales
    u_profesora = usuarios_db.get("profesora@sanandres.cl", 12)
    u_apoderado = usuarios_db.get("apoderado@sanandres.cl", 13)
    u_admin = usuarios_db.get("admin@sanandres.cl", 11)
    u_marco = usuarios_db.get("marco.palma@duocuc.cl", 1)
    u_carolina_m = usuarios_db.get("carolina.munoz@colegio.cl", 2)
    u_rodrigo_f = usuarios_db.get("rodrigo.fuentes@gmail.com", 5)

    print(f"IDs encontrados: Profe={u_profesora}, Apoderada={u_apoderado}, Director={u_admin}")

    # Limpiar tablas de mensajería para insertar set completo y consistente
    cur.execute("SET FOREIGN_KEY_CHECKS = 0")
    cur.execute("TRUNCATE TABLE MENSAJE")
    cur.execute("TRUNCATE TABLE PARTICIPANTE_CONVERSACION")
    cur.execute("TRUNCATE TABLE CONVERSACION")
    cur.execute("SET FOREIGN_KEY_CHECKS = 1")

    ahora = datetime.now()

    # 1. Conversación: Profesora Marcela Soto <-> Apoderada Carolina Tapia (Mateo)
    c1_fecha = ahora - timedelta(days=2, hours=4)
    cur.execute(
        "INSERT INTO CONVERSACION (id, asunto, fecha_creacion, estado) VALUES (%s, %s, %s, %s)",
        (1, "Seguimiento pedagógico de Mateo (1° Básico B)", c1_fecha, "ABIERTA")
    )
    cur.execute("INSERT INTO PARTICIPANTE_CONVERSACION (conversacion_id, usuario_id, fecha_union) VALUES (%s, %s, %s)", (1, u_profesora, c1_fecha))
    cur.execute("INSERT INTO PARTICIPANTE_CONVERSACION (conversacion_id, usuario_id, fecha_union) VALUES (%s, %s, %s)", (1, u_apoderado, c1_fecha))

    c1_mensajes = [
        (u_profesora, "Estimada Carolina, buenas tardes. Le comento que Mateo hoy realizó su primera actividad con el Agente de Voz IA en la sala. Como él aún está afianzando la lectura de textos largos, le ayudó muchísimo que el robot le leyera los problemas hablados con las frutas.", c1_fecha + timedelta(minutes=10)),
        (u_apoderado, "Excelente noticia Tía Marcela. En la casa Mateo me contó muy entusiasmado que Robot Leo le hizo preguntas y que él le respondió hablando. Nos da mucha tranquilidad saber que no se frustra con la lectura.", c1_fecha + timedelta(hours=1, minutes=5)),
        (u_profesora, "Así es, esa es la meta de la IA por voz en 1° básico. Mañana continuaremos con la actividad de conteo lúdico y la próxima semana con la letra S. Saludos cordiales.", c1_fecha + timedelta(hours=1, minutes=30)),
        (u_apoderado, "Muchas gracias por su dedicación Tía Marcela. Estaremos practicando los 15 minutos diarios recomendados en la plataforma familiar.", ahora - timedelta(hours=3))
    ]
    for rem, cont, f_env in c1_mensajes:
        cur.execute(
            "INSERT INTO MENSAJE (conversacion_id, remitente_usuario_id, contenido, fecha_envio, leido) VALUES (%s, %s, %s, %s, TRUE)",
            (1, rem, cont, f_env)
        )

    # 2. Conversación: Profesora Marcela Soto <-> Apoderada Carolina Tapia (Sofía)
    c2_fecha = ahora - timedelta(days=4)
    cur.execute(
        "INSERT INTO CONVERSACION (id, asunto, fecha_creacion, estado) VALUES (%s, %s, %s, %s)",
        (2, "Rendimiento y lectura comprensiva de Sofía (2° Básico A)", c2_fecha, "ABIERTA")
    )
    cur.execute("INSERT INTO PARTICIPANTE_CONVERSACION (conversacion_id, usuario_id, fecha_union) VALUES (%s, %s, %s)", (2, u_profesora, c2_fecha))
    cur.execute("INSERT INTO PARTICIPANTE_CONVERSACION (conversacion_id, usuario_id, fecha_union) VALUES (%s, %s, %s)", (2, u_apoderado, c2_fecha))

    c2_mensajes = [
        (u_profesora, "Estimada apoderada, le informo que Sofía obtuvo nota 6.5 en su comprensión lectora de fábulas. Ha mostrado excelente participación oral y comprensión de moralejas.", c2_fecha + timedelta(hours=2)),
        (u_apoderado, "Muchas gracias por informarme profesora. Sofía disfrutó mucho la historia de la zorra y las uvas. Continuaremos reforzando la lectura compartida los fines de semana.", c2_fecha + timedelta(hours=4)),
        (u_profesora, "Perfecto, esa constancia en el hogar se nota de inmediato en su vocabulario y dicción.", c2_fecha + timedelta(hours=5))
    ]
    for rem, cont, f_env in c2_mensajes:
        cur.execute(
            "INSERT INTO MENSAJE (conversacion_id, remitente_usuario_id, contenido, fecha_envio, leido) VALUES (%s, %s, %s, %s, TRUE)",
            (2, rem, cont, f_env)
        )

    # 3. Conversación: Director Rodrigo Valenzuela <-> Apoderada Carolina Tapia
    c3_fecha = ahora - timedelta(days=6)
    cur.execute(
        "INSERT INTO CONVERSACION (id, asunto, fecha_creacion, estado) VALUES (%s, %s, %s, %s)",
        (3, "Coordinación y Apoyo Escolar - Dirección Académica", c3_fecha, "ABIERTA")
    )
    cur.execute("INSERT INTO PARTICIPANTE_CONVERSACION (conversacion_id, usuario_id, fecha_union) VALUES (%s, %s, %s)", (3, u_admin, c3_fecha))
    cur.execute("INSERT INTO PARTICIPANTE_CONVERSACION (conversacion_id, usuario_id, fecha_union) VALUES (%s, %s, %s)", (3, u_apoderado, c3_fecha))

    c3_mensajes = [
        (u_admin, "Estimadas familias: Les recordamos que este jueves tendremos la sesión informativa virtual sobre las nuevas herramientas de aprendizaje asistido por voz para el ciclo inicial.", c3_fecha + timedelta(hours=1)),
        (u_apoderado, "Buenas tardes Director, muchas gracias por la invitación. Ya pudimos probar la plataforma con Mateo y los resultados han sido muy positivos.", c3_fecha + timedelta(hours=3)),
        (u_admin, "Nos alegra mucho escuchar eso. En la reunión profundizaremos en el impacto pedagógico y responderemos consultas de los apoderados.", ahora - timedelta(days=1, hours=2))
    ]
    for rem, cont, f_env in c3_mensajes:
        cur.execute(
            "INSERT INTO MENSAJE (conversacion_id, remitente_usuario_id, contenido, fecha_envio, leido) VALUES (%s, %s, %s, %s, TRUE)",
            (3, rem, cont, f_env)
        )

    # 4. Conversación institucional del dataset original: Carolina Muñoz <-> Rodrigo Fuentes
    c4_fecha = ahora - timedelta(days=10)
    cur.execute(
        "INSERT INTO CONVERSACION (id, asunto, fecha_creacion, estado) VALUES (%s, %s, %s, %s)",
        (4, "Avance de Martina en Matemática", c4_fecha, "ABIERTA")
    )
    cur.execute("INSERT INTO PARTICIPANTE_CONVERSACION (conversacion_id, usuario_id, fecha_union) VALUES (%s, %s, %s)", (4, u_carolina_m, c4_fecha))
    cur.execute("INSERT INTO PARTICIPANTE_CONVERSACION (conversacion_id, usuario_id, fecha_union) VALUES (%s, %s, %s)", (4, u_rodrigo_f, c4_fecha))

    cur.execute(
        "INSERT INTO MENSAJE (conversacion_id, remitente_usuario_id, contenido, fecha_envio, leido) VALUES (%s, %s, %s, %s, TRUE)",
        (4, u_carolina_m, "Estimado apoderado, Martina ha mostrado buen avance en la actividad de sumas y restas.", c4_fecha + timedelta(minutes=5))
    )
    cur.execute(
        "INSERT INTO MENSAJE (conversacion_id, remitente_usuario_id, contenido, fecha_envio, leido) VALUES (%s, %s, %s, %s, TRUE)",
        (4, u_rodrigo_f, "Muchas gracias por avisar profesora, seguiremos reforzando en casa.", c4_fecha + timedelta(hours=1))
    )

    conn.commit()
    conn.close()
    print("Ingesta de mensajería completada exitosamente en MySQL.")

if __name__ == "__main__":
    seed_messaging()
