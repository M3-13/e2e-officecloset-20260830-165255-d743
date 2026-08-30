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

const listStyle = {
  margin: 0,
  paddingLeft: "var(--space-4)",
};

export default function DatenschutzPage() {
  return (
    <section className="page">
      <h1 className="page-title">Datenschutzerklärung</h1>
      <p className="page-subtitle">
        Informationen zum Umgang mit deinen personenbezogenen Daten.
      </p>

      <div style={cardStyle}>
        <div style={blockStyle}>
          <h2 style={headingStyle}>1. Verantwortlicher</h2>
          <p>
            Garderobe
            <br />
            Musterstraße 1<br />
            12345 Musterstadt
            <br />
            E-Mail: kontakt@garderobe.example
          </p>
        </div>

        <div style={blockStyle}>
          <h2 style={headingStyle}>2. Gespeicherte Kontodaten</h2>
          <p>
            Bei der Registrierung werden dein Name, deine E-Mail-Adresse und
            ein Passwort gespeichert. Das Passwort wird niemals im Klartext
            abgelegt, sondern ausschließlich als gehashter Wert. Die
            Kontodaten werden benötigt, um dir Zugang zu deiner persönlichen
            Garderobe zu gewähren und dich von anderen Nutzern zu
            unterscheiden.
          </p>
        </div>

        <div style={blockStyle}>
          <h2 style={headingStyle}>3. Hochgeladene Bilder</h2>
          <p>
            Bilder, die du deinen Kleidungsstücken hinzufügst, werden auf
            unserem Server gespeichert und sind ausschließlich für dich
            sichtbar. Es findet kein öffentliches Teilen und keine Weitergabe
            an Dritte statt. Die Bilder können jederzeit über die Garderobe
            oder durch Löschen deines Kontos entfernt werden.
          </p>
        </div>

        <div style={blockStyle}>
          <h2 style={headingStyle}>4. Lokal gespeicherter Token</h2>
          <p>
            Nach der Anmeldung wird ein Zugriffstoken (JWT) ausschließlich
            lokal in deinem Browser gespeichert (localStorage). Er dient
            dazu, deine Sitzung zu erhalten, sodass du dich nicht bei jedem
            Seitenaufruf erneut anmelden musst. Der Token wird nicht an Dritte
            übertragen. Du kannst ihn jederzeit entfernen, indem du dich
            abmeldest.
          </p>
        </div>

        <div style={blockStyle}>
          <h2 style={headingStyle}>5. Kontolöschung</h2>
          <p>
            Du kannst dein Konto jederzeit über die Kontoseite selbst
            löschen. Dabei werden dauerhaft entfernt:
          </p>
          <ul style={listStyle}>
            <li>deine Kontodaten (Name, E-Mail-Adresse, Passwort-Hash),</li>
            <li>deine Kleidungsstücke und zugehörige Bilder,</li>
            <li>deine gespeicherten Outfits.</li>
          </ul>
        </div>

        <div style={blockStyle}>
          <h2 style={headingStyle}>6. Deine Rechte</h2>
          <p>
            Du hast das Recht auf Auskunft, Berichtigung und Löschung deiner
            gespeicherten Daten sowie auf Einschränkung der Verarbeitung.
            Wende dich dafür an die oben genannte Kontaktadresse.
          </p>
        </div>

        <div>
          <h2 style={headingStyle}>7. Drittanbieter-Ressourcen</h2>
          <p>
            Diese Anwendung lädt keine Schriften, Skripte oder Tracker von
            Drittanbietern.
          </p>
        </div>
      </div>
    </section>
  );
}
