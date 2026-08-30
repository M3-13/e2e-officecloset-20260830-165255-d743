const cardStyle = {
  backgroundColor: "var(--color-surface)",
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-lg)",
  padding: "var(--space-4)",
  marginTop: "var(--space-4)",
};

const blockStyle = {
  marginBottom: "var(--space-4)",
};

const headingStyle = {
  fontSize: "18px",
  color: "var(--color-accent)",
  marginBottom: "var(--space-2)",
};

const mutedStyle = {
  color: "var(--color-muted)",
};

export default function ImpressumPage() {
  return (
    <section className="page">
      <h1 className="page-title">Impressum</h1>
      <p className="page-subtitle">
        Angaben gemäß § 5 TMG sowie § 18 Abs. 2 MStV.
      </p>

      <div style={cardStyle}>
        <div style={blockStyle}>
          <h2 style={headingStyle}>Anbieterkennzeichnung</h2>
          <p>
            <strong>Garderobe</strong> – Glamouröser Kleiderschrank-Manager
            <br />
            Musterstraße 1<br />
            12345 Musterstadt
            <br />
            Deutschland
          </p>
        </div>

        <div style={blockStyle}>
          <h2 style={headingStyle}>Kontakt</h2>
          <p>
            E-Mail: kontakt@garderobe.example
            <br />
            Telefon: +49 123 456789
          </p>
        </div>

        <div style={blockStyle}>
          <h2 style={headingStyle}>Vertretungsberechtigte Person</h2>
          <p>Max Mustermann (Geschäftsführung)</p>
        </div>

        <div style={blockStyle}>
          <h2 style={headingStyle}>Verantwortlich für den Inhalt</h2>
          <p>Max Mustermann (Anschrift wie oben)</p>
        </div>

        <div style={blockStyle}>
          <h2 style={headingStyle}>Haftungshinweis</h2>
          <p style={mutedStyle}>
            Trotz sorgfältiger inhaltlicher Kontrolle übernehmen wir keine
            Haftung für die Inhalte externer Links. Für den Inhalt der
            verlinkten Seiten sind ausschließlich deren Betreiber
            verantwortlich.
          </p>
        </div>

        <div>
          <h2 style={headingStyle}>Urheberrecht</h2>
          <p style={mutedStyle}>
            Die durch die Seitenbetreiber erstellten Inhalte und Werke auf
            diesen Seiten unterliegen dem deutschen Urheberrecht.
          </p>
        </div>
      </div>
    </section>
  );
}
