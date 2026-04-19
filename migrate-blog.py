#!/usr/bin/env python3
"""Migrate soakcolorados blog MDX files into Astrogon format."""
import os
import re
import shutil

SRC_DIR = "/Users/chesterbeard/Desktop/soakcolorados/src/content/blog"
DST_DIR = "/Users/chesterbeard/Desktop/soakcolorados/astrogon/src/content/blog"

def convert_frontmatter(content, filename):
    """Convert soakcolorados frontmatter to Astrogon format."""
    # Extract frontmatter
    match = re.match(r'^---\n(.*?)\n---\n(.*)$', content, re.DOTALL)
    if not match:
        print(f"  SKIP: No frontmatter found in {filename}")
        return None

    fm_text = match.group(1)
    body = match.group(2)

    # Parse old frontmatter key-value pairs
    old_fm = {}
    for line in fm_text.split('\n'):
        line = line.strip()
        if not line or line.startswith('#'):
            continue
        # Handle array values like tags: []
        m = re.match(r'^(\w+):\s*(.*)', line)
        if m:
            key, val = m.group(1), m.group(2).strip()
            old_fm[key] = val

    # Build new frontmatter
    title = old_fm.get('title', '').strip('"').strip("'")
    description = old_fm.get('description', '').strip('"').strip("'")
    published_date = old_fm.get('publishedDate', '').strip('"').strip("'")
    updated_date = old_fm.get('updatedDate', '').strip('"').strip("'")
    hero_image = old_fm.get('heroImage', '').strip('"').strip("'")
    hero_image_alt = old_fm.get('heroImageAlt', '').strip('"').strip("'")
    hero_image_caption = old_fm.get('heroImageCaption', '').strip('"').strip("'")
    tags_raw = old_fm.get('tags', '[]')
    featured = old_fm.get('featured', 'false')
    ghost_slug = old_fm.get('ghostSlug', '').strip('"').strip("'")
    ghost_id = old_fm.get('ghostId', '').strip('"').strip("'")
    seo_title = old_fm.get('seo', '')  # nested, skip for now

    lines = []
    lines.append(f'title: "{title}"')
    if description:
        # Clean HTML entities from description
        description = description.replace('&amp;', '&').replace('&lt;', '<').replace('&gt;', '>')
        lines.append(f'description: "{description}"')
    if published_date:
        lines.append(f'date: {published_date}')
    if updated_date and updated_date != published_date:
        lines.append(f'updatedDate: {updated_date}')
    # heroImage is a URL, not a local asset - we'll skip image field and keep it as a comment
    # Astrogon's image field expects local assets, but URLs won't work with image()
    # We'll add heroImage as a custom field or handle it differently
    if hero_image:
        lines.append(f'imageAlt: "{hero_image_alt or title}"')
        if hero_image_caption:
            caption = hero_image_caption.replace('"', '\\"')
            lines.append(f'imageCaption: "{caption}"')
    # Tags
    tags = re.findall(r"'([^']*)'", tags_raw)
    if not tags:
        tags = re.findall(r'"([^"]*)"', tags_raw)
    if tags:
        lines.append(f'tags: {[t for t in tags]}')
    else:
        # Auto-categorize based on title
        lines.append('tags: ["colorado", "hot-springs"]')
    lines.append(f'featured: {featured}')
    lines.append('author: soak-colorado')
    if ghost_slug:
        lines.append(f'ghostSlug: "{ghost_slug}"')
    if ghost_id:
        lines.append(f'ghostId: "{ghost_id}"')

    new_fm = '\n'.join(lines)
    return f"---\n{new_fm}\n---\n{body}"


# Ensure destination exists
os.makedirs(DST_DIR, exist_ok=True)

# Copy the blog index file
src_index = os.path.join(DST_DIR, "-index.md")
# We'll update it separately

migrated = 0
skipped = 0

for fname in sorted(os.listdir(SRC_DIR)):
    if not fname.endswith(('.md', '.mdx')):
        continue

    src_path = os.path.join(SRC_DIR, fname)
    dst_path = os.path.join(DST_DIR, fname)

    with open(src_path, 'r') as f:
        content = f.read()

    result = convert_frontmatter(content, fname)
    if result:
        with open(dst_path, 'w') as f:
            f.write(result)
        migrated += 1
        print(f"  OK: {fname}")
    else:
        skipped += 1

print(f"\nMigrated {migrated} posts, skipped {skipped}")
