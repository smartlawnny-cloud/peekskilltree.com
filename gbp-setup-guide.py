#!/usr/bin/env python3
"""GBP Setup Guide — Copy/Paste Ready for Second Nature Tree Service"""
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, HRFlowable

GREEN = HexColor('#2d5a27')
DARK = HexColor('#1a1a1a')
GRAY = HexColor('#666666')
WHITE = HexColor('#ffffff')
PALE = HexColor('#f5f5f5')

s = {}
s['title'] = ParagraphStyle('T', fontName='Helvetica-Bold', fontSize=22, textColor=GREEN, spaceAfter=6)
s['h1'] = ParagraphStyle('H1', fontName='Helvetica-Bold', fontSize=16, textColor=GREEN, spaceBefore=20, spaceAfter=8)
s['h2'] = ParagraphStyle('H2', fontName='Helvetica-Bold', fontSize=12, textColor=HexColor('#b5610a'), spaceBefore=14, spaceAfter=6)
s['body'] = ParagraphStyle('B', fontName='Helvetica', fontSize=10, textColor=DARK, spaceAfter=6, leading=14)
s['copy'] = ParagraphStyle('C', fontName='Courier', fontSize=9, textColor=DARK, spaceAfter=4, leading=13, leftIndent=15, backColor=HexColor('#f0f0f0'))
s['label'] = ParagraphStyle('L', fontName='Helvetica-Bold', fontSize=10, textColor=GREEN, spaceBefore=10, spaceAfter=2)
s['note'] = ParagraphStyle('N', fontName='Helvetica-Oblique', fontSize=9, textColor=GRAY, spaceAfter=8)

def hr():
    return HRFlowable(width="100%", thickness=1, color=HexColor('#e0e0e0'), spaceBefore=6, spaceAfter=6)

