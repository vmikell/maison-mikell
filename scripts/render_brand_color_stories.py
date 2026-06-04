from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle

OUT = "/home/vboxuser/.openclaw/workspace/maison-mikell/docs/brand/maison-color-stories-2026-04-17.pdf"

styles = getSampleStyleSheet()
styles.add(ParagraphStyle(
    name="EyebrowMaison",
    parent=styles["BodyText"],
    fontName="Helvetica-Bold",
    fontSize=9,
    leading=11,
    textColor=colors.HexColor("#8A6A4A"),
    spaceAfter=10,
    alignment=TA_LEFT,
))
styles.add(ParagraphStyle(
    name="TitleMaison",
    parent=styles["Title"],
    fontName="Helvetica-Bold",
    fontSize=27,
    leading=31,
    textColor=colors.HexColor("#2F241F"),
    spaceAfter=12,
))
styles.add(ParagraphStyle(
    name="SubtitleMaison",
    parent=styles["BodyText"],
    fontName="Helvetica",
    fontSize=11.2,
    leading=16,
    textColor=colors.HexColor("#65564D"),
    spaceAfter=8,
))
styles.add(ParagraphStyle(
    name="SectionMaison",
    parent=styles["Heading1"],
    fontName="Helvetica-Bold",
    fontSize=18,
    leading=22,
    textColor=colors.HexColor("#2F241F"),
    spaceAfter=6,
    spaceBefore=0,
))
styles.add(ParagraphStyle(
    name="StoryTagMaison",
    parent=styles["Heading2"],
    fontName="Helvetica-Bold",
    fontSize=14,
    leading=18,
    textColor=colors.HexColor("#3F3028"),
    spaceAfter=8,
))
styles.add(ParagraphStyle(
    name="BodyMaison",
    parent=styles["BodyText"],
    fontName="Helvetica",
    fontSize=10,
    leading=14.2,
    textColor=colors.HexColor("#574A42"),
    spaceAfter=6,
))
styles.add(ParagraphStyle(
    name="SmallMaison",
    parent=styles["BodyText"],
    fontName="Helvetica",
    fontSize=8.5,
    leading=11,
    textColor=colors.HexColor("#7A6A5E"),
    spaceAfter=0,
))
styles.add(ParagraphStyle(
    name="CapsMaison",
    parent=styles["BodyText"],
    fontName="Helvetica-Bold",
    fontSize=8.2,
    leading=10,
    textColor=colors.HexColor("#8A6A4A"),
    spaceAfter=5,
))
styles.add(ParagraphStyle(
    name="QuoteMaison",
    parent=styles["BodyText"],
    fontName="Helvetica-Bold",
    fontSize=15,
    leading=20,
    textColor=colors.HexColor("#2F241F"),
    alignment=TA_CENTER,
    spaceAfter=8,
))


