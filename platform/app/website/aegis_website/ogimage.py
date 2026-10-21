"""Default Open Graph image and organization logo as PNG (pure Python, no C extensions).

The SVG originals live in static/img/. Social networks need raster images, so this module
rasterizes an equivalent design with a tiny supersampled renderer (polygon fill, round-capped
strokes and a built-in stroke font for A–Z). reportlab's renderPM needs an optional cairo
backend that is not available everywhere, so it is not used.

Regenerate the committed PNGs after changing the design or tagline:

    python3 -m aegis_website.ogimage          # from app/website/
"""
from __future__ import annotations

import struct
import zlib
from pathlib import Path

NAVY = (12, 35, 64)
TEAL = (94, 196, 182)
WHITE = (255, 255, 255)
SLATE = (200, 211, 224)

SHIELD = [(14, 1), (20, 3.25), (26, 5.5), (26, 14.7), (25.2, 19), (23, 23), (19, 27.4), (14, 31),
          (9, 27.4), (5, 23), (2.8, 19), (2, 14.7), (2, 5.5), (8, 3.25)]
TICK = [(8.5, 16.2), (12.3, 20), (19.7, 12)]

# Stroke font on a 4-wide x 6-high grid (y grows downwards). glyph -> (advance, [polyline, ...])
_O = [[(1, 0), (3, 0), (4, 1), (4, 5), (3, 6), (1, 6), (0, 5), (0, 1), (1, 0)]]
_P = [[(0, 6), (0, 0), (3, 0), (4, 1), (4, 2), (3, 3), (0, 3)]]
FONT: dict[str, tuple[float, list[list[tuple[float, float]]]]] = {
    "A": (4, [[(0, 6), (0, 2), (2, 0), (4, 2), (4, 6)], [(0, 3.5), (4, 3.5)]]),
    "B": (4, [[(0, 0), (0, 6), (3, 6), (4, 5), (4, 4), (3, 3), (0, 3)], [(0, 0), (3, 0), (4, 1), (4, 2), (3, 3)]]),
    "C": (4, [[(4, 0), (1, 0), (0, 1), (0, 5), (1, 6), (4, 6)]]),
    "D": (4, [[(0, 0), (0, 6), (2.5, 6), (4, 4.5), (4, 1.5), (2.5, 0), (0, 0)]]),
    "E": (4, [[(4, 0), (0, 0), (0, 6), (4, 6)], [(0, 3), (3, 3)]]),
    "F": (4, [[(4, 0), (0, 0), (0, 6)], [(0, 3), (3, 3)]]),
    "G": (4, [[(4, 1), (3, 0), (1, 0), (0, 1), (0, 5), (1, 6), (3, 6), (4, 5), (4, 3.5), (2.5, 3.5)]]),
    "H": (4, [[(0, 0), (0, 6)], [(4, 0), (4, 6)], [(0, 3), (4, 3)]]),
    "I": (2, [[(1, 0), (1, 6)], [(0, 0), (2, 0)], [(0, 6), (2, 6)]]),
    "J": (4, [[(4, 0), (4, 5), (3, 6), (1, 6), (0, 5)]]),
    "K": (4, [[(0, 0), (0, 6)], [(4, 0), (0, 4)], [(1.5, 2.8), (4, 6)]]),
    "L": (4, [[(0, 0), (0, 6), (4, 6)]]),
    "M": (5, [[(0, 6), (0, 0), (2.5, 3.5), (5, 0), (5, 6)]]),
    "N": (4, [[(0, 6), (0, 0), (4, 6), (4, 0)]]),
    "O": (4, _O),
    "P": (4, _P),
    "Q": (4, _O + [[(2.5, 4.5), (4, 6)]]),
    "R": (4, _P + [[(2, 3), (4, 6)]]),
    "S": (4, [[(4, 1), (3, 0), (1, 0), (0, 1), (0, 2), (1, 3), (3, 3), (4, 4), (4, 5), (3, 6), (1, 6), (0, 5)]]),
    "T": (4, [[(0, 0), (4, 0)], [(2, 0), (2, 6)]]),
    "U": (4, [[(0, 0), (0, 5), (1, 6), (3, 6), (4, 5), (4, 0)]]),
    "V": (4, [[(0, 0), (2, 6), (4, 0)]]),
    "W": (5, [[(0, 0), (1.2, 6), (2.5, 2), (3.8, 6), (5, 0)]]),
    "X": (4, [[(0, 0), (4, 6)], [(4, 0), (0, 6)]]),
    "Y": (4, [[(0, 0), (2, 3), (4, 0)], [(2, 3), (2, 6)]]),
    "Z": (4, [[(0, 0), (4, 0), (0, 6), (4, 6)]]),
    ",": (1, [[(0.7, 5.6), (0.2, 7)]]),
    ".": (1, [[(0.5, 6), (0.5, 6)]]),
    "-": (3, [[(0, 3), (3, 3)]]),
    "—": (5, [[(0, 3), (5, 3)]]),
    " ": (1.5, []),
}


