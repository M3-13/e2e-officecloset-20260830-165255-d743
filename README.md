# Glamouröser Kleiderschrank-Manager

Ein Mehrbenutzer-Webtool im Hollywood-Stil, in dem sich Nutzer registrieren, ihre
Kleidungsstücke mit Bildern und Kategorien verwalten, die Garderobe durchstöbern
und im Outfit-Creator Einzelteile zu gespeicherten Outfits kombinieren. Jede
Garderobe und jedes Outfit ist strikt privat und nur für den jeweiligen Benutzer
sichtbar – kein öffentliches Teilen, keine Community-Features.

## Tech-Stack

- **Backend**: Python, FastAPI, SQLAlchemy (SQLite)
- **Auth**: JWT (Bearer), Passwort-Hashing (bcrypt)
- **Storage**: lokaler Datei-Upload
- **Frontend**: Vite + React

## Installation

Voraussetzungen: Python 3.13+.

```bash
cd backend
py -m pip install -r requirements.txt
```

## Start (Entwicklung)

1. Eine `.env`-Datei aus der Vorlage anlegen und `JWT_SECRET` setzen (ein
   Secret, das nie als Literal im Repository liegt):

   ```bash
   cd backend
   copy .env.example .env
   py -c "import secrets; print(secrets.token_hex(32))"
   # den ausgegebenen Wert als JWT_SECRET=... in .env eintragen
   ```

2. Starten:

   ```bash
   cd backend
   py -m uvicorn app.main:app --reload --port 8000
   ```

   Alternativ ohne `.env`-Datei (PowerShell):

   ```powershell
   cd backend
   $env:JWT_SECRET = "dein-generiertes-secret"
   py -m uvicorn app.main:app --reload --port 8000
   ```

Die API ist danach unter `http://localhost:8000` erreichbar, die interaktive
Dokumentation unter `http://localhost:8000/docs`.

Der Start ist zusätzlich maschinenlesbar in `RUN.json` im Repo-Wurzelverzeichnis
hinterlegt (Installations- und Startkommando, Port, Health-Check und
Umgebungsvariablen). Der CI-Pipeline-Runner erzeugt `JWT_SECRET` dabei pro Lauf
selbst (Klasse `generate`).

## Konfiguration

Die Anwendung liest ihre Konfiguration aus der Umgebung (`.env` wird unterstützt,
Vorlage unter `backend/.env.example`):

| Variable          | Default                    | Beschreibung                          |
| ----------------- | -------------------------- | ------------------------------------- |
| `JWT_SECRET`      | (kein Default – generiert) | Signier-Secret für JWT-Tokens         |
| `DATABASE_URL`    | `sqlite:///./wardrobe.db`  | SQLAlchemy-Datenbank-URL              |
| `UPLOAD_DIR`      | `./uploads`                | Verzeichnis für Bild-Uploads          |
| `FRONTEND_ORIGIN` | `http://localhost:5173`    | Erlaubte CORS-Origin des Frontends    |
| `MAX_UPLOAD_SIZE` | `5242880` (5 MB)           | Maximale Upload-Größe in Bytes        |

`JWT_SECRET` ist ein Secret und wird **nie** als Literal im Repository abgelegt.
Für die lokale Entwicklung legt man es über `.env` (aus `.env.example` kopiert)
oder per Umgebungsvariable fest – siehe „Start (Entwicklung)".

## API-Endpunkte

Alle Endpunkte außer `/api/health`, `/api/auth/register` und `/api/auth/login`
erfordern `Authorization: Bearer <JWT>`; jeder Fehler liefert
`{"detail": "<Meldung>"}` mit passendem Status.

### Auth

| Methode | Pfad               | Body                          | Erfolg                                        |
| ------- | ------------------ | ----------------------------- | --------------------------------------------- |
| POST    | `/api/auth/register` | `{name, email, password}`   | 201 `{access_token, token_type, user}`        |
| POST    | `/api/auth/login`    | `{email, password}`         | 200 `{access_token, token_type, user}`        |
| POST    | `/api/auth/logout`   | –                            | 204                                           |

### Health

| Methode | Pfad          | Erfolg                  |
| ------- | ------------- | ----------------------- |
| GET     | `/api/health` | 200 `{"status": "ok"}`  |

### Items (Kleidungsstücke)

| Methode | Pfad                    | Body/Form                                     | Erfolg     |
| ------- | ----------------------- | --------------------------------------------- | ---------- |
| GET     | `/api/items`            | –                                             | 200 `[Item]` |
| POST    | `/api/items`            | multipart: `name`, `category`, `image`, `description?`, `color?` | 201 `Item` |
| GET     | `/api/items/{id}`       | –                                             | 200 `Item` |
| PATCH   | `/api/items/{id}`       | multipart (Bild optional)                     | 200 `Item` |
| DELETE  | `/api/items/{id}`       | –                                             | 204        |
| GET     | `/api/items/{id}/image` | –                                             | 200 Bild-Bytes |

`category` ∈ `{oberteil, hose, kleid, schuhe, accessoire}`.

### Outfits

| Methode | Pfad                 | Body                          | Erfolg       |
| ------- | -------------------- | ----------------------------- | ------------ |
| GET     | `/api/outfits`       | –                             | 200 `[Outfit]` |
| POST    | `/api/outfits`       | `{name, item_ids: [int]}`     | 201 `Outfit` |
| GET     | `/api/outfits/{id}`  | –                             | 200 `Outfit` |
| PATCH   | `/api/outfits/{id}`  | `{name?, item_ids?}`          | 200 `Outfit` |
| DELETE  | `/api/outfits/{id}`  | –                             | 204          |

### Account

| Methode | Pfad           | Erfolg |
| ------- | -------------- | ------ |
| DELETE  | `/api/account` | 204    |

## Datenmodelle

- `User` `{id: int, name: str, email: str}`
- `Item` `{id: int, name: str, category: str, description: str|null, color: str|null, image_url: str, owner_id: int}`
- `Outfit` `{id: int, name: str, item_ids: [int], owner_id: int}`

## Features

- Registrierung und Login mit JWT-Session (bcrypt-gehashte Passwörter)
- Garderobe: Kleidungsstücke mit Bild, Kategorie, Farbe und Beschreibung anlegen, filtern, bearbeiten und löschen
- Outfit-Creator: Einzelteile kombinieren, als Outfit speichern, bearbeiten und löschen
- Strikte Privatsphäre: jeder Nutzer sieht nur seine eigenen Daten
- Kontolöschung inklusive aller zugehörigen Daten
