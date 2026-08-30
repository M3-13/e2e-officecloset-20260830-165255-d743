import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import WardrobePage from "./pages/WardrobePage.jsx";
import OutfitCreatorPage from "./pages/OutfitCreatorPage.jsx";
import AccountPage from "./pages/AccountPage.jsx";
import ImpressumPage from "./pages/ImpressumPage.jsx";
import DatenschutzPage from "./pages/DatenschutzPage.jsx";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="app-shell">
          <Navbar />
          <main className="app-main">
            <Routes>
              <Route path="/" element={<Navigate to="/garderobe" replace />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/garderobe" element={<WardrobePage />} />
              <Route path="/outfits" element={<OutfitCreatorPage />} />
              <Route path="/konto" element={<AccountPage />} />
              <Route path="/impressum" element={<ImpressumPage />} />
              <Route path="/datenschutz" element={<DatenschutzPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
