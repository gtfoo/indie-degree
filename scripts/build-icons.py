#!/usr/bin/env python3
"""Derive every icon in the app from assets/logo.png.

    python3 scripts/build-icons.py

The source is a horizontal lockup: a hexagon badge on the left, the wordmark
"Indie Degree" on the right. Those need different treatment and the difference
is the whole reason this script exists.

- **The badge alone becomes the app icon.** Scaling the full lockup into a
  192px square would make the wordmark about eleven pixels tall — unreadable,
  and the badge unrecognisably small with it. An icon has one job at small
  sizes and text does not survive it.
- **The full lockup becomes public/logo.png**, for anywhere with horizontal
  room.

The maskable variant is padded far harder than the others. Android crops
adaptive icons to a circle or squircle of roughly 80% diameter, and the badge
is a hexagon — its points are exactly what a circular crop removes.

Backgrounds are opaque #fdfdfc, matching background_color in the manifest, so
the launcher never composites the artwork onto a colour the app did not choose.
"""
from PIL import Image
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "assets" / "logo.png"
BG = (253, 253, 252, 255)  # --background from globals.css

# Measured from the source's alpha channel rather than eyeballed; re-derive
# with a bbox scan if the artwork is ever replaced.
BADGE = (52, 291, 637, 897)
LOCKUP = (52, 291, 1233, 897)


def render(box: tuple[int, int, int, int], size: int, coverage: float,
           out: Path, opaque: bool = True) -> None:
    """Fit the cropped region into a square canvas at the given coverage."""
    art = Image.open(SRC).convert("RGBA").crop(box)
    target = int(size * coverage)
    art.thumbnail((target, target), Image.LANCZOS)
    canvas = Image.new("RGBA", (size, size), BG if opaque else (0, 0, 0, 0))
    canvas.paste(art, ((size - art.width) // 2, (size - art.height) // 2), art)
    out.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(out, "PNG", optimize=True)
    print(f"  {out.relative_to(ROOT)}  {size}x{size}  {out.stat().st_size // 1024} KB")


def main() -> int:
    if not SRC.exists():
        print(f"no source artwork at {SRC}")
        return 1

    print("app icons, badge only:")
    # 256 rather than 512: browsers draw this at 16-32px in a tab, and the
    # 512 the installer wants already exists in public/.
    render(BADGE, 256, 0.86, ROOT / "src/app/icon.png")
    render(BADGE, 180, 0.82, ROOT / "src/app/apple-icon.png")
    render(BADGE, 192, 0.86, ROOT / "public/icon-192.png")
    render(BADGE, 512, 0.86, ROOT / "public/icon-512.png")
    # 66% rather than 86%: the safe zone is a circle of 80% diameter, and a
    # hexagon inscribed in that needs more slack than a round mark would.
    render(BADGE, 512, 0.66, ROOT / "public/icon-maskable-512.png")

    print("full lockup, for anywhere with horizontal room:")
    art = Image.open(SRC).convert("RGBA").crop(LOCKUP)
    art.thumbnail((1024, 1024), Image.LANCZOS)
    out = ROOT / "public/logo.png"
    art.save(out, "PNG", optimize=True)
    print(f"  {out.relative_to(ROOT)}  {art.width}x{art.height}  "
          f"{out.stat().st_size // 1024} KB  (transparent)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
