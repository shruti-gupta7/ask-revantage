from pathlib import Path
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase import pdfmetrics
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "demo-data" / "synthetic-hr-policy.pdf"
OUT.parent.mkdir(parents=True, exist_ok=True)
NAVY = colors.HexColor("#031730")
BRONZE = colors.HexColor("#8E695B")
BLUE = colors.HexColor("#4C759D")
TAN = colors.HexColor("#F2ECE8")
GRAY = colors.HexColor("#F1F1F1")
TEAL = colors.HexColor("#7DCCC7")
WHITE = colors.white

# Use widely available open fonts; these are PDF-only fallbacks, not new brand fonts.
serif = "/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf"
sans = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
sans_bold = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
if Path(serif).exists():
    pdfmetrics.registerFont(TTFont("PolicySerif", serif))
    pdfmetrics.registerFont(TTFont("PolicySans", sans))
    pdfmetrics.registerFont(TTFont("PolicySansBold", sans_bold))
    pdfmetrics.registerFontFamily("PolicySerif", normal="PolicySerif", bold="PolicySerif", italic="PolicySerif", boldItalic="PolicySerif")
    pdfmetrics.registerFontFamily("PolicySans", normal="PolicySans", bold="PolicySansBold", italic="PolicySans", boldItalic="PolicySansBold")
else:
    serif, sans, sans_bold = "Times-Roman", "Helvetica", "Helvetica-Bold"

styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name="PolicyTitle", fontName="Times-Roman", fontSize=28, leading=32, textColor=NAVY, spaceAfter=10))
styles.add(ParagraphStyle(name="PolicySubtitle", fontName="Helvetica", fontSize=10, leading=16, textColor=BLUE))
styles.add(ParagraphStyle(name="H1x", fontName="Times-Roman", fontSize=20, leading=24, textColor=NAVY, spaceBefore=7, spaceAfter=10))
styles.add(ParagraphStyle(name="H2x", fontName="Helvetica-Bold", fontSize=10, leading=14, textColor=BRONZE, spaceBefore=8, spaceAfter=5, uppercase=True))
styles.add(ParagraphStyle(name="Bodyx", fontName="Helvetica", fontSize=9.2, leading=15, textColor=NAVY, spaceAfter=7))
styles.add(ParagraphStyle(name="Smallx", fontName="Helvetica", fontSize=7.5, leading=11, textColor=BLUE))
styles.add(ParagraphStyle(name="Centerx", fontName="Helvetica-Bold", fontSize=9, leading=13, textColor=NAVY, alignment=TA_CENTER))
styles.add(ParagraphStyle(name="Calloutx", fontName="Helvetica", fontSize=8.5, leading=14, textColor=NAVY, borderColor=TEAL, borderWidth=1, borderPadding=10, backColor=TAN, spaceAfter=10))


def footer(canvas, doc):
    canvas.saveState()
    w, h = A4
    canvas.setFillColor(NAVY)
    canvas.rect(0, h-13*mm, w, 13*mm, fill=1, stroke=0)
    canvas.setFillColor(WHITE)
    canvas.setFont("Helvetica-Bold", 7)
    canvas.drawString(18*mm, h-8*mm, "ASK REVANTAGE | SYNTHETIC HR POLICY SAMPLE")
    canvas.setFillColor(BRONZE)
    canvas.rect(0, h-14*mm, w, 1*mm, fill=1, stroke=0)
    canvas.setFillColor(BLUE)
    canvas.setFont("Helvetica", 7)
    canvas.drawString(18*mm, 11*mm, "Fictional content for hackathon demonstration only - not a real company policy")
    canvas.drawRightString(w-18*mm, 11*mm, f"Page {doc.page}")
    canvas.setFillColor(colors.Color(3/255,23/255,48/255,alpha=.055))
    canvas.setFont("Helvetica-Bold", 28)
    canvas.translate(w/2, h/2)
    canvas.rotate(34)
    canvas.drawCentredString(0, 0, "SYNTHETIC DEMO - NOT A REAL POLICY")
    canvas.restoreState()


