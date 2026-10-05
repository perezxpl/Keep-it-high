import math, random
from PIL import Image, ImageDraw, ImageFilter

W, H = 4400, 1400
Y_MAIN = 900
Y_SLAB_BOT = 970
Y_TUNNEL = 1270

# 1. Wczytanie źródeł graficznych
cyan_src = Image.open(r'C:\Users\bujo1\.gemini\antigravity\brain\920a61bb-19f0-4822-9ea3-75f42d7c6c1e\foundry_wall_cyan_1791200672930.jpg')
orange_src = Image.open(r'C:\Users\bujo1\.gemini\antigravity\brain\920a61bb-19f0-4822-9ea3-75f42d7c6c1e\foundry_wall_orange_1791200694503.jpg')
center_src = Image.open(r'C:\Users\bujo1\.gemini\antigravity\brain\920a61bb-19f0-4822-9ea3-75f42d7c6c1e\foundry_center_furnace_1791200715747.jpg')
hole_cyan_raw = Image.open('assets/hole_cyan.jpg').convert('RGBA')
hole_orange_raw = Image.open('assets/hole_orange.jpg').convert('RGBA')

# Główna powierzchnia tła
bg = Image.new('RGB', (W, H), color='#080c14')

# =========================================================================
# 2. KOMPOZYCJA GÓRNEJ HALI (Y: 0 do 950 px)
# =========================================================================
hall_h = 950

