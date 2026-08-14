import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { authConfigured, currentUser, signIn } from "@/auth";

export const metadata: Metadata = { title: "Sign in" };
export const dynamic = "force-dynamic";

/**
 * Sign in, which nothing here requires in order to read.
 *
 * The page says plainly that there is one account and it probably isn't yours.
 * A sign-in screen that implies otherwise wastes a stranger's time and invites
 * them to guess at an address.
 */
export default async function SignInPage() {
  if (await currentUser()) redirect("/");

  const ready = authConfigured();

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <Link
        href="/"
        className="text-sm text-muted transition-colors hover:text-foreground"
      >
        ← Programme
      </Link>

      <h1 className="mt-6 text-2xl font-semibold tracking-tight">Sign in</h1>
      <p className="mt-2 text-muted">
        Everything here is readable without an account. Signing in only lets one
        specific person tick things off — and if you are reading this, that is
        probably not you.
      </p>

      {!ready ? (
        <p className="mt-6 rounded-lg border border-border bg-card px-5 py-4 text-sm text-muted">
          This deployment has no sign-in configured, so nothing can be edited
          here. The transcript below is read-only for everyone, including its
          owner.
        </p>
      ) : (
        <form
          action={async (formData: FormData) => {
            "use server";
            await signIn("resend", {
              email: String(formData.get("email") ?? ""),
              redirectTo: "/",
            });
          }}
          className="mt-6 space-y-3"
        >
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            className="w-full rounded-lg border border-border bg-card px-4 py-3 outline-none focus:border-accent"
          />
          <button
            type="submit"
            className="w-full rounded-lg bg-accent px-5 py-3 font-medium text-accent-foreground transition-opacity hover:opacity-90"
          >
            Email me a link
          </button>
          <p className="text-sm text-muted">
            The link expires in fifteen minutes and works once.
          </p>
        </form>
      )}
    </div>
  );
}
