#!/usr/bin/env python3
"""Generate public/resume.pdf — Pujan Banik Arnab's real résumé (ATS-safe).

Source of truth: owner's CV (uploaded Oct 2026). Content is verbatim-faithful;
wording lightly normalized for ATS parseability. Style per pdf skill
briefs/resume.md: single column, FreeSerif, 1.5 cm margins, accent from
palette.cascade, min font 9.5pt, language-aware line breaking.

Re-run after edits: pnpm resume   (tooling/scripts/make-resume.py)
"""
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.lib.colors import HexColor
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_CENTER
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, HRFlowable, KeepTogether,
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily
import os

# ── Fonts (per configs/fonts.md) ──
FREE = "/usr/share/fonts/truetype/freefont"
pdfmetrics.registerFont(TTFont("FreeSerif", f"{FREE}/FreeSerif.ttf"))
pdfmetrics.registerFont(TTFont("FreeSerif-Bold", f"{FREE}/FreeSerifBold.ttf"))
pdfmetrics.registerFont(TTFont("FreeSerif-Italic", f"{FREE}/FreeSerifItalic.ttf"))
pdfmetrics.registerFont(TTFont("FreeSerif-BoldItalic", f"{FREE}/FreeSerifBoldItalic.ttf"))
registerFontFamily("FreeSerif", normal="FreeSerif", bold="FreeSerif-Bold",
                   italic="FreeSerif-Italic", boldItalic="FreeSerif-BoldItalic")

# ── Palette (pdf.py palette.cascade, mode=minimal) ──
ACCENT = HexColor("#897129")
TEXT_PRIMARY = HexColor("#1b1a18")
TEXT_MUTED = HexColor("#6e6b64")   # darkened from #87847d for print contrast
BORDER = HexColor("#d2cfc5")

# ── Styles ──
name_style = ParagraphStyle("name", fontName="FreeSerif", fontSize=24, leading=28,
                            alignment=TA_CENTER, textColor=TEXT_PRIMARY, spaceAfter=2)
role_style = ParagraphStyle("role", fontName="FreeSerif", fontSize=11.5, leading=15,
                            alignment=TA_CENTER, textColor=TEXT_MUTED, spaceAfter=2)
contact_style = ParagraphStyle("contact", fontName="FreeSerif", fontSize=10, leading=14,
                               alignment=TA_CENTER, textColor=TEXT_MUTED, spaceAfter=6)
section_title = ParagraphStyle("sectitle", fontName="FreeSerif", fontSize=13, leading=16,
                               spaceBefore=12, spaceAfter=4, textColor=ACCENT)
job_title = ParagraphStyle("jobtitle", fontName="FreeSerif", fontSize=11, leading=14,
                           spaceBefore=6, spaceAfter=1, textColor=TEXT_PRIMARY)
job_meta = ParagraphStyle("jobmeta", fontName="FreeSerif", fontSize=10, leading=13,
                          textColor=TEXT_MUTED, spaceAfter=4)
bullet = ParagraphStyle("bullet", fontName="FreeSerif", fontSize=10, leading=14,
                        leftIndent=14, bulletIndent=2, spaceBefore=1, spaceAfter=1,
                        textColor=TEXT_PRIMARY, allowWidows=0, allowOrphans=0)
body = ParagraphStyle("body", fontName="FreeSerif", fontSize=10, leading=14,
                      spaceAfter=2, textColor=TEXT_PRIMARY)

def sect(title):
    return [
        Paragraph(f"<b>{title}</b>", section_title),
        HRFlowable(width="100%", thickness=0.8, color=ACCENT, spaceBefore=0, spaceAfter=6),
    ]

def entry(title, meta, bullets):
    meta = meta.replace("  |  ", "&nbsp; | &nbsp;")  # keep pipes visually spaced
    parts = [Paragraph(f"<b>{title}</b>", job_title), Paragraph(meta, job_meta)]
    return KeepTogether(parts + [Paragraph(f"\u2022 {b}", bullet) for b in bullets])

OUT = "/home/z/my-project/apps/web/public/resume.pdf"
doc = SimpleDocTemplate(
    OUT, pagesize=A4,
    leftMargin=1.5 * cm, rightMargin=1.5 * cm, topMargin=1.5 * cm, bottomMargin=1.5 * cm,
    title="Pujan Banik Arnab — Résumé",
    author="Pujan Banik Arnab",
    creator="Pujan Banik Arnab",
    subject="Industrial & Production Engineer — Supply Chain Management",
)

story = []

# ── Header ──
story.append(Paragraph("<b>PUJAN BANIK ARNAB</b>", name_style))
story.append(Paragraph("Industrial &amp; Production Engineer", role_style))
story.append(Paragraph(
    "banikarnab.ipe@gmail.com  |  +880 1792 514506  |  Jigatola, Dhanmondi, Dhaka, Bangladesh",
    contact_style))
story.append(Paragraph(
    'LinkedIn: <link href="https://www.linkedin.com/in/pujan-banik-arnab">linkedin.com/in/pujan-banik-arnab</link>',
    contact_style))

# ── Professional Summary ──
story.extend(sect("PROFESSIONAL SUMMARY"))
story.append(Paragraph(
    "Results-driven Supply Chain and Production professional with experience across "
    "procurement, logistics coordination, and manufacturing operations. Currently serving as "
    "Junior Executive in Supply Chain Management at Excellent Ceramics Group, managing "
    "sourcing, international procurement, and shipment execution — from Comparative "
    "Statements and purchase orders to Letter of Credit processing, customs clearance, and "
    "freight coordination. Previously Assistant Engineer — Production at PRAN Beverage Ltd "
    "(PRAN-RFL Group), supervising beverage lines with GMP-compliant, safety-first practice. "
    "Skilled in cost optimization, inventory planning, and operational efficiency. B.Sc. in "
    "Industrial &amp; Production Engineering (AUST). Preparing for graduate study (M.Sc.) in "
    "Supply Chain Management.", body))

