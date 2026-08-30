import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  function handleLogout() {
    logout();
    setOpen(false);
    navigate("/login");
  }

  const navLinks = isAuthenticated
    ? [
        { to: "/garderobe", label: "Garderobe" },
        { to: "/outfits", label: "Outfits" },
        { to: "/konto", label: "Konto" },
      ]
    : [
        { to: "/login", label: "Anmelden" },
        { to: "/register", label: "Registrieren" },
      ];

  return (
    <header className="navbar">
      <div className="navbar-inner container">
        <Link to="/" className="navbar-brand" onClick={() => setOpen(false)}>
          Garderobe
        </Link>

        <button
          type="button"
          className="navbar-toggle"
          aria-label="Menü öffnen"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="navbar-toggle-bar" />
          <span className="navbar-toggle-bar" />
          <span className="navbar-toggle-bar" />
        </button>

        <nav className={`navbar-menu${open ? " is-open" : ""}`}>
          <ul className="navbar-links">
            {navLinks.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    isActive ? "navbar-link is-active" : "navbar-link"
                  }
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>

          <div className="navbar-auth">
            {isAuthenticated ? (
              <>
                {user && user.name ? (
                  <span className="navbar-user">{user.name}</span>
                ) : null}
                <button
                  type="button"
                  className="btn btn-secondary navbar-logout"
                  onClick={handleLogout}
                >
                  Abmelden
                </button>
              </>
            ) : null}
          </div>
        </nav>
      </div>
    </header>
  );
}
