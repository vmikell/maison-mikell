from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    PageBreak,
    KeepTogether,
    Table,
    TableStyle,
)

OUT = "/home/vboxuser/.openclaw/workspace/maison-mikell/docs/launch/maison-organic-marketing-report-2026-04-16.pdf"

styles = getSampleStyleSheet()
styles.add(ParagraphStyle(
    name="ReportTitle",
    parent=styles["Title"],
    fontName="Helvetica-Bold",
    fontSize=28,
    leading=31,
    textColor=colors.HexColor("#221933"),
    alignment=TA_LEFT,
    spaceAfter=12,
))
styles.add(ParagraphStyle(
    name="HeroSub",
    parent=styles["BodyText"],
    fontName="Helvetica",
    fontSize=11.5,
    leading=16,
    textColor=colors.HexColor("#6E6681"),
    spaceAfter=8,
))
styles.add(ParagraphStyle(
    name="Eyebrow",
    parent=styles["BodyText"],
    fontName="Helvetica-Bold",
    fontSize=9,
    leading=11,
    textColor=colors.HexColor("#6D50D8"),
    spaceAfter=8,
    alignment=TA_LEFT,
))
styles.add(ParagraphStyle(
    name="SectionTitle",
    parent=styles["Heading1"],
    fontName="Helvetica-Bold",
    fontSize=19,
    leading=22,
    textColor=colors.HexColor("#221933"),
    spaceAfter=8,
    spaceBefore=0,
))
styles.add(ParagraphStyle(
    name="SectionIntro",
    parent=styles["BodyText"],
    fontName="Helvetica",
    fontSize=10.5,
    leading=15,
    textColor=colors.HexColor("#6E6681"),
    spaceAfter=14,
))
styles.add(ParagraphStyle(
    name="CardTitle",
    parent=styles["Heading2"],
    fontName="Helvetica-Bold",
    fontSize=12.5,
    leading=15,
    textColor=colors.HexColor("#221933"),
    spaceAfter=6,
))
styles.add(ParagraphStyle(
    name="CardBody",
    parent=styles["BodyText"],
    fontName="Helvetica",
    fontSize=9.7,
    leading=14,
    textColor=colors.HexColor("#5F5872"),
    spaceAfter=0,
))
styles.add(ParagraphStyle(
    name="BulletBody",
    parent=styles["BodyText"],
    fontName="Helvetica",
    fontSize=9.5,
    leading=13.5,
    textColor=colors.HexColor("#5F5872"),
    leftIndent=10,
    bulletIndent=0,
    spaceAfter=3,
))
styles.add(ParagraphStyle(
    name="Quote",
    parent=styles["BodyText"],
    fontName="Helvetica-Bold",
    fontSize=14,
    leading=19,
    textColor=colors.HexColor("#221933"),
    alignment=TA_CENTER,
    spaceAfter=10,
))
styles.add(ParagraphStyle(
    name="FooterNote",
    parent=styles["BodyText"],
    fontName="Helvetica",
    fontSize=8.5,
    leading=11,
    textColor=colors.HexColor("#7B738D"),
    alignment=TA_CENTER,
))

PINK = colors.HexColor("#FF8ECF")
VIOLET = colors.HexColor("#8F6BFF")
INK = colors.HexColor("#221933")
MUTED = colors.HexColor("#6E6681")
LINE = colors.HexColor("#EADFF0")
LAV = colors.HexColor("#F6EFFF")
ROSE = colors.HexColor("#FFF2F7")
CREAM = colors.HexColor("#FFFDFD")
GREEN_BG = colors.HexColor("#EEF9F4")
GREEN_TX = colors.HexColor("#1E8F6B")
GOLD_BG = colors.HexColor("#FFF7EC")
GOLD_TX = colors.HexColor("#9A5F16")


