import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { updateProfile } from "../services/api";
import { useAuth } from "../hooks/useAuth";

export default function AccountModal({ isOpen, onClose }) {
  const { user, setUser } = useAuth ? useAuth() : { user: null, setUser: null };
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      setNombre(user?.nombre_usuario || "");
      setEmail(user?.email || "");
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!nombre.trim() || !email.trim()) {
      toast.warn("Nombre y correo son obligatorios");
      return;
    }
    setSaving(true);
    try {
      const { data } = await updateProfile({
        nombre_usuario: nombre.trim(),
        email: email.trim(),
      });

      // Actualiza contexto si existe, y también localStorage como fallback
      try {
        setUser?.(data.user);
      } catch {}
      try {
        localStorage.setItem("user", JSON.stringify(data.user));
      } catch {}

      toast.success("Datos de cuenta actualizados");
      onClose?.();
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        (err?.response?.status === 409
          ? "El correo ya está en uso"
          : "No se pudo actualizar");
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 50 }}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Mi cuenta</h2>
        <form
          onSubmit={onSubmit}
          className="account-form"
          style={{ display: "grid", gap: 12 }}
        >
          <label>
            Nombre de usuario
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Tu nombre"
              autoFocus
            />
          </label>
          <label>
            Correo electrónico
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tucorreo@dominio.cl"
              type="email"
            />
          </label>

          <div className="modal-actions">
            <button type="submit" disabled={saving}>
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
            <button type="button" onClick={onClose}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