class Canvas:
    """RGB canvas with supersampling (draw at ss x resolution, downsample on save)."""

    def __init__(self, width: int, height: int, bg, ss: int = 3):
        self.w, self.h, self.ss = width * ss, height * ss, ss
        self.out_w, self.out_h = width, height
        self.rows = [bytearray(bytes(bg) * self.w) for _ in range(self.h)]

    def _span(self, y: int, x0: int, x1: int, color) -> None:
        if y < 0 or y >= self.h:
            return
        x0, x1 = max(0, x0), min(self.w - 1, x1)
        if x1 < x0:
            return
        self.rows[y][x0 * 3:(x1 + 1) * 3] = bytes(color) * (x1 - x0 + 1)

    def rect(self, x, y, w, h, color) -> None:
        s = self.ss
        for yy in range(int(y * s), int((y + h) * s)):
            self._span(yy, int(x * s), int((x + w) * s) - 1, color)

    def polygon(self, pts, color) -> None:
        s = self.ss
        P = [(x * s, y * s) for x, y in pts]
        ys = [p[1] for p in P]
        for yy in range(max(0, int(min(ys))), min(self.h, int(max(ys)) + 1)):
            yc = yy + 0.5
            xs = []
            for i in range(len(P)):
                (x1, y1), (x2, y2) = P[i], P[(i + 1) % len(P)]
                if (y1 <= yc < y2) or (y2 <= yc < y1):
                    xs.append(x1 + (yc - y1) * (x2 - x1) / (y2 - y1))
            xs.sort()
            for a, b in zip(xs[0::2], xs[1::2]):
                self._span(yy, int(a + 0.5), int(b - 0.5), color)

    def stroke(self, pts, width, color) -> None:
        """Round-capped, round-joined polyline (capsules)."""
        s = self.ss
        r = width * s / 2
        P = [(x * s, y * s) for x, y in pts]
        segs = list(zip(P, P[1:])) or [(P[0], P[0])]
        for (x1, y1), (x2, y2) in segs:
            dx, dy = x2 - x1, y2 - y1
            L2 = dx * dx + dy * dy
            y_lo, y_hi = int(min(y1, y2) - r), int(max(y1, y2) + r) + 1
            for yy in range(max(0, y_lo), min(self.h, y_hi + 1)):
                yc = yy + 0.5
                # solve the x-interval of points within distance r of the segment (exact for a capsule)
                xs_in = []
                x_lo, x_hi = int(min(x1, x2) - r), int(max(x1, x2) + r) + 1
                for xx in range(max(0, x_lo), min(self.w, x_hi + 1)):
                    xc = xx + 0.5
                    t = 0.0 if L2 == 0 else max(0.0, min(1.0, ((xc - x1) * dx + (yc - y1) * dy) / L2))
                    px, py = x1 + t * dx - xc, y1 + t * dy - yc
                    if px * px + py * py <= r * r:
                        xs_in.append(xx)
                if xs_in:
                    self._span(yy, xs_in[0], xs_in[-1], color)

    def text(self, x, y, string, size, color, weight=0.14, tracking=1.4) -> float:
        """Draw uppercase stroke text with cap height `size` at baseline-top (x, y). Returns width."""
        u = size / 6
        cx = x
        for ch in string.upper():
            adv, lines = FONT.get(ch, FONT[" "])
            for line in lines:
                self.stroke([(cx + gx * u, y + gy * u) for gx, gy in line], size * weight, color)
            cx += (adv + tracking) * u
        return cx - x

    def png_bytes(self) -> bytes:
        s, W = self.ss, self.out_w
        n = s * s
        raw = bytearray()
        for oy in range(self.out_h):
            raw.append(0)
            src = self.rows[oy * s:(oy + 1) * s]
            acc = [0] * (W * 3)
            for row in src:
                for ox in range(W):
                    base = ox * s * 3
                    for k in range(s):
                        i = base + k * 3
                        o = ox * 3
                        acc[o] += row[i]
                        acc[o + 1] += row[i + 1]
                        acc[o + 2] += row[i + 2]
            raw.extend(bytes(v // n for v in acc))
        return _png(self.out_w, self.out_h, bytes(raw))


def _png(width: int, height: int, raw_with_filters: bytes) -> bytes:
    def chunk(tag: bytes, data: bytes) -> bytes:
        return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)

    return (b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0))
            + chunk(b"IDAT", zlib.compress(raw_with_filters, 9)) + chunk(b"IEND", b""))


def png_size(data: bytes) -> tuple[int, int]:
    if data[:8] != b"\x89PNG\r\n\x1a\n" or data[12:16] != b"IHDR":
        raise ValueError("not a PNG")
    return struct.unpack(">II", data[16:24])


def render_og(width: int = 1200, height: int = 630, ss: int = 2) -> bytes:
    c = Canvas(width, height, NAVY, ss)
    c.rect(0, height - 14, width, 14, TEAL)
    sx, sy, k = 100, 110, 5.2
    c.polygon([(sx + x * k, sy + y * k) for x, y in SHIELD], WHITE)
    c.stroke([(sx + x * k, sy + y * k) for x, y in TICK], 2.6 * k, NAVY)
    c.text(290, 140, "AEGIS", 96, WHITE, weight=0.16)
    c.text(100, 330, "Govern every AI system,", 40, WHITE, weight=0.12)
    c.text(100, 395, "agent and decision", 40, WHITE, weight=0.12)
    c.text(100, 460, "with evidence.", 40, WHITE, weight=0.12)
    c.text(100, 548, "Enterprise AI governance - runtime guardrails - evidence", 20, SLATE, weight=0.12)
    return c.png_bytes()


def render_logo(size: int = 256, ss: int = 2) -> bytes:
    c = Canvas(size, size, WHITE, ss)
    k = size / 34
    ox, oy = (size - 28 * k) / 2, (size - 32 * k) / 2
    c.polygon([(ox + x * k, oy + y * k) for x, y in SHIELD], NAVY)
    c.stroke([(ox + x * k, oy + y * k) for x, y in TICK], 2.6 * k, WHITE)
    return c.png_bytes()


def main() -> None:  # pragma: no cover - maintenance entry point
    img = Path(__file__).resolve().parents[1] / "static" / "img"
    (img / "og-default.png").write_bytes(render_og())
    (img / "aegis-logo.png").write_bytes(render_logo())
    print(f"wrote {img / 'og-default.png'} and {img / 'aegis-logo.png'}")


if __name__ == "__main__":  # pragma: no cover
    main()
