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
 * The assertions themselves live in src/server/signin-email-checks.ts, so that
 * mutate-signin-email.ts can prove they actually fail when the email breaks.
 *
 * No build step and no dev dependency: Node 22 strips the types itself.
 */
import { writeFileSync } from "node:fs";
import { LINK_MINUTES, signinEmail } from "../src/server/signin-email.ts";
import { runChecks } from "../src/server/signin-email-checks.ts";

// A realistic Auth.js callback: multiple query parameters, so the ampersands
// are load-bearing. An unescaped `&` in HTML is the classic way a link arrives
// looking perfect and resolves to a truncated URL.
export const URL_UNDER_TEST =
  "https://indie-degree.gtfoo.com/api/auth/callback/resend" +
  "?callbackUrl=%2F&token=abc123def456&email=owner%40example.com";

const email = signinEmail(URL_UNDER_TEST);
const results = runChecks(URL_UNDER_TEST, email, LINK_MINUTES);

console.log("sign-in email");
let failed = 0;
for (const r of results) {
  if (r.ok) {
    console.log(`  ok    ${r.name}`);
  } else {
    failed += 1;
    console.log(`  FAIL  ${r.name}${r.detail ? ` — ${r.detail}` : ""}`);
  }
}

const preview = process.env.PREVIEW;
if (preview) {
  writeFileSync(preview, email.html, "utf-8");
  console.log(`\n  wrote ${preview}`);
}

if (failed > 0) {
  console.log(`\n${failed} failed`);
  process.exit(1);
}
console.log("\nall good");
