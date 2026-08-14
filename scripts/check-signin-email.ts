/**
 * Assert the sign-in email is usable, without sending anything.
 *
 * Runs offline: no key, no network, no inbox. Worth having because a fault here
 * is invisible from this side — you find out because somebody could not sign in
 * and did not tell you.
 *
 *   node --experimental-strip-types scripts/check-signin-email.ts
 *   PREVIEW=/tmp/signin.html node --experimental-strip-types scripts/check-signin-email.ts
 *
 * No build step and no dev dependency: Node 22 strips the types itself.
 */
import { writeFileSync } from "node:fs";
import { LINK_MINUTES, signinEmail } from "../src/server/signin-email.ts";

// A realistic Auth.js callback: multiple query parameters, so the ampersands
// are load-bearing. An unescaped `&` in HTML is the classic way a link arrives
// looking perfect and resolves to a truncated URL.
const URL_UNDER_TEST =
  "https://indie-degree.gtfoo.com/api/auth/callback/resend" +
  "?callbackUrl=%2F&token=abc123def456&email=owner%40example.com";

const { subject, html, text } = signinEmail(URL_UNDER_TEST);

let failed = 0;
function check(name: string, ok: boolean, detail = ""): void {
  if (ok) {
    console.log(`  ok    ${name}`);
  } else {
    failed += 1;
    console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

console.log("sign-in email");

check("subject is set", subject.length > 0);

// The whole point: unescaping the href must give back exactly the URL we were
// handed. This is what catches a raw `&` truncating the token.
const href = html.match(/href="([^"]+)"/)?.[1] ?? "";
const unescaped = href
  .replace(/&amp;/g, "&")
  .replace(/&lt;/g, "<")
  .replace(/&gt;/g, ">")
  .replace(/&quot;/g, '"');
check("href round-trips through escaping", unescaped === URL_UNDER_TEST, href);
check("ampersands are escaped in the href", !/&(?!amp;|lt;|gt;|quot;)/.test(href));

// Some clients strip or mangle styled links; the raw URL has to be readable.
check(
  "raw URL also appears as copyable text",
  html.split(URL_UNDER_TEST.replace(/&/g, "&amp;")).length - 1 >= 2,
);
check("plain-text part contains the URL verbatim", text.includes(URL_UNDER_TEST));

// Both parts must state the two things that otherwise read as a broken app.
for (const [part, body] of [
  ["html", html],
  ["text", text],
] as const) {
  check(`${part} states the expiry (${LINK_MINUTES} minutes)`, body.includes(String(LINK_MINUTES)));
  check(`${part} states single use`, /works once|once,/i.test(body));
}

// Nothing load-bearing may be a thing email clients discard.
check("no images", !/<img/i.test(html));
check("no <style> block", !/<style/i.test(html));
check("no flex or grid layout", !/display:\s*(flex|grid)/i.test(html));
check("uses tables for layout", /<table/i.test(html));
check("plain-text part is non-empty", text.trim().length > 0);

const preview = process.env.PREVIEW;
if (preview) {
  writeFileSync(preview, html, "utf-8");
  console.log(`\n  wrote ${preview}`);
}

if (failed > 0) {
  console.log(`\n${failed} failed`);
  process.exit(1);
}
console.log("\nall good");
