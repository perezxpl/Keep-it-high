import math, random
from PIL import Image, ImageDraw, ImageFilter

W, H = 4400, 1400
Y_MAIN = 900
Y_TUNNEL = 1270

# 1. Źródła graficzne 4K
cyan_src = Image.open(r'C:\Users\bujo1\.gemini\antigravity\brain\920a61bb-19f0-4822-9ea3-75f42d7c6c1e\foundry_cyan_clean_1791205184259.jpg')
orange_src = Image.open(r'C:\Users\bujo1\.gemini\antigravity\brain\920a61bb-19f0-4822-9ea3-75f42d7c6c1e\foundry_orange_clean_1791205208766.jpg')
center_src = Image.open(r'C:\Users\bujo1\.gemini\antigravity\brain\920a61bb-19f0-4822-9ea3-75f42d7c6c1e\foundry_center_clean_1791205241578.jpg')
tunnel_src = Image.open(r'C:\Users\bujo1\.gemini\antigravity\brain\920a61bb-19f0-4822-9ea3-75f42d7c6c1e\foundry_lower_tunnel_1791205287778.jpg')

hole_cyan_raw = Image.open('assets/hole_cyan.jpg').convert('RGBA')
hole_orange_raw = Image.open('assets/hole_orange.jpg').convert('RGBA')

bg = Image.new('RGB', (W, H), color='#070a10')

# =========================================================================
# 2. DOLNY TUNEL TECHNICZNY Z TORAMI (Y: 840 do 1400 px)
# Tunel zaczyna się na Y = 840 (60 px za górną posadzką), dzięki czemu
# stalowe dźwigary i rury stropowe tunelu podtrzymują bezpośrednio płytę hali (Y = 900).
# Główka szyny znajduje się DOKŁADNIE na Y = 1270.
# =========================================================================
tw, th = tunnel_src.size
rail_y = 668
sec_w = 1600
overlap = 60
t_h_upper = 370 + overlap  # 430 px od Y=840 do Y=1270

# Górna część tunelu (od dźwigarów sufitowych do główki szyny): 0..rail_y -> wysokość 430 px
t_upper = tunnel_src.crop((0, 0, tw, rail_y))
t_upper_scaled = t_upper.resize((sec_w, t_h_upper), Image.Resampling.LANCZOS)
t_upper_flip = t_upper.transpose(Image.FLIP_LEFT_RIGHT).resize((sec_w, t_h_upper), Image.Resampling.LANCZOS)

# Dolna część tunelu (podtorze i podsypka): rail_y..th -> wysokość 130 px (Y=1270 do 1400)
t_lower = tunnel_src.crop((0, rail_y, tw, th))
t_lower_scaled = t_lower.resize((sec_w, 130), Image.Resampling.LANCZOS)
t_lower_flip = t_lower.transpose(Image.FLIP_LEFT_RIGHT).resize((sec_w, 130), Image.Resampling.LANCZOS)

# Kompletna sekcja tunelu o wysokości 560 px (od Y=840 do Y=1400)
sec_normal = Image.new('RGB', (sec_w, t_h_upper + 130))
sec_normal.paste(t_upper_scaled, (0, 0))
sec_normal.paste(t_lower_scaled, (0, t_h_upper))

sec_flipped = Image.new('RGB', (sec_w, t_h_upper + 130))
sec_flipped.paste(t_upper_flip, (0, 0))
sec_flipped.paste(t_lower_flip, (0, t_h_upper))

# 3 sekcje tunelu z miękkim przenikaniem (blending)
tun_y = Y_MAIN - overlap  # 840
bg.paste(sec_normal, (0, tun_y))

mask_mid = Image.new('L', (sec_w, t_h_upper + 130), 255)
dm = ImageDraw.Draw(mask_mid)
for x in range(0, 200):
    dm.line([(x, 0), (x, t_h_upper + 130)], fill=int(255 * (x / 200)))
for x in range(sec_w - 200, sec_w):
    dm.line([(x, 0), (x, t_h_upper + 130)], fill=int(255 * (1.0 - (x - (sec_w - 200)) / 200)))
bg.paste(sec_flipped, (1400, tun_y), mask_mid)

mask_right = Image.new('L', (sec_w, t_h_upper + 130), 255)
dr = ImageDraw.Draw(mask_right)
for x in range(0, 250):
    dr.line([(x, 0), (x, t_h_upper + 130)], fill=int(255 * (x / 250)))
bg.paste(sec_normal, (W - sec_w, tun_y), mask_right)

# =========================================================================
# 3. GÓRNA HALA BOISKA (Y: 0 do 900 px)
# Wysokość 900 px - posadzka z kamiennych płyt i żelbetu leży DOKŁADNIE na Y = 900.
# Bez żadnego sztucznego pasma ani czarnego paska pod spodem!
# =========================================================================
hall_h = Y_MAIN  # 900 px

# Centrum hali (Wielki Piec) - szerokość 2050px, środek dokładnie na X=2200
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

# Cień kontaktowy wokół bramek
shadow_layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
sdraw = ImageDraw.Draw(shadow_layer)
sdraw.ellipse([190 - 180, 450 - 180, 190 + 180, 450 + 180], fill=(0, 0, 0, 220))
sdraw.ellipse([4210 - 180, 450 - 180, 4210 + 180, 450 + 180], fill=(0, 0, 0, 220))
shadow_layer = shadow_layer.filter(ImageFilter.GaussianBlur(16))
bg.paste(shadow_layer, (0, 0), shadow_layer)

bg.paste(conduit_cyan, (20, 280), conduit_cyan)
bg.paste(conduit_orange, (4040, 280), conduit_orange)

# =========================================================================
# 5. POŚWIATY WOLUMETRYCZNE (VOLUMETRIC LIGHTING)
# =========================================================================
glow = Image.new('RGB', (W, H), (0, 0, 0))
gdraw = ImageDraw.Draw(glow)

CX = 2200
# Ciepła łuna pieca w tle
gdraw.ellipse([CX - 450, 750 - 150, CX + 450, Y_MAIN + 80], fill=(235, 70, 10))
gdraw.ellipse([CX - 220, 750 - 80, CX + 220, 850], fill=(255, 150, 30))

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
print("Successfully generated seamless foundry_bg.png without floor strip and without ceiling fan!")