# Środek (Wielka hala pieca) - 2000px szerokości, wyśrodkowany na 2200
center_w = 2000
center_scaled = center_src.resize((center_w, hall_h), Image.Resampling.LANCZOS)
bg.paste(center_scaled, (W // 2 - center_w // 2, 0))

# Lewe skrzydło (Cyan) - 1650px szerokości
left_w = 1650
left_scaled = cyan_src.resize((left_w, hall_h), Image.Resampling.LANCZOS)
mask_l = Image.new('L', (left_w, hall_h), 255)
dl = ImageDraw.Draw(mask_l)
blend_len = 350
for x in range(left_w - blend_len, left_w):
    alpha = int(255 * (1.0 - (x - (left_w - blend_len)) / blend_len))
    dl.line([(x, 0), (x, hall_h)], fill=alpha)
bg.paste(left_scaled, (0, 0), mask_l)

# Prawe skrzydło (Orange) - 1650px szerokości, lustrzane odbicie
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
# 3. PRZEMYSŁOWE GNIAZDA WENTYLATORA SUFITOWEGO (X: 2200, Y: 220, R: 210)
# =========================================================================
# Tworzymy głęboki, ciemny szyb wentylacyjny z pancernym pierścieniem i kratownicą
fan_cx, fan_cy, fan_r = 2200, 220, 210
fan_layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
fdraw = ImageDraw.Draw(fan_layer)

# Ciemna czeluść szybu
fdraw.ellipse([fan_cx - fan_r, fan_cy - fan_r, fan_cx + fan_r, fan_cy + fan_r], fill=(6, 9, 14, 255))
# Pierścienie głębi
for ir, alpha in [(190, 230), (150, 200), (100, 160), (50, 120)]:
    fdraw.ellipse([fan_cx - ir, fan_cy - ir, fan_cx + ir, fan_cy + ir], fill=(3, 5, 8, alpha), outline=(25, 35, 48, 255), width=3)

# Radialne stalowe pręty osłony wentylatora
for ang_deg in range(0, 360, 30):
    rad = math.radians(ang_deg)
    ex = fan_cx + math.cos(rad) * fan_r
    ey = fan_cy + math.sin(rad) * fan_r
    fdraw.line([(fan_cx, fan_cy), (ex, ey)], fill=(30, 42, 58, 255), width=3)
    fdraw.line([(fan_cx, fan_cy), (ex, ey)], fill=(12, 18, 26, 255), width=1)

# Pancerne nity i kołnierz zewnętrzny
fdraw.ellipse([fan_cx - fan_r - 12, fan_cy - fan_r - 12, fan_cx + fan_r + 12, fan_cy + fan_r + 12], outline=(45, 58, 76, 255), width=8)
fdraw.ellipse([fan_cx - fan_r - 4, fan_cy - fan_r - 4, fan_cx + fan_r + 4, fan_cy + fan_r + 4], outline=(20, 28, 38, 255), width=3)
for ang_deg in range(0, 360, 15):
    rad = math.radians(ang_deg)
    bx = fan_cx + math.cos(rad) * (fan_r + 6)
    by = fan_cy + math.sin(rad) * (fan_r + 6)
    fdraw.ellipse([bx - 3, by - 3, bx + 3, by + 3], fill=(85, 105, 130, 255), outline=(15, 22, 32, 255), width=1)

bg.paste(fan_layer, (0, 0), fan_layer)

# =========================================================================
# 4. WBUDOWANIE BRAMEK PRZEMYSŁOWYCH (CYAN & ORANGE)
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

# Cień kontaktowy za kołnierzem bramki
shadow_layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
sdraw = ImageDraw.Draw(shadow_layer)
sdraw.ellipse([190 - 180, 450 - 180, 190 + 180, 450 + 180], fill=(0, 0, 0, 210))
sdraw.ellipse([4210 - 180, 450 - 180, 4210 + 180, 450 + 180], fill=(0, 0, 0, 210))
shadow_layer = shadow_layer.filter(ImageFilter.GaussianBlur(16))
bg.paste(shadow_layer, (0, 0), shadow_layer)

bg.paste(conduit_cyan, (20, 280), conduit_cyan)
bg.paste(conduit_orange, (4040, 280), conduit_orange)

# =========================================================================
# 5. DOLNY TUNEL PODZIEMNY (Y: 970 do 1400 px) - PEŁNA ARCHITEKTURA
# =========================================================================
draw = ImageDraw.Draw(bg)

# Tło dolnego tunelu: wilgotny kamień i stal
draw.rectangle([0, Y_SLAB_BOT, W, Y_TUNNEL], fill='#070b12')
# Pionowe stalowe filary podpierające strop co 180 px
for col_x in range(160, W - 140, 180):
    draw.rectangle([col_x - 12, Y_SLAB_BOT, col_x + 12, Y_TUNNEL], fill='#131a26', outline='#1e2736', width=2)
    draw.line([(col_x - 6, Y_SLAB_BOT), (col_x - 6, Y_TUNNEL)], fill='#253245', width=1)
    draw.line([(col_x + 6, Y_SLAB_BOT), (col_x + 6, Y_TUNNEL)], fill='#0b0f16', width=1)
    # Nity montażowe na filarach
    for ny in range(Y_SLAB_BOT + 25, Y_TUNNEL - 20, 40):
        draw.ellipse([col_x - 3, ny - 3, col_x + 3, ny + 3], fill='#3b4c63')

# Ciąg rurociągów podstropowych w tunelu
draw.rectangle([0, Y_SLAB_BOT + 18, W, Y_SLAB_BOT + 34], fill='#1e2736', outline='#0a0e14', width=2)
draw.line([(0, Y_SLAB_BOT + 22), (W, Y_SLAB_BOT + 22)], fill='#3b4c63', width=2)
draw.rectangle([0, Y_SLAB_BOT + 42, W, Y_SLAB_BOT + 54], fill='#16202c', outline='#0a0e14', width=2)
for jx in range(90, W, 220):
    draw.rectangle([jx - 4, Y_SLAB_BOT + 15, jx + 4, Y_SLAB_BOT + 37], fill='#334155')
    draw.rectangle([jx - 4, Y_SLAB_BOT + 39, jx + 4, Y_SLAB_BOT + 57], fill='#334155')

# Spąg tunelu (Y = 1270 do 1400)
draw.rectangle([0, Y_TUNNEL, W, H], fill='#05070c', outline='#161e2b', width=2)
draw.rectangle([0, Y_TUNNEL, W, Y_TUNNEL + 12], fill='#101622')

# Podkłady kolejowe (sleepers) i podsypka tłuczniowa pod tory
for sx in range(160, 4240, 24):
    draw.rectangle([sx, Y_TUNNEL - 2, sx + 12, Y_TUNNEL + 5], fill='#1a2230', outline='#0b0f16', width=1)
# Stalowe szyny
draw.rectangle([160, Y_TUNNEL - 4, 4240, Y_TUNNEL - 2], fill='#475569')
draw.line([(160, Y_TUNNEL - 4), (4240, Y_TUNNEL - 4)], fill='#94a3b8', width=1)

# Oświetlenie awaryjne w tunelu (żółto-bursztynowe lampy na filarach)
for lx in [380, 720, 1100, 1500, 1820, 2580, 2900, 3300, 3680, 4020]:
    draw.rectangle([lx - 5, Y_SLAB_BOT + 75, lx + 5, Y_SLAB_BOT + 92], fill='#1e293b', outline='#334155')
    draw.ellipse([lx - 4, Y_SLAB_BOT + 80, lx + 4, Y_SLAB_BOT + 92], fill='#f59e0b')

# Pionowe drabiny w tunelu pod szybami (440 i 3960)
for lx in [440, 3960]:
    draw.line([(lx - 12, Y_MAIN), (lx - 12, Y_TUNNEL)], fill='#334155', width=3)
    draw.line([(lx + 12, Y_MAIN), (lx + 12, Y_TUNNEL)], fill='#334155', width=3)
    for ly in range(Y_MAIN + 15, Y_TUNNEL, 22):
        draw.line([(lx - 12, ly), (lx + 12, ly)], fill='#475569', width=2)

# =========================================================================
# 6. PŁYTA GŁÓWNA (Y: 900 do 970 px) & SZYBY ZRZUTOWE
# =========================================================================
def draw_floor_slab(x1, x2):
    draw.rectangle([x1, Y_MAIN, x2, Y_SLAB_BOT], fill='#0d121b', outline='#1e2736', width=2)
    draw.rectangle([x1, Y_MAIN, x2, Y_MAIN + 10], fill='#1e293b')
    draw.line([(x1, Y_MAIN), (x2, Y_MAIN)], fill='#475569', width=2)
    # Nity montażowe
    for nx in range(x1 + 25, x2 - 15, 45):
        draw.ellipse([nx, Y_MAIN + 3, nx + 4, Y_MAIN + 7], fill='#64748b')

draw_floor_slab(0, 780)
draw_floor_slab(920, 1850)
draw_floor_slab(2550, 3480)
draw_floor_slab(3620, 4400)

# Otwarte szyby zrzutowe do dolnego tunelu (780..920 oraz 3480..3620)
for hx1, hx2 in [(780, 920), (3480, 3620)]:
    draw.rectangle([hx1, Y_MAIN, hx2, Y_MAIN + 8], fill='#070a10', outline='#334155', width=2)
    for gx in range(hx1 + 8, hx2, 16):
        draw.line([(gx, Y_MAIN), (gx, Y_MAIN + 8)], fill='#475569', width=2)

# =========================================================================
# 7. CENTRALNA STREFA PIECA (RAMPY 1850..1980 & 2420..2550, POMOST 1980..2420, KADŹ)
# =========================================================================
ramp_top = 800

# Rampa lewa: (1850, 900) -> (1980, 800)
# Podbudowa rampy ze stalowych kratownic i płyt
draw.polygon([(1850, Y_MAIN), (1980, ramp_top), (1980, Y_MAIN)], fill='#101622', outline='#1e2838', width=2)
# Belka nośna skośna rampy z ryflowaniem
draw.line([(1850, Y_MAIN), (1980, ramp_top)], fill='#334155', width=6)
draw.line([(1850, Y_MAIN - 2), (1980, ramp_top - 2)], fill='#64748b', width=2)
for i in range(12):
    t = i / 11.0
    rx = 1850 + t * 130
    ry = Y_MAIN - t * 100
    draw.line([(rx, ry), (rx + 4, ry - 3)], fill='#eab308', width=2)

# Rampa prawa: (2420, 800) -> (2550, 900)
draw.polygon([(2420, ramp_top), (2550, Y_MAIN), (2420, Y_MAIN)], fill='#101622', outline='#1e2838', width=2)
draw.line([(2420, ramp_top), (2550, Y_MAIN)], fill='#334155', width=6)
draw.line([(2420, ramp_top - 2), (2550, Y_MAIN - 2)], fill='#64748b', width=2)
for i in range(12):
    t = i / 11.0
    rx = 2420 + t * 130
    ry = ramp_top + t * 100
    draw.line([(rx, ry), (rx - 4, ry - 3)], fill='#eab308', width=2)

# Pomost roboczy pieca (X: 1980..2420, Y: 800)
draw.rectangle([1980, ramp_top, 2420, ramp_top + 18], fill='#1e293b', outline='#334155', width=2)
draw.line([(1980, ramp_top), (2420, ramp_top)], fill='#64748b', width=2)
# Podbudowa pieca (komora grzewcza pod pomostem X: 1980..2420, Y: 818..900)
draw.rectangle([1980, ramp_top + 18, 2420, Y_MAIN], fill='#0d131c', outline='#1e2838', width=2)
# Kraty wentylacyjne komory i żar
for vx in range(2005, 2390, 35):
    draw.rectangle([vx, ramp_top + 32, vx + 22, ramp_top + 70], fill='#07090f', outline='#273548', width=2)
    draw.line([(vx + 4, ramp_top + 55), (vx + 18, ramp_top + 55)], fill='#f97316', width=3)

# CADŹ / KOCIOŁ ODLEWNICZY W CENTRUM (CX = 2200, Y = 780..860)
# Sylwetka masywnej stalowej kadzi, w której Canvas rysuje wrzącą surówkę
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
], fill='#121824', outline='#2a3547', width=3)

