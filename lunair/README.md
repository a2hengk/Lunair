# lunair

Euer Tagebuch unter Freunden – Fotos, Texte und Stories in einer geschlossenen Gruppe. Rein nur mit Einladung.

## Stack

Next.js 16 (App Router, Server Actions) · Postgres + Drizzle · Better Auth (Benutzername + Passwort) · Tailwind 4

## Lokal starten

```bash
npm install
cp .env.example .env          # DATABASE_URL und BETTER_AUTH_SECRET eintragen
npm run db:migrate            # Tabellen anlegen
npm run invite                # erste Einladung erzeugen, Link im Browser öffnen
npm run dev
```

`BETTER_AUTH_SECRET` erzeugen: `openssl rand -base64 32`

Nach dem ersten Account lädt man weitere Leute unter **Einstellungen → Freunde einladen** ein. Jeder Link gilt für eine Person und 7 Tage.

## Deploy (Vercel)

1. Postgres anlegen (z. B. Neon über den Vercel Marketplace), `DATABASE_URL` setzen
2. `BETTER_AUTH_SECRET` und `BETTER_AUTH_URL` (die echte Domain) als Env-Variablen setzen
3. Einmal `npm run db:migrate` gegen die Produktions-DB laufen lassen, dann `npm run invite`

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
