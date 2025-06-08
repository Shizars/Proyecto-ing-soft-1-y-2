import "./App.css";
import Header from "./componentes/Header";
import Footer from "./componentes/Footer";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import AboutPage from "./pages/AboutPage";
import Dashboard from "./pages/Dashboard"; // ejemplo de ruta privada
import PrivateRoute from "./componentes/PrivateRoute"; // el wrapper que creaste

function App() {
  return (
    <Router>
      <div className="App">
        <Header />

        <Routes>
          {/* Públicas */}
          <Route path="/" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/proyecto" element={<AboutPage />} />

          {/* Privadas */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
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
