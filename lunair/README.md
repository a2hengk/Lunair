# lunair

Euer Tagebuch unter Freunden – Fotos, Texte und Stories in einer geschlossenen Gruppe. Rein nur mit Einladung.

## Stack

Next.js 16 (App Router, Server Actions) · Postgres + Drizzle · Better Auth (Benutzername + Passwort) · Tailwind 4

## Lokal starten

```bash
npm install
cp .env.example .env          # DATABASE_URL und BETTER_AUTH_SECRET eintragen
npm run db:migrate            # Tabellen anlegen
npm run dev                   # localhost:3000 → „Ersten Account anlegen“
```

`BETTER_AUTH_SECRET` erzeugen: `openssl rand -base64 32`

Solange es keinen Account gibt, bietet `/login` die Ersteinrichtung an. Danach kommt man nur noch per Einladungslink rein (**Einstellungen → Freunde einladen**, ein Link = eine Person, 7 Tage gültig). `npm run invite` erzeugt zur Not einen Link direkt in der DB.

## Deploy (Vercel)

Root Directory im Projekt: `lunair`. Funktionen laufen in Frankfurt (`vercel.json`).

1. **Storage → Neon Postgres** anlegen, Region Frankfurt, mit dem Projekt verbinden – setzt `DATABASE_URL`
2. **Storage → Blob** anlegen, Zugriff **Private**, mit dem Projekt verbinden – setzt den Blob-Token
3. **Settings → Environment Variables:** `BETTER_AUTH_SECRET` für Production und Preview
4. Neu deployen – der Build spielt die Migrationen automatisch ein
5. Seite öffnen → „Ersten Account anlegen“

## Bilder

Fotos werden im Browser auf max. 1600 px verkleinert und als JPEG neu geschrieben (EXIF/GPS fliegt dabei raus), Profilbilder auf 512 px quadratisch. Gespeichert wird in einem **privaten** Vercel-Blob-Store; ausgeliefert nur über `/api/media/…`, das den Login prüft. In der DB stehen Pfade, keine URLs – ein Wechsel zu R2 betrifft nur `lib/storage.ts`.

Ohne Blob-Token speichert lunair lokal unter `.data/uploads`. Auf Vercel ohne Blob gehen nur Text-Beiträge.

`BETTER_AUTH_URL` ist nur für eine eigene Domain nötig; `*.vercel.app` wird automatisch erkannt.

## Schema ändern

`lib/db/schema.ts` anpassen → `npm run db:generate` → `npm run db:migrate`

## Stand

- [x] Login, Registrierung nur per Einladungslink, Logout
- [x] Profil (`/u/[username]`) mit Name und Bio, bearbeiten unter `/settings`
- [x] Startseite mit Story-Leiste (Mitglieder) und leerem Feed
- [x] Profilbild hochladen, ändern, entfernen
- [x] Beiträge mit Text und/oder bis zu 4 Fotos, Feed, Profil-Raster, Einzelansicht, Löschen
- [x] Profil-Banner (3:1), Zurück-Button
- [x] Reaktionen (6 Emojis + eigene Sticker, bis zu 3 pro Person) auf Beiträge und Kommentare
- [x] Kommentare mit Antworten (eine Ebene) und Stickern
- [x] Eigene Sticker (Einstellungen → Sticker, 256 × 256 PNG, für alle nutzbar)
- [x] Fotos am PC: Pfeile, Pfeiltasten, mit der Maus wischen; Vollbild mit Zoom
- [x] Reaktionen und neueste Kommentare steigen beim Sichtbarwerden auf und verblassen
- [ ] Stories
- [ ] PWA
