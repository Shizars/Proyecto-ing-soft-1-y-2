# test_smtp.py
import os
import smtplib
from dotenv import load_dotenv

# Carga automática de .env y sobreescribe variables existentes
load_dotenv(override=True)

# Leer configuración desde entorno
HOST = os.getenv("SMTP_HOST")
PORT = int(os.getenv("SMTP_PORT", "587"))
USER = os.getenv("SMTP_USER")
PASS = os.getenv("SMTP_PASS")

print(f"Conectando a {HOST}:{PORT} como {USER}")

# Iniciar conexión con debug para ver el diálogo SMTP
server = smtplib.SMTP(HOST, PORT, timeout=10)
server.set_debuglevel(1)
server.ehlo()
server.starttls()
server.ehlo()
try:
    server.login(USER, PASS)
    code, msg = server.noop()
    print("NOOP result:", code, msg)
finally:
    server.quit()
