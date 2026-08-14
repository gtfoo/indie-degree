/**
 * A deliberately partial Auth.js adapter over this app's SQLite database.
 *
 * With the JWT session strategy Auth.js never calls createSession,
 * getSessionAndUser, updateSession or deleteSession, so they are omitted rather
 * than stubbed. Dead code that silently does nothing is worse than absent code:
 * it looks like a session store and is not one.
 *
 * Magic-link sign-in needs the verification-token pair plus enough user methods
 * to find or create the single account. There is no account linking and no
 * OAuth here, so linkAccount and friends are absent too.
 */
import { randomUUID } from "node:crypto";
import type { Adapter, AdapterUser, VerificationToken } from "next-auth/adapters";
import { getDb } from "./db";

interface UserRow {
  id: string;
  email: string | null;
  name: string | null;
  image: string | null;
  email_verified: string | null;
}

function toUser(row: UserRow | undefined): AdapterUser | null {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email ?? "",
    name: row.name,
    image: row.image,
    emailVerified: row.email_verified ? new Date(row.email_verified) : null,
  };
}

const SELECT = `SELECT id, email, name, image, email_verified FROM users`;

export function SqliteAdapter(): Adapter {
  return {
    async createUser(user) {
      const id = randomUUID();
      getDb()
        .prepare(
          `INSERT INTO users (id, email, name, image, email_verified, created_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
        )
        .run(
          id,
          user.email ?? null,
          user.name ?? null,
          user.image ?? null,
          user.emailVerified ? user.emailVerified.toISOString() : null,
          new Date().toISOString(),
        );
      return { ...user, id } as AdapterUser;
    },

    async getUser(id) {
      return toUser(getDb().prepare(`${SELECT} WHERE id = ?`).get(id) as UserRow);
    },

    async getUserByEmail(email) {
      return toUser(
        getDb().prepare(`${SELECT} WHERE email = ?`).get(email) as UserRow,
      );
    },

    async updateUser(user) {
      const db = getDb();
      const current = db.prepare(`${SELECT} WHERE id = ?`).get(user.id) as UserRow;
      db.prepare(
        `UPDATE users SET email = ?, name = ?, image = ?, email_verified = ?
          WHERE id = ?`,
      ).run(
        user.email ?? current?.email ?? null,
        user.name ?? current?.name ?? null,
        user.image ?? current?.image ?? null,
        user.emailVerified
          ? user.emailVerified.toISOString()
          : (current?.email_verified ?? null),
        user.id,
      );
      return toUser(
        db.prepare(`${SELECT} WHERE id = ?`).get(user.id) as UserRow,
      ) as AdapterUser;
    },

    async createVerificationToken(token) {
      getDb()
        .prepare(
          `INSERT INTO verification_tokens (identifier, token, expires)
           VALUES (?, ?, ?)`,
        )
        .run(token.identifier, token.token, token.expires.toISOString());
      return token;
    },

    /**
     * Single use: the row is deleted as it is read, inside a transaction, so a
     * magic link cannot be replayed even if the email is forwarded or the URL
     * ends up in a proxy log. Expiry is checked by the caller; the row is
     * consumed either way, so a stale link cannot be retried.
     */
    async useVerificationToken({ identifier, token }) {
      const db = getDb();
      const consume = db.transaction(() => {
        const row = db
          .prepare(
            `SELECT identifier, token, expires FROM verification_tokens
              WHERE identifier = ? AND token = ?`,
          )
          .get(identifier, token) as
          | { identifier: string; token: string; expires: string }
          | undefined;
        if (!row) return null;
        db.prepare(
          `DELETE FROM verification_tokens WHERE identifier = ? AND token = ?`,
        ).run(identifier, token);
        return {
          identifier: row.identifier,
          token: row.token,
          expires: new Date(row.expires),
        } satisfies VerificationToken;
      });
      return consume();
    },
  };
}
