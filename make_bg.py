import math, random
from collections import deque
from PIL import Image, ImageDraw, ImageFilter

W, H = 4400, 1400
img = Image.new('RGB', (W, H), color='#060910')
draw = ImageDraw.Draw(img)

# 1. Gradient tła
for y in range(H):
    fy = y / H
    r = int(6 + (fy ** 2.2) * 110)
    g = int(9 + (fy ** 2.2) * 32)
    b = int(15 + (fy ** 2.2) * 10)
    draw.line([(0, y), (W, y)], fill=(r, g, b))

# 2. Architektura i instalacje
random.seed(4400)
for i in range(65):
    col_x = random.randint(30, W - 30)
    col_w = random.randint(50, 140)
    shade = random.randint(11, 22)
    draw.rectangle([col_x, 0, col_x + col_w, H], fill=(shade, shade + 2, shade + 4))
    draw.line([col_x, 0, col_x, H], fill=(shade - 5, shade - 5, shade - 5), width=2)
    draw.line([col_x + col_w, 0, col_x + col_w, H], fill=(shade + 5, shade + 5, shade + 5), width=2)

for py in [160, 360, 580, 780, 1080]:
    draw.rectangle([0, py, W, py + 24], fill='#131a24')
    draw.line([(0, py + 2), (W, py + 2)], fill='#253245', width=3)
    draw.line([(0, py + 22), (W, py + 22)], fill='#080c12', width=2)
    for px in range(80, W, 260):
        draw.rectangle([px - 5, py - 4, px + 5, py + 28], fill='#303e52')

for y_truss in [80, 400]:
    draw.rectangle([0, y_truss, W, y_truss + 20], fill='#0f151f')
    draw.line([(0, y_truss), (W, y_truss)], fill='#1c2636', width=2)
    for x in range(0, W, 90):
        draw.line([(x, y_truss), (x + 90, y_truss + 20)], fill='#080c12', width=2)
        draw.line([(x + 90, y_truss), (x, y_truss + 20)], fill='#080c12', width=2)

# 3. Szyb wentylatora (otwarty)
fan_cx, fan_cy = W // 2, 220
fan_r = 210
draw.ellipse([fan_cx - fan_r, fan_cy - fan_r, fan_cx + fan_r, fan_cy + fan_r], fill='#020407', outline='#1a2433', width=16)
for ir in [70, 135, 195]:
    draw.ellipse([fan_cx - ir, fan_cy - ir, fan_cx + ir, fan_cy + ir], outline='#0e1520', width=4)
for ang_deg in range(0, 360, 45):
    rad = math.radians(ang_deg)
    ex = fan_cx + math.cos(rad) * fan_r
    ey = fan_cy + math.sin(rad) * fan_r
    draw.line([(fan_cx, fan_cy), (ex, ey)], fill='#1a2433', width=4)
draw.ellipse([fan_cx - 40, fan_cy - 40, fan_cx + 40, fan_cy + 40], fill='#080c14', outline='#2d3b4e', width=6)
draw.ellipse([fan_cx - 15, fan_cy - 15, fan_cx + 15, fan_cy + 15], fill='#161e2a')

# 4. Kotwy stropowe pod łańcuchy
for ax in [500, 750, 1100, 1400, 1750, 2650, 3000, 3300, 3650, 3900]:
    draw.rectangle([ax - 28, 0, ax + 28, 34], fill='#19202a', outline='#2d3748', width=2)
    draw.ellipse([ax - 12, 28, ax + 12, 54], outline='#55657d', width=4)
    draw.line([(ax, 14), (ax, 42)], fill='#3c4a5e', width=4)

# 5. Podłogi i dolny tunel
Y_MAIN = 900
Y_SLAB_BOT = 970
Y_TUNNEL_FLR = 1270

draw.rectangle([0, 0, 160, H], fill='#090d15', outline='#17202e', width=3)
draw.rectangle([W - 160, 0, W, H], fill='#090d15', outline='#17202e', width=3)
draw.rectangle([160, Y_SLAB_BOT, W - 160, Y_TUNNEL_FLR], fill='#05070c')

for tx in range(200, W - 200, 120):
    draw.rectangle([tx - 8, Y_SLAB_BOT, tx + 8, Y_SLAB_BOT + 24], fill='#1e2736')
    draw.line([(tx, Y_SLAB_BOT + 24), (tx, Y_TUNNEL_FLR)], fill='#101620', width=2)

draw.rectangle([0, Y_TUNNEL_FLR, W, H], fill='#080b10', outline='#1a222f', width=3)
draw.rectangle([0, Y_TUNNEL_FLR, W, Y_TUNNEL_FLR + 14], fill='#161d28')

for belt_x1, belt_x2 in [(350, 1850), (2550, 4050)]:
    draw.rectangle([belt_x1, Y_TUNNEL_FLR - 10, belt_x2, Y_TUNNEL_FLR], fill='#0d121a', outline='#2a3545', width=2)
    for rx in range(belt_x1 + 20, belt_x2, 45):
        draw.ellipse([rx - 6, Y_TUNNEL_FLR - 8, rx + 6, Y_TUNNEL_FLR - 2], fill='#3b4759')

