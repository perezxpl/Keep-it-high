# scripts/process_minigun_sprites.py
# Extracts clean transparent high-res PNG sprites for M134 Minigun:
# 1. assets/weapons/minigun.png (Full Armory card sprite with curved linked brass belt)
# 2. assets/weapons/minigun_body.png (Modular receiver, handles, chute lip without barrels/hanging belt)
# 3. assets/weapons/minigun_barrels_sheet.png (4 cols x 3 rows: 4 rotation phases x 3 heat states)

import os
import math
from collections import deque
from PIL import Image

SRC_IMAGE = r"C:\Users\bujo1\.gemini\antigravity\brain\2869c5b1-4826-4041-9b15-51dc729c663b\m134_vulcan_minigun_sprite_fixed_1795552990693.jpg"
OUT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "assets", "weapons")

# Landmark bounds in source 1376x768 image
CROP_X0, CROP_Y0 = 56, 149
CROP_X1, CROP_Y1 = 1318, 739  # exclusive -> 1262 x 590

BODY_X1 = 645    # body crops 56..645 -> 589 px wide
BODY_Y1 = 508    # body crops 149..508 -> 359 px tall (keeps full steel chute frame & motor, cuts loose belt below y=508)

BARREL_X0 = 625  # overlaps collar cleanly (collar ends ~632)
BARREL_X1 = 1319 # 694 px wide
BARREL_Y0 = 308
BARREL_Y1 = 460  # 152 px tall

BARREL_TUBE_Y_MIN = 322
BARREL_TUBE_Y_MAX = 445
BARREL_CENTER_Y = 383.5
BARREL_RADIUS = 61.5

CLAMP_RANGES = [
    (928, 976),
    (1106, 1121),
    (1188, 1200),
    (1219, 1268),
    (1288, 1303),
]


def is_in_clamps(x):
    for a, b in CLAMP_RANGES:
        if a <= x <= b:
            return True
    return False


def flood_clear(px, w, h, seeds, threshold=18):
    visited = bytearray(w * h)
    q = deque()
    for sx, sy in seeds:
        if 0 <= sx < w and 0 <= sy < h:
            idx = sy * w + sx
            if not visited[idx]:
                visited[idx] = 1
                q.append((sx, sy))

    while q:
        x, y = q.popleft()
        r, g, b, a = px[x, y]
        if a == 0 or max(r, g, b) <= threshold:
            px[x, y] = (0, 0, 0, 0)
            if x > 0 and not visited[y * w + (x - 1)]:
                visited[y * w + (x - 1)] = 1
                q.append((x - 1, y))
            if x < w - 1 and not visited[y * w + (x + 1)]:
                visited[y * w + (x + 1)] = 1
                q.append((x + 1, y))
            if y > 0 and not visited[(y - 1) * w + x]:
                visited[(y - 1) * w + x] = 1
                q.append((x, y - 1))
            if y < h - 1 and not visited[(y + 1) * w + x]:
                visited[(y + 1) * w + x] = 1
                q.append((x, y + 1))


def extract_clean_master():
    im = Image.open(SRC_IMAGE).convert("RGBA")
    w, h = im.size
    px = im.load()

    # Outer edge seeds + exact interior structural cutouts (no gunmetal crevices!)
    seeds = []
    for x in range(w):
        seeds.append((x, 0))
        seeds.append((x, h - 1))
    for y in range(h):
        seeds.append((0, y))
        seeds.append((w - 1, y))

    # Interior cutouts
    seeds.extend([
        (165, 195),  # trigger guard loop
        (75, 365),   # rear cage left opening
        (150, 365),  # rear cage right opening
        (475, 200),  # top chainsaw handle gap
        (695, 585),  # belt loop right
        (575, 625),  # belt loop mid
        (625, 495),  # under barrels / right of chute
    ])

    flood_clear(px, w, h, seeds, threshold=20)

    # Also clear small trapped dark spots specifically between ammo belt links (y > 490, x > 420)
    belt_seeds = []
    for y in range(495, 740, 2):
        for x in range(420, 920, 2):
            r, g, b, a = px[x, y]
            if a > 0 and max(r, g, b) <= 14:
                belt_seeds.append((x, y))
    flood_clear(px, w, h, belt_seeds, threshold=16)

    # Soft anti-alias pass on border dark pixels touching transparent background
    orig_alpha = [[px[x, y][3] for x in range(w)] for y in range(h)]
    for y in range(1, h - 1):
        for x in range(1, w - 1):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            has_trans_neighbor = (
                orig_alpha[y][x - 1] == 0
                or orig_alpha[y][x + 1] == 0
                or orig_alpha[y - 1][x] == 0
                or orig_alpha[y + 1][x] == 0
            )
            if has_trans_neighbor:
                mx = max(r, g, b)
                if mx < 38:
                    new_a = max(0, min(255, int(255 * (mx / 38.0))))
                    px[x, y] = (r, g, b, new_a)

    return im


