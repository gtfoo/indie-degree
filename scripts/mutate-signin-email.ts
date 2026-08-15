/**
 * Break the sign-in email on purpose, and require the checks to notice.
 *
 *   node --experimental-strip-types scripts/mutate-signin-email.ts
 *
 * Adapted from the 1-percent-more-fluent agent's script, on their point that a
 * check suite which has never been shown to fail is a suite nobody has tested —
 * two of their six mutations survived the first pass, and they would not have
 * guessed which two.
 *
 * The first mutation is the one that matters here. It simulates the code
 * forgetting to escape, and it is the case a round-trip assertion provably
 * cannot catch: decoding `&amp;` back out of a raw `&` is a no-op, so the
 * comparison against the original URL still passes. If `surviving` ever lists
 * "href stops being escaped", the complementary bare-`&` assertion has been
 * lost and links will silently truncate at the first parameter.
 */
import { LINK_MINUTES, signinEmail } from "../src/server/signin-email.ts";
import { runChecks, type Email } from "../src/server/signin-email-checks.ts";
import { URL_UNDER_TEST } from "./check-signin-email.ts";

interface Mutation {
  name: string;
  apply: (e: Email) => Email;
  /** The assertion that must be the one to catch it, when it is specific. */
  expect?: string;
}

const MUTATIONS: Mutation[] = [
  {
    name: "href stops being escaped",
    expect: "ampersands are escaped in the href",
    apply: (e) => ({
      ...e,
      html: e.html.replace(/href="([^"]+)"/, (_m, h: string) => `href="${h.replace(/&amp;/g, "&")}"`),
    }),
  },
  {
    name: "token truncated in the href",
    expect: "href round-trips through escaping",
    apply: (e) => ({ ...e, html: e.html.replace("abc123def456", "abc123") }),
  },
  {
    name: "href points somewhere else entirely",
    expect: "href round-trips through escaping",
    apply: (e) => ({
      ...e,
      html: e.html.replace(/href="[^"]+"/, 'href="https://example.com/"'),
    }),
  },
  {
    name: "plain-text part loses the URL",
    expect: "plain-text part contains the URL verbatim",
    apply: (e) => ({ ...e, text: e.text.replace(URL_UNDER_TEST, "[link]") }),
  },
  {
    name: "expiry no longer stated",
    apply: (e) => ({
      ...e,
      html: e.html.replaceAll(String(LINK_MINUTES), "some"),
      text: e.text.replaceAll(String(LINK_MINUTES), "some"),
    }),
  },
  {
    name: "single-use wording dropped",
    apply: (e) => ({
      ...e,
      html: e.html.replace(/works once/gi, "works").replace(/once,/gi, "and,"),
      text: e.text.replace(/works once/gi, "works").replace(/once,/gi, "and,"),
    }),
  },
  {
    name: "layout switched to flex",
    apply: (e) => ({
      ...e,
      html: e.html.replace(/<table/i, '<div style="display: flex"').replace(/<\/table>/i, "</div>"),
    }),
  },
  {
    name: "an image is introduced",
    apply: (e) => ({ ...e, html: e.html.replace("<body", '<img src="x.png"><body') }),
  },
  {
    name: "the copyable raw URL is removed",
    expect: "raw URL also appears as copyable text",
    apply: (e) => {
      const escaped = URL_UNDER_TEST.replace(/&/g, "&amp;");
      const first = e.html.indexOf(escaped);
      const second = e.html.indexOf(escaped, first + 1);
      return second === -1
        ? e
        : { ...e, html: e.html.slice(0, second) + "[removed]" + e.html.slice(second + escaped.length) };
    },
  },
];

const base = signinEmail(URL_UNDER_TEST);
if (runChecks(URL_UNDER_TEST, base, LINK_MINUTES).some((r) => !r.ok)) {
  console.log("the unmutated email already fails its own checks — fix that first");
  process.exit(1);
}

console.log(`mutation testing ${MUTATIONS.length} mutations\n`);
const surviving: string[] = [];
const misattributed: string[] = [];

for (const m of MUTATIONS) {
  const caught = runChecks(URL_UNDER_TEST, m.apply(structuredClone(base)), LINK_MINUTES)
    .filter((r) => !r.ok)
    .map((r) => r.name);

  if (caught.length === 0) {
    surviving.push(m.name);
    console.log(`  SURVIVED  ${m.name}`);
    continue;
  }
  if (m.expect && !caught.includes(m.expect)) {
    misattributed.push(m.name);
    console.log(`  caught    ${m.name} — but not by "${m.expect}" (${caught[0]})`);
    continue;
  }
  console.log(`  caught    ${m.name} — by ${caught.join(", ")}`);
}

if (surviving.length || misattributed.length) {
  console.log(`\n${surviving.length} survived, ${misattributed.length} caught by the wrong assertion`);
  process.exit(1);
}
console.log(`\nall ${MUTATIONS.length} mutations caught`);