def bullet(text):
    return Paragraph(f"<bullet>&bull;</bullet>{text}", ParagraphStyle(name=f"b{abs(hash(text))}", parent=styles["Bodyx"], leftIndent=12, firstLineIndent=-8, bulletIndent=0, spaceAfter=5))

story = [Spacer(1, 20*mm)]
story += [Paragraph("SYNTHETIC DEMO DOCUMENT", styles["H2x"]), Paragraph("Example People Leave & Time Away Policy", styles["PolicyTitle"]), Paragraph("A fictional policy-format document created only to demonstrate Ask Revantage retrieval, citations and administration. It contains no real Revantage policy, employee, operational or confidential information.", styles["PolicySubtitle"]), Spacer(1, 11*mm)]
meta = [
    ["Document classification", "Synthetic / non-production"],
    ["Policy owner", "Sample People Operations Team"],
    ["Version", "0.1 Demo"],
    ["Effective date", "Not applicable - demonstration only"],
    ["Review cycle", "Fictional annual review"],
]
t = Table(meta, colWidths=[52*mm, 104*mm], hAlign="LEFT")
t.setStyle(TableStyle([
    ("FONTNAME",(0,0),(0,-1),"Helvetica-Bold"),
    ("FONTNAME",(1,0),(1,-1),"Helvetica"),
    ("FONTSIZE",(0,0),(-1,-1),8), ("TEXTCOLOR",(0,0),(-1,-1),NAVY),
    ("BACKGROUND",(0,0),(0,-1),TAN), ("GRID",(0,0),(-1,-1),.35,colors.Color(3/255,23/255,48/255,alpha=.18)),
    ("VALIGN",(0,0),(-1,-1),"MIDDLE"), ("TOPPADDING",(0,0),(-1,-1),7), ("BOTTOMPADDING",(0,0),(-1,-1),7),
    ("LEFTPADDING",(0,0),(-1,-1),8),
]))
story += [t, Spacer(1, 10*mm), Paragraph("Important", styles["H2x"]), Paragraph("This document deliberately uses invented rules and generic examples. It must not be used to make employment decisions or to infer any actual company policy. A production implementation must connect only to approved sources and preserve source permissions.", styles["Calloutx"]), PageBreak()]

story += [Paragraph("1. Purpose and scope", styles["H1x"]), Paragraph("This fictional template illustrates how a people policy could be structured for search and retrieval. It applies only to invented DemoCo employees used in the Ask Revantage prototype.", styles["Bodyx"]), Paragraph("2. Example leave categories", styles["H1x"])]
for text in [
    "Sample Annual Leave: a fictional allowance used to demonstrate balance and carry-forward questions.",
    "Sample Wellness Leave: an invented category for unplanned time away in demo scenarios.",
    "Sample Caregiver Leave: a fictional option used to test inclusive search language.",
    "Sample Public Holiday: an invented calendar entry with no relationship to a real office or jurisdiction.",
]: story.append(bullet(text))
story += [Paragraph("3. Illustrative request process", styles["H1x"]), Paragraph("The steps below are intentionally generic and do not describe a real workflow.", styles["Bodyx"])]
steps = [
    ["01", "Plan", "The demo employee reviews their fictional balance and sample team calendar."],
    ["02", "Request", "The demo employee submits a non-production request in the sample portal."],
    ["03", "Review", "A fictional manager reviews coverage and the invented policy conditions."],
    ["04", "Record", "The prototype updates a synthetic balance and confirmation timeline."],
]
st = Table(steps, colWidths=[13*mm, 29*mm, 114*mm], repeatRows=0)
st.setStyle(TableStyle([
    ("BACKGROUND",(0,0),(0,-1),NAVY), ("TEXTCOLOR",(0,0),(0,-1),WHITE),
    ("BACKGROUND",(1,0),(1,-1),TAN), ("TEXTCOLOR",(0,0),(-1,-1),NAVY),
    ("FONTNAME",(0,0),(1,-1),"Helvetica-Bold"),
    ("FONTNAME",(2,0),(2,-1),"Helvetica"),
    ("FONTSIZE",(0,0),(-1,-1),8), ("GRID",(0,0),(-1,-1),.35,colors.Color(3/255,23/255,48/255,alpha=.14)),
    ("VALIGN",(0,0),(-1,-1),"MIDDLE"), ("TOPPADDING",(0,0),(-1,-1),8), ("BOTTOMPADDING",(0,0),(-1,-1),8),
    ("LEFTPADDING",(0,0),(-1,-1),7),
]))
story += [st, Spacer(1, 7*mm), Paragraph("4. Fictional carry-forward example", styles["H1x"]), Paragraph("For retrieval testing only, this sample states that unused annual leave may be carried into the next demo period up to an invented cap of five sample days, with any exception sent to the Sample People Operations Team. This number is fabricated and is not a Revantage entitlement.", styles["Calloutx"]), PageBreak()]

