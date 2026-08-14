import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Check your email" };

/** Shown once a link has been requested. Auth.js routes here via `verifyRequest`. */
export default function CheckEmail() {
  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">Check your email</h1>
      {/* Deliberately says nothing about whether that address is the one
          permitted to sign in. Otherwise this page is a free tool for finding
          out whose it is. */}
      <p className="mt-2 text-muted">
        If that address can sign in here, a link is on its way. It expires in
        fifteen minutes and works once.
      </p>
      <p className="mt-4 text-sm text-muted">
        Nothing arriving is the expected outcome for most addresses.
      </p>
      <Link
        href="/"
        className="mt-6 inline-block text-sm text-muted underline-offset-4 hover:text-accent hover:underline"
      >
        Back to the programme
      </Link>
    </div>
  );
}