def draw_slab_segment(x1, x2):
    draw.rectangle([x1, Y_MAIN, x2, Y_SLAB_BOT], fill='#0e141f', outline='#1f2b3a', width=3)
    draw.rectangle([x1, Y_MAIN, x2, Y_MAIN + 10], fill='#1c2635')
    draw.line([(x1, Y_MAIN), (x2, Y_MAIN)], fill='#3b4c63', width=2)
    for nx in range(x1 + 30, x2 - 20, 50):
        draw.ellipse([nx, Y_MAIN + 3, nx + 4, Y_MAIN + 7], fill='#556780')

# Podłoga solidna pod wlotami tuneli i na korcie
draw_slab_segment(0, 780)
draw_slab_segment(920, 1850)
draw_slab_segment(2550, 3480)
draw_slab_segment(3620, 4400)

for hx1, hx2 in [(780, 920), (3480, 3620)]:
    draw.rectangle([hx1, Y_MAIN, hx2, Y_MAIN + 8], fill='#0a0e16', outline='#334155', width=2)
    for gx in range(hx1 + 10, hx2, 16):
        draw.line([(gx, Y_MAIN), (gx, Y_MAIN + 8)], fill='#475569', width=2)

# Drabiny do dolnego tunelu
for lx in [440, 3960]:
    draw.line([(lx - 12, Y_MAIN), (lx - 12, Y_TUNNEL_FLR)], fill='#334155', width=3)
    draw.line([(lx + 12, Y_MAIN), (lx + 12, Y_TUNNEL_FLR)], fill='#334155', width=3)
    for ly in range(Y_MAIN + 15, Y_TUNNEL_FLR, 22):
        draw.line([(lx - 12, ly), (lx + 12, ly)], fill='#475569', width=2)

for r1, r2 in [(1000, 1800), (2600, 3400)]:
    draw.line([(r1, Y_MAIN - 2), (r2, Y_MAIN - 2)], fill='#3b4c63', width=3)
    for sx in range(r1, r2, 35):
        draw.rectangle([sx, Y_MAIN - 4, sx + 12, Y_MAIN], fill='#1f2b3a')
    for obx in [r1, r2]:
        draw.rectangle([obx - 6, Y_MAIN - 15, obx + 6, Y_MAIN], fill='#0f1622', outline='#475569', width=1)
        draw.rectangle([obx - 4, Y_MAIN - 15, obx + 4, Y_MAIN - 12], fill='#eab308')

# 6. Centralny piec i rampa
CX = W // 2
ramp_top = Y_MAIN - 100
draw.polygon([(1850, Y_MAIN), (1980, ramp_top), (1980, Y_MAIN)], fill='#0b0f16')
draw.polygon([(2420, ramp_top), (2550, Y_MAIN), (2420, Y_MAIN)], fill='#0b0f16')
draw.line([(1850, Y_MAIN), (1980, ramp_top)], fill='#334155', width=6)
draw.line([(1850, Y_MAIN - 1), (1980, ramp_top - 1)], fill='#64748b', width=2)
draw.line([(2420, ramp_top), (2550, Y_MAIN)], fill='#334155', width=6)
draw.line([(2420, ramp_top - 1), (2550, Y_MAIN - 1)], fill='#64748b', width=2)

draw.rectangle([1980, ramp_top, 2420, Y_MAIN + 80], fill='#070a10')
for p_left in [1970, 2385]:
    draw.rectangle([p_left, ramp_top - 30, p_left + 45, Y_MAIN + 80], fill='#151d28', outline='#2d3b4e', width=2)

