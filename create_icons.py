#!/usr/bin/env python3
from PIL import Image, ImageDraw, ImageFont
import os

sizes = [48, 128, 256, 512]
base_dir = '/Users/filipihadji/Documents/Designer Brasil /Mosca Tee/mosca-tee-_-editor-de-design-online-grátis---200/flatpak/icons'

# Color scheme
bg_color = (51, 102, 102)  # Dark teal
text_color = (255, 255, 255)  # White
accent_color = (255, 153, 51)  # Orange

for size in sizes:
    # Create image
    img = Image.new('RGBA', (size, size), bg_color + (255,))
    draw = ImageDraw.Draw(img)
    
    # Try to use a nice font, fallback to default
    try:
        font_size = int(size * 0.45)
        font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", font_size)
    except:
        font = ImageFont.load_default()
    
    # Draw a circle accent
    accent_radius = int(size * 0.35)
    bbox = [
        size // 2 - accent_radius,
        size // 2 - accent_radius,
        size // 2 + accent_radius,
        size // 2 + accent_radius
    ]
    draw.ellipse(bbox, fill=accent_color)
    
    # Draw text "MT"
    text = "MT"
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    
    x = (size - text_width) // 2
    y = (size - text_height) // 2 - int(size * 0.05)
    
    draw.text((x, y), text, fill=bg_color, font=font)
    
    # Save
    filename = f'{base_dir}/com.moscatee.Editor-{size}x{size}.png'
    img.save(filename)
    print(f'Created {filename}')

print('Icons created successfully!')
