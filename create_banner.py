#!/usr/bin/env python3
"""Create 3 professional banner versions for Second Nature Tree Service"""

from PIL import Image, ImageDraw, ImageFont, ImageFilter
import os

IMG_DIR = '/Users/dougbrown/Desktop/second-nature-tree/images'

BANNER_W = 1920
BANNER_H = 600

# Two hero images
IMG1 = 'dead-tree-removal-bucket-truck-lewisboro.jpg'  # Fall colors, bucket truck
IMG2 = 'big-fell.jpg'                                   # Action shot, tree falling

# --- Font setup ---
bold_font_paths = [
    '/Library/Fonts/Arial Bold.ttf',
    '/System/Library/Fonts/Supplemental/Arial Bold.ttf',
    '/System/Library/Fonts/Helvetica.ttc',
    '/System/Library/Fonts/HelveticaNeue.ttc',
]
regular_font_paths = [
    '/Library/Fonts/Arial.ttf',
    '/System/Library/Fonts/Supplemental/Arial.ttf',
    '/System/Library/Fonts/Helvetica.ttc',
    '/System/Library/Fonts/HelveticaNeue.ttc',
]

font_large = font_medium_bold = font_medium = font_small = None
for fp in bold_font_paths:
    if os.path.exists(fp):
        try:
            font_large = ImageFont.truetype(fp, 76)
            font_medium_bold = ImageFont.truetype(fp, 34)
            break
        except:
            continue
for fp in regular_font_paths:
    if os.path.exists(fp):
        try:
            font_medium = ImageFont.truetype(fp, 32)
            font_small = ImageFont.truetype(fp, 26)
            break
        except:
            continue
if font_large is None:
    font_large = ImageFont.load_default()
if font_medium is None:
    font_medium = font_large
    font_medium_bold = font_large
if font_small is None:
    font_small = font_medium

accent_color = (34, 139, 34)  # Forest green

def draw_text_with_shadow(draw, pos, text, fill, font, shadow_offset=3):
    x, y = pos
    draw.text((x + shadow_offset, y + shadow_offset), text, fill=(0, 0, 0), font=font)
    draw.text((x + shadow_offset-1, y + shadow_offset-1), text, fill=(0, 0, 0, 180), font=font)
    draw.text((x, y), text, fill=fill, font=font)

def crop_fill(img, target_w, target_h, bias_top=0.3):
    """Crop and resize image to fill target dimensions"""
    img_ratio = img.width / img.height
    target_ratio = target_w / target_h
    if img_ratio > target_ratio:
        new_w = int(img.height * target_ratio)
        left = (img.width - new_w) // 2
        img = img.crop((left, 0, left + new_w, img.height))
    else:
        new_h = int(img.width / target_ratio)
        top = int((img.height - new_h) * bias_top)
        img = img.crop((0, top, img.width, top + new_h))
    return img.resize((target_w, target_h), Image.LANCZOS)