def box(title, body=None, bullets=None, bg=CREAM):
    content = [Paragraph(title, styles["CardTitle"])]
    if body:
        content.append(Paragraph(body, styles["CardBody"]))
    if bullets:
        for item in bullets:
            content.append(Paragraph(f"• {item}", styles["BulletBody"]))
    table = Table([[content]], colWidths=[3.18 * inch])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), bg),
        ("BOX", (0, 0), (-1, -1), 1, LINE),
        ("INNERPADDING", (0, 0), (-1, -1), 14),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    return table


def mini_box(title, body):
    table = Table([[[Paragraph(f"<b>{title}</b><br/>{body}", styles["CardBody"])] ]], colWidths=[2.1 * inch])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.white),
        ("BOX", (0, 0), (-1, -1), 1, LINE),
        ("INNERPADDING", (0, 0), (-1, -1), 12),
    ]))
    return table


def label_box(label, title, bullets, label_bg, label_color):
    inner = [
        Paragraph(f'<font color="{label_color}"><b>{label}</b></font>', styles["CardBody"]),
        Spacer(1, 4),
        Paragraph(title, styles["CardTitle"]),
    ]
    for item in bullets:
        inner.append(Paragraph(f"• {item}", styles["BulletBody"]))
    table = Table([[inner]], colWidths=[3.15 * inch])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), label_bg),
        ("BOX", (0, 0), (-1, -1), 1, LINE),
        ("INNERPADDING", (0, 0), (-1, -1), 14),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    return table


def quote_box(text, note):
    table = Table([[[Paragraph(text, styles["Quote"]), Paragraph(note, styles["FooterNote"])] ]], colWidths=[6.6 * inch])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#FBF7FF")),
        ("BOX", (0, 0), (-1, -1), 1, LINE),
        ("INNERPADDING", (0, 0), (-1, -1), 18),
    ]))
    return table


def banner(text):
    table = Table([[[Paragraph(f'<font color="#FFFFFF"><b>{text}</b></font>', styles["CardBody"])] ]], colWidths=[6.6 * inch])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), VIOLET),
        ("BOX", (0, 0), (-1, -1), 0, colors.white),
        ("INNERPADDING", (0, 0), (-1, -1), 14),
    ]))
    return table


def page_bg(canvas, doc):
    canvas.saveState()
    width, height = LETTER
    canvas.setFillColor(CREAM)
    canvas.rect(0, 0, width, height, stroke=0, fill=1)
    canvas.setStrokeColor(colors.HexColor("#F1E8F5"))
    canvas.setLineWidth(0.8)
    canvas.line(50, 38, width - 50, 38)
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(MUTED)
    canvas.drawRightString(width - 54, 24, f"Page {doc.page}")
    canvas.restoreState()


def cover_bg(canvas, doc):
    width, height = LETTER
    canvas.saveState()
    canvas.setFillColor(colors.HexColor("#FFFDFD"))
    canvas.rect(0, 0, width, height, stroke=0, fill=1)
    canvas.setFillColor(colors.HexColor("#FFF0F7"))
    canvas.circle(width - 82, height - 52, 100, stroke=0, fill=1)
    canvas.setFillColor(colors.HexColor("#F3ECFF"))
    canvas.circle(72, 92, 90, stroke=0, fill=1)
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

