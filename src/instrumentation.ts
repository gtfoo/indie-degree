/**
 * Process startup.
 *
 * Only used to report this app's registered-user count to the shared directory
 * gtfoo.com/admin reads. The contract asks for a write at startup plus one
 * after each sign-in; this is the startup half.
 *
 * The import is dynamic because user-counts reaches the database and this file
 * is evaluated in both runtimes — a static import would pull better-sqlite3
 * into the edge bundle, which cannot load a native addon.
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { reportUserCounts } = await import("@/server/user-counts");
  // Already fire-and-forget internally: a missing usage directory or an unset
  // DATA_DIR must not stop the server booting.
  reportUserCounts();
}
