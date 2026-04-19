from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import PageBreak, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

OUT = "/home/vboxuser/.openclaw/workspace/maison-mikell/docs/launch/maison-social-content-package-2026-04-18.pdf"

styles = getSampleStyleSheet()
styles.add(ParagraphStyle(
    name="Eyebrow",
    parent=styles["BodyText"],
    fontName="Helvetica-Bold",
    fontSize=9,
    leading=11,
    textColor=colors.HexColor("#9A654C"),
    alignment=TA_LEFT,
    spaceAfter=8,
))
styles.add(ParagraphStyle(
    name="TitleLarge",
    parent=styles["Title"],
    fontName="Helvetica-Bold",
    fontSize=27,
    leading=31,
    textColor=colors.HexColor("#2D201B"),
    alignment=TA_LEFT,
    spaceAfter=10,
))
styles.add(ParagraphStyle(
    name="Sub",
    parent=styles["BodyText"],
    fontName="Helvetica",
    fontSize=10.8,
    leading=15,
    textColor=colors.HexColor("#6F625A"),
    spaceAfter=8,
))
styles.add(ParagraphStyle(
    name="SectionTitle",
    parent=styles["Heading1"],
    fontName="Helvetica-Bold",
    fontSize=18,
    leading=21,
    textColor=colors.HexColor("#2D201B"),
    spaceAfter=8,
))
styles.add(ParagraphStyle(
    name="Body",
    parent=styles["BodyText"],
    fontName="Helvetica",
    fontSize=9.6,
    leading=13.4,
    textColor=colors.HexColor("#584B44"),
    spaceAfter=3,
))
styles.add(ParagraphStyle(
    name="CardTitle",
    parent=styles["Heading2"],
    fontName="Helvetica-Bold",
    fontSize=11.8,
    leading=14,
    textColor=colors.HexColor("#2D201B"),
    spaceAfter=5,
))
styles.add(ParagraphStyle(
    name="DeckBullet",
    parent=styles["BodyText"],
    fontName="Helvetica",
    fontSize=9.2,
    leading=12.8,
    textColor=colors.HexColor("#584B44"),
    leftIndent=10,
    bulletIndent=0,
    spaceAfter=2,
))
styles.add(ParagraphStyle(
    name="Quote",
    parent=styles["BodyText"],
    fontName="Helvetica-Bold",
    fontSize=12.8,
    leading=17,
    textColor=colors.HexColor("#2D201B"),
    alignment=TA_CENTER,
    spaceAfter=5,
))
styles.add(ParagraphStyle(
    name="Tiny",
    parent=styles["BodyText"],
    fontName="Helvetica",
    fontSize=7.8,
    leading=10,
    textColor=colors.HexColor("#786B63"),
    spaceAfter=2,
))
styles.add(ParagraphStyle(
    name="MetricBig",
    parent=styles["BodyText"],
    fontName="Helvetica-Bold",
    fontSize=16.5,
    leading=18.5,
    textColor=colors.HexColor("#2D201B"),
    alignment=TA_CENTER,
    spaceAfter=3,
))
styles.add(ParagraphStyle(
    name="MetricLabel",
    parent=styles["BodyText"],
    fontName="Helvetica",
    fontSize=8.4,
    leading=10.4,
    textColor=colors.HexColor("#6F625A"),
    alignment=TA_CENTER,
))

LINE = colors.HexColor("#E6D7CC")
PAPER = colors.HexColor("#FCF7F2")
WHITE = colors.HexColor("#FFFDFC")
TERRACOTTA = colors.HexColor("#B86C54")
TERRACOTTA_SOFT = colors.HexColor("#F5E4DD")
GOLD = colors.HexColor("#C79B52")
GOLD_SOFT = colors.HexColor("#F8F0DF")
WALNUT = colors.HexColor("#4D372C")
WALNUT_SOFT = colors.HexColor("#F1EBE6")
SAGE_SOFT = colors.HexColor("#EEF3EE")
MUTED = colors.HexColor("#6F625A")


