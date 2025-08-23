import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function PrivateRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  // Mientras validamos el token, no renderizamos nada (o puedes mostrar un spinner)
  if (loading) {
    return null;
  }

  return isAuthenticated ? children : <Navigate to="/" replace />;
}