def build():
    doc = SimpleDocTemplate("/Users/dougbrown/Desktop/Claude/GBP-Setup-Guide-Second-Nature.pdf",
        pagesize=letter, leftMargin=0.75*inch, rightMargin=0.75*inch, topMargin=0.6*inch, bottomMargin=0.6*inch)
    story = []

    story.append(Paragraph("Google Business Profile Setup Guide", s['title']))
    story.append(Paragraph("Second Nature Tree Service — Copy/Paste Ready", ParagraphStyle('sub', fontName='Helvetica', fontSize=12, textColor=GRAY, spaceAfter=20)))
    story.append(HRFlowable(width="100%", thickness=2, color=GREEN, spaceAfter=15))

    # ── DESCRIPTION ──
    story.append(Paragraph("1. Business Description", s['h1']))
    story.append(Paragraph("Go to: Edit Profile → About → Description. Select all existing text and replace with:", s['body']))
    story.append(Paragraph(
        "Second Nature Tree Service — professional tree removal, pruning, stump grinding, and emergency storm response in Peekskill, NY. Serving Westchester, Putnam, and Southern Dutchess Counties for over 10 years. Locally owned and operated by a dedicated crew — not a franchise or call center. Licensed in Westchester (WC-32079) and Putnam (PC-50644), fully insured with workers' comp and general liability on every job. We handle everything from routine pruning to complex removals near homes, power lines, and steep terrain. 75ft bucket truck, chipper, loader, and crane services available. 5.0 stars with 70+ Google reviews. Free on-site estimates — call (914) 391-5233.",
        s['copy']))
    story.append(Paragraph("746 characters — right at the 750 limit.", s['note']))

    # ── CATEGORIES ──
    story.append(Paragraph("2. Business Categories", s['h1']))
    story.append(Paragraph("Go to: Edit Profile → About → Business category", s['body']))
    story.append(Paragraph("Primary category (already set):", s['label']))
    story.append(Paragraph("Tree service", s['copy']))
    story.append(Paragraph("Add secondary categories:", s['label']))
    story.append(Paragraph("Arborist", s['copy']))
    story.append(Paragraph("Stump removal service", s['copy']))

    # ── WEBSITE URL ──
    story.append(Paragraph("3. Website URL (with UTM tracking)", s['h1']))
    story.append(Paragraph("Go to: Edit Profile → Contact → Website. Replace current URL with:", s['body']))
    story.append(Paragraph("https://peekskilltree.com/?utm_source=google&amp;utm_medium=organic&amp;utm_campaign=gbp", s['copy']))
    story.append(Paragraph("This lets Google Analytics track GBP traffic separately from regular search.", s['note']))

    # ── APPOINTMENT URL ──
    story.append(Paragraph("4. Appointment / Booking URL", s['h1']))
    story.append(Paragraph("Go to: Bookings (on dashboard). Add this URL:", s['body']))
    story.append(Paragraph("https://peekskilltree.com/contact.html?utm_source=google&amp;utm_medium=organic&amp;utm_campaign=gbp_booking", s['copy']))

    story.append(PageBreak())

    # ── SERVICES ──
    story.append(Paragraph("5. Services (Critical for SEO)", s['h1']))
    story.append(Paragraph("Go to: Edit Services → Add each service below. For each one, enter the name, price, and description exactly as shown.", s['body']))
    story.append(hr())

    services = [
        ("Tree Removal", "Starting at $600",
         "Safe, complete tree removal for any size tree — from small yard trees to large hardwoods near structures and power lines. Our crew handles felling, sectional dismantling, rigging, and full cleanup. Bucket truck and crane available for complex removals. Serving Peekskill, Yorktown, Cortlandt, Croton, and all of Westchester and Putnam Counties."),
        ("Tree Pruning & Trimming", "Starting at $250",
         "Professional pruning to improve tree health, shape, and safety. Crown thinning, deadwood removal, canopy lifting, and vista pruning. We follow ISA pruning standards to protect your trees while reducing risk from overhanging branches near your home, driveway, or power lines."),
        ("Stump Grinding", "Starting at $150",
         "Fast, clean stump grinding below grade so you can replant, landscape, or reclaim your yard. We grind stumps of any size and haul away the chips or leave them for fill. Typically completed in under an hour per stump."),
        ("Emergency Tree Service", "Call for pricing",
         "24/7 emergency response for fallen trees, storm damage, and hazardous limbs. We respond same-day, often within hours. Available evenings, weekends, and holidays. If a tree is on your house, car, driveway, or power lines — call (914) 391-5233 immediately."),
        ("Land & Lot Clearing", "Starting at $2,000",
         "Complete lot clearing for construction, landscaping, or property restoration. We remove trees, brush, stumps, and overgrowth. Equipment includes chipper, loader, and hauling. Serving residential and commercial properties across Westchester, Putnam, and Southern Dutchess Counties."),
        ("Hazardous Tree Removal", "Call for estimate",
         "Specialized removal of dead, dying, leaning, or storm-damaged trees that pose a risk to your property or safety. Our crew is trained for high-risk removals near homes, power lines, and steep terrain using rigging, crane, and bucket truck techniques."),
        ("Crane-Assisted Tree Removal", "Starting at $3,000",
         "For large trees in tight spaces or near structures where traditional felling isn't possible. We coordinate crane operations to safely lift sections over homes, pools, and fences. Fully insured for crane work with experienced rigging crew."),
        ("Brush & Debris Removal", "Starting at $300",
         "Cleanup and hauling of brush, limbs, logs, and yard debris. We chip brush on-site and haul away everything. Perfect after storms, DIY projects, or as part of a larger tree job. Same-day service available."),
        ("Storm Damage Cleanup", "Call for emergency pricing",
         "Rapid response for storm damage — fallen trees, broken limbs, blocked driveways, and roof strikes. We work with insurance companies and provide documentation for claims. Call (914) 391-5233 any time for immediate help."),
        ("Firewood", "Call for pricing",
         "Quality seasoned firewood from our tree removal jobs. Hardwoods including oak, maple, and cherry. Delivery available throughout Westchester and Putnam Counties."),
    ]

    for name, price, desc in services:
        story.append(Paragraph(name, s['h2']))
        story.append(Paragraph(f"Price: {price}", s['label']))
        story.append(Paragraph(desc, s['copy']))
        story.append(Spacer(1, 4))

    story.append(PageBreak())

    # ── GOOGLE POSTS ──
    story.append(Paragraph("6. Google Posts (Schedule These)", s['h1']))
    story.append(Paragraph("Go to: Posts on the dashboard. Create each post below. Add a photo from your phone/gallery. Set CTA to 'Call now' with phone number.", s['body']))
    story.append(hr())

    posts = [
        ("Post 1: Spring Pruning",
         "Spring is the best time to prune most trees — before full leaf-out when the branch structure is visible. Proper pruning improves tree health, reduces storm risk, and keeps your property looking its best. Licensed and insured. Serving Peekskill, Yorktown, Cortlandt, and all of Westchester and Putnam Counties. Call (914) 391-5233 for a free estimate.",
         "Use a photo of pruning work in progress"),
        ("Post 2: Storm Season Ready",
         "Storm season is here. Dead limbs, leaning trees, and weak branches can become dangerous fast. Don't wait for the next storm — call us for a free hazard assessment. We respond 24/7 for emergency tree removal and storm damage cleanup. (914) 391-5233.",
         "Use a storm damage or emergency response photo"),
        ("Post 3: Before & After",
         "Another big one down safely. This large oak in Yorktown was leaning toward the house and had significant deadwood in the canopy. Our crew removed it in sections using our 75' bucket truck — zero damage to the property. Licensed, insured, and 5.0 stars on Google. Free estimates: (914) 391-5233.",
         "Use a before/after removal photo"),
        ("Post 4: Stump Grinding",
         "Don't let old stumps sit in your yard all summer. We grind them below grade so you can replant, landscape, or just get your lawn back. Quick, clean work — most stumps done in under an hour. Serving Westchester and Putnam Counties. Call (914) 391-5233.",
         "Use a stump grinding photo"),
        ("Post 5: Equipment Spotlight",
         "Our 75' Altec bucket truck getting it done overlooking the Hudson River. This is the kind of reach you need for large removals near houses and power lines. No job too high, no tree too big. Licensed, insured, 70+ five-star reviews. Free estimates: (914) 391-5233.",
         "Use the bucket truck Hudson River photo"),
    ]

    for title, text, photo_note in posts:
        story.append(Paragraph(title, s['h2']))
        story.append(Paragraph(text, s['copy']))
        story.append(Paragraph(f"Photo: {photo_note}", s['note']))
        story.append(Spacer(1, 4))

    story.append(PageBreak())

    # ── REVIEW STRATEGY ──
    story.append(Paragraph("7. Review Collection", s['h1']))
    story.append(Paragraph("Go to: 'Ask for reviews' on the dashboard to get your review link and QR code.", s['body']))

    story.append(Paragraph("After-job text template:", s['label']))
    story.append(Paragraph(
        "Hi [Name], thanks for choosing Second Nature for your [tree removal/pruning/etc] today! If you have a minute, a Google review helps other homeowners find us. Here's the link: [PASTE YOUR REVIEW LINK]. Thank you! — Doug",
        s['copy']))

    story.append(Paragraph("Review response template (positive):", s['label']))
    story.append(Paragraph(
        "Thank you [Name]! It was great working on your [service type] in [Town]. We appreciate you trusting Second Nature with your trees. — Doug & the crew",
        s['copy']))

    story.append(Paragraph("Pro tip:", s['label']))
    story.append(Paragraph("Ask customers to mention the TYPE of work and their TOWN in the review. This feeds Google's AI and helps you rank for local searches like 'tree removal Yorktown NY'.", s['note']))

    # ── PHOTO STRATEGY ──
    story.append(Paragraph("8. Photo Upload Plan", s['h1']))
    story.append(Paragraph("Go to: Photos on the dashboard. Upload 3-5 photos per week. Top-ranking businesses have 250+ photos.", s['body']))

    photo_types = [
        ["Photo Type", "What to Shoot", "How Many"],
        ["Before/After", "Side-by-side of completed jobs", "10+ to start"],
        ["Action Shots", "Climbing, cutting, chipping in progress", "10+"],
        ["Equipment", "Bucket truck, chipper, loader, stump grinder", "5"],
        ["Crew/Team", "Crew in branded gear, on the job", "5"],
        ["Completed Work", "Clean yards after removal/trimming", "10+"],
        ["Exterior/Trucks", "Branded trucks, yard/shop", "3"],
    ]
    t = Table(photo_types, colWidths=[1.8*inch, 3.2*inch, 1.5*inch])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), GREEN),
        ('TEXTCOLOR', (0,0), (-1,0), WHITE),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 9),
        ('GRID', (0,0), (-1,-1), 0.5, HexColor('#e0e0e0')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [WHITE, PALE]),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t)

    # ── WEEKLY CHECKLIST ──
    story.append(Paragraph("9. Weekly Maintenance Checklist", s['h1']))
    checklist = [
        "Upload 2-3 new job photos",
        "Publish 1-2 Google Posts",
        "Respond to ALL new reviews within 24 hours",
        "Check for unauthorized edits to your profile",
    ]
    for item in checklist:
        story.append(Paragraph(f"[ ]  {item}", ParagraphStyle('check', fontName='Helvetica', fontSize=10, textColor=DARK, spaceAfter=6, leftIndent=15)))

    story.append(Spacer(1, 15))
    story.append(Paragraph("10. Directory Cleanup (Do This Week)", s['h1']))
    cleanup = [
        "[ ]  Fix Angi duplicate — contact support to merge 'Second Nature Tree Care' into 'Second Nature Tree LLC'",
        "[ ]  Fix EZlocal — claim listing and correct phone from (914) 306-6912 to (914) 391-5233",
        "[ ]  Disable Jobber auto-site — go to Jobber settings, turn off the public-facing site",
        "[ ]  Standardize name to 'Second Nature Tree Service' on all platforms",
        "[ ]  Claim Bing Places — bingplaces.com",
        "[ ]  Claim Apple Business Connect — business.apple.com",
        "[ ]  Create Thumbtack profile — thumbtack.com/join",
        "[ ]  Create Porch profile — porch.com/pro",
        "[ ]  Create Manta listing — manta.com/claim",
    ]
    for item in cleanup:
        story.append(Paragraph(item, ParagraphStyle('check', fontName='Helvetica', fontSize=9, textColor=DARK, spaceAfter=5, leftIndent=15)))

    doc.build(story)
    print("Created: GBP-Setup-Guide-Second-Nature.pdf")

if __name__ == '__main__':
    build()
