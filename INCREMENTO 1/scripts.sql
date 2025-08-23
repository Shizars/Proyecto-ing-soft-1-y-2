
-- Script SQL para crear tablas del sistema de gestión documental
-- Compatible con PostgreSQL

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    nombre_usuario VARCHAR(80) UNIQUE NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    password_hash VARCHAR(128) NOT NULL,
    role VARCHAR(30) DEFAULT 'cliente',
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tags (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE documents (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(200) NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    categoria VARCHAR(50),
    formato VARCHAR(10),
    fecha_subida TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    owner_id INTEGER REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE document_tags (
    document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (document_id, tag_id)
);
