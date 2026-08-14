/**
 * The sign-in email.
 *
 * Auth.js has a default template and it never mentions that the link expires.
 * Ours dies in fifteen minutes by design, so a reader returning after twenty
 * gets an unexplained failure that reads as a broken app rather than a working
 * safeguard. The security was fine; the silence was the bug. (Raised by the
 * 1-percent-more-fluent agent, who had the same gap.)
 *
 * The markup looks like 2005 on purpose. The constraints are email's, not the
 * web's:
 *
 * - **Tables, not flex or grid.** Outlook renders through Word, which supports
 *   neither, and a div layout collapses to a single column there.
 * - **Inline styles only.** Gmail strips <style> blocks in some clients.
 * - **No images.** Blocked by default nearly everywhere, so nothing
 *   load-bearing can be one — the button is a styled link, not a picture.
 * - **The URL repeated as plain text.** Some clients mangle or refuse styled
 *   links, and a sign-in email that cannot be used is worse than an ugly one.
 * - **A plain-text part.** Not courtesy: a message without one scores worse
 *   with spam filters, and this one has to arrive.
 */

/**
 * How long a link lives. ONE constant, defined next to the words that promise
 * it and imported by the auth config to mint the token.
 *
 * Two constants drift silently, and an email promising fifteen minutes for a
 * token that dies in five teaches people the app is broken while nothing
 * anywhere reports a problem.
 */
export const LINK_MINUTES = 15;

const ACCENT = "#2f56d9";
const FOREGROUND = "#191917";
const MUTED = "#6b6b64";
const BORDER = "#e7e7e1";
const BACKGROUND = "#fdfdfc";

/** Escape for HTML attribute and text contexts. `&` in the URL matters most. */
function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function signinEmail(url: string): {
  subject: string;
  html: string;
  text: string;
} {
  const safe = esc(url);
  const subject = "Sign in to Indie Degree";

  const html = `<!doctype html>
<html lang="en">
<body style="margin:0;padding:0;background:${BACKGROUND};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${BACKGROUND};">
  <tr>
    <td align="center" style="padding:32px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:480px;">
        <tr>
          <td style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:20px;font-weight:600;color:${FOREGROUND};padding-bottom:8px;">
            Indie Degree
          </td>
        </tr>
        <tr>
          <td style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;line-height:22px;color:${FOREGROUND};padding-bottom:20px;">
            Use the button below to sign in. It works once, and it stops working
            ${LINK_MINUTES} minutes after it was sent.
          </td>
        </tr>
        <tr>
          <td style="padding-bottom:20px;">
            <a href="${safe}" style="display:inline-block;background:${ACCENT};color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;font-weight:500;text-decoration:none;padding:12px 22px;border-radius:8px;">Sign in</a>
          </td>
        </tr>
        <tr>
          <td style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;line-height:20px;color:${MUTED};padding-bottom:8px;">
            If the button does not work, paste this into your browser:
          </td>
        </tr>
        <tr>
          <td style="font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:12px;line-height:18px;color:${MUTED};word-break:break-all;padding-bottom:24px;">
            ${safe}
          </td>
        </tr>
        <tr>
          <td style="border-top:1px solid ${BORDER};padding-top:16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;line-height:20px;color:${MUTED};">
            If you did not ask to sign in, nothing has happened and you can
            ignore this. Only one account can sign in here, so a link you did
            not request is not a sign someone got in.
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;

  const text = [
    "Sign in to Indie Degree",
    "",
    `Open this link to sign in. It works once, and it stops working ${LINK_MINUTES} minutes after it was sent.`,
    "",
    url,
    "",
    "If you did not ask to sign in, nothing has happened and you can ignore this.",
  ].join("\n");

  return { subject, html, text };
}

/**
 * Send it. Plain REST rather than the SDK — one fetch is not worth a
 * dependency, and this shape is the one the fluent agent verified end to end
 * against a real inbox.
 *
 * Throwing on failure is deliberate and matches Auth.js's own behaviour: the
 * caller turns it into an error on the sign-in page. Returning quietly would
 * send the reader to "check your email" for a message that was never sent.
 */
export async function sendVerificationRequest(params: {
  identifier: string;
  url: string;
  provider: { apiKey?: string; from?: string };
}): Promise<void> {
  const { identifier, url, provider } = params;
  const { subject, html, text } = signinEmail(url);

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${provider.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: provider.from,
      to: identifier,
      subject,
      html,
      text,
    }),
  });

  if (!res.ok) {
    throw new Error(`Resend: ${(await res.text()).slice(0, 300)}`);
  }
}
