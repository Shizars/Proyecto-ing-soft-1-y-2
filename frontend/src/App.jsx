import "./App.css";
import Header from "./componentes/Header";
import Footer from "./componentes/Footer";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";

import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import AboutPage from "./pages/AboutPage";
import DashboardPage from "./pages/DashboardPage";
import PrivateRoute from "./componentes/PrivateRoute";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";

import ShareViewer from "./pages/ShareViewer";

/* ---------- envoltorio que usa useLocation ---------- */
function AppInner() {
  const { pathname } = useLocation();

  /* Oculta footer en todas las rutas privadas */
  const hideFooter = pathname.startsWith("/dashboard");
  const hideHeader = pathname.startsWith("/dashboard/auditorias");

  return (
    <div className="App">
      <Header />

      {/* contenedor flexible */}
      <main className="App-content">
        <Routes>
          {/* Públicas */}
          <Route path="/registro" element={<RegisterPage />} />
          <Route path="/" element={<LoginPage />} />
          <Route path="/proyecto" element={<AboutPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route
            path="/reset-password/:token"
            element={<ResetPasswordPage />}
          />
          <Route path="/shared/:token" element={<ShareViewer />} />

          {/* Privadas */}
          <Route
            path="/dashboard/*"
            element={
              <PrivateRoute>
                <DashboardPage />
              </PrivateRoute>
            }
          />

          {/* 🔐 Ruta privada para crear una Auditoría */}
        </Routes>
      </main>

      {/* se renderiza solo si NO estamos en dashboard */}
      {!hideFooter && <Footer />}
    </div>
  );
}

/* ---------- export principal ---------- */
export default function App() {
  return (
    <Router>
      <AppInner />
    </Router>
  );
}