story += [Paragraph("5. Responsibilities", styles["H1x"])]
resp = [
    [Paragraph("Demo employee", styles["Centerx"]), Paragraph("Uses fictional information, avoids personal data and validates that the interface shows a source.", styles["Smallx"])],
    [Paragraph("Sample manager", styles["Centerx"]), Paragraph("Reviews the invented request and keeps the scenario free from real team schedules or employee details.", styles["Smallx"])],
    [Paragraph("Knowledge admin", styles["Centerx"]), Paragraph("Marks every source synthetic, checks provenance and removes any content that could be real or confidential.", styles["Smallx"])],
    [Paragraph("Product team", styles["Centerx"]), Paragraph("Runs privacy, security and responsible-AI checks before any approved production pilot.", styles["Smallx"])],
]
rt = Table(resp, colWidths=[42*mm,114*mm])
rt.setStyle(TableStyle([("GRID",(0,0),(-1,-1),.4,colors.Color(3/255,23/255,48/255,alpha=.18)),("BACKGROUND",(0,0),(0,-1),TAN),("VALIGN",(0,0),(-1,-1),"MIDDLE"),("TOPPADDING",(0,0),(-1,-1),9),("BOTTOMPADDING",(0,0),(-1,-1),9),("LEFTPADDING",(0,0),(-1,-1),8),("RIGHTPADDING",(0,0),(-1,-1),8)]))
story += [rt, Spacer(1, 8*mm), Paragraph("6. Responsible AI and privacy", styles["H1x"])]
for text in [
    "Use only synthetic, anonymized, masked, scrubbed or approved non-production information.",
    "Do not enter names, email addresses, phone numbers, employee IDs, case details, credentials or production links.",
    "Show the source and confidence for each answer; route low-confidence questions to a person.",
    "Do not treat the assistant as the authority for employment, legal, medical, tax, finance or safety decisions.",
    "Evaluate grounding, privacy leakage, prompt injection, harmful content and access control before production use.",
]: story.append(bullet(text))
story += [Spacer(1,5*mm), Paragraph("End of synthetic sample", styles["H2x"]), Paragraph("Generated for the Ask Revantage hackathon prototype. The document is intentionally non-authoritative and contains no real Revantage policy data.", styles["Bodyx"])]

doc = SimpleDocTemplate(str(OUT), pagesize=A4, rightMargin=20*mm, leftMargin=20*mm, topMargin=22*mm, bottomMargin=20*mm, title="Synthetic HR Policy Sample - Ask Revantage", author="Ask Revantage Hackathon Team", subject="Synthetic non-production demonstration document")
doc.build(story, onFirstPage=footer, onLaterPages=footer)
print(OUT)
