#!/usr/bin/env python3
"""
Social Media Post Generator for Second Nature Tree Service
===========================================================
Reads image/video files + matching .txt descriptions from new-posts/
and generates ready-to-schedule social media captions.

Usage: python3 generate_posts.py
  or: ask Claude to "generate posts from my new-posts folder"
"""

import os
import sys
import random
from pathlib import Path

PHONE = "(914) 391-5233"
WEBSITE = "peekskilltree.com"
BUSINESS = "Second Nature Tree Service"

# Hashtag pools by service type (detected from description keywords)
HASHTAG_POOLS = {
    "removal": ["#TreeRemoval", "#TreeFelling", "#SafeTreeRemoval", "#HazardousTree"],
    "pruning": ["#TreePruning", "#TreeTrimming", "#CrownThinning", "#TreeCare", "#ProfessionalTreeCare"],
    "stump": ["#StumpGrinding", "#StumpRemoval", "#BanditGrinder", "#YardCleanup"],
    "emergency": ["#EmergencyTreeRemoval", "#StormDamage", "#StormCleanup", "#24HourService"],
    "land": ["#LandClearing", "#LotClearing", "#SitePrep", "#PropertyDevelopment"],
    "climbing": ["#TreeClimber", "#ArboristLife", "#RopeWork", "#Rigging", "#TreeClimbing"],
    "rigging": ["#TreeRigging", "#Rigging", "#CarefulWork", "#ProfessionalTreeCare"],
    "crane": ["#CraneRemoval", "#HeavyEquipment", "#TreeRemoval"],
    "bucket": ["#BucketTruck", "#TreeService", "#ProfessionalTreeService"],
}

ALWAYS_TAGS = ["#Peekskill", "#WestchesterNY", "#TreeService", "#SecondNatureTree", "#HudsonValley", "#NorthernWestchester"]

# Town hashtag mapping
TOWN_TAGS = {
    "yorktown": "#Yorktown", "cortlandt": "#CortlandtManor", "ossining": "#Ossining",
    "croton": "#CrotonOnHudson", "peekskill": "#Peekskill", "garrison": "#Garrison",
    "cold spring": "#ColdSpring", "mahopac": "#Mahopac", "somers": "#Somers",
    "katonah": "#Katonah", "bedford": "#Bedford", "chappaqua": "#Chappaqua",
    "lewisboro": "#Lewisboro", "pound ridge": "#PoundRidge", "armonk": "#Armonk",
    "mount kisco": "#MountKisco", "briarcliff": "#BriarcliffManor",
    "putnam valley": "#PutnamValley", "north salem": "#NorthSalem",
    "pleasantville": "#Pleasantville", "buchanan": "#Buchanan",
}

IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".heic", ".webp"}
VIDEO_EXTS = {".mov", ".mp4", ".m4v", ".avi"}


def detect_service(description):
    """Detect service type from description text."""
    desc = description.lower()
    services = []
    if any(w in desc for w in ["remov", "fell", "took down", "take down", "cut down", "dropped"]):
        services.append("removal")
    if any(w in desc for w in ["prun", "trim", "crown", "deadwood", "thin"]):
        services.append("pruning")
    if any(w in desc for w in ["stump", "grind"]):
        services.append("stump")
    if any(w in desc for w in ["emergency", "storm", "fallen", "came down", "urgent"]):
        services.append("emergency")
    if any(w in desc for w in ["land", "clearing", "lot", "excavat"]):
        services.append("land")
    if any(w in desc for w in ["climb", "rope", "pov", "harness", "ascend"]):
        services.append("climbing")
    if any(w in desc for w in ["rig", "lower"]):
        services.append("rigging")
    if any(w in desc for w in ["crane"]):
        services.append("crane")
    if any(w in desc for w in ["bucket"]):
        services.append("bucket")
    if not services:
        services.append("removal")  # default
    return services


def detect_town(description):
    """Detect town mention in description."""
    desc = description.lower()
    for town, tag in TOWN_TAGS.items():
        if town in desc:
            return tag
    return None


def build_hashtags(services, description):
    """Build hashtag string from detected services."""
    tags = list(ALWAYS_TAGS)
    for svc in services:
        pool = HASHTAG_POOLS.get(svc, [])
        tags.extend(pool[:3])  # take up to 3 from each service pool
    town_tag = detect_town(description)
    if town_tag and town_tag not in tags:
        tags.insert(0, town_tag)
    # deduplicate while preserving order
    seen = set()
    unique = []
    for t in tags:
        if t not in seen:
            seen.add(t)
            unique.append(t)
    return " ".join(unique[:15])  # cap at 15 hashtags


def generate_caption(description, filename):
    """Generate a full social media caption from a one-line description."""
    services = detect_service(description)
    hashtags = build_hashtags(services, description)
    is_video = Path(filename).suffix.lower() in VIDEO_EXTS

    media_note = "[VIDEO]" if is_video else "[PHOTO]"

    caption = f"""{description}

Free estimates: {PHONE}
{WEBSITE}

{hashtags}"""

    return caption, media_note


def main():
    posts_dir = Path(__file__).parent / "new-posts"

    if not posts_dir.exists():
        print(f"No new-posts/ folder found at {posts_dir}")
        sys.exit(1)

    # Find all media files
    media_files = []
    for f in sorted(posts_dir.iterdir()):
        if f.suffix.lower() in IMAGE_EXTS | VIDEO_EXTS:
            media_files.append(f)

    if not media_files:
        print("No images or videos found in new-posts/")
        print("Drop your photos/videos there with matching .txt description files.")
        sys.exit(0)

    print(f"\n{'='*60}")
    print(f"  SECOND NATURE TREE — Social Media Posts Generator")
    print(f"  Found {len(media_files)} media file(s) in new-posts/")
    print(f"{'='*60}\n")

    for i, media in enumerate(media_files, 1):
        txt_file = media.with_suffix(".txt")
        if txt_file.exists():
            description = txt_file.read_text().strip().strip('"').strip("'")
        else:
            print(f"  SKIPPED: {media.name} — no matching .txt file")
            print(f"  Create: {txt_file.name} with a one-line description\n")
            continue

        caption, media_note = generate_caption(description, media.name)

        print(f"--- POST {i} {media_note} ---")
        print(f"File: {media.name}")
        print(f"")
        print(caption)
        print(f"\n")

    print(f"{'='*60}")
    print(f"  Schedule: Tuesday & Friday at 10:00 AM")
    print(f"  Platforms: Facebook, Instagram, Google Business")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    main()