def lerp(a, b, t):
    return a + (b - a) * t


def apply_heat_tint(rgba_cell, row):
    if row == 0:
        return rgba_cell.copy()

    out = rgba_cell.copy()
    w, h = out.size
    px = out.load()

    # Barrel metal starts around local x = 10 (635 - 625) to w - 2
    for x in range(w):
        t_x = max(0.0, min(1.0, (x - 10) / float(max(1, w - 12))))
        if row == 1:
            heat = max(0.0, min(1.0, (t_x - 0.36) / 0.64)) ** 1.35
        else:
            heat = max(0.0, min(1.0, (t_x - 0.10) / 0.90)) ** 1.05

        if heat <= 0.01:
            continue

        # Suppress heat slightly on clamp collars so steel rings stand out thermally
        src_x = BARREL_X0 + x
        clamp_mult = 0.45 if is_in_clamps(src_x) else 1.0
        eff_heat = heat * clamp_mult

        for y in range(h):
            r, g, b, a = px[x, y]
            if a < 10:
                continue

            lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255.0
            # Keep deep dark outlines crisp while making metallic faces glow
            metal_factor = max(0.0, min(1.0, (lum - 0.06) / 0.45))
            glow = min(1.0, eff_heat * (0.48 + 0.65 * metal_factor))

            if row == 1:
                # Warm amber-orange glow at barrel tips
                if eff_heat < 0.55:
                    gt = eff_heat / 0.55
                    tr, tg, tb = lerp(125, 228, gt), lerp(40, 108, gt), lerp(10, 12, gt)
                else:
                    gt = (eff_heat - 0.55) / 0.45
                    tr, tg, tb = lerp(228, 255, gt), lerp(108, 224, gt), lerp(12, 70, gt)
            else:
                # Overheated blazing crimson -> orange -> bright yellow-white crown
                if eff_heat < 0.35:
                    gt = eff_heat / 0.35
                    tr, tg, tb = lerp(155, 240, gt), lerp(24, 52, gt), lerp(14, 18, gt)
                elif eff_heat < 0.72:
                    gt = (eff_heat - 0.35) / 0.37
                    tr, tg, tb = lerp(240, 255, gt), lerp(52, 155, gt), lerp(18, 22, gt)
                else:
                    gt = (eff_heat - 0.72) / 0.28
                    tr, tg, tb = lerp(255, 255, gt), lerp(155, 245, gt), lerp(22, 160, gt)

            boost = (0.85 + lum * 0.65) if row == 2 else (0.78 + lum * 0.65)
            nr = max(0, min(255, int(lerp(r, min(255, tr * boost), glow))))
            ng = max(0, min(255, int(lerp(g, min(255, tg * boost), glow))))
            nb = max(0, min(255, int(lerp(b, min(255, tb * boost), glow))))
            px[x, y] = (nr, ng, nb, a)

    return out


