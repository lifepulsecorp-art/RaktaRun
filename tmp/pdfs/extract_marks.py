from PIL import Image
from pathlib import Path
src = Image.open('tmp/pdfs/source_300.png').convert('RGB')
# Crop the existing handwritten signature and company seal from the source certificate.
src.crop((250, 2460, 620, 2585)).save('tmp/pdfs/signature.png', dpi=(300, 300))
src.crop((1740, 2510, 2080, 2855)).save('tmp/pdfs/seal.png', dpi=(300, 300))
