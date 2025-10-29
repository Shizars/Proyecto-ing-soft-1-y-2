import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { updateProfile } from "../services/api";
import { useAuth } from "../hooks/useAuth";

export default function AccountSettingsModal({ isOpen, onClose, currentUser }) {
  const { user, setUser } = useAuth?.() || { user: currentUser };
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const u = currentUser || user || {};
    setNombre(u?.nombre_usuario || "");
    setEmail(u?.email || "");
  }, [currentUser, user, isOpen]);

  if (!isOpen) return null;

  const onSave = async (e) => {
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

      // Actualiza el estado global si existe setUser en tu hook
      if (setUser) setUser(data.user);

      // Como respaldo, guarda en localStorage si lo usas para hidratar sesión
      try {
        const raw = JSON.parse(localStorage.getItem("auth") || "{}");
        localStorage.setItem(
          "auth",
          JSON.stringify({ ...raw, user: data.user })
        );
      } catch {}

      toast.success("Datos actualizados");
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
    <div
      className="modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Mi cuenta</h2>
        <form onSubmit={onSave} className="form-grid">
          <label>
            Nombre de usuario
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Tu nombre"
            />
          </label>
          <label>
            Correo
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.cl"
            />
          </label>

          <div className="modal-actions">
            <button type="submit" disabled={saving}>
              {saving ? "Guardando..." : "Guardar"}
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