ladle_w_top, ladle_w_bot = 220, 160
ladle_top_y, ladle_bot_y = ramp_top - 20, Y_MAIN + 60
draw.polygon([(CX - ladle_w_top//2, ladle_top_y + 15), (CX + ladle_w_top//2, ladle_top_y + 15), (CX + ladle_w_bot//2, ladle_bot_y), (CX - ladle_w_bot//2, ladle_bot_y)], fill='#10151f', outline='#2d3848')

for trun_x in [CX - ladle_w_top//2 - 28, CX + ladle_w_top//2 + 6]:
    draw.rectangle([trun_x, ladle_top_y + 35, trun_x + 22, ladle_top_y + 65], fill='#252e3d', outline='#475569', width=2)
    draw.ellipse([trun_x + 2, ladle_top_y + 40, trun_x + 20, ladle_top_y + 60], fill='#080c14', outline='#6b7c96', width=2)

for cyl_x in [2010, 2390]:
    draw.line([(cyl_x, Y_MAIN + 40), (cyl_x - 18 if cyl_x < CX else cyl_x + 18, ladle_top_y + 55)], fill='#414f63', width=8)

collar_w, collar_h = ladle_w_top + 20, 48
draw.ellipse([CX - collar_w//2, ladle_top_y, CX + collar_w//2, ladle_top_y + collar_h], fill='#1a212d', outline='#374659', width=5)

lava_w, lava_h = collar_w - 28, collar_h - 16
draw.ellipse([CX - lava_w//2, ladle_top_y + 8, CX + lava_w//2, ladle_top_y + 8 + lava_h], fill='#c2410c', outline='#ea580c', width=2)
draw.ellipse([CX - (lava_w - 40)//2, ladle_top_y + 12, CX + (lava_w - 40)//2, ladle_top_y + 12 + lava_h - 10], fill='#f97316')
draw.ellipse([CX - (lava_w - 90)//2, ladle_top_y + 16, CX + (lava_w - 90)//2, ladle_top_y + 16 + lava_h - 16], fill='#fef08a')

draw.polygon([(CX - 24, ladle_top_y + 35), (CX + 24, ladle_top_y + 35), (CX + 16, ladle_top_y + 90), (CX - 16, ladle_top_y + 90)], fill='#171d26', outline='#354354', width=2)
draw.polygon([(CX - 12, ladle_top_y + 40), (CX + 12, ladle_top_y + 40), (CX + 8, Y_TUNNEL_FLR), (CX - 8, Y_TUNNEL_FLR)], fill='#ea580c')
draw.polygon([(CX - 5, ladle_top_y + 40), (CX + 5, ladle_top_y + 40), (CX + 3, Y_TUNNEL_FLR), (CX - 3, Y_TUNNEL_FLR)], fill='#fef08a')

# 7. PRZEMYSŁOWE DZIURY W ŚCIANIE (CIRCULAR WALL CONDUIT HOLES)
def make_circular_conduit(im_path, r_outer=425, feather=14, rotate_deg=0, flip_vertical=False):
    im = Image.open(im_path).convert('RGBA')
    if rotate_deg != 0:
        im = im.rotate(rotate_deg)
    if flip_vertical:
        im = im.transpose(Image.FLIP_TOP_BOTTOM)
    w, h = im.size
    cx, cy = w // 2, h // 2
    
    mask = Image.new('L', (w, h), 0)
    dm = ImageDraw.Draw(mask)
    dm.ellipse([cx - r_outer, cy - r_outer, cx + r_outer, cy + r_outer], fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(feather))
    
    im.putalpha(mask)
    crop_box = (cx - r_outer - 15, cy - r_outer - 15, cx + r_outer + 15, cy + r_outer + 15)
    return im.crop(crop_box)

circle_cyan = make_circular_conduit('assets/hole_cyan.jpg', r_outer=425, feather=14, rotate_deg=180, flip_vertical=True)
circle_orange = make_circular_conduit('assets/hole_orange.jpg', r_outer=425, feather=14, rotate_deg=0)

HOLE_DIAMETER = 340
HOLE_Y = (Y_MAIN - HOLE_DIAMETER) // 2  # (900 - 340) // 2 = 280 (centralnie między sufitem Y=0 a płytą Y=900)

scaled_cyan_hole = circle_cyan.resize((HOLE_DIAMETER, HOLE_DIAMETER), Image.Resampling.LANCZOS)
scaled_orange_hole = circle_orange.resize((HOLE_DIAMETER, HOLE_DIAMETER), Image.Resampling.LANCZOS)

CYAN_HOLE_X = 20
ORANGE_HOLE_X = W - HOLE_DIAMETER - 20

img.paste(scaled_cyan_hole, (CYAN_HOLE_X, HOLE_Y), scaled_cyan_hole)
img.paste(scaled_orange_hole, (ORANGE_HOLE_X, HOLE_Y), scaled_orange_hole)

# 8. Rozmycie światła wolumetrycznego
glow = Image.new('RGB', (W, H), (0, 0, 0))
glow_draw = ImageDraw.Draw(glow)
glow_draw.ellipse([CX - 650, ladle_top_y - 200, CX + 650, Y_MAIN + 250], fill=(240, 75, 0))
glow_draw.ellipse([CX - 280, ladle_top_y - 90, CX + 280, ladle_top_y + 160], fill=(255, 175, 35))
glow_draw.rectangle([CX - 120, ladle_top_y, CX + 120, Y_TUNNEL_FLR], fill=(215, 55, 0))

# Poświata z głębi tuneli w ścianie (Cyan w lewo, Orange w prawo)
glow_draw.ellipse([CYAN_HOLE_X + 40, HOLE_Y + 70, CYAN_HOLE_X + 220, HOLE_Y + 250], fill=(0, 180, 255))
glow_draw.ellipse([CYAN_HOLE_X + 70, HOLE_Y + 100, CYAN_HOLE_X + 180, HOLE_Y + 220], fill=(160, 245, 255))

glow_draw.ellipse([ORANGE_HOLE_X + 120, HOLE_Y + 70, ORANGE_HOLE_X + 300, HOLE_Y + 250], fill=(255, 110, 10))
glow_draw.ellipse([ORANGE_HOLE_X + 160, HOLE_Y + 100, ORANGE_HOLE_X + 270, HOLE_Y + 220], fill=(255, 205, 60))

glow = glow.filter(ImageFilter.GaussianBlur(60))
final_img = Image.blend(img, glow, 0.40)
final_img.save('foundry_bg.png', format='PNG')
print("Successfully generated foundry_bg.png with circular wall conduit holes.")
