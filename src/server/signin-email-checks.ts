/**
 * What a usable sign-in email has to be true of.
 *
 * Extracted so two callers share one list: check-signin-email.ts asserts them
 * against the real output, and mutate-signin-email.ts breaks the email on
 * purpose and requires that at least one of them notices. A check suite that
 * has never been shown to fail is a suite nobody has tested.
 *
 * The pair on the href is deliberate and was a correction from another agent:
 * a round-trip alone **cannot** catch under-escaping. If the code stops
 * escaping, the href carries a raw `&`, decoding `&amp;` back is a no-op, and
 * the comparison against the original URL still passes. One assertion catches
 * corruption, the other catches under-escaping, and neither substitutes for
 * the other.
 */

export interface CheckResult {
  name: string;
  ok: boolean;
  detail?: string;
}

export interface Email {
  subject: string;
  html: string;
  text: string;
}

export function runChecks(
  url: string,
  { subject, html, text }: Email,
  linkMinutes: number,
): CheckResult[] {
  const out: CheckResult[] = [];
  const add = (name: string, ok: boolean, detail?: string) =>
    out.push({ name, ok, detail });

  add("subject is set", subject.length > 0);

  const href = html.match(/href="([^"]+)"/)?.[1] ?? "";
  const unescaped = href
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"');

  // Catches corruption: a truncated or rewritten link.
  add("href round-trips through escaping", unescaped === url, href);
  // Catches under-escaping, which the round-trip cannot see.
  add(
    "ampersands are escaped in the href",
    href.length > 0 && !/&(?!amp;|lt;|gt;|quot;)/.test(href),
    href,
  );

  add(
    "raw URL also appears as copyable text",
    html.split(url.replace(/&/g, "&amp;")).length - 1 >= 2,
  );
  add("plain-text part contains the URL verbatim", text.includes(url));

  for (const [part, body] of [
    ["html", html],
    ["text", text],
  ] as const) {
    add(
      `${part} states the expiry (${linkMinutes} minutes)`,
      body.includes(String(linkMinutes)),
    );
    add(`${part} states single use`, /works once|once,/i.test(body));
  }

  add("no images", !/<img/i.test(html));
  add("no <style> block", !/<style/i.test(html));
  add("no flex or grid layout", !/display:\s*(flex|grid)/i.test(html));
  add("uses tables for layout", /<table/i.test(html));
  add("plain-text part is non-empty", text.trim().length > 0);

  return out;
}
