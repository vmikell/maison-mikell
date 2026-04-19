from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    KeepTogether,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

OUT = "/home/vboxuser/.openclaw/workspace/maison-mikell/docs/launch/maison-grassroots-social-strategy-2026-04-18.pdf"

styles = getSampleStyleSheet()
styles.add(ParagraphStyle(
    name="DeckEyebrow",
    parent=styles["BodyText"],
    fontName="Helvetica-Bold",
    fontSize=9,
    leading=11,
    textColor=colors.HexColor("#9A654C"),
    spaceAfter=8,
    alignment=TA_LEFT,
))
styles.add(ParagraphStyle(
    name="DeckTitle",
    parent=styles["Title"],
    fontName="Helvetica-Bold",
    fontSize=28,
    leading=31,
    textColor=colors.HexColor("#2D201B"),
    alignment=TA_LEFT,
    spaceAfter=10,
))
styles.add(ParagraphStyle(
    name="DeckSub",
    parent=styles["BodyText"],
    fontName="Helvetica",
    fontSize=11,
    leading=15,
    textColor=colors.HexColor("#6F625A"),
    spaceAfter=8,
))
styles.add(ParagraphStyle(
    name="SectionTitle",
    parent=styles["Heading1"],
    fontName="Helvetica-Bold",
    fontSize=19,
    leading=22,
    textColor=colors.HexColor("#2D201B"),
    spaceAfter=8,
))
styles.add(ParagraphStyle(
    name="SectionIntro",
    parent=styles["BodyText"],
    fontName="Helvetica",
    fontSize=10.2,
    leading=14,
    textColor=colors.HexColor("#6F625A"),
    spaceAfter=12,
))
styles.add(ParagraphStyle(
    name="CardTitle",
    parent=styles["Heading2"],
    fontName="Helvetica-Bold",
    fontSize=12,
    leading=14,
    textColor=colors.HexColor("#2D201B"),
    spaceAfter=6,
))
styles.add(ParagraphStyle(
    name="CardBody",
    parent=styles["BodyText"],
    fontName="Helvetica",
    fontSize=9.4,
    leading=13.2,
    textColor=colors.HexColor("#584B44"),
    spaceAfter=3,
))
styles.add(ParagraphStyle(
    name="BulletBody",
    parent=styles["BodyText"],
    fontName="Helvetica",
    fontSize=9.3,
    leading=13,
    textColor=colors.HexColor("#584B44"),
    leftIndent=10,
    bulletIndent=0,
    spaceAfter=2,
))
styles.add(ParagraphStyle(
    name="MetricBig",
    parent=styles["BodyText"],
    fontName="Helvetica-Bold",
    fontSize=17,
    leading=19,
    textColor=colors.HexColor("#2D201B"),
    alignment=TA_CENTER,
    spaceAfter=3,
))
styles.add(ParagraphStyle(
    name="MetricLabel",
    parent=styles["BodyText"],
    fontName="Helvetica",
    fontSize=8.7,
    leading=11.2,
    textColor=colors.HexColor("#6F625A"),
    alignment=TA_CENTER,
))
styles.add(ParagraphStyle(
    name="Quote",
    parent=styles["BodyText"],
    fontName="Helvetica-Bold",
    fontSize=13,
    leading=18,
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
    name="Source",
    parent=styles["BodyText"],
    fontName="Helvetica",
    fontSize=8.2,
    leading=10.5,
    textColor=colors.HexColor("#5F534B"),
    spaceAfter=2,
))

INK = colors.HexColor("#2D201B")
MUTED = colors.HexColor("#6F625A")
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
GREEN = colors.HexColor("#50715D")


def bullet_paragraphs(items):
    return [Paragraph(f"• {item}", styles["BulletBody"]) for item in items]


def card(title, body=None, bullets=None, bg=WHITE, width=3.15 * inch):
    parts = [Paragraph(title, styles["CardTitle"])]
    if body:
        parts.append(Paragraph(body, styles["CardBody"]))
    if bullets:
        parts.extend(bullet_paragraphs(bullets))
    t = Table([[parts]], colWidths=[width])
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
    t = Table([[[Paragraph(value, styles["MetricBig"]), Paragraph(label, styles["MetricLabel"])] ]], colWidths=[2.05 * inch])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), bg),
        ("BOX", (0, 0), (-1, -1), 1, LINE),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 12),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
    ]))
    return t