story.append(Paragraph("Maison Mikell • Organic Marketing Report", styles["Eyebrow"]))
story.append(Paragraph("A no-budget launch plan for growing Maison Mikell through social, story, and sharp execution.", styles["ReportTitle"]))
story.append(Paragraph(
    "Prepared for Victor and Riah. This report packages Maison’s positioning, organic growth strategy, working approval model, required access stack, and the immediate next moves for letting Henry own the marketing process under Victor’s review.",
    styles["HeroSub"],
))
story.append(Spacer(1, 18))
cover_left = box(
    "Core thesis",
    "Maison Mikell should not be marketed like a generic organizer app. It should be framed as a calm home operating system for couples, then grown through founder-led organic distribution, polished assets, and disciplined feedback loops instead of paid ads.",
    bg=colors.white,
)
cover_right = Table([
    [mini_box("Primary positioning", "The home operating system for couples."), mini_box("Go-to-market style", "No-budget, organic, founder-led social and community distribution.")],
    [mini_box("Offer structure", "$179 founding lifetime for 7 days, then $12 monthly or $96 yearly."), mini_box("Working authority", "Henry drafts. Victor approves before publishing.")],
], colWidths=[2.18 * inch, 2.18 * inch])
cover_right.setStyle(TableStyle([("VALIGN", (0,0), (-1,-1), "TOP"), ("LEFTPADDING", (0,0), (-1,-1), 0), ("RIGHTPADDING", (0,0), (-1,-1), 0), ("TOPPADDING", (0,0), (-1,-1), 0), ("BOTTOMPADDING", (0,0), (-1,-1), 10)]))
story.append(Table([[cover_left, cover_right]], colWidths=[3.05 * inch, 3.45 * inch], style=[("VALIGN", (0,0), (-1,-1), "TOP")]))
story.append(Spacer(1, 28))
story.append(Paragraph("Prepared on April 16, 2026. Designed as a shareable planning report for Maison Mikell.", styles["FooterNote"]))
story.append(PageBreak())

story.append(Paragraph("1. The marketable story", styles["SectionTitle"]))
story.append(Paragraph("Maison’s edge is emotional clarity, not feature sprawl. The marketing story has to make the product feel like relief, not just productivity.", styles["SectionIntro"]))
left = [
    box("What Maison is", bullets=[
        "A calm shared system for running a home.",
        "A product for couples and households, not just solo list-making.",
        "A place for shopping, maintenance, reminders, and household planning to live together.",
    ], bg=colors.white),
    Spacer(1, 12),
    box("What Maison is not", bullets=[
        "Not another generic family organizer.",
        "Not a hyper-optimized productivity app.",
        "Not a feature blob trying to be everything for everyone.",
    ], bg=ROSE),
]
right = [
    box("Primary audience", bullets=[
        "Couples sharing a home.",
        "Busy homeowners.",
        "Households feeling recurring coordination friction.",
        "People who want calm more than hustle-culture productivity.",
    ], bg=colors.white),
    Spacer(1, 12),
    box("Hero message", body="<b>The home operating system for couples.</b><br/><br/>Maison Mikell brings maintenance, shared shopping, reminders, and household planning into one clean place, so running a home feels lighter instead of chaotic.", bg=LAV),
]
story.append(Table([[left, right]], colWidths=[3.2 * inch, 3.2 * inch], style=[("VALIGN", (0,0), (-1,-1), "TOP")]))
story.append(Spacer(1, 18))
story.append(quote_box(
    '“The first job is not to reach everyone. The first job is to make the right households say: this actually makes our home life easier.”',
    "Guiding launch principle for Maison Mikell",
))
story.append(Spacer(1, 18))
story.append(banner("Maison should grow like a tastefully run founder-led product, not like a desperate app begging for attention."))
story.append(PageBreak())

story.append(Paragraph("2. The no-budget growth model", styles["SectionTitle"]))
story.append(Paragraph("Without paid acquisition, Maison has to grow through content, narrative, founder credibility, and deliberate outreach. That means discipline matters more than volume.", styles["SectionIntro"]))
pillar_table = Table([
    [
        box("Social content", body="Short-form posts and videos that translate household friction into a sharp, relatable story.", bullets=["Instagram", "TikTok", "X"], bg=colors.white),
        box("Founder-led distribution", body="Use Victor and Riah’s voice, story, and lived use cases to make the product feel real instead of corporate.", bullets=["Founder posts", "Warm network outreach", "Direct launch invites"], bg=LAV),
    ],
    [
        box("Careful community outreach", body="Selective participation in communities where household coordination pain is already visible.", bullets=["Reddit, carefully", "Facebook groups, carefully", "Couples and homeowner spaces"], bg=ROSE),
        box("Success loop", bullets=["Build attention with emotionally precise content.", "Convert that attention into landing page visits and early signups.", "Feed objections back into onboarding, paywall, and messaging."], bg=colors.white),
    ]
], colWidths=[3.2 * inch, 3.2 * inch])
pillar_table.setStyle(TableStyle([("VALIGN", (0,0), (-1,-1), "TOP"), ("LEFTPADDING", (0,0), (-1,-1), 0), ("RIGHTPADDING", (0,0), (-1,-1), 0), ("TOPPADDING", (0,0), (-1,-1), 0), ("BOTTOMPADDING", (0,0), (-1,-1), 14)]))
story.append(pillar_table)
story.append(Spacer(1, 8))