STORIES = [
    {
        "eyebrow": "COLOR STORY 01",
        "title": "Sunwashed Market",
        "tagline": "Cream, mustard, teal, and walnut. Bright, tasteful, alive, and unmistakably human.",
        "story": "This direction feels like morning light in a warm kitchen, handmade ceramics on open shelves, and a home that is cared for without looking precious. It keeps Maison friendly and optimistic, but pulls it far away from glossy purple SaaS.",
        "palette": [
            ("Antique Cream", "#F7F1E5", "#3F3328"),
            ("Butter Linen", "#EFE3CD", "#3F3328"),
            ("Harvest Mustard", "#D0A84A", "#FFF9EF"),
            ("Kitchen Teal", "#4D8C86", "#F7F3ED"),
            ("Walnut", "#4B392D", "#FFF9F3"),
        ],
        "branding": [
            "Best for a Maison that feels clean, capable, warm, and slightly editorial.",
            "The mustard gives it memorability. The teal keeps it calm and believable.",
            "This is the strongest fit if the brand should feel modern, lived-in, and a little premium without turning stiff.",
        ],
        "ui": [
            "Use cream and butter as the main canvas so the app breathes.",
            "Reserve mustard for primary actions, highlighted numbers, and moments of confidence.",
            "Use teal for progress, check states, navigation focus, and functional accents.",
            "Keep walnut for headings, anchors, and dark contrast zones instead of black.",
        ],
        "type": "Typography should feel tailored, not futuristic. I would pair a warm, strong wordmark with a clean humanist sans in the UI. For a custom Maison wordmark, I would explore soft flared terminals, slightly high contrast, generous spacing, and elegant capitals that still feel domestic rather than luxury-fashion cold.",
        "avoid": "Avoid neon teal, sharp lemon yellow, cold gray backgrounds, or overusing the mustard. The charm is in restraint.",
    },
    {
        "eyebrow": "COLOR STORY 02",
        "title": "Sage Linen",
        "tagline": "Linen, oat, sage, olive, and muted gold. Quiet confidence, calm order, and soft daylight.",
        "story": "This direction is the most understated. It feels like expensive soap packaging, warm stone countertops, natural fiber curtains, and a house that is calm because someone actually thought about it. It is less playful than Sunwashed Market, but very believable.",
        "palette": [
            ("Linen", "#F6F1E8", "#40382F"),
            ("Oat", "#ECE3D5", "#40382F"),
            ("Soft Sage", "#8F9A77", "#FAF8F3"),
            ("Olive Shade", "#6B7656", "#FAF8F3"),
            ("Muted Gold", "#C2A46A", "#FFF9F2"),
        ],
        "branding": [
            "Best for a Maison that wants to feel mature, composed, and trustworthy.",
            "This one says thoughtful home care rather than energetic startup.",
            "It is the safest premium direction if you want warm neutrality to lead the brand.",
        ],
        "ui": [
            "Use linen and oat for nearly all app backgrounds.",
            "Let sage carry buttons, selected states, and positive system moments.",
            "Bring muted gold in carefully for premium callouts, pricing, and highlights.",
            "Use olive for utility depth and secondary emphasis.",
        ],
        "type": "This story wants typography that feels composed and grounded. The custom Maison wordmark here should be a little more restrained, with subtle contrast, open counters, and a classic silhouette that can age well. Think modern heritage rather than trendy DTC.",
        "avoid": "Do not let this become muddy. Too much olive or too little contrast will make it feel sleepy instead of calm.",
    },
    {
        "eyebrow": "COLOR STORY 03",
        "title": "Clay Hearth",
        "tagline": "Oat, parchment, terracotta, cedar, and espresso. Warmth, depth, texture, and strong domestic character.",
        "story": "This direction has the most personality. It feels like fired clay, wood, books, old house character, and a little ritual. If Maison should feel soulful and memorable, this is the boldest route without becoming noisy.",
        "palette": [
            ("Parchment", "#F8F1E8", "#3F3028"),
            ("Warm Oat", "#EEE0D1", "#3F3028"),
            ("Terracotta", "#B46F54", "#FFF9F4"),
            ("Cedar", "#7D523C", "#FFF9F4"),
            ("Espresso", "#34241D", "#F9F4EE"),
        ],
        "branding": [
            "Best for a Maison that should feel distinctive, emotional, and rich.",
            "This one creates the clearest personality and the strongest visual memory.",
            "It is warmer and more intimate, which could be powerful if the product story leans toward belonging and care.",
        ],
        "ui": [
            "Use parchment and oat as the quiet foundation.",
            "Use terracotta for hero actions, primary calls to action, and emphasis moments.",
            "Use cedar for tabs, filter states, and structured navigation depth.",
            "Use espresso for text, framing, and dark panels instead of default charcoal.",
        ],
        "type": "This story wants the strongest display typography. The custom Maison wordmark could push furthest here, with elegant tension between softness and structure. I would explore slightly sculpted serifs, gentle flare shapes, and a bespoke capital M that feels architectural but warm.",
        "avoid": "Do not combine this with generic app-store blue or shiny gradients. It needs matte, tactile handling.",
    },
]


def bullet_lines(items):
    return "<br/>".join([f"• {item}" for item in items])


def info_box(label, content, bg="#FFFDF8"):
    data = [[
        Paragraph(label, styles["CapsMaison"]),
        Paragraph(content, styles["BodyMaison"]),
    ]]
    table = Table(data, colWidths=[1.4 * inch, 4.9 * inch])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor(bg)),
        ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#E5D7C8")),
        ("INNERPADDING", (0, 0), (-1, -1), 12),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    return table


def swatch_table(palette):
    row = []
    for name, hex_code, text in palette:
        cell = Paragraph(
            f'<font color="{text}"><b>{name}</b><br/>{hex_code}</font>',
            styles["SmallMaison"],
        )
        row.append(cell)
    table = Table([row], colWidths=[1.28 * inch] * len(palette), rowHeights=[0.95 * inch])
    style = [
        ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#E5D7C8")),
        ("INNERGRID", (0, 0), (-1, -1), 1, colors.white),
        ("VALIGN", (0, 0), (-1, -1), "BOTTOM"),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]
    for i, (_, hex_code, _) in enumerate(palette):
        style.append(("BACKGROUND", (i, 0), (i, 0), colors.HexColor(hex_code)))
    table.setStyle(TableStyle(style))
    return table


def page_bg(canvas, doc):
    canvas.saveState()
    width, height = LETTER
    canvas.setFillColor(colors.HexColor("#FBF7F1"))
    canvas.rect(0, 0, width, height, stroke=0, fill=1)
    canvas.setStrokeColor(colors.HexColor("#E9DDD0"))
    canvas.setLineWidth(0.8)
    canvas.line(50, 38, width - 50, 38)
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(colors.HexColor("#7A6A5E"))
    canvas.drawRightString(width - 54, 24, f"Page {doc.page}")
    canvas.restoreState()


