import math, random
from PIL import Image, ImageDraw, ImageFilter

W, H = 4400, 1400
Y_MAIN = 900
Y_SLAB_BOT = 970
Y_TUNNEL = 1270

# 1. Źródła graficzne 4K
cyan_src = Image.open(r'C:\Users\bujo1\.gemini\antigravity\brain\920a61bb-19f0-4822-9ea3-75f42d7c6c1e\foundry_cyan_clean_1791205184259.jpg')
orange_src = Image.open(r'C:\Users\bujo1\.gemini\antigravity\brain\920a61bb-19f0-4822-9ea3-75f42d7c6c1e\foundry_orange_clean_1791205208766.jpg')
center_src = Image.open(r'C:\Users\bujo1\.gemini\antigravity\brain\920a61bb-19f0-4822-9ea3-75f42d7c6c1e\foundry_center_clean_1791205241578.jpg')
tunnel_src = Image.open(r'C:\Users\bujo1\.gemini\antigravity\brain\920a61bb-19f0-4822-9ea3-75f42d7c6c1e\foundry_lower_tunnel_1791205287778.jpg')

hole_cyan_raw = Image.open('assets/hole_cyan.jpg').convert('RGBA')
hole_orange_raw = Image.open('assets/hole_orange.jpg').convert('RGBA')

# Główna powierzchnia tła
bg = Image.new('RGB', (W, H), color='#070a10')

# =========================================================================
# 2. DOLNY TUNEL TECHNICZNY Z TORAMI (Y: 970 do 1400 px)
# =========================================================================
tunnel_h = H - Y_SLAB_BOT  # 430 px
# Dzielimy dolny tunel na 3 malarskie sekcje po 1550 px z miękkim przenikaniem
tw, th = tunnel_src.size
sec_w = 1600
scaled_tunnel = tunnel_src.resize((sec_w, tunnel_h), Image.Resampling.LANCZOS)
scaled_tunnel_flip = tunnel_src.transpose(Image.FLIP_LEFT_RIGHT).resize((sec_w, tunnel_h), Image.Resampling.LANCZOS)

# Lewa część tunelu (0..1550)
bg.paste(scaled_tunnel, (0, Y_SLAB_BOT))

# Środkowa część tunelu (1400..2950) z blendem
mask_mid = Image.new('L', (sec_w, tunnel_h), 255)
dm = ImageDraw.Draw(mask_mid)
for x in range(0, 200):
    dm.line([(x, 0), (x, tunnel_h)], fill=int(255 * (x / 200)))
for x in range(sec_w - 200, sec_w):
    dm.line([(x, 0), (x, tunnel_h)], fill=int(255 * (1.0 - (x - (sec_w - 200)) / 200)))
bg.paste(scaled_tunnel_flip, (1400, Y_SLAB_BOT), mask_mid)

# Prawa część tunelu (2800..4400) z blendem
mask_right = Image.new('L', (sec_w, tunnel_h), 255)
dr = ImageDraw.Draw(mask_right)
for x in range(0, 250):
    dr.line([(x, 0), (x, tunnel_h)], fill=int(255 * (x / 250)))
bg.paste(scaled_tunnel, (W - sec_w, Y_SLAB_BOT), mask_right)

# =========================================================================
# 3. GÓRNA HALA BOISKA (Y: 0 do 970 px)
# =========================================================================
hall_h = Y_SLAB_BOT  # 970 px

