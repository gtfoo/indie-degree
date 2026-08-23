import type { MetadataRoute } from "next";

/**
 * The web app manifest — the thing whose absence made Chrome offer "Create
 * shortcut" instead of "Install". A shortcut is a bookmark with an icon and
 * opens in a browser tab; an install needs a manifest declaring `display`
 * and icons, and only then does the launcher give it its own window.
 *
 * Icons are generated from assets/logo.png by `npm run icons` — see
 * scripts/build-icons.py. They carry the hexagon badge only, not the full
 * lockup: the wordmark would be about eleven pixels tall at 192px and would
 * take the badge down to unrecognisable with it.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Indie Degree",
    // Launchers truncate around twelve characters and "Indie Degree" is exactly
    // twelve, which is close enough to the edge to come back as "Indie Degre…"
    // on some of them. "Indie" is unambiguous next to the other apps on this
    // home screen.
    short_name: "Indie",
    description:
      "Build your own degree, and prove you did it. A self-directed programme " +
      "where every source is identity-verified and every claim carries its evidence.",
    start_url: "/",
    display: "standalone",
    // Both from --background in globals.css, and the same colour the icons are
    // rendered onto. background_color fills the screen while the app starts, so
    // a value that disagrees with the page shows as a flash of the wrong colour
    // on every launch. This app is light-only, so there is no dark variant.
    background_color: "#fdfdfc",
    theme_color: "#fdfdfc",
    // Deliberately unlocked, unlike the reading apps. The skill graph is
    // 1978px wide and the calibration table is a five-column grid — both are
    // materially better in landscape, and forcing portrait would be choosing a
    // phone-shaped answer for a transcript mostly read on a desktop.
    orientation: "any",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      // Separate and padded much harder, because Android crops adaptive icons
      // to a circle or squircle and the badge is a hexagon — its points are
      // exactly what that crop takes off.
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
