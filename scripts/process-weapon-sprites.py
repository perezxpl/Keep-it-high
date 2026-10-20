import os
import sys
from PIL import Image

def process_sprite(input_path, output_path, bg_threshold=22, hole_threshold=25):
    if not os.path.exists(input_path):
        print(f"[ERROR] Input not found: {input_path}")
        return False

    rgba = Image.open(input_path).convert('RGBA')
    width, height = rgba.size
    pixels = rgba.load()

    # 1. Flood-fill from outer edges to remove solid black background
    from collections import deque
    visited = bytearray(width * height)
    queue = deque()

    for x in range(width):
        queue.append((x, 0))
        queue.append((x, height - 1))
    for y in range(height):
        queue.append((0, y))
        queue.append((width - 1, y))

    while queue:
        x, y = queue.popleft()
        idx = y * width + x
        if visited[idx]:
            continue
        visited[idx] = 1

        r, g, b, a = pixels[x, y]
        if max(r, g, b) <= bg_threshold:
            pixels[x, y] = (0, 0, 0, 0)
            if x > 0 and not visited[y * width + (x - 1)]:
                queue.append((x - 1, y))
            if x < width - 1 and not visited[y * width + (x + 1)]:
                queue.append((x + 1, y))
            if y > 0 and not visited[(y - 1) * width + x]:
                queue.append((x, y - 1))
            if y < height - 1 and not visited[(y + 1) * width + x]:
                queue.append((x, y + 1))

    # 2. Clear any enclosed black islands (like trigger guards or crossguard holes)
    # Check connected black components not touching the edges
    # Any pixel with max(r,g,b) <= hole_threshold and not belonging to weapon details
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            if a > 0 and max(r, g, b) <= hole_threshold:
                pixels[x, y] = (0, 0, 0, 0)

    # 3. Crop to content bounding box
    bbox = rgba.getbbox()
    if bbox:
        # Add 2px transparent padding
        x0, y0, x1, y1 = bbox
        x0 = max(0, x0 - 2)
        y0 = max(0, y0 - 2)
        x1 = min(width, x1 + 2)
        y1 = min(height, y1 + 2)
        cropped = rgba.crop((x0, y0, x1, y1))
    else:
        cropped = rgba

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    cropped.save(output_path, 'PNG')
    print(f"[OK] Saved {output_path} (size: {cropped.size})")
    return True

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print("Usage: python process-weapon-sprites.py <input> <output> [bg_thresh] [hole_thresh]")
        sys.exit(1)
    in_file = sys.argv[1]
    out_file = sys.argv[2]
    bg_t = int(sys.argv[3]) if len(sys.argv) > 3 else 22
    hole_t = int(sys.argv[4]) if len(sys.argv) > 4 else 25
    process_sprite(in_file, out_file, bg_t, hole_t)