# Centrum hali (Wielki Piec) - szerokość 2000px, środek dokładnie na X=2200
center_w = 2050
center_scaled = center_src.resize((center_w, hall_h), Image.Resampling.LANCZOS)
bg.paste(center_scaled, (W // 2 - center_w // 2, 0))

# Lewe skrzydło (Cyan) - szerokość 1650px, blend do centrum
left_w = 1650
left_scaled = cyan_src.resize((left_w, hall_h), Image.Resampling.LANCZOS)
mask_l = Image.new('L', (left_w, hall_h), 255)
dl = ImageDraw.Draw(mask_l)
blend_len = 400
for x in range(left_w - blend_len, left_w):
    alpha = int(255 * (1.0 - (x - (left_w - blend_len)) / blend_len))
    dl.line([(x, 0), (x, hall_h)], fill=alpha)
bg.paste(left_scaled, (0, 0), mask_l)

# Prawe skrzydło (Orange) - szerokość 1650px, blend do centrum
right_w = 1650
orange_flipped = orange_src.transpose(Image.FLIP_LEFT_RIGHT)
right_scaled = orange_flipped.resize((right_w, hall_h), Image.Resampling.LANCZOS)
mask_r = Image.new('L', (right_w, hall_h), 255)
dr = ImageDraw.Draw(mask_r)
for x in range(0, blend_len):
    alpha = int(255 * (x / blend_len))
    dr.line([(x, 0), (x, hall_h)], fill=alpha)
bg.paste(right_scaled, (W - right_w, 0), mask_r)

# =========================================================================
# 4. GNIAZDO WENTYLATORA SUFITOWEGO (X: 2200, Y: 220, R: 210)
# =========================================================================
fan_cx, fan_cy, fan_r = 2200, 220, 210
fan_layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
fdraw = ImageDraw.Draw(fan_layer)

# Ciemny wlot szybu
fdraw.ellipse([fan_cx - fan_r, fan_cy - fan_r, fan_cx + fan_r, fan_cy + fan_r], fill=(5, 8, 12, 255))
for ir, alpha in [(190, 230), (150, 190), (100, 150), (50, 100)]:
    fdraw.ellipse([fan_cx - ir, fan_cy - ir, fan_cx + ir, fan_cy + ir], fill=(3, 4, 7, alpha), outline=(22, 30, 42, 255), width=3)

# Kratownica radialna
for ang_deg in range(0, 360, 30):
    rad = math.radians(ang_deg)
    ex = fan_cx + math.cos(rad) * fan_r
    ey = fan_cy + math.sin(rad) * fan_r
    fdraw.line([(fan_cx, fan_cy), (ex, ey)], fill=(28, 38, 52, 255), width=3)
    fdraw.line([(fan_cx, fan_cy), (ex, ey)], fill=(10, 15, 22, 255), width=1)

# Pancerne nity i kołnierz zewnętrzny
fdraw.ellipse([fan_cx - fan_r - 12, fan_cy - fan_r - 12, fan_cx + fan_r + 12, fan_cy + fan_r + 12], outline=(42, 54, 70, 255), width=8)
fdraw.ellipse([fan_cx - fan_r - 4, fan_cy - fan_r - 4, fan_cx + fan_r + 4, fan_cy + fan_r + 4], outline=(18, 25, 34, 255), width=3)
for ang_deg in range(0, 360, 15):
    rad = math.radians(ang_deg)
    bx = fan_cx + math.cos(rad) * (fan_r + 6)
    by = fan_cy + math.sin(rad) * (fan_r + 6)
    fdraw.ellipse([bx - 3, by - 3, bx + 3, by + 3], fill=(80, 100, 125, 255), outline=(12, 18, 26, 255), width=1)

bg.paste(fan_layer, (0, 0), fan_layer)

# =========================================================================
# 5. WBUDOWANIE BRAMEK PRZEMYSŁOWYCH (CYAN & ORANGE)
# Dokładne współrzędne gry:
# Cyan: x: 20, y: 280, w: 340, h: 340, holeCx: 190, holeCy: 450, holeR: 170
# Orange: x: 4040, y: 280, w: 340, h: 340, holeCx: 4210, holeCy: 450, holeR: 170
# =========================================================================
def make_conduit_layer(raw_img, flip_h=False, r_outer=430, feather=22):
    im = raw_img.copy()
    if flip_h:
        im = im.transpose(Image.FLIP_LEFT_RIGHT)
    w, h = im.size
    cx, cy = w // 2, h // 2
    
    mask = Image.new('L', (w, h), 0)
    dm = ImageDraw.Draw(mask)
    dm.ellipse([cx - r_outer, cy - r_outer, cx + r_outer, cy + r_outer], fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(feather))
    im.putalpha(mask)
    
    crop_box = (cx - r_outer - 20, cy - r_outer - 20, cx + r_outer + 20, cy + r_outer + 20)
    cropped = im.crop(crop_box)
    return cropped.resize((340, 340), Image.Resampling.LANCZOS)

conduit_cyan = make_conduit_layer(hole_cyan_raw, flip_h=True, r_outer=430, feather=22)
conduit_orange = make_conduit_layer(hole_orange_raw, flip_h=False, r_outer=430, feather=22)

# Cień kontaktowy
shadow_layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
sdraw = ImageDraw.Draw(shadow_layer)
sdraw.ellipse([190 - 180, 450 - 180, 190 + 180, 450 + 180], fill=(0, 0, 0, 220))
sdraw.ellipse([4210 - 180, 450 - 180, 4210 + 180, 450 + 180], fill=(0, 0, 0, 220))
shadow_layer = shadow_layer.filter(ImageFilter.GaussianBlur(16))
bg.paste(shadow_layer, (0, 0), shadow_layer)

bg.paste(conduit_cyan, (20, 280), conduit_cyan)
bg.paste(conduit_orange, (4040, 280), conduit_orange)

# =========================================================================
# 6. GŁÓWNA PŁYTA STROPOWA (Y: 900 do 970 px) & SZYBY ZRZUTOWE
# =========================================================================
draw = ImageDraw.Draw(bg)

def draw_floor_slab(x1, x2):
    # Ciało płyty żelbetowej
    draw.rectangle([x1, Y_MAIN, x2, Y_SLAB_BOT], fill='#0d121b', outline='#1e2736', width=2)
    # Górne stalowe okucie z nitami (poziom stóp Y=900)
    draw.rectangle([x1, Y_MAIN, x2, Y_MAIN + 8], fill='#1c2636')
    draw.line([(x1, Y_MAIN), (x2, Y_MAIN)], fill='#475569', width=2)
    for nx in range(x1 + 25, x2 - 15, 45):
        draw.ellipse([nx, Y_MAIN + 2, nx + 4, Y_MAIN + 6], fill='#64748b')

draw_floor_slab(0, 780)
draw_floor_slab(920, 1850)
draw_floor_slab(2550, 3480)
draw_floor_slab(3620, 4400)

# Otwarte szyby zrzutowe do dolnego tunelu (780..920 oraz 3480..3620)
for hx1, hx2 in [(780, 920), (3480, 3620)]:
    draw.rectangle([hx1, Y_MAIN, hx2, Y_MAIN + 8], fill='#070a10', outline='#334155', width=2)
    for gx in range(hx1 + 8, hx2, 16):
        draw.line([(gx, Y_MAIN), (gx, Y_MAIN + 8)], fill='#475569', width=2)

# Drabiny pionowe w szybach zrzutowych
for lx in [440, 3960]:
    draw.line([(lx - 12, Y_MAIN), (lx - 12, Y_TUNNEL)], fill='#334155', width=3)
    draw.line([(lx + 12, Y_MAIN), (lx + 12, Y_TUNNEL)], fill='#334155', width=3)
    for ly in range(Y_MAIN + 15, Y_TUNNEL, 22):
        draw.line([(lx - 12, ly), (lx + 12, ly)], fill='#475569', width=2)

# =========================================================================
# 7. CENTRALNA STREFA PIECA (RAMPY 1850..1980 & 2420..2550, POMOST 1980..2420, KADŹ)
# =========================================================================
ramp_top = 800

# Rampa lewa: (1850, 900) -> (1980, 800)
draw.polygon([(1850, Y_MAIN), (1980, ramp_top), (1980, Y_MAIN)], fill='#0f1520', outline='#1c2635', width=2)
draw.line([(1850, Y_MAIN), (1980, ramp_top)], fill='#334155', width=6)
draw.line([(1850, Y_MAIN - 2), (1980, ramp_top - 2)], fill='#64748b', width=2)
for i in range(12):
    t = i / 11.0
    rx = 1850 + t * 130
    ry = Y_MAIN - t * 100
    draw.line([(rx, ry), (rx + 4, ry - 3)], fill='#eab308', width=2)

# Rampa prawa: (2420, 800) -> (2550, 900)
draw.polygon([(2420, ramp_top), (2550, Y_MAIN), (2420, Y_MAIN)], fill='#0f1520', outline='#1c2635', width=2)
draw.line([(2420, ramp_top), (2550, Y_MAIN)], fill='#334155', width=6)
draw.line([(2420, ramp_top - 2), (2550, Y_MAIN - 2)], fill='#64748b', width=2)
for i in range(12):
    t = i / 11.0
    rx = 2420 + t * 130
    ry = ramp_top + t * 100
    draw.line([(rx, ry), (rx - 4, ry - 3)], fill='#eab308', width=2)

# Pomost roboczy pieca (X: 1980..2420, Y: 800)
draw.rectangle([1980, ramp_top, 2420, ramp_top + 16], fill='#1c2636', outline='#334155', width=2)
draw.line([(1980, ramp_top), (2420, ramp_top)], fill='#64748b', width=2)
# Podbudowa pieca
draw.rectangle([1980, ramp_top + 16, 2420, Y_MAIN], fill='#0c111a', outline='#1c2635', width=2)
# Kraty wentylacyjne komory i żar
for vx in range(2005, 2390, 35):
    draw.rectangle([vx, ramp_top + 30, vx + 22, ramp_top + 68], fill='#07090e', outline='#243142', width=2)
    draw.line([(vx + 4, ramp_top + 52), (vx + 18, ramp_top + 52)], fill='#f97316', width=3)

# CADŹ / KOCIOŁ ODLEWNICZY W CENTRUM (CX = 2200, Y = 794..865)
CX = 2200
cad_top_y = 794
cad_bot_y = 865
cad_w_top = 226
cad_w_bot = 160

draw.polygon([
    (CX - cad_w_top // 2, cad_top_y + 12),
    (CX + cad_w_top // 2, cad_top_y + 12),
    (CX + cad_w_bot // 2, cad_bot_y),
    (CX - cad_w_bot // 2, cad_bot_y)
], fill='#111722', outline='#283244', width=3)

# Pasy wzmacniające kadź z nitami
for py in [cad_top_y + 35, cad_top_y + 55]:
    draw.line([(CX - 95, py), (CX + 95, py)], fill='#222d3d', width=5)
    for nx in range(CX - 85, CX + 90, 22):
        draw.ellipse([nx - 2, py - 2, nx + 2, py + 2], fill='#4d5e75')

# Czopy obrotowe kadzi
for trun_x in [CX - cad_w_top // 2 - 24, CX + cad_w_top // 2 + 2]:
    draw.rectangle([trun_x, cad_top_y + 25, trun_x + 22, cad_top_y + 52], fill='#222b3b', outline='#354458', width=2)
    draw.ellipse([trun_x + 4, cad_top_y + 30, trun_x + 18, cad_top_y + 46], fill='#090d14', outline='#586980', width=2)

# Kołnierz wylewu kadzi
collar_w, collar_h = 228, 38
draw.ellipse([CX - collar_w // 2, cad_top_y - 2, CX + collar_w // 2, cad_top_y + collar_h], fill='#141b27', outline='#354458', width=4)

# =========================================================================
# 8. POŚWIATY WOLUMETRYCZNE (VOLUMETRIC LIGHTING)
# =========================================================================
glow = Image.new('RGB', (W, H), (0, 0, 0))
gdraw = ImageDraw.Draw(glow)

# Żar wielkiego pieca
gdraw.ellipse([CX - 450, cad_top_y - 150, CX + 450, Y_MAIN + 120], fill=(235, 70, 10))
gdraw.ellipse([CX - 220, cad_top_y - 80, CX + 220, cad_top_y + 100], fill=(255, 150, 30))

# Poświata bramki Cyan
gdraw.ellipse([190 - 150, 450 - 150, 190 + 150, 450 + 150], fill=(0, 170, 240))
gdraw.ellipse([190 - 80, 450 - 80, 190 + 80, 450 + 80], fill=(140, 235, 255))

# Poświata bramki Orange
gdraw.ellipse([4210 - 150, 450 - 150, 4210 + 150, 450 + 150], fill=(245, 100, 10))
gdraw.ellipse([4210 - 80, 450 - 80, 4210 + 80, 450 + 80], fill=(255, 190, 50))

glow = glow.filter(ImageFilter.GaussianBlur(55))
final_bg = Image.blend(bg, glow, 0.28)

# Zapisujemy nowe tło
final_bg.save('foundry_bg.png', format='PNG')
print("Successfully generated NEW master foundry_bg.png (4400x1400) perfectly aligned with collision grid.")
