import { ImageResponse } from "next/og";

/**
 * iOS home screen. Separate from icon.tsx because Apple wants 180x180 and
 * applies its own rounded-rectangle mask, so the glyph is inset a little to
 * survive the corner radius.
 */
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
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
          fontSize: 80,
          fontWeight: 700,
          letterSpacing: -4,
        }}
      >
        iD
      </div>
    ),
    size,
  );
}