# ── Core Skills ──
story.extend(sect("CORE SKILLS"))
for s in [
    "Procurement &amp; Sourcing (Local &amp; International)",
    "Vendor &amp; Supplier Management",
    "LC Processing &amp; Trade Documentation",
    "Logistics &amp; Shipment Coordination",
    "Inventory &amp; Stock Control",
    "Cost &amp; Freight Optimization",
    "Production Operations &amp; Line Supervision",
    "Process &amp; Operational Improvement",
]:
    story.append(Paragraph(f"\u2022 {s}", bullet))

# ── Professional Experience ──
story.extend(sect("PROFESSIONAL EXPERIENCE"))
story.append(entry(
    "Junior Executive — Supply Chain Management",
    "Excellent Ceramics Group  |  May 2025 – Present  |  Dhaka, Bangladesh",
    [
        "Manage end-to-end procurement of local raw materials, sodium silicate, and press "
        "machine punches and moulds for the Tiles and Ceramics units — from quotation "
        "collection and Comparative Statement (CS) preparation to vendor selection and "
        "purchase orders.",
        "Source finished goods, seat covers, fittings, and accessories from overseas vendors; "
        "evaluate quotations, select suppliers, and prepare Letter of Credit (LC) applications "
        "in coordination with banks.",
        "Coordinate with Clearing &amp; Forwarding (C&amp;F) agents on customs duty and clearance; "
        "follow up on imports to ensure timely receipt at the factory.",
        "Negotiate freight quotations with forwarders, monitor Estimated Time of Departure "
        "(ETD) and Estimated Time of Arrival (ETA), and obtain freight certificates from banks "
        "to keep shipments on schedule.",
        "Process supplier, freight, and inbound shipment invoices through system posting, bill "
        "and payment requisitions, and payments (including Post-Dated Cheques), maintaining "
        "accurate supplier ledgers.",
        "Verify LC files for document completeness and hand them to the Accounts team for "
        "accurate import costing; prepare work orders for the Designer team and process the "
        "related bill requisitions and payments.",
        "Collaborate with factory, bank, Accounts, and logistics teams to ensure materials "
        "arrive on time with complete documentation.",
    ]))
story.append(entry(
    "Assistant Engineer — Production",
    "PRAN Beverage Limited (PRAN-RFL Group)  |  April 2022 – May 2023  |  Bangladesh",
    [
        "Supervised and operated beverage production lines to ensure smooth and continuous "
        "manufacturing operations; supported production planning and scheduling to meet "
        "operational targets and deadlines.",
        "Implemented process improvements to enhance efficiency and minimize material wastage; "
        "coordinated with maintenance teams to ensure timely equipment servicing and reduce "
        "downtime.",
        "Prepared and analyzed production reports to monitor performance and support "
        "decision-making.",
        "Ensured compliance with GMP (Good Manufacturing Practices) and workplace safety "
        "standards; maintained consistent product quality by adhering to standard operating "
        "procedures and production guidelines.",
    ]))

# ── Education ──
story.extend(sect("EDUCATION"))
story.append(entry(
    "Bachelor of Science — Industrial &amp; Production Engineering",
    "Ahsanullah University of Science and Technology  |  2017 – 2022  |  CGPA: 2.95",
    []))
story.append(entry(
    "Higher Secondary School Certificate (Science)",
    "MC College, Sylhet  |  2013 – 2015  |  GPA: 5.00",
    []))

# ── Certifications ──
story.extend(sect("CERTIFICATIONS"))
story.append(Paragraph("\u2022 Supply Chain Logistics — Coursera", bullet))
story.append(Paragraph("\u2022 Supply Chain Operations — Coursera", bullet))

# ── Project & Research Experience ──
story.extend(sect("PROJECT &amp; RESEARCH EXPERIENCE"))
story.append(entry(
    "Thesis — Design of Experiments on Hardened-Steel Turning",
    "Ahsanullah University of Science and Technology",
    [
        "Investigated the effects of cutting parameters and machining environment on surface "
        "roughness and chip morphology in turning hardened high-carbon steel (52 HRC), using "
        "Design of Experiments (DOE).",
        "Measured and analyzed surface roughness to identify optimal machining parameters for "
        "improved surface finish; evaluated chip morphology under different machining "
        "conditions to understand material behavior and process efficiency.",
        "Applied statistical and analytical methods to determine the most effective machining "
        "environment and cutting conditions.",
    ]))
story.append(entry(
    "Multi-Material Crusher — Product Design Sessional",
    "Ahsanullah University of Science and Technology",
    [
        "Designed and developed a multi-material crusher incorporating a pneumatic mechanism "
        "to crush aluminum cans and plastic waste, improving waste-handling efficiency and "
        "supporting sustainable material processing.",
        "Prepared design concepts, technical specifications, and project documentation.",
    ]))

# ── References ──
story.extend(sect("REFERENCES"))
story.append(entry(
    "Rezaul Karim Nayeem",
    "Assistant Professor, Department of MPE, Ahsanullah University of Science and Technology "
    "  |  rknayeem.mpe@gmail.com  |  +880 1913 464185",
    []))
story.append(entry(
    "Ranjit Das",
    "Assistant Revenue Officer, Dhaka — National Board of Revenue  |  prattay.edu@gmail.com  |  "
    "+880 1722 253712",
    []))

doc.build(story)
size = os.path.getsize(OUT)
print(f"apps/web/public/resume.pdf written ({size/1024:.0f} KB)")
