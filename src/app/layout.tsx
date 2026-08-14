import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { authConfigured, currentUser, signOut } from "@/auth";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

const DESCRIPTION =
  "Build your own degree, and prove you did it. A self-directed programme where every source is identity-verified and every claim carries its evidence.";

export const metadata: Metadata = {
  title: {
    default: "Indie Degree",
    template: "%s · Indie Degree",
  },
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: "Indie Degree",
    title: "Indie Degree",
    description: DESCRIPTION,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await currentUser();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <header className="border-b border-border">
          <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
            <Link href="/" className="font-medium tracking-tight">
              Indie Degree
            </Link>
            <div className="flex items-center gap-4 text-sm">
              <a
                href="https://github.com/gtfoo/indie-degree"
                className="text-muted transition-colors hover:text-foreground"
              >
                GitHub
              </a>
              {/* Sign-in is only ever offered when it could work, and only to
                  someone not already signed in. A reader is never nudged
                  toward an account they cannot have. */}
              {user ? (
                <form
                  action={async () => {
                    "use server";
                    await signOut({ redirectTo: "/" });
                  }}
                >
                  <button
                    type="submit"
                    className="text-muted transition-colors hover:text-foreground"
                  >
                    Sign out
                  </button>
                </form>
              ) : authConfigured() ? (
                <Link
                  href="/signin"
                  className="text-muted transition-colors hover:text-foreground"
                >
                  Sign in
                </Link>
              ) : null}
            </div>
          </div>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="border-t border-border">
          <div className="mx-auto max-w-3xl px-6 py-6 text-sm text-muted">
            Produced outside the institution, deliberately. Judged on the work
            rather than on who signed it off.
          </div>
        </footer>
      </body>
    </html>
  );
}
