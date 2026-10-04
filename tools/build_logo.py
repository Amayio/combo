# Rebuilds the Lombard Combo mark (C + L) as vectors and exports SVG/PNG/OG files to assets/img/.
from pathlib import Path
from PIL import Image, ImageDraw

OUT = Path(__file__).resolve().parent.parent / "assets" / "img"
OUT.mkdir(parents=True, exist_ok=True)

# Geometry on a 60 x 32 grid, traced from the original logo.png
# Dark "C": square ring open on the left
C_PATH = ("M0 0H30V32H0V19H8V21Q8 24 11 24H19Q22 24 22 21V11"
          "Q22 8 19 8H11Q8 8 8 11V13H0Z")
# Light "L": top serif and a raised end with a hole
L_PATH = "M32 0H46V8H40V21Q40 24 43 24H52V18H60V32H32Z"
HOLE = (56, 28, 1.7)  # cx, cy, r

def hole_path(cx, cy, r):
    return (f"M{cx + r} {cy}A{r} {r} 0 1 0 {cx - r} {cy}"
            f"A{r} {r} 0 1 0 {cx + r} {cy}Z")

def svg(tile, c, l, pad=(10, 10), radius=9, with_tile=True):
    px, py = pad
    w, h = 60 + 2 * px, 32 + 2 * py
    tile_el = (f'<rect x="{-px}" y="{-py}" width="{w}" height="{h}" rx="{radius}" fill="{tile}"/>'
               if with_tile else "")
    vb = f"{-px} {-py} {w} {h}" if with_tile else "0 0 60 32"
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" role="img" aria-label="Lombard Combo">'
            f'{tile_el}<path d="{C_PATH}" fill="{c}"/>'
            f'<path fill-rule="evenodd" d="{L_PATH}{hole_path(*HOLE)}" fill="{l}"/></svg>\n')

# Minimal path parser (M H V Q Z) for the PNG renderer
def path_points(d, steps=24):
    import re
    toks = re.findall(r"[MHVQZ]|-?\d+\.?\d*", d)
    pts, x, y, i, cmd = [], 0.0, 0.0, 0, None
    while i < len(toks):
        t = toks[i]
        if t in "MHVQZ":
            cmd = t; i += 1
            if cmd == "Z": continue
        if cmd == "M":
            x, y = float(toks[i]), float(toks[i + 1]); i += 2; pts.append((x, y))
        elif cmd == "H":
            x = float(toks[i]); i += 1; pts.append((x, y))
        elif cmd == "V":
            y = float(toks[i]); i += 1; pts.append((x, y))
        elif cmd == "Q":
            cx, cy, ex, ey = map(float, toks[i:i + 4]); i += 4
            x0, y0 = x, y
            for s in range(1, steps + 1):
                t_ = s / steps
                pts.append(((1 - t_) ** 2 * x0 + 2 * (1 - t_) * t_ * cx + t_ ** 2 * ex,
                            (1 - t_) ** 2 * y0 + 2 * (1 - t_) * t_ * cy + t_ ** 2 * ey))
            x, y = ex, ey
    return pts

def png(name, tile, c, l, scale=40, pad=(10, 10), radius=9, with_tile=True, ss=4):
    px, py = pad if with_tile else (0, 0)
    W, H = int((60 + 2 * px) * scale), int((32 + 2 * py) * scale)
    S = scale * ss
    img = Image.new("RGBA", (W * ss, H * ss), (0, 0, 0, 0))
    dr = ImageDraw.Draw(img)
    tr = lambda p: ((p[0] + px) * S, (p[1] + py) * S)
    if with_tile:
        dr.rounded_rectangle([0, 0, W * ss - 1, H * ss - 1], radius=radius * S, fill=tile)
    dr.polygon([tr(p) for p in path_points(C_PATH)], fill=c)
    dr.polygon([tr(p) for p in path_points(L_PATH)], fill=l)
    cx, cy, r = HOLE
    hole_fill = tile if with_tile else (0, 0, 0, 0)
    (x0, y0), (x1, y1) = tr((cx - r, cy - r)), tr((cx + r, cy + r))
    dr.ellipse([x0, y0, x1, y1], fill=hole_fill)
    img.resize((W, H), Image.LANCZOS).save(OUT / name)

VARIANTS = {
    # name:            (tile,      C,         L)
    "logo-mark":       ("#E5007E", "#1C1B21", "#FFFFFF"),   # magenta palette
    "logo-mark-classic": ("#CC3A49", "#2F333D", "#FFFFFF"), # original colors
}
for name, (t, c, l) in VARIANTS.items():
    (OUT / f"{name}.svg").write_text(svg(t, c, l), encoding="utf-8")
    png(f"{name}.png", t, c, l)

# One-color versions without the tile, for print and stamps
(OUT / "logo-mono-dark.svg").write_text(svg(None, "#1C1B21", "#1C1B21", with_tile=False), encoding="utf-8")
(OUT / "logo-mono-white.svg").write_text(svg(None, "#FFFFFF", "#FFFFFF", with_tile=False), encoding="utf-8")
png("logo-mono-dark.png", None, "#1C1B21", "#1C1B21", with_tile=False)
png("logo-mono-white.png", None, "#FFFFFF", "#FFFFFF", with_tile=False)

# Square favicon
fav = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="-6 -20 72 72">'
       f'<rect x="-6" y="-20" width="72" height="72" rx="16" fill="#E5007E"/>'
       f'<path d="{C_PATH}" fill="#1C1B21"/>'
       f'<path fill-rule="evenodd" d="{L_PATH}{hole_path(*HOLE)}" fill="#FFFFFF"/></svg>\n')
(OUT / "favicon.svg").write_text(fav, encoding="utf-8")
print("OK ->", OUT)

# Social share image (Open Graph, 1200 x 630)
def og_image():
    from PIL import ImageFilter, ImageFont
    W, H = 1200, 630
    img = Image.new("RGB", (W, H), "#1C1B21")
    glow = Image.new("RGB", (W, H), "#1C1B21")
    ImageDraw.Draw(glow).ellipse([700, -250, 1450, 500], fill="#E5007E")
    img = Image.blend(img, glow.filter(ImageFilter.GaussianBlur(140)), 0.55)
    mark_scale = 6
    png("_tmp_mark.png", "#E5007E", "#1C1B21", "#FFFFFF", scale=mark_scale, pad=(9, 9), radius=8)
    mark = Image.open(OUT / "_tmp_mark.png")
    img.paste(mark, (90, (H - mark.height) // 2), mark)
    (OUT / "_tmp_mark.png").unlink()
    d = ImageDraw.Draw(img)
    def font(names, size):
        for n in names:
            try: return ImageFont.truetype(n, size)
            except OSError: pass
        return ImageFont.load_default()
    bold = font(["C:/Windows/Fonts/segoeuib.ttf", "DejaVuSans-Bold.ttf"], 84)
    reg = font(["C:/Windows/Fonts/segoeui.ttf", "DejaVuSans.ttf"], 34)
    x = 90 + mark.width + 60
    d.text((x, 200), "Lombard Combo", font=bold, fill="#FFFFFF")
    d.text((x, 305), "Zastaw · Sprzedaj · Kup", font=reg, fill="#FF5DB1")
    d.text((x, 355), "Szczecin · gotówka od ręki", font=reg, fill="#CFCCD6")
    img.save(OUT / "og-image.png", optimize=True)

og_image()
print("OG ->", OUT / "og-image.png")