def quote_box(text, note):
    t = Table([[[Paragraph(text, styles["Quote"]), Paragraph(note, styles["Tiny"])] ]], colWidths=[6.6 * inch])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), GOLD_SOFT),
        ("BOX", (0, 0), (-1, -1), 1, LINE),
        ("LEFTPADDING", (0, 0), (-1, -1), 18),
        ("RIGHTPADDING", (0, 0), (-1, -1), 18),
        ("TOPPADDING", (0, 0), (-1, -1), 16),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 14),
    ]))
    return t


def banner(text, bg=TERRACOTTA):
    t = Table([[[Paragraph(f'<font color="#FFFFFF"><b>{text}</b></font>', styles["CardBody"])] ]], colWidths=[6.6 * inch])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), bg),
        ("BOX", (0, 0), (-1, -1), 0, bg),
        ("LEFTPADDING", (0, 0), (-1, -1), 14),
        ("RIGHTPADDING", (0, 0), (-1, -1), 14),
        ("TOPPADDING", (0, 0), (-1, -1), 11),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 11),
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


def source_line(num, text):
    return Paragraph(f"{num}. {text}", styles["Source"])


doc = SimpleDocTemplate(
    OUT,
    pagesize=LETTER,
    rightMargin=50,
    leftMargin=50,
    topMargin=50,
    bottomMargin=46,
)

story = []

# Cover
story.append(Paragraph("Maison • Grassroots Social Growth Deck", styles["DeckEyebrow"]))
story.append(Paragraph("What actually worked on Instagram, TikTok, and X over the last five years, and how Maison should use it.", styles["DeckTitle"]))
story.append(Paragraph(
    "Prepared for Victor. This deck leans on benchmark data, platform/operator research, and Maison’s current brand direction. The goal is not inflated growth theatre. It is a realistic organic system that can earn attention and convert it into waitlist or trial demand.",
    styles["DeckSub"],
))
story.append(Spacer(1, 14))
cover_grid = Table([
    [
        card(
            "Core call",
            body="The winning grassroots pattern from 2020 to 2025 was simple: human faces, native formats, repeatable series, and conversation loops beat polished brand broadcasting. Maison should market shared home life, not just app features.",
            bg=WHITE,
            width=3.25 * inch,
        ),
        card(
            "What to optimize for first",
            bullets=[
                "Consistent saves, shares, replies, and profile visits",
                "Email / waitlist capture before hard monetization",
                "A few repeatable content series instead of random one-offs",
                "Founder or creator-like presence over faceless brand posts",
            ],
            bg=GOLD_SOFT,
            width=3.25 * inch,
        ),
    ]
], colWidths=[3.25 * inch, 3.25 * inch])
cover_grid.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 0)]))
story.append(cover_grid)
story.append(Spacer(1, 18))
story.append(Table([
    [metric("0.48%", "Instagram average engagement, 2025", TERRACOTTA_SOFT), metric("4.20%", "TikTok engagement by views, 2025", GOLD_SOFT), metric("0.029%", "X median engagement, 2024", WALNUT_SOFT)]
], colWidths=[2.1 * inch, 2.1 * inch, 2.1 * inch], style=[("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 0)]))
story.append(Spacer(1, 14))
story.append(Paragraph("Prepared on April 18, 2026. Primary benchmark sources include Socialinsider, Rival IQ, Unbounce, Deloitte, TikTok for Business, and X algorithm reporting.", styles["Tiny"]))
story.append(PageBreak())

# Page 2: patterns
story.append(Paragraph("1. The 2020 to 2025 pattern: what actually kept winning", styles["SectionTitle"]))
story.append(Paragraph(
    "The best grassroots growth did not come from acting bigger than you are. It came from looking believable, useful, and close to real life. Across the last five years, the same pattern kept showing up, even as formats changed.",
    styles["SectionIntro"],
))
pattern_table = Table([
    [
        card("Human beats logo", bullets=[
            "Founder-led and face-led posts consistently outperform faceless brand content for trust and response.",
            "TikTok’s own data shows creator-led ads materially outperform non-creator ads, which directionally supports creator-native organic content too.",
            "Maison should use Victor and Riah style energy, not anonymous SaaS copy.",
        ], bg=WHITE),
        card("Useful beats polished", bullets=[
            "Instagram carousels stayed strong because people save and share them.",
            "TikTok rewarded fast, useful, emotionally specific clips over overly-produced spots.",
            "X rewarded posts that create replies, not generic promotional blasts.",
        ], bg=TERRACOTTA_SOFT),
    ],
    [
        card("Series beat randomness", bullets=[
            "The strongest small brands turned winners into repeatable formats.",
            "One clear weekly motif usually beats ten disconnected ideas.",
            "Maison should have named series, not just 'content'.", 
        ], bg=GOLD_SOFT),
        card("Conversation beats broadcast", bullets=[
            "Replies, DMs, comments, collabs, and creator/community crossover drove the compounding effect.",
            "On X especially, replies matter more than likes for reach.",
            "The best grassroots marketing is part publishing, part conversation design.",
        ], bg=WALNUT_SOFT),
    ],
], colWidths=[3.25 * inch, 3.25 * inch])
pattern_table.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 0), ("BOTTOMPADDING", (0, 0), (-1, -1), 10)]))
story.append(pattern_table)
story.append(Spacer(1, 10))
story.append(quote_box(
    "For Maison, the right public framing is broader than 'for couples only'. The wedge can still be shared-home life and household coordination, while the public-facing story stays warm, credible, and inclusive.",
    "Maison application of the five-year pattern",
))
story.append(Spacer(1, 12))
story.append(banner("Translation: Maison should market relief, rituals, and shared-home clarity, then let the product prove itself."))
story.append(PageBreak())

