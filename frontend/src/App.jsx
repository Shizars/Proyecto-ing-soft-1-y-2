import "./App.css";
import Header from "./componentes/Header";
import Footer from "./componentes/Footer";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import AboutPage from "./pages/AboutPage";
import DashboardPage from "./pages/DashboardPage"; // ejemplo de ruta privada
import PrivateRoute from "./componentes/PrivateRoute"; // el wrapper que creaste

function App() {
  return (
    <Router>
      <div className="App">
        <Header />

        <Routes>
          {/* Públicas */}
          <Route path="/registro" element={<RegisterPage />} />
          <Route path="/" element={<LoginPage />} />
          <Route path="/proyecto" element={<AboutPage />} />

          {/* Privadas */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <DashboardPage />
              </PrivateRoute>
            }
          />
        </Routes>

        <Footer />
      </div>
    </Router>
  );
}

export default App;
