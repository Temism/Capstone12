import os
import mysql.connector
from mysql.connector import Error
from dotenv import load_dotenv

# Cargar variables de entorno desde .env
load_dotenv()

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = int(os.getenv("DB_PORT", "3306"))
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_NAME = os.getenv("DB_NAME", "plataforma_educativa")

def get_connection():
    """Crea y retorna una nueva conexión a MySQL."""
    try:
        connection = mysql.connector.connect(
            host=DB_HOST,
            port=DB_PORT,
            user=DB_USER,
            password=DB_PASSWORD,
            database=DB_NAME,
            charset="utf8mb4",
            collation="utf8mb4_unicode_ci"
        )
        return connection
    except Error as e:
        print(f"[ERROR DB] Error al conectar con MySQL: {e}")
        raise e

def execute_query(query: str, params: tuple = None, fetch_one: bool = False, commit: bool = False):
    """Ejecuta una consulta SQL retornando diccionarios con los nombres de columnas."""
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute(query, params or ())
        
        if commit:
            conn.commit()
            last_id = cursor.lastrowid
            affected = cursor.rowcount
            cursor.close()
            return {"last_id": last_id, "affected_rows": affected}
        
        if fetch_one:
            result = cursor.fetchone()
        else:
            result = cursor.fetchall()
            
        cursor.close()
        return result
    except Error as e:
        print(f"[ERROR SQL] Error en consulta: {e}")
        raise e
    finally:
        if conn and conn.is_connected():
            conn.close()

def check_db_health():
    """Comprueba el estado de la conexión a la base de datos."""
    try:
        conn = get_connection()
        is_ok = conn.is_connected()
        conn.close()
        return is_ok
    except Exception:
        return False