# Instagram
story.append(Paragraph("2. Instagram, best grassroots plays and Maison application", styles["SectionTitle"]))
story.append(Paragraph(
    "Instagram’s last five years moved from polished grid culture toward saveable education, more human Reels, collaborative reach, and DM or profile-intent actions. Carousels held up best. Reels became table stakes for discovery.",
    styles["SectionIntro"],
))
insta_grid = Table([
    [
        card("What wins on Instagram now", bullets=[
            "Carousel posts that teach, compare, or frame a pain point clearly.",
            "Reels that feel human, domestic, and natively shot rather than ad-like.",
            "Collab posts and creator crossover to borrow trust and audience.",
            "Story sequences that move from pain to proof to CTA.",
        ], bg=WHITE),
        card("How Maison should use it", bullets=[
            "Carousel series: 'tiny home frictions that turn into arguments'.",
            "Reels: quick lived-in scenes, not screen-recording dumps.",
            "Collab-style posts with small home, lifestyle, or relationship creators whose audience already cares about routines.",
            "Use profile CTA and Story CTA for waitlist, early access, or 'send this to your partner'.",
        ], bg=TERRACOTTA_SOFT),
    ],
], colWidths=[3.25 * inch, 3.25 * inch])
insta_grid.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 0)]))
story.append(insta_grid)
story.append(Spacer(1, 10))
story.append(Table([
    [metric("0.55%", "Carousel engagement benchmark", GOLD_SOFT), metric("0.52%", "Reels engagement benchmark", WHITE), metric("5 posts / wk", "Typical brand posting cadence", WALNUT_SOFT)]
], colWidths=[2.1 * inch, 2.1 * inch, 2.1 * inch], style=[("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 0)]))
story.append(Spacer(1, 10))
story.append(card(
    "Realistic Maison conversion assumptions from Instagram",
    bullets=[
        "Engagement target for early good performance: roughly 0.5% to 0.9%, with carousels often doing the heavier trust work.",
        "Cold-organic impression to landing-page click: roughly 0.2% to 0.6% when using bio, Story, collab, and profile-intent mechanics well.",
        "Landing-page conversion from Instagram traffic to waitlist / early-access signup: roughly 5% to 10% if the page is sharp and visually aligned.",
        "Honest outcome per 100,000 impressions: about 200 to 600 visits, then about 10 to 60 signups.",
    ],
    bg=GOLD_SOFT,
    width=6.6 * inch,
))
story.append(Spacer(1, 8))
story.append(Paragraph("Best role for Instagram: trust, taste, saveable value, and warm sharing between partners or friends.", styles["CardBody"]))
story.append(PageBreak())

# TikTok
story.append(Paragraph("3. TikTok, best grassroots plays and Maison application", styles["SectionTitle"]))
story.append(Paragraph(
    "TikTok rewarded creator-native storytelling, strong hooks, repeatable series, and comments that turn into more content. It remains the best platform for outsized discovery, but it is less predictable and more demanding than a year or two ago.",
    styles["SectionIntro"],
))
tiktok_grid = Table([
    [
        card("What wins on TikTok now", bullets=[
            "Fast hooks, clear narrative, and obvious emotional tension in the first seconds.",
            "Creator-like or founder-like faces, not polished branded talking heads.",
            "Repeatable formats built around a recurring pain or ritual.",
            "Comment-driven follow-ups, creator partnerships, and native edits.",
        ], bg=WHITE),
        card("How Maison should use it", bullets=[
            "Series ideas: '3 things that make living together harder than it should be' or 'tiny household fixes that lower mental load'.",
            "Use lived scenes, shopping runs, reminder misses, chore ambiguity, fridge notes, and repair chaos as narrative fuel.",
            "Shoot vertically, keep cuts fast, and make the product the resolution, not the opening shot.",
            "Test founder-led clips, partner dynamic clips, and creator-seeded demos in the same week.",
        ], bg=TERRACOTTA_SOFT),
    ],
], colWidths=[3.25 * inch, 3.25 * inch])
tiktok_grid.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 0)]))
story.append(tiktok_grid)
story.append(Spacer(1, 10))
story.append(Table([
    [metric("4.20%", "Engagement by views benchmark", GOLD_SOFT), metric("4.40%", "Small-account benchmark", WHITE), metric("+40%", "Brand posting frequency change in 2025", WALNUT_SOFT)]
], colWidths=[2.1 * inch, 2.1 * inch, 2.1 * inch], style=[("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 0)]))
story.append(Spacer(1, 10))
story.append(card(
    "Realistic Maison conversion assumptions from TikTok",
    bullets=[
        "Engagement target for promising early content: roughly 3% to 6% by views, with smaller accounts able to punch above their size.",
        "Cold-organic view to landing-page click: roughly 0.4% to 1.2% if the hook, CTA, and profile path are all clean.",
        "Landing-page conversion from TikTok traffic to waitlist / early access: roughly 5% to 12% when the promise matches the video well.",
        "Honest outcome per 100,000 views: about 400 to 1,200 visits, then about 20 to 144 signups.",
    ],
    bg=GOLD_SOFT,
    width=6.6 * inch,
))
story.append(Spacer(1, 8))
story.append(Paragraph("Best role for TikTok: top-of-funnel discovery, emotional resonance, and finding the one or two messages that make strangers instantly get Maison.", styles["CardBody"]))
story.append(PageBreak())

# X
story.append(Paragraph("4. X, best grassroots plays and Maison application", styles["SectionTitle"]))
story.append(Paragraph(
    "X stayed brutally low-engagement for brands, but still useful for founder-led distribution, tight messaging, real-time conversation, and building a visible point of view. It rewards replies and conversation far more than generic outbound promotion.",
    styles["SectionIntro"],
))
x_grid = Table([
    [
        card("What wins on X now", bullets=[
            "Founder point of view, not sanitized brand voice.",
            "Replies, quote-posts, and conversational participation around existing conversations.",
            "Short threads, screenshots, product observations, and build-in-public notes.",
            "Often keeping the main post cleaner and using reply chains for context or links.",
        ], bg=WHITE),
        card("How Maison should use it", bullets=[
            "Post sharp observations about shared-home friction, mental load, repairs, shopping, and household systems.",
            "Use Victor's voice more than a faceless Maison account voice, especially early.",
            "Reply under adjacent conversations about home life, relationships, routines, apps, and domestic organization.",
            "Share tiny product moments, screenshots, and honest founder notes instead of sales copy.",
        ], bg=TERRACOTTA_SOFT),
    ],
], colWidths=[3.25 * inch, 3.25 * inch])
x_grid.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 0)]))
story.append(x_grid)
story.append(Spacer(1, 10))
story.append(Table([
    [metric("0.029%", "Median brand engagement", GOLD_SOFT), metric("0.08%", "Top 25% brand engagement", WHITE), metric("replies matter most", "Algorithm direction", WALNUT_SOFT)]
], colWidths=[2.1 * inch, 2.1 * inch, 2.1 * inch], style=[("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 0)]))
story.append(Spacer(1, 10))
story.append(card(
    "Realistic Maison conversion assumptions from X",
    bullets=[
        "Engagement target for healthy early traction: roughly 0.03% to 0.10%, depending on whether founder posts and reply loops are working.",
        "Cold-organic impression to landing-page click: roughly 0.25% to 0.8%, especially when the post earns curiosity first and the link is handled carefully.",
        "Landing-page conversion from X traffic to waitlist / early access: roughly 3% to 8% because traffic quality can be smart but noisy.",
        "Honest outcome per 100,000 impressions: about 250 to 800 visits, then about 8 to 64 signups.",
    ],
    bg=GOLD_SOFT,
    width=6.6 * inch,
))
story.append(Spacer(1, 8))
story.append(Paragraph("Best role for X: message development, founder credibility, and network-driven discovery, not primary volume acquisition.", styles["CardBody"]))
story.append(PageBreak())

# model page
story.append(Paragraph("5. Maison’s realistic cross-channel funnel", styles["SectionTitle"]))
story.append(Paragraph(
    "The honest first conversion should usually be waitlist, early access, or email capture, not immediate paid subscription. Cold organic social rarely converts directly into a meaningful volume of paid customers until message-market fit is obvious.",
    styles["SectionIntro"],
))
model_table = Table([
    [Paragraph("Channel", styles["CardTitle"]), Paragraph("What it mainly does", styles["CardTitle"]), Paragraph("Visit rate assumption", styles["CardTitle"]), Paragraph("Signup conversion assumption", styles["CardTitle"])],
    [Paragraph("Instagram", styles["CardBody"]), Paragraph("Taste + trust + shares", styles["CardBody"]), Paragraph("0.2% to 0.6%", styles["CardBody"]), Paragraph("5% to 10%", styles["CardBody"])],
    [Paragraph("TikTok", styles["CardBody"]), Paragraph("Discovery + emotional clarity", styles["CardBody"]), Paragraph("0.4% to 1.2%", styles["CardBody"]), Paragraph("5% to 12%", styles["CardBody"])],
    [Paragraph("X", styles["CardBody"]), Paragraph("Conversation + founder credibility", styles["CardBody"]), Paragraph("0.25% to 0.8%", styles["CardBody"]), Paragraph("3% to 8%", styles["CardBody"])],
], colWidths=[1.2 * inch, 2.25 * inch, 1.45 * inch, 1.7 * inch])
model_table.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, 0), WALNUT),
    ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
    ("BACKGROUND", (0, 1), (-1, -1), WHITE),
    ("BOX", (0, 0), (-1, -1), 1, LINE),
    ("INNERGRID", (0, 0), (-1, -1), 0.8, LINE),
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("LEFTPADDING", (0, 0), (-1, -1), 10),
    ("RIGHTPADDING", (0, 0), (-1, -1), 10),
    ("TOPPADDING", (0, 0), (-1, -1), 8),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
]))
story.append(model_table)
story.append(Spacer(1, 12))
scenario_table = Table([
    [
        card("Low traction month", bullets=[
            "75k combined impressions / views",
            "~250 to 650 visits",
            "~12 to 45 signups",
            "Useful if it sharpens message and surfaces winners",
        ], bg=WHITE),
        card("Solid early month", bullets=[
            "200k combined impressions / views",
            "~700 to 1,800 visits",
            "~35 to 140 signups",
            "This is a healthy organic start, not a miracle month",
        ], bg=GOLD_SOFT),
    ],
    [
        card("Breakout month", bullets=[
            "500k+ combined impressions / views",
            "~2,000 to 5,000 visits",
            "~120 to 400 signups",
            "Usually requires one or two breakout TikToks or collab posts, not just consistency",
        ], bg=TERRACOTTA_SOFT),
        card("The hard truth", bullets=[
            "Direct cold-social to paid subscription will likely be far lower than waitlist capture.",
            "If Maison can reliably turn social traffic into email capture first, that is already meaningful traction.",
            "A sharp landing page and follow-up system matter almost as much as content quality.",
        ], bg=WALNUT_SOFT),
    ],
], colWidths=[3.25 * inch, 3.25 * inch])
scenario_table.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 0)]))
story.append(scenario_table)
story.append(Spacer(1, 10))
story.append(banner("Judge the first 90 days by message pull, signups, and repeatable winners, not by forcing premature paid conversion."))
story.append(PageBreak())

