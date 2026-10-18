from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.colors import HexColor, white
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Paragraph
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_JUSTIFY
from PIL import Image
from pathlib import Path

out = Path('output/pdf/Schmiede_Internship_Certificate_Ashish_M_Draft.pdf')
W, H = A4
navy = HexColor('#172B4D')
gold = HexColor('#B28A42')
ink = HexColor('#252525')
muted = HexColor('#555F6D')
pdfmetrics.registerFont(TTFont('Georgia', r'C:\Windows\Fonts\georgia.ttf'))
pdfmetrics.registerFont(TTFont('Georgia-Bold', r'C:\Windows\Fonts\georgiab.ttf'))
pdfmetrics.registerFont(TTFont('Arial', r'C:\Windows\Fonts\arial.ttf'))
pdfmetrics.registerFont(TTFont('Arial-Bold', r'C:\Windows\Fonts\arialbd.ttf'))

c = canvas.Canvas(str(out), pagesize=A4, pageCompression=1)
c.setTitle('Internship Certificate - Mr. Ashish M - Draft')
c.setAuthor('SCHMIEDE India Pvt. Ltd.')
c.setSubject('Internship completion certificate')
c.setFillColor(white)
c.rect(0, 0, W, H, stroke=0, fill=1)

# Faint SCHMIEDE logo watermark behind the main body copy.
logo = Image.open('tmp/pdfs/schmiede_logo_blended.png').convert('RGBA')
alpha = logo.getchannel('A').point(lambda value: int(value * 0.14))
logo.putalpha(alpha)
watermark_path = Path('tmp/pdfs/schmiede_logo_watermark.png')
logo.save(watermark_path)
c.drawImage(str(watermark_path), (W-300)/2, 399, width=300, height=72,
            preserveAspectRatio=True, mask='auto')

# Clean company letterhead, using only organization details present in the source.
c.drawImage('tmp/pdfs/schmiede_logo_blended.png', 58, H-94, width=160, height=38.4, preserveAspectRatio=True, anchor='c', mask='auto')
info_x = W-58
c.setFillColor(navy)
c.setFont('Arial-Bold', 9.4)
c.drawRightString(info_x, H-57, 'SCHMIEDE India Pvt. Ltd.')
c.setFillColor(muted)
c.setFont('Arial', 8.6)
c.drawRightString(info_x, H-72, 'M.H. Plaza, Thumbe, Mangalore')
c.drawRightString(info_x, H-87, 'Karnataka 574143')
c.setStrokeColor(navy)
c.setLineWidth(0.65)
c.line(W-239, H-102, W-239, H-50)
c.setStrokeColor(gold)
c.setLineWidth(0.8)
c.line(58, H-115, W-58, H-115)

# Issue date. The certificate reference was removed at the user's request.
c.setFillColor(ink)
c.setFont('Georgia', 10.5)
body_x, body_width = 91, W-182
c.drawString(body_x, H-248, 'Date: 21 February 2026')

# Formal letter-style heading.
heading = 'TO WHOMSOEVER IT MAY CONCERN'
c.setFillColor(ink)
c.setFont('Georgia-Bold', 14)
c.drawCentredString(W/2, H-296, heading)
heading_width = pdfmetrics.stringWidth(heading, 'Georgia-Bold', 14)
c.setStrokeColor(ink)
c.setLineWidth(0.75)
c.line((W-heading_width)/2, H-300, (W+heading_width)/2, H-300)

body_style = ParagraphStyle(
    'CertificateBody', fontName='Georgia', fontSize=11.3, leading=18.8,
    textColor=ink, alignment=0, firstLineIndent=0,
    spaceAfter=14, allowWidows=0, allowOrphans=0,
)
cursor_y = H-332
paragraphs = [
    'This is to certify that <b>Mr. Ashish M</b> has successfully completed an internship as a <b>Data Analyst Intern</b> at SCHMIEDE from 21 January 2026 to 21 February 2026.',
    'During this period, he demonstrated initiative, a positive attitude, and good discipline. He completed assigned tasks within the expected time frame and developed skills in his field.',
    'We wish him every success in his future endeavors.',
]
for text in paragraphs:
    para = Paragraph(text, body_style)
    _, height = para.wrap(body_width, H)
    para.drawOn(c, body_x, cursor_y-height)
    cursor_y -= height + body_style.spaceAfter

# Leave a genuinely blank signature line for an authorised company signatory.
sign_x = body_x + 2
sign_y = 194
c.setFillColor(ink)
c.setFont('Georgia', 10.5)
c.drawString(sign_x, sign_y+48, 'For SCHMIEDE India Pvt. Ltd.')
c.setStrokeColor(ink)
c.setLineWidth(0.7)
c.line(sign_x, sign_y+12, sign_x+148, sign_y+12)
c.setFillColor(ink)
c.setFont('Georgia', 9.5)
c.drawString(sign_x, sign_y-4, 'Authorised Signatory')

# Work address and contact details in a compact, print-safe footer.
c.setStrokeColor(HexColor('#C8CDD4'))
c.setLineWidth(0.55)
c.line(58, 116, W-58, 116)
c.setFillColor(muted)
c.setFont('Arial', 7.0)
c.drawCentredString(W/2, 98, 'M.H. Plaza, Thumbe, Mangalore, Karnataka 574143')
c.drawCentredString(W/2, 84, 'Contact: +91 81975 55477  |  foundersoffice@schmiedeyourway.com  |  www.schmiedeyourway.com')
c.drawCentredString(W/2, 70, 'GSTIN: 29GGUPR9542G1ZB  |  Manufactured by Bioxent Health and Nutrition Pvt. Ltd.')
c.drawCentredString(W/2, 56, 'ISO 9001:2015 & GMP certified production')

# Clearly identify this unsigned document as a review draft, below the
# signatory block and above the footer so it does not cross the certificate text.
c.saveState()
c.setFillColor(HexColor('#9AA3AE'))
c.setFont('Arial-Bold', 8.5)
c.drawCentredString(W/2, 145, 'DRAFT - FOR COMPANY REVIEW')
c.restoreState()

c.showPage()
c.save()
print(out.resolve())