story.append(Paragraph("3. Operating model and authority", styles["SectionTitle"]))
story.append(Paragraph("Henry can own the process only if the boundaries are clear. This approval model is strong enough to move quickly without becoming sloppy.", styles["SectionIntro"]))
ops = Table([
    [
        label_box("APPROVED", "Henry may draft", ["Social posts and captions", "Replies", "DMs", "Outreach messages", "Launch copy and support assets"], GREEN_BG, GREEN_TX),
        label_box("APPROVAL REQUIRED", "Publishing workflow", ["Everything is drafted first.", "Victor approves before it goes live.", "Publishing happens only after approval."], GOLD_BG, GOLD_TX),
    ],
    [
        label_box("APPROVED", "Brand voice rule", ["Henry may speak as ‘we’ for Maison.", "The voice should stay calm, premium, warm, and grounded."], GREEN_BG, GREEN_TX),
        label_box("OPEN DECISION", "Commenting as Maison", ["Still undecided.", "Recommendation: revisit after the first batch of posts and audience response."], LAV, VIOLET.hexval()),
    ]
], colWidths=[3.2 * inch, 3.2 * inch])
ops.setStyle(TableStyle([("VALIGN", (0,0), (-1,-1), "TOP"), ("LEFTPADDING", (0,0), (-1,-1), 0), ("RIGHTPADDING", (0,0), (-1,-1), 0), ("TOPPADDING", (0,0), (-1,-1), 0), ("BOTTOMPADDING", (0,0), (-1,-1), 12)]))
story.append(ops)
story.append(Spacer(1, 12))
story.append(quote_box(
    "Henry should own the drafting, cadence, system, and feedback loop. Victor should keep the final publishing check until the rhythm is fully trusted.",
    "Recommended operating model",
))
story.append(PageBreak())

story.append(Paragraph("4. Tools and access needed", styles["SectionTitle"]))
story.append(Paragraph("To actually run this, Henry needs a lean but real operating stack. No paid ads does not mean no system.", styles["SectionIntro"]))
left_tools = [
    box("Channel access", bullets=["Instagram access or scheduler access", "TikTok access or scheduler access", "X account access", "Optional Facebook group access later"], bg=colors.white),
    Spacer(1, 12),
    box("Creative stack", bullets=["Canva or Figma for graphics and carousels", "CapCut for short-form video", "Google Drive or shared folder for assets", "Notion or Airtable for content pipeline"], bg=LAV),
]
right_tools = [
    box("Distribution and scheduling", bullets=["Meta Business Suite", "Optional Buffer or Later", "Landing page with email capture", "Google Sheet or Airtable for leads and feedback tracking"], bg=colors.white),
    Spacer(1, 12),
    box("Product asset access", bullets=["App access for screenshots and recordings", "Brand assets, icons, colors, mockups", "Founder story inputs from Victor", "Riah’s perspective if she wants to help shape voice"], bg=ROSE),
]
story.append(Table([[left_tools, right_tools]], colWidths=[3.2 * inch, 3.2 * inch], style=[("VALIGN", (0,0), (-1,-1), "TOP")]))
story.append(Spacer(1, 14))
story.append(Paragraph("Important security note: do not pass raw passwords through chat or store them in workspace files. Use role access or a password manager whenever possible.", styles["SectionIntro"]))

