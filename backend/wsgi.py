# backend/wsgi.py

from backend.app import create_app  # app.py está en esta misma carpeta

# creamos la instancia real de Flask
app = create_app()

if __name__ == "__main__":
    # Servidor escuchando en todas las IPs de tu PC, puerto 8000
    app.run(host="0.0.0.0", port=5000, debug=False)