def add_overlay_and_text(banner):
    """Add dark gradient overlay and text to banner"""
    overlay = Image.new('RGBA', (BANNER_W, BANNER_H), (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)

    # Left-heavy gradient
    for x in range(BANNER_W):
        if x < BANNER_W * 0.5:
            alpha = int(200 - (x / (BANNER_W * 0.5)) * 60)
        elif x < BANNER_W * 0.7:
            progress = (x - BANNER_W * 0.5) / (BANNER_W * 0.2)
            alpha = int(140 - progress * 80)
        else:
            alpha = int(60 - ((x - BANNER_W * 0.7) / (BANNER_W * 0.3)) * 30)
        alpha = max(25, min(210, alpha))
        d.line([(x, 0), (x, BANNER_H)], fill=(0, 0, 0, alpha))

    banner = banner.convert('RGBA')
    banner = Image.alpha_composite(banner, overlay)
    banner = banner.convert('RGB')

    draw = ImageDraw.Draw(banner)

    text_x = 80
    text_y = 130

    # Green accent line
    draw.rectangle([text_x, text_y - 20, text_x + 6, text_y + 290], fill=accent_color)

    # Title
    draw_text_with_shadow(draw, (text_x + 30, text_y), "SECOND NATURE", 'white', font_large, 3)
    draw_text_with_shadow(draw, (text_x + 30, text_y + 85), "TREE SERVICE", 'white', font_large, 3)

    # Tagline
    draw_text_with_shadow(draw, (text_x + 34, text_y + 185), "Professional Tree Care | Westchester & Hudson Valley", (220, 220, 220), font_medium, 2)

    # CTA
    cta_y = text_y + 240
    draw.rectangle([text_x + 30, cta_y, text_x + 680, cta_y + 48], fill=accent_color)
    draw.text((text_x + 50, cta_y + 8), "Fill out a request form at peekskilltree.com", fill='white', font=font_medium_bold)

    # Bottom accent
    draw.rectangle([0, BANNER_H - 4, BANNER_W, BANNER_H], fill=accent_color)

    return banner

# ============================================================
# VERSION 1: Fall colors - dead tree removal with bucket truck
# ============================================================
img1 = Image.open(os.path.join(IMG_DIR, IMG1))
v1 = crop_fill(img1, BANNER_W, BANNER_H, bias_top=0.2)
v1 = add_overlay_and_text(v1)
v1.save(os.path.join(IMG_DIR, 'banner-v1-fall-colors.jpg'), 'JPEG', quality=92)
print('Version 1 saved: banner-v1-fall-colors.jpg (fall tree removal)')

# ============================================================
# VERSION 2: Action shot - big tree falling
# ============================================================
img2 = Image.open(os.path.join(IMG_DIR, IMG2))
v2 = crop_fill(img2, BANNER_W, BANNER_H, bias_top=0.3)
v2 = add_overlay_and_text(v2)
v2.save(os.path.join(IMG_DIR, 'banner-v2-action-shot.jpg'), 'JPEG', quality=92)
print('Version 2 saved: banner-v2-action-shot.jpg (tree felling action)')

# ============================================================
# VERSION 3: Split - fall colors left, action shot right
# ============================================================
v3 = Image.new('RGB', (BANNER_W, BANNER_H), (0, 0, 0))

# Left half: fall colors image
left_img = crop_fill(Image.open(os.path.join(IMG_DIR, IMG1)), BANNER_W // 2, BANNER_H, bias_top=0.2)
v3.paste(left_img, (0, 0))

# Right half: action shot
right_img = crop_fill(Image.open(os.path.join(IMG_DIR, IMG2)), BANNER_W // 2, BANNER_H, bias_top=0.3)
v3.paste(right_img, (BANNER_W // 2, 0))

# Thin divider line
div_draw = ImageDraw.Draw(v3)
div_draw.rectangle([BANNER_W // 2 - 2, 0, BANNER_W // 2 + 2, BANNER_H], fill=accent_color)

v3 = add_overlay_and_text(v3)
v3.save(os.path.join(IMG_DIR, 'banner-v3-split.jpg'), 'JPEG', quality=92)
print('Version 3 saved: banner-v3-split.jpg (split: fall + action)')

# ============================================================
# Also create sized versions for each
# ============================================================
for suffix, src in [('v1-fall-colors', v1), ('v2-action-shot', v2), ('v3-split', v3)]:
    # Facebook cover (820x312)
    fb = src.resize((820, 312), Image.LANCZOS)
    fb.save(os.path.join(IMG_DIR, f'banner-{suffix}-facebook.jpg'), 'JPEG', quality=92)

    # YouTube banner (2560x1440)
    yt = Image.new('RGB', (2560, 1440), (15, 15, 15))
    yt_resized = src.resize((2560, 800), Image.LANCZOS)
    yt.paste(yt_resized, (0, 320))
    yt.save(os.path.join(IMG_DIR, f'banner-{suffix}-youtube.jpg'), 'JPEG', quality=92)

print('\nAll 3 versions created with Facebook + YouTube sizes each (9 files total)')