def bullets(items):
    return [Paragraph(f"• {item}", styles["DeckBullet"]) for item in items]


def card(title, body=None, items=None, bg=WHITE, width=3.15 * inch):
    content = [Paragraph(title, styles["CardTitle"])]
    if body:
        content.append(Paragraph(body, styles["Body"]))
    if items:
        content.extend(bullets(items))
    t = Table([[content]], colWidths=[width])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), bg),
        ("BOX", (0, 0), (-1, -1), 1, LINE),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 14),
        ("RIGHTPADDING", (0, 0), (-1, -1), 14),
        ("TOPPADDING", (0, 0), (-1, -1), 12),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
    ]))
    return t


def metric(value, label, bg=WHITE):
    t = Table([[[Paragraph(value, styles["MetricBig"]), Paragraph(label, styles["MetricLabel"])] ]], colWidths=[2.06 * inch])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), bg),
        ("BOX", (0, 0), (-1, -1), 1, LINE),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 12),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
    ]))
    return t


def banner(text, bg=TERRACOTTA):
    t = Table([[[Paragraph(f'<font color="#FFFFFF"><b>{text}</b></font>', styles["Body"])] ]], colWidths=[6.6 * inch])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), bg),
        ("BOX", (0, 0), (-1, -1), 0, bg),
        ("LEFTPADDING", (0, 0), (-1, -1), 14),
        ("RIGHTPADDING", (0, 0), (-1, -1), 14),
        ("TOPPADDING", (0, 0), (-1, -1), 11),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 11),
    ]))
    return t


def quote_box(text, note):
    t = Table([[[Paragraph(text, styles["Quote"]), Paragraph(note, styles["Tiny"])] ]], colWidths=[6.6 * inch])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), GOLD_SOFT),
        ("BOX", (0, 0), (-1, -1), 1, LINE),
        ("LEFTPADDING", (0, 0), (-1, -1), 18),
        ("RIGHTPADDING", (0, 0), (-1, -1), 18),
        ("TOPPADDING", (0, 0), (-1, -1), 15),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 13),
    ]))
    return t


def page_bg(canvas, doc):
    width, height = LETTER
    canvas.saveState()
    canvas.setFillColor(PAPER)
    canvas.rect(0, 0, width, height, stroke=0, fill=1)
    canvas.setStrokeColor(colors.HexColor("#EBDDD3"))
    canvas.setLineWidth(0.8)
    canvas.line(50, 38, width - 50, 38)
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(MUTED)
    canvas.drawRightString(width - 54, 24, f"Page {doc.page}")
    canvas.restoreState()


def cover_bg(canvas, doc):
    width, height = LETTER
    canvas.saveState()
    canvas.setFillColor(PAPER)
    canvas.rect(0, 0, width, height, stroke=0, fill=1)
    canvas.setFillColor(colors.HexColor("#F1DED4"))
    canvas.circle(width - 82, height - 58, 104, stroke=0, fill=1)
    canvas.setFillColor(colors.HexColor("#F5ECD9"))
    canvas.circle(76, 92, 88, stroke=0, fill=1)
    canvas.setFillColor(colors.HexColor("#EFE7E1"))
    canvas.circle(width - 36, 88, 68, stroke=0, fill=1)
    canvas.restoreState()


doc = SimpleDocTemplate(
    OUT,
    pagesize=LETTER,
    leftMargin=50,
    rightMargin=50,
    topMargin=50,
    bottomMargin=46,
)

story = []