# operating system
story.append(Paragraph("6. The Maison operating system this research points to", styles["SectionTitle"]))
story.append(Paragraph(
    "The best application for Maison is not to be everywhere at once. It is to run a small number of strong series across the three channels, then redistribute the winners in native ways.",
    styles["SectionIntro"],
))
ops_table = Table([
    [
        card("Recommended weekly cadence", bullets=[
            "Instagram: 2 carousels, 2 Reels, daily Stories when assets exist",
            "TikTok: 4 to 6 posts, with at least 2 built from repeatable series",
            "X: 4 to 7 original posts plus ongoing replies",
            "1 small creator or collab touchpoint per week once assets are stable",
        ], bg=WHITE),
        card("Maison series to test first", bullets=[
            "'Tiny home frictions that cost more than they should'",
            "'Things couples keep forgetting because the system is bad'",
            "'Calmer ways to run a home'",
            "'Household hot takes' on X",
            "'Before Maison / after Maison' lifestyle demos",
        ], bg=TERRACOTTA_SOFT),
    ],
    [
        card("Measurement stack", bullets=[
            "Per-post saves, shares, replies, and profile visits",
            "Landing-page sessions by source",
            "Signup conversion by source and creative angle",
            "Comments and DM language to mine positioning clues",
        ], bg=GOLD_SOFT),
        card("Decision rule", bullets=[
            "Keep the formats that repeatedly earn attention and qualified clicks.",
            "Kill formats that look pretty but do not move saves, replies, profile visits, or signups.",
            "Turn every winner into a series before inventing new formats.",
        ], bg=WALNUT_SOFT),
    ],
], colWidths=[3.25 * inch, 3.25 * inch])
ops_table.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 0)]))
story.append(ops_table)
story.append(Spacer(1, 10))
story.append(quote_box(
    "If Maison gets one thing right, it should be this: make people feel seen in the chaos of shared-home life, then show the product as relief.",
    "Best-fit creative principle",
))
story.append(PageBreak())

