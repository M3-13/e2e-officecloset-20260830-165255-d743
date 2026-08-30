import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner container">
        <span className="footer-brand">Garderobe</span>
        <nav className="footer-links" aria-label="Rechtliches">
          <Link to="/impressum" className="footer-link">
            Impressum
          </Link>
          <Link to="/datenschutz" className="footer-link">
            Datenschutz
          </Link>
        </nav>
      </div>
    </footer>
  );
}