story.append(Paragraph("Maison • Social Execution Package", styles["Eyebrow"]))
story.append(Paragraph("30-day calendar, final Instagram carousel copy, TikTok shot lists, and first-post starter pack.", styles["TitleLarge"]))
story.append(Paragraph(
    "Prepared for Victor and Riah. This is the practical follow-through from the Maison grassroots strategy deck, built so the first month of content can actually get made and approved instead of staying conceptual.",
    styles["Sub"],
))
story.append(Spacer(1, 14))
cover = Table([
    [
        card(
            "What this package does",
            items=[
                "gives Maison a 30-day publishing rhythm across Instagram, TikTok, and X",
                "turns the first Instagram carousel into real slide copy",
                "turns the first TikTok batch into shootable shot lists",
                "keeps the brand voice warm, premium, domestic, and specific",
            ],
            bg=WHITE,
            width=3.25 * inch,
        ),
        card(
            "Operating principle",
            body="Run a few strong ideas repeatedly, measure honestly, and turn the winners into the real launch engine. Maison should feel like relief for shared-home life, not another loud productivity app.",
            bg=GOLD_SOFT,
            width=3.25 * inch,
        ),
    ]
], colWidths=[3.25 * inch, 3.25 * inch])
cover.setStyle(TableStyle([("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 0), ("VALIGN", (0, 0), (-1, -1), "TOP")]))
story.append(cover)
story.append(Spacer(1, 16))
story.append(Table([
    [metric("30 days", "calendar window", TERRACOTTA_SOFT), metric("1 carousel", "fully written for design", GOLD_SOFT), metric("4 TikToks", "shot-listed for production", WALNUT_SOFT)]
], colWidths=[2.1 * inch, 2.1 * inch, 2.1 * inch], style=[("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 0)]))
story.append(Spacer(1, 14))
story.append(Paragraph("Prepared on April 18, 2026. Package files also exist as editable docs inside `maison-mikell/docs/launch/`.", styles["Tiny"]))
story.append(PageBreak())

story.append(Paragraph("1. 30-day operating rhythm", styles["SectionTitle"]))
story.append(Paragraph("The first month should feel disciplined, not bloated. Instagram handles trust and taste. TikTok handles discovery. X handles founder voice and message sharpening.", styles["Sub"]))
ops = Table([
    [
        card("Instagram", items=["2 carousels per week", "2 reels per week", "stories on publishing days", "focus on saveability, taste, and shares"], bg=WHITE),
        card("TikTok", items=["5 posts per week", "fast hooks", "series over one-offs", "product appears as the resolution, not the opening shot"], bg=TERRACOTTA_SOFT),
    ],
    [
        card("X", items=["4 to 6 original posts per week", "reply loops on active days", "founder tone over faceless brand tone", "use it to test sharp phrasing in public"], bg=GOLD_SOFT),
        card("Core series", items=["Tiny home frictions", "Calmer systems", "Before / after Maison", "Founder notes", "Household hot takes"], bg=WALNUT_SOFT),
    ],
], colWidths=[3.25 * inch, 3.25 * inch])
ops.setStyle(TableStyle([("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 0), ("VALIGN", (0, 0), (-1, -1), "TOP")]))
story.append(ops)
story.append(Spacer(1, 10))
story.append(quote_box("Do not invent 30 unrelated posts. Run a few strong Maison ideas repeatedly, then let the market tell you which ones deserve scale.", "Calendar rule"))
story.append(Spacer(1, 12))
story.append(banner("Week 1 should establish the pain clearly. Week 2 should introduce Maison as relief. Weeks 3 and 4 should repeat winners and push signups without getting salesy."))
story.append(PageBreak())

story.append(Paragraph("2. Week 1 starter sequence", styles["SectionTitle"]))
story.append(Paragraph("This is the first practical sprint to shoot, design, and approve. It is enough to get signal quickly without overbuilding.", styles["Sub"]))
week1 = Table([
    [
        card("Day 1", items=["Instagram carousel: 7 tiny home frictions", "TikTok: quick-cut lived-scene version", "X founder post on repeated household misses"], bg=WHITE),
        card("Day 2", items=["TikTok: shopping list chaos is a bad system", "X hot take + thoughtful replies in adjacent conversations"], bg=TERRACOTTA_SOFT),
    ],
    [
        card("Day 3 to 5", items=["Instagram Reel: what mental load looks like", "X thread: why household systems fail", "Instagram carousel: what Maison is and what it is not"], bg=GOLD_SOFT),
        card("Day 6 to 7", items=["TikTok: calmer-home utility post", "Stories poll or question sticker", "X reply sweep for audience language mining"], bg=WALNUT_SOFT),
    ],
], colWidths=[3.25 * inch, 3.25 * inch])
week1.setStyle(TableStyle([("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 0), ("VALIGN", (0, 0), (-1, -1), "TOP")]))
story.append(week1)
story.append(Spacer(1, 12))
story.append(Table([
    [metric("0.5% to 0.9%", "good early Instagram signal", SAGE_SOFT), metric("3% to 6%", "good early TikTok signal", TERRACOTTA_SOFT), metric("0.03% to 0.10%", "healthy early X engagement", GOLD_SOFT)]
], colWidths=[2.1 * inch, 2.1 * inch, 2.1 * inch], style=[("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 0)]))
story.append(PageBreak())

story.append(Paragraph("3. Instagram carousel 01, final slide copy", styles["SectionTitle"]))
story.append(Paragraph("Post goal: make people feel instantly recognized by the tiny repeated frictions of shared-home life, then position Maison as the calm fix.", styles["Sub"]))
slides = Table([
    [
        card("Slide 1, cover", items=["7 tiny home frictions that create way more stress than they should", "Optional sub-line: The stuff that quietly makes shared-home life feel heavier."], bg=WHITE),
        card("Slide 2", items=["Headline: Forgetting what needs to be bought", "Body: You notice it only when you are already out of it. And somehow no one knows who was supposed to remember."], bg=TERRACOTTA_SOFT),
    ],
    [
        card("Slide 3", items=["Headline: One person carrying the reminder load", "Body: Appointments. refills. tasks. follow-ups. When all of that lives in one person's head, the system is already broken."], bg=GOLD_SOFT),
        card("Slide 4", items=["Headline: Maintenance tasks living nowhere useful", "Body: Filters. batteries. small repairs. routine upkeep. Nothing feels urgent, until suddenly it is."], bg=WALNUT_SOFT),
    ],
    [
        card("Slide 5", items=["Headline: Repeating the same conversation every week", "Body: Did we get that? Who is handling this? I thought you had it."], bg=WHITE),
        card("Slide 6", items=["Headline: Everything living in five different places", "Body: Texts. notes. memory. screenshots. the calendar. A shared home does not feel calm when the system is scattered."], bg=TERRACOTTA_SOFT),
    ],
], colWidths=[3.25 * inch, 3.25 * inch])
slides.setStyle(TableStyle([("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 0), ("VALIGN", (0, 0), (-1, -1), "TOP")]))
story.append(slides)
story.append(Spacer(1, 10))
story.append(card("Slide 7, CTA", items=["Headline: There should be one calm place for this", "Body: Maison is built to make shared-home life feel lighter, clearer, and less fragmented.", "Recommended CTA: Join early access"], bg=GOLD_SOFT, width=6.6 * inch))
story.append(Spacer(1, 10))
story.append(card("Caption, refined draft", body="Most home stress does not show up as one huge disaster. It shows up as tiny repeated misses. The grocery thing. The reminder thing. The maintenance thing. The 'I thought you had it' thing. That is the kind of friction Maison is built to reduce. Not by turning home life into a productivity competition. Just by giving shared-home life one calm place to live.", bg=WHITE, width=6.6 * inch))
story.append(PageBreak())

story.append(Paragraph("4. TikTok shot lists, posts 1 and 2", styles["SectionTitle"]))
story.append(Paragraph("These are designed for low-friction production, native pacing, and domestic realism over polished ad energy.", styles["Sub"]))
story.append(Table([
    [
        card("TikTok 01", items=["Hook: It might not be a relationship problem. It might be a system problem.", "Shots: messy counter or fridge, face-to-camera hook, grocery note, text thread, missing pantry item, reminder visual, calm closing shot, Maison hint.", "On-screen beats: tiny arguments, bad system, too many places, no clear flow, calmer home."], bg=WHITE),
        card("TikTok 02", items=["Hook: The grocery issue is almost never really about groceries.", "Shots: empty shelf, fridge reveal, direct-to-camera line, text thread or notes visual, shopping bag, slight annoyed moment, calmer kitchen, product hint.", "On-screen beats: not really groceries, shared info is everywhere, one person remembers, friction adds up."], bg=TERRACOTTA_SOFT),
    ]
], colWidths=[3.25 * inch, 3.25 * inch], style=[("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 0), ("VALIGN", (0, 0), (-1, -1), "TOP")]))
story.append(Spacer(1, 10))
story.append(banner("Rule: hook in under 2 seconds, keep the clips short, and let Maison appear as the relief at the end rather than the whole story at the start."))
story.append(PageBreak())

story.append(Paragraph("5. TikTok shot lists, posts 3 and 4", styles["SectionTitle"]))
story.append(Paragraph("TikTok 03 is the calmer utility post. TikTok 04 is the sharper recognition post.", styles["Sub"]))
story.append(Table([
    [
        card("TikTok 03", items=["Hook: Three tiny things that make a home feel more coordinated immediately.", "Shots: warm home establishing shot, face-to-camera opener, shared shopping visual, recurring task visual, reminder visual, calm domestic reset, Maison glimpse, CTA.", "On-screen beats: 1 shared shopping system, 1 place for tasks, 1 place for reminders, less guessing, calmer home."], bg=GOLD_SOFT),
        card("TikTok 04", items=["Hook: Things that feel normal at home but are actually signs your system is broken.", "Shots: face-to-camera hook, repeated reminder text, texting yourself, uncertainty on who owns what, maintenance issue, closing line on bad coordination design, Maison hint.", "On-screen beats: feels normal, system is broken, repeating reminders, nobody knows who has it."], bg=WALNUT_SOFT),
    ]
], colWidths=[3.25 * inch, 3.25 * inch], style=[("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 0), ("VALIGN", (0, 0), (-1, -1), "TOP")]))
story.append(Spacer(1, 10))
story.append(card("Who should be on camera", items=["Victor works well for the sharper, founder-led lines.", "Riah works especially well for warmth, realism, and domestic authority.", "If neither is on camera, use hands, rooms, objects, text overlays, and voiceover, but keep it personal rather than faceless."], bg=WHITE, width=6.6 * inch))
story.append(PageBreak())

story.append(Paragraph("6. First-post starter pack and next approvals", styles["SectionTitle"]))
story.append(Paragraph("The editable docs now cover the first wave of actual content across all three channels. This page is the approval checklist for getting those assets into production fast.", styles["Sub"]))
story.append(Table([
    [
        card("Already drafted", items=["30-day content calendar", "first Instagram carousel and reel drafts", "4 TikTok scripts", "6 X starter posts", "optional softer founder note"], bg=WHITE),
        card("Approve next", items=["whether Maison voice should skew more Victor, more Maison, or a blend", "which CTA should dominate, early access, follow, or softer curiosity", "whether 'couples' appears in any public-facing post or stays broader", "which concepts should become named recurring series"], bg=TERRACOTTA_SOFT),
    ],
    [
        card("Recommended immediate production order", items=["design Instagram carousel 01", "shoot TikTok 01 and 02", "queue 3 to 5 X posts", "review what language people mirror back"], bg=GOLD_SOFT),
        card("Editable source files", items=["maison-30-day-content-calendar-2026-04.md", "maison-first-post-batch-2026-04.md", "maison-instagram-carousel-01-slide-copy-2026-04.md", "maison-tiktok-shot-lists-2026-04.md"], bg=WALNUT_SOFT),
    ]
], colWidths=[3.25 * inch, 3.25 * inch], style=[("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 0), ("VALIGN", (0, 0), (-1, -1), "TOP")]))
story.append(Spacer(1, 12))
story.append(quote_box("The first win is not looking like a big brand. The first win is making the right households say: yes, this is exactly the part of home life that feels messy.", "Maison launch standard"))
story.append(Spacer(1, 10))
story.append(banner("Recommended next step after review: turn carousel 01 into a designed asset and script the first two TikToks shot by shot."))

doc.build(story, onFirstPage=cover_bg, onLaterPages=page_bg)
print(OUT)
