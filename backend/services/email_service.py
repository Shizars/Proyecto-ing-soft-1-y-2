import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# Configuración desde variables de entorno
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.example.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "user@example.com")
SMTP_PASS = os.getenv("SMTP_PASS", "password")
FROM_EMAIL = os.getenv("FROM_EMAIL", SMTP_USER)


def send_reset_email(to_email: str, reset_link: str):
    """
    Envía un correo de recuperación de contraseña con el enlace proporcionado.
    """
    subject = "Recuperación de contraseña - Fundación Ciudad del Niño"
    body = (
        f"Hola,\n\nRecibimos una solicitud de restablecimiento de contraseña. "
        f"Puedes hacerlo haciendo clic en el siguiente enlace:\n{reset_link}\n\n"
        "Si no solicitaste esto, ignora este correo.\n\nSaludos,\nFundación Ciudad del Niño"
    )

    # Construir mensaje
    message = MIMEMultipart()
    message["From"] = FROM_EMAIL
    message["To"] = to_email
    message["Subject"] = subject
    message.attach(MIMEText(body, "plain"))

    # Enviar correo, manejando STARTTLS correctamente
    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.ehlo()                     # Identificarse
            server.starttls()                 # Iniciar TLS
            server.ehlo()                     # Re-identificarse tras TLS
            server.login(SMTP_USER, SMTP_PASS)
            server.send_message(message)
    except Exception as e:
        print(f"Error enviando email a {to_email}: {e}")
        raise
