import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { username } from "better-auth/plugins";
import { db, schema } from "./db";

export const USERNAME_PATTERN = /^[a-zA-Z0-9_.]{3,24}$/;

// Base-URL ohne Pflicht-Env: Host aus dem Request, aber nur von erlaubten Domains.
// Deckt lunair-one.vercel.app, Preview-URLs und lokal ab; eigene Domain über BETTER_AUTH_URL.
const customHost = process.env.BETTER_AUTH_URL ? new URL(process.env.BETTER_AUTH_URL).host : undefined;
const productionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL;

export const auth = betterAuth({
  baseURL: {
    allowedHosts: [
      "lunair-*.vercel.app",
      "localhost:3000",
      ...(customHost ? [customHost] : []),
      ...(productionHost ? [productionHost] : []),
    ],
    fallback: process.env.BETTER_AUTH_URL ?? (productionHost ? `https://${productionHost}` : "http://localhost:3000"),
  },
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  user: {
    additionalFields: {
      bio: { type: "string", required: false, input: false },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 60, // 60 Tage eingeloggt bleiben
    updateAge: 60 * 60 * 24,
    // Session 5 Min. im signierten Cookie: jedes Bild prüft den Login, ohne jedes Mal die DB zu fragen.
    cookieCache: { enabled: true, maxAge: 5 * 60 },
  },
  // Registrierung nur über unsere Server Action mit Einladungscode –
  // der öffentliche HTTP-Endpunkt ist deshalb abgeschaltet.
  disabledPaths: ["/sign-up/email"],
  plugins: [
    username({
      minUsernameLength: 3,
      maxUsernameLength: 24,
      usernameValidator: (value) => USERNAME_PATTERN.test(value),
    }),
    nextCookies(), // muss das letzte Plugin sein
  ],
});