# Pasy wzmacniające kadź z nitami
for py in [cad_top_y + 35, cad_top_y + 55]:
    draw.line([(CX - 95, py), (CX + 95, py)], fill='#253245', width=5)
    for nx in range(CX - 85, CX + 90, 22):
        draw.ellipse([nx - 2, py - 2, nx + 2, py + 2], fill='#556882')

# Czopy obrotowe kadzi (Trunnions) po bokach
for trun_x in [CX - cad_w_top // 2 - 24, CX + cad_w_top // 2 + 2]:
    draw.rectangle([trun_x, cad_top_y + 25, trun_x + 22, cad_top_y + 52], fill='#253042', outline='#3b4c63', width=2)
    draw.ellipse([trun_x + 4, cad_top_y + 30, trun_x + 18, cad_top_y + 46], fill='#0b0f16', outline='#64748b', width=2)

# Kołnierz wylewu kadzi (eliptyczny brzeg)
collar_w, collar_h = 228, 38
draw.ellipse([CX - collar_w // 2, cad_top_y - 2, CX + collar_w // 2, cad_top_y + collar_h], fill='#161e2b', outline='#3b4c63', width=4)

# =========================================================================
# 8. ŚWIATŁO WOLUMETRYCZNE I POŚWIATY (VOLUMETRIC ATMOSPHERE)
# =========================================================================
glow = Image.new('RGB', (W, H), (0, 0, 0))
gdraw = ImageDraw.Draw(glow)

# Żar wielkiego pieca w centrum
gdraw.ellipse([CX - 450, cad_top_y - 150, CX + 450, Y_MAIN + 120], fill=(240, 75, 10))
gdraw.ellipse([CX - 220, cad_top_y - 80, CX + 220, cad_top_y + 100], fill=(255, 160, 35))

# Poświata bramki Cyan
gdraw.ellipse([190 - 150, 450 - 150, 190 + 150, 450 + 150], fill=(0, 175, 245))
gdraw.ellipse([190 - 80, 450 - 80, 190 + 80, 450 + 80], fill=(150, 240, 255))

# Poświata bramki Orange
gdraw.ellipse([4210 - 150, 450 - 150, 4210 + 150, 450 + 150], fill=(250, 105, 10))
gdraw.ellipse([4210 - 80, 450 - 80, 4210 + 80, 450 + 80], fill=(255, 195, 55))

# Lampy awaryjne w tunelu dolnym
for lx in [380, 720, 1100, 1500, 1820, 2580, 2900, 3300, 3680, 4020]:
    gdraw.ellipse([lx - 50, Y_SLAB_BOT + 60, lx + 50, Y_SLAB_BOT + 120], fill=(160, 95, 10))

glow = glow.filter(ImageFilter.GaussianBlur(55))
final_bg = Image.blend(bg, glow, 0.30)

# Zapisujemy wygenerowane tło do foundry_bg.png
final_bg.save('foundry_bg.png', format='PNG')
print("Successfully generated master foundry_bg.png (4400x1400) with complete architecture.")