# next 90 days + sources
story.append(Paragraph("7. Next 90 days, and the source base behind this deck", styles["SectionTitle"]))
story.append(Paragraph(
    "This is the most grounded way to turn the research into action. Start narrow, measure honestly, then scale only the winners. Sources are listed below so this deck stays auditable instead of hand-wavy.",
    styles["SectionIntro"],
))
story.append(card("90-day sequence", bullets=[
    "Days 1 to 14: finalize landing page, analytics, waitlist flow, and the first 10 to 15 pieces of content.",
    "Days 15 to 45: publish on all three channels, with extra attention on TikTok for message discovery and Instagram for trust building.",
    "Days 46 to 75: cut obvious losers, amplify winners, and add small creator or collab distribution.",
    "Days 76 to 90: convert the best-performing messages into a repeatable launch pipeline and tighter onboarding copy.",
], bg=WHITE, width=6.6 * inch))
story.append(Spacer(1, 10))
story.append(Paragraph("Primary sources", styles["CardTitle"]))
for i, text in enumerate([
    "Socialinsider, Social Media Benchmarks for 2026, based on 70M posts across TikTok, Instagram, Facebook, and X.",
    "Socialinsider, 2026 Instagram Organic Engagement Benchmarks, based on 35M Instagram posts.",
    "Socialinsider, 2026 TikTok Organic Engagement Benchmarks, based on 2M TikTok posts.",
    "Rival IQ, What is a Good Engagement Rate on Twitter?, citing its 2024 Social Media Industry Benchmark Report.",
    "Unbounce, What is the average landing page conversion rate? Q4 2024 data, based on 41,000 landing pages, 464M visitors, and 57M conversions.",
    "Deloitte, Social Commerce and the Creator Economy, including creator influence and website-visit behavior findings.",
    "TikTok for Business, The Creator Advantage, showing creator-led ads driving higher CTR and engagement than non-creator ads.",
    "Social Media Today coverage of X ranking factors, summarizing X documentation that heavily favors replies and conversation behavior.",
], start=1):
    story.append(source_line(i, text))
story.append(Spacer(1, 8))
story.append(Paragraph("Note on the conversion numbers: they are not lifted from a single benchmark table because platform-native organic social rarely offers a universal direct-conversion benchmark. They are synthesized conservatively from public engagement data, operator research, channel mechanics, and landing-page baselines. The deck intentionally avoids fantasy-case startup math.", styles["Tiny"]))
story.append(Spacer(1, 10))
story.append(banner("Recommended next deliverable: a Maison content calendar plus the first batch of channel-specific post drafts.", bg=GOLD))


doc.build(story, onFirstPage=cover_bg, onLaterPages=page_bg)
print(OUT)
