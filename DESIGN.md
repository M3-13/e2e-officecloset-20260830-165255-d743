# Design — Project Identity

> This document is project-long-lived. Tokens are not changed without
> the Architect's approval. Developers MUST use these tokens
> instead of improvising their own colors/spacings.

## Style Direction

Elegante Red-Carpet-Optik: tiefes, warmes Schwarz mit Champagner-Weiß, gedämpftem Goldakzent und serifenbetonten Überschriften – glamourös, aber klar und ruhig wie eine hochwertige Produkt-App.

## Colors

- `--color-bg`: **#0E0C0A**
- `--color-surface`: **#191512**
- `--color-surface_alt`: **#211C17**
- `--color-fg`: **#F3EBDD**
- `--color-muted`: **#A89B87**
- `--color-border`: **#3A322A**
- `--color-accent`: **#C9A24B**
- `--color-accent_hover`: **#D9B45F**
- `--color-accent_active`: **#B08A3C**
- `--color-danger`: **#C05B4D**
- `--color-success`: **#6E8F6A**
- `--color-focus_ring`: **rgba(201, 162, 75, 0.28)**

## Typography

- `font_family`: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif
- `heading_font_family`: Didot, "Bodoni MT", Georgia, "Times New Roman", serif
- `heading_weight`: 700
- `body_weight`: 400
- `size_scale`: xs: 12px; sm: 14px; base: 16px; lg: 18px; xl: 24px; xxl: 32px

## Spacing Scale

- `--space-0`: 4px
- `--space-1`: 8px
- `--space-2`: 12px
- `--space-3`: 16px
- `--space-4`: 24px
- `--space-5`: 32px
- `--space-6`: 48px

## Border-Radii

- `--radius-sm`: 4px
- `--radius-md`: 8px
- `--radius-lg`: 16px
- `--radius-pill`: 999px

## Components

### Button

Primär: padding 12px 24px, min-height 44px (Touch), radius md, font-weight 600, transition 160ms ease; default bg=accent #C9A24B fg=#0E0C0A; hover bg=accent_hover; active bg=accent_active + translateY(1px); disabled opacity 0.5, cursor not-allowed. Sekundär: bg=transparent, border 1px border, fg=fg; hover border=accent fg=accent; active bg=surface_alt. Danger: bg=transparent, border 1px danger, fg=danger; hover bg=danger fg=#0E0C0A.

### Card

Garderoben-Karte: bg=surface, border 1px border, radius lg, padding 16px, transition border-color/transform 160ms; hover border=accent, translateY(-2px). Bild oben radius md, object-fit cover, aspect-ratio 3/4, leichter Schlagschatten rgba(0,0,0,0.3). Titel 16px/600 fg, Meta 14px muted.

### Input

Label 14px muted über dem Feld. Feld bg=surface_alt, border 1px border, radius md, padding 12px 14px, min-height 44px, fg=fg, placeholder=muted; focus border=accent + ring 3px focus_ring; error border=danger + Meldung 14px danger. File-Upload als gestrichelte Dropzone radius lg, padding 24px, min-height 120px.

### Modal

Overlay rgba(0,0,0,0.6) + backdrop-filter blur(4px). Dialog bg=surface, border 1px border, radius lg, padding 24px, max-width 480px, zentriert; Titel serif 24px fg; Schließen-Icon 44x44px Touch-Ziel.

### Navbar

Sticky oben, bg=rgba(14,12,10,0.85) + backdrop-filter blur(8px), border-bottom 1px border, Höhe 64px. Logo serif 20px in accent. Links 16px fg, hover muted, aktiver Link accent. Mobile: Hamburger-Button 44x44px, Menü als ausklappbares Panel bg=surface.

### CategoryChip

Filter-Pill: padding 8px 16px, min-height 44px, radius pill, border 1px border, bg=surface, fg=muted; hover border=accent fg=fg; active bg=accent fg=#0E0C0A border=accent.

### EmptyState

Zentrierter Block padding 48px 24px, Icon 48px muted, Titel serif 24px fg, Beschreibung 16px muted, CTA als primärer Button darunter.

## Layout Principles

- Container max-width 1200px, zentriert; horizontales Padding 16px mobil, 24px ab 640px.
- Breakpoints: 640px (Mobil), 1024px (Desktop).
- Garderobe-Grid: repeat(auto-fill, minmax(180px, 1fr)), gap 16px; auf Desktop mindestens 4 Spalten sichtbar.
- Outfit-Creator: Desktop zweispaltig (Auswahl links, Vorschau rechts sticky), mobil einspaltig gestapelt.
- Vertikaler Sektionsabstand 48px, innerhalb von Cards 16px.
- Auth-Seiten: zentrierte Karte max-width 420px, vertikal mittig im Viewport.
- Übergänge einheitlich 160ms ease; Fokus-Zustände immer sichtbar mit focus_ring.
