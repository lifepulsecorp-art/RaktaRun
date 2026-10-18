from PIL import Image
source = Image.open(r'C:\Users\HP\AppData\Local\Temp\codex-clipboard-7d6cef46-dd42-4d77-b26f-5b8a49473f52.png').convert('RGB')
bounds = source.convert('L').point(lambda value: 255 if value > 35 else 0).getbbox()
crop = source.crop(bounds)
w, h = crop.size
rgba = Image.new('RGBA', crop.size)
pixels = []
for y in range(h):
    for x in range(w):
        r, g, b = crop.getpixel((x, y))
        luminance = (r * 299 + g * 587 + b * 114) // 1000
        alpha = max(0, min(255, round((luminance - 17) * 255 / 238)))
        color = (178, 138, 66) if y + bounds[1] >= 110 else (23, 43, 77)
        pixels.append((*color, alpha))
rgba.putdata(pixels)
rgba.save('tmp/pdfs/schmiede_logo_blended.png')
print('bounds', bounds, 'output', rgba.size)