def cover_bg(canvas, doc):
    width, height = LETTER
    canvas.saveState()
    canvas.setFillColor(colors.HexColor("#FCF7F0"))
    canvas.rect(0, 0, width, height, stroke=0, fill=1)
    canvas.setFillColor(colors.HexColor("#F2E4D5"))
    canvas.circle(width - 70, height - 50, 110, stroke=0, fill=1)
    canvas.setFillColor(colors.HexColor("#E8D7C6"))
    canvas.circle(85, 100, 90, stroke=0, fill=1)
    canvas.restoreState()


doc = SimpleDocTemplate(
    OUT,
    pagesize=LETTER,
    rightMargin=50,
    leftMargin=50,
    topMargin=52,
    bottomMargin=46,
)

story = []
story.append(Paragraph("MAISON • BRANDING + UI COLOR STORIES", styles["EyebrowMaison"]))
story.append(Paragraph("Three separate warm-home directions for Maison", styles["TitleMaison"]))
story.append(Paragraph(
    "Prepared for Victor and Riah. These directions are designed to replace the current glossy AI-looking palette with three cleaner, warmer, more intentional color stories that can guide both the brand and the product UI.",
    styles["SubtitleMaison"],
))
story.append(Spacer(1, 14))

cover_quote = Table([[[
    Paragraph("\u201cMaison should feel like a beautiful, cared-for home, not a generic software dashboard.\u201d", styles["QuoteMaison"]),
    Paragraph("This document turns that instinct into three distinct visual routes.", styles["SmallMaison"]),
]]], colWidths=[6.55 * inch])
cover_quote.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#FFFDF8")),
    ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#E5D7C8")),
    ("INNERPADDING", (0, 0), (-1, -1), 18),
]))
story.append(cover_quote)
story.append(Spacer(1, 18))

intro_table = Table([
    [
        Paragraph("<b>What changed</b><br/>The current palette skews glossy, cool, and synthetic. These new directions aim for warmth, restraint, and real domestic texture.", styles["BodyMaison"]),
        Paragraph("<b>What stays true</b><br/>Maison still needs clarity, good contrast, and strong interaction states. Warm does not mean muddy or vague.", styles["BodyMaison"]),
    ]
], colWidths=[3.18 * inch, 3.18 * inch])
intro_table.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#FFF9F2")),
    ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#E5D7C8")),
    ("INNERPADDING", (0, 0), (-1, -1), 14),
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
]))
story.append(intro_table)
story.append(Spacer(1, 24))
story.append(Paragraph("Prepared on April 17, 2026", styles["SmallMaison"]))
story.append(PageBreak())

for idx, item in enumerate(STORIES):
    story.append(Paragraph(item["eyebrow"], styles["EyebrowMaison"]))
    story.append(Paragraph(item["title"], styles["SectionMaison"]))
    story.append(Paragraph(item["tagline"], styles["StoryTagMaison"]))
    story.append(Paragraph(item["story"], styles["BodyMaison"]))
    story.append(Spacer(1, 10))
    story.append(Paragraph("PALETTE", styles["CapsMaison"]))
    story.append(swatch_table(item["palette"]))
    story.append(Spacer(1, 14))
    story.append(info_box("BRANDING", bullet_lines(item["branding"]), bg="#FFFDF8"))
    story.append(Spacer(1, 10))
    story.append(info_box("UI", bullet_lines(item["ui"]), bg="#FFF8F1"))
    story.append(Spacer(1, 10))
    story.append(info_box("TYPE", item["type"], bg="#FDF7F2"))
    story.append(Spacer(1, 10))
    story.append(info_box("AVOID", item["avoid"], bg="#FFFDF8"))
    if idx < len(STORIES) - 1:
        story.append(PageBreak())

story.append(PageBreak())
story.append(Paragraph("Recommendation", styles["SectionMaison"]))
story.append(Paragraph(
    "If Maison needs the best mix of warmth, freshness, and memorability right now, I would test <b>Sunwashed Market</b> first. It is the clearest move away from the current AI-looking palette without getting heavy or precious.",
    styles["BodyMaison"],
))
story.append(Paragraph(
    "If the goal is the safest premium direction, choose <b>Sage Linen</b>. If the goal is a stronger emotional signature, choose <b>Clay Hearth</b>.",
    styles["BodyMaison"],
))
story.append(Spacer(1, 12))
story.append(info_box(
    "FONT NEXT",
    "Yes, Maison can absolutely have a custom font direction. My recommendation is to design a custom Maison wordmark and display alphabet first, then decide whether it should grow into a full font. That gets us the emotional signature fast without taking on the full production burden of a complete type family too early.",
    bg="#FFF8F1",
))


doc.build(story, onFirstPage=cover_bg, onLaterPages=page_bg)
print(f"Wrote {OUT}")