def make_barrel_phase(base_cell, col):
    if col == 0:
        return base_cell.copy()

    w, h = base_cell.size
    out = base_cell.copy()
    src_px = base_cell.load()
    dst_px = out.load()

    y_min_local = BARREL_TUBE_Y_MIN - BARREL_Y0
    y_max_local = BARREL_TUBE_Y_MAX - BARREL_Y0
    center_local = BARREL_CENTER_Y - BARREL_Y0

    # Cylindrical phase shift: 15 degrees (PI/12) per col
    phi_shift = col * (math.pi / 12.0)

    for x in range(w):
        src_x = BARREL_X0 + x
        in_clamp = is_in_clamps(src_x)

        for y in range(y_min_local, y_max_local + 1):
            _, _, _, dst_a = src_px[x, y]
            if dst_a == 0:
                continue

            if in_clamp:
                # Subtle mechanical notch scroll inside clamp bands while preserving collar outer shape
                if y_min_local + 6 <= y <= y_max_local - 6:
                    span = (y_max_local - 6) - (y_min_local + 6) + 1
                    sy = (y_min_local + 6) + ((y - (y_min_local + 6) - col * 8) % span)
                    r, g, b, _ = src_px[x, sy]
                    dst_px[x, y] = (r, g, b, dst_a)
                continue

            # Cylindrical angle mapping across front hemisphere [-PI/2, +PI/2]
            u = max(-0.995, min(0.995, (y - center_local) / BARREL_RADIUS))
            phi = math.asin(u)
            phi_src = ((phi - phi_shift + math.pi * 0.5) % math.pi) - math.pi * 0.5
            sy_f = center_local + BARREL_RADIUS * math.sin(phi_src)

            sy0 = max(y_min_local, min(y_max_local, int(math.floor(sy_f))))
            sy1 = max(y_min_local, min(y_max_local, sy0 + 1))
            frac = sy_f - sy0

            r0, g0, b0, a0 = src_px[x, sy0]
            r1, g1, b1, a1 = src_px[x, sy1]
            # Keep solid alpha silhouette of original barrel frame
            if a0 < 40 and a1 < 40:
                continue
            if a0 < 40:
                r0, g0, b0 = r1, g1, b1
            elif a1 < 40:
                r1, g1, b1 = r0, g0, b0

            r = int(lerp(r0, r1, frac))
            g = int(lerp(g0, g1, frac))
            b = int(lerp(b0, b1, frac))
            dst_px[x, y] = (r, g, b, dst_a)

    return out


def run():
    os.makedirs(OUT_DIR, exist_ok=True)
    master = extract_clean_master()

    # 1. Full Armory Preview Sprite (with wavy brass belt)
    armory_im = master.crop((CROP_X0, CROP_Y0, CROP_X1, CROP_Y1))
    armory_path = os.path.join(OUT_DIR, "minigun.png")
    armory_im.save(armory_path, "PNG")
    print(f"[OK] Saved {armory_path} size={armory_im.size}")

    # 2. Modular Combat Body (no barrels right of collar, no frozen hanging belt below chute lip)
    body_im = master.crop((CROP_X0, CROP_Y0, BODY_X1, BODY_Y1))
    bpx = body_im.load()
    bw, bh = body_im.size
    # Trim any barrel protrusion inside collar zone (x >= 633 in src -> local x >= 577)
    collar_cut_x = 633 - CROP_X0
    for y in range(315 - CROP_Y0, min(bh, 456 - CROP_Y0)):
        for x in range(collar_cut_x, bw):
            bpx[x, y] = (0, 0, 0, 0)

    body_path = os.path.join(OUT_DIR, "minigun_body.png")
    body_im.save(body_path, "PNG")
    print(f"[OK] Saved {body_path} size={body_im.size}")

    # 3. High-Res Rotating & Glowing Barrels Spritesheet (4 cols x 3 rows)
    base_barrel_cell = master.crop((BARREL_X0, BARREL_Y0, BARREL_X1, BARREL_Y1))
    cw, ch = base_barrel_cell.size
    sheet = Image.new("RGBA", (cw * 4, ch * 3), (0, 0, 0, 0))

    phase_cells = [make_barrel_phase(base_barrel_cell, col) for col in range(4)]
    for row in range(3):
        for col in range(4):
            tinted = apply_heat_tint(phase_cells[col], row)
            sheet.paste(tinted, (col * cw, row * ch))

    sheet_path = os.path.join(OUT_DIR, "minigun_barrels_sheet.png")
    sheet.save(sheet_path, "PNG")
    print(f"[OK] Saved {sheet_path} size={sheet.size} cell=({cw}, {ch})")


if __name__ == "__main__":
    run()