story.append(Paragraph("5. Content system", styles["SectionTitle"]))
story.append(Paragraph("Maison content should feel aesthetic, emotionally sharp, and specific. The goal is not to post often. The goal is to build the right signal.", styles["SectionIntro"]))
content = Table([
    [
        box("Content pillars", bullets=["Shared-home friction", "Calm systems for couples", "Shopping and maintenance routines", "Founder perspective", "Soft product demos"], bg=colors.white),
        box("Formats", bullets=["Short videos", "Carousel posts", "Static quote graphics", "Founder notes", "Launch DMs and outreach"], bg=LAV),
    ],
    [
        box("Tone rules", bullets=["Calm, not loud", "Premium, not sterile", "Domestic, not corporate", "Specific, not generic", "Warm, not cheesy"], bg=ROSE),
        box("Weekly rhythm", bullets=["1 hero post", "2 to 3 supporting social posts", "1 founder-style note", "A small batch of warm outreach messages"], bg=colors.white),
    ],
], colWidths=[3.2 * inch, 3.2 * inch])
content.setStyle(TableStyle([("VALIGN", (0,0), (-1,-1), "TOP"), ("LEFTPADDING", (0,0), (-1,-1), 0), ("RIGHTPADDING", (0,0), (-1,-1), 0), ("TOPPADDING", (0,0), (-1,-1), 0), ("BOTTOMPADDING", (0,0), (-1,-1), 10)]))
story.append(content)
story.append(Spacer(1, 8))
story.append(banner("Every post should either sharpen desire, validate the problem, or make Maison feel more real."))
story.append(PageBreak())

story.append(Paragraph("6. Assets already prepared", styles["SectionTitle"]))
story.append(Paragraph("The marketing foundation is no longer theoretical. Key launch assets are already drafted and sitting in the repo.", styles["SectionIntro"]))
story.append(Table([
    [
        box("Completed docs", bullets=["marketing-plan.md", "landing-page-copy.md", "app-store-listing-copy.md", "screenshot-shotlist.md", "founding-offer-faq.md"], bg=colors.white),
        box("What these unlock", bullets=["A coherent landing page", "Store-ready messaging direction", "A staged screenshot plan", "A clean founding-offer explanation", "A base for content and outreach writing"], bg=LAV),
    ]
], colWidths=[3.2 * inch, 3.2 * inch], style=[("VALIGN", (0,0), (-1,-1), "TOP")]))
story.append(Spacer(1, 16))
story.append(quote_box(
    "Maison’s next marketing step is not more ideas. It is turning the current strategy and copy into a real content and launch pipeline.",
    "State of the work",
))
story.append(Spacer(1, 18))

story.append(Paragraph("7. Immediate next moves", styles["SectionTitle"]))
story.append(Paragraph("This is the best sequence for the next phase so Maison builds momentum without getting scattered.", styles["SectionIntro"]))
for title, body in [
    ("1. Finalize the channel stack", "Choose the exact launch platforms. Recommended: Instagram, TikTok, X, then optional careful community outreach later."),
    ("2. Grant access and tool permissions", "Set up channel access, scheduling access, asset folder access, and the content pipeline workspace."),
    ("3. Build the landing page", "Use the drafted copy to turn Maison’s positioning into a public conversion surface."),
    ("4. Produce the first launch assets", "Create screenshot visuals, short-form videos, and the first batch of social posts."),
    ("5. Run approval-based publishing", "Henry drafts. Victor reviews. Maison publishes with a clean feedback loop."),
    ("6. Use the Mac mini arrival as an execution unlock", "When the Mac mini lands, pair the improved marketing pipeline with better device access and stronger asset production."),
]:
    story.append(Paragraph(f"<b>{title}</b><br/><font color='#6E6681'>{body}</font>", styles["CardBody"]))
    story.append(Spacer(1, 8))

story.append(Spacer(1, 12))
story.append(banner("Recommended next deliverable: a Maison content calendar plus the first batch of actual social post drafts."))


doc.build(story, onFirstPage=cover_bg, onLaterPages=page_bg)
print(OUT)
