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
2. **Settings → Environment Variables:** `BETTER_AUTH_SECRET` für Production und Preview
3. Neu deployen – der Build spielt die Migrationen automatisch ein
4. Seite öffnen → „Ersten Account anlegen“

`BETTER_AUTH_URL` ist nur für eine eigene Domain nötig; `*.vercel.app` wird automatisch erkannt.

## Schema ändern

`lib/db/schema.ts` anpassen → `npm run db:generate` → `npm run db:migrate`

## Stand

- [x] Login, Registrierung nur per Einladungslink, Logout
- [x] Profil (`/u/[username]`) mit Name und Bio, bearbeiten unter `/settings`
- [x] Startseite mit Story-Leiste (Mitglieder) und leerem Feed
- [ ] Bilder-Upload (R2) inkl. Profilbild
- [ ] Posts (Foto/Text) und Feed
- [ ] Stories
- [ ] Likes und Kommentare
- [ ] PWA
