import { ImageResponse } from "next/og";

/**
 * Home-screen and browser-tab icon, generated rather than shipped as a PNG.
 *
 * This app has no design assets and did not need any: Next serves this at
 * /icon, which the manifest references, so there is nothing in public/ to keep
 * in sync with the palette in globals.css.
 *
 * Accent on accent-foreground rather than the page's own light background —
 * a #fdfdfc icon disappears against a light home screen, and an icon that
 * cannot be picked out of a grid of five apps has failed at its only job.
 */
export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#2f56d9",
          color: "#ffffff",
          fontSize: 250,
          fontWeight: 700,
          letterSpacing: -12,
        }}
      >
        iD
      </div>
    ),
    size,
  );
}
