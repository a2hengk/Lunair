import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { username } from "better-auth/plugins";
import { db, schema } from "./db";

export const USERNAME_PATTERN = /^[a-zA-Z0-9_.]{3,24}$/;

export const auth = betterAuth({
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
