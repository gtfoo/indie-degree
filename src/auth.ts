/**
 * Signing in, which only one person can do.
 *
 * The transcript is public on purpose — a credential nobody can inspect is not
 * a credential. So reading is open to everyone and always will be, and the
 * account exists solely to decide who may *write*. There is exactly one such
 * person: the address in OWNER_EMAIL.
 *
 * Magic link, no passwords. Passwords would not have avoided the email
 * dependency — "forgot password" is an email — they would only have added
 * hashing, reset tokens and credential-stuffing defence on top of it.
 *
 * Sessions are JWTs, so there is no session table and no database round-trip to
 * read one.
 */
import NextAuth, { type NextAuthConfig } from "next-auth";
import Resend from "next-auth/providers/resend";
import { SqliteAdapter } from "@/server/auth-adapter";
import { LINK_MINUTES, sendVerificationRequest } from "@/server/signin-email";
import { reportUserCounts } from "@/server/user-counts";

/**
 * The single account permitted to exist.
 *
 * Deliberately has no default. This repository is meant to be forked, and a
 * hardcoded address would mean a forked deployment quietly trusts its author's
 * email rather than its operator's. No OWNER_EMAIL means nobody can sign in,
 * which is the safe way to be misconfigured.
 */
export function ownerEmail(): string | null {
  const raw = process.env.OWNER_EMAIL?.trim().toLowerCase();
  return raw ? raw : null;
}

const providers: NextAuthConfig["providers"] = [];

if (process.env.AUTH_RESEND_KEY) {
  providers.push(
    Resend({
      apiKey: process.env.AUTH_RESEND_KEY,
      // Must be a domain VERIFIED in Resend. A subdomain is a separate domain
      // there and needs its own DNS records; sending from an unverified one
      // fails silently, and the only symptom is that no email ever arrives.
      from: process.env.AUTH_EMAIL_FROM ?? "login@gtfoo.com",
      name: "Indie Degree sign-in link",
      // Short-lived: a link that works all day is a link that works for whoever
      // reads the inbox tomorrow. The SAME constant the email quotes, imported
      // rather than repeated — two constants drift, and an email promising
      // fifteen minutes for a token that dies in five teaches people the app is
      // broken while nothing reports a problem.
      maxAge: LINK_MINUTES * 60,
      // Auth.js's default template never mentions that the link expires.
      sendVerificationRequest,
    }),
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: SqliteAdapter(),
  providers,
  session: { strategy: "jwt" },
  pages: { signIn: "/signin", verifyRequest: "/signin/check-email" },

  callbacks: {
    /**
     * The allowlist, enforced here rather than after the link is clicked.
     *
     * This callback runs twice: once when a link is REQUESTED (with
     * `email.verificationRequest`) and again when one is used. Rejecting at the
     * request step is what stops this app being a free way to send mail to
     * arbitrary addresses — a stranger who types someone else's address gets
     * nothing sent, rather than an email that merely fails to work.
     */
    async signIn({ user }) {
      const owner = ownerEmail();
      if (!owner) return false;
      return user?.email?.trim().toLowerCase() === owner;
    },

    async jwt({ token, user }) {
      if (user?.email) token.email = user.email;
      return token;
    },

    async session({ session, token }) {
      if (typeof token.email === "string") session.user.email = token.email;
      return session;
    },
  },

  events: {
    // After a sign-in actually completes, refresh the count gtfoo.com/admin
    // renders. Fire and forget: a failed write must never fail a sign-in.
    signIn() {
      reportUserCounts(true);
    },
  },
});

/**
 * Is signing in usable at all?
 *
 * Auth.js needs AUTH_SECRET even to READ a session, so calling auth() without
 * one throws MissingSecret on every render. Reading this app never requires an
 * account, so a missing secret means "no sign-in", not "broken app" — callers
 * check this before touching auth() rather than catching an exception.
 */
export function authConfigured(): boolean {
  return (
    Boolean(process.env.AUTH_SECRET) && providers.length > 0 && Boolean(ownerEmail())
  );
}

/** Safe session read: null when auth is not configured, instead of throwing. */
export async function currentUser(): Promise<{ email: string } | null> {
  if (!authConfigured()) return null;
  try {
    const email = (await auth())?.user?.email;
    return email ? { email } : null;
  } catch (err) {
    // Reading a session touches headers, which during static generation makes
    // Next throw to say "this route is dynamic". That is control flow, not a
    // fault: swallowing it stops Next learning the route is dynamic, and
    // logging it prints an error on every build for something working exactly
    // as designed — which is how people learn to ignore build output.
    if (
      (err as { digest?: string })?.digest?.startsWith("DYNAMIC_SERVER_USAGE") ||
      (err instanceof Error && err.message.includes("Dynamic server usage"))
    ) {
      throw err;
    }
    console.error("session read failed", err);
    return null;
  }
}

/**
 * May this request change anything?
 *
 * Checked again on every write rather than trusted from the UI. The buttons
 * being hidden is a courtesy to readers; this is the actual boundary.
 */
export async function isOwner(): Promise<boolean> {
  const owner = ownerEmail();
  if (!owner) return false;
  const user = await currentUser();
  return user?.email.trim().toLowerCase() === owner;
}
