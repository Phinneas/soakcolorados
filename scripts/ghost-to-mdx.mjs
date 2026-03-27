/**
 * Ghost JSON Export → Astro MDX Migration Script
 *
 * Usage:
 *   node scripts/ghost-to-mdx.mjs <path-to-ghost-export.json>
 *
 * Outputs:
 *   src/content/blog/<slug>.mdx  (one file per published post)
 *   public/_redirects            (301s from Ghost flat URLs → /blog/<slug>)
 *
 * Dependencies: none (pure Node.js, no npm installs needed)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Convert Ghost HTML to clean Markdown-compatible content.
 * Ghost HTML is already well-formed — we do targeted cleanup:
 *   - Remove empty <h1> tags Ghost injects at the top
 *   - Convert <figure>/<figcaption> to MDX-friendly format
 *   - Strip Ghost-specific bookmark cards and gallery cards
 *   - Preserve all real heading hierarchy
 */
function htmlToMdx(html = '') {
  // Remove Ghost's injected empty h1 at top
  html = html.replace(/<h1[^>]*>\s*<\/h1>/gi, '');

  // Strip Ghost card wrapper comments — MDX chokes on <!--kg-card-*-->
  html = html.replace(/<!--kg-card-begin:[^>]*-->/gi, '');
  html = html.replace(/<!--kg-card-end:[^>]*-->/gi, '');

  // Strip <script> blocks entirely (Ghost injects JSON-LD schema inside html cards)
  // MDX cannot render raw <script> tags inline
  html = html.replace(/<script[\s\S]*?<\/script>/gi, '');

  // Ghost bookmark cards — replace with a plain link paragraph
  html = html.replace(
    /<figure[^>]*kg-bookmark-card[^>]*>[\s\S]*?<a[^>]*href="([^"]+)"[^>]*>[\s\S]*?<\/figure>/gi,
    (_, url) => `<p><a href="${url}">${url}</a></p>`
  );

  // Ghost gallery cards — strip wrapper, keep inner imgs
  html = html.replace(
    /<figure[^>]*kg-gallery-card[^>]*>([\s\S]*?)<\/figure>/gi,
    (_, inner) => inner
  );

  // Figure + figcaption — keep as-is, MDX renders HTML natively
  // Just clean up Ghost's excessive classes
  html = html.replace(/ class="[^"]*kg-[^"]*"/gi, '');

  // Clean up residual empty paragraphs
  html = html.replace(/<p>\s*<\/p>/gi, '');

  // Trim
  return html.trim();
}

/**
 * Auto-generate a plain-text excerpt from HTML (first ~160 chars).
 * Used when Ghost custom_excerpt is absent.
 */
function autoExcerpt(html = '', maxLen = 160) {
  const plain = html
    .replace(/<[^>]+>/g, ' ')   // strip tags
    .replace(/\s+/g, ' ')        // collapse whitespace
    .trim();
  if (plain.length <= maxLen) return plain;
  // Don't cut mid-word
  const cut = plain.lastIndexOf(' ', maxLen);
  return plain.slice(0, cut > 0 ? cut : maxLen) + '…';
}

/**
 * Escape YAML string — wrap in double-quotes, escape inner quotes.
 */
function yamlStr(str = '') {
  if (!str) return '""';
  const escaped = str.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  return `"${escaped}"`;
}

/**
 * Format an ISO date string as YYYY-MM-DD.
 */
function isoDate(dateStr = '') {
  return dateStr ? dateStr.slice(0, 10) : '';
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const ghostExportPath = process.argv[2];
if (!ghostExportPath) {
  console.error('Usage: node scripts/ghost-to-mdx.mjs <path-to-ghost-export.json>');
  process.exit(1);
}

console.log(`\n📂 Reading Ghost export: ${ghostExportPath}\n`);

const raw = fs.readFileSync(ghostExportPath, 'utf-8');
const exportData = JSON.parse(raw);
const db = exportData.db[0].data;

// Pull tables we need
const posts = db.posts || [];
const postsMeta = db.posts_meta || [];
const postsTags = db.posts_tags || [];
const tags = db.tags || [];
const users = db.users || [];
const postsAuthors = db.posts_authors || [];

// Build lookup maps
const metaByPostId = Object.fromEntries(postsMeta.map((m) => [m.post_id, m]));
const tagMap = Object.fromEntries(tags.map((t) => [t.id, t.slug]));
const userMap = Object.fromEntries(users.map((u) => [u.id, u.slug]));

// Tag associations per post
const tagsByPostId = {};
for (const pt of postsTags) {
  if (!tagsByPostId[pt.post_id]) tagsByPostId[pt.post_id] = [];
  if (tagMap[pt.tag_id]) tagsByPostId[pt.post_id].push(tagMap[pt.tag_id]);
}

// Author associations per post
const authorsByPostId = {};
for (const pa of postsAuthors) {
  if (!authorsByPostId[pa.post_id]) authorsByPostId[pa.post_id] = [];
  if (userMap[pa.author_id]) authorsByPostId[pa.post_id].push(userMap[pa.author_id]);
}

// Filter to published posts only (excludes pages)
const publishedPosts = posts.filter(
  (p) => p.status === 'published' && p.type === 'post'
);

console.log(`✅ Found ${publishedPosts.length} published posts to migrate\n`);

// Ensure output directories exist
const blogDir = path.join(ROOT, 'src/content/blog');
const publicDir = path.join(ROOT, 'public');
fs.mkdirSync(blogDir, { recursive: true });
fs.mkdirSync(publicDir, { recursive: true });

// ─── Generate MDX files ───────────────────────────────────────────────────────

const redirectLines = [
  '# Ghost → Astro 301 redirects',
  '# Generated by scripts/ghost-to-mdx.mjs',
  '# Ghost published all posts at /{slug}/ (flat, trailing slash)',
  '# New structure: /blog/{slug} (no trailing slash)',
  '',
];

const migrationLog = [];

for (const post of publishedPosts) {
  const meta = metaByPostId[post.id] || {};
  const postTags = tagsByPostId[post.id] || [];
  const postAuthors = authorsByPostId[post.id] || [];

  const slug = post.slug;
  const title = post.title || '';
  const publishedDate = isoDate(post.published_at);
  const updatedDate = isoDate(post.updated_at);
  const heroImage = post.feature_image || '';
  const heroImageAlt = meta.feature_image_alt || '';

  // Strip HTML from caption for plain-text storage
  const rawCaption = meta.feature_image_caption || '';
  const heroImageCaption = rawCaption.replace(/<[^>]+>/g, '').trim();

  // Excerpt: custom_excerpt → auto-generate from HTML
  const description =
    post.custom_excerpt ||
    autoExcerpt(post.html || post.plaintext || '', 160);

  // SEO
  const seoTitle = meta.meta_title || '';
  const seoDescription = meta.meta_description || '';

  // Content: clean the HTML
  const bodyHtml = htmlToMdx(post.html || '');

  // Build frontmatter
  const fm = [
    '---',
    `title: ${yamlStr(title)}`,
    `publishedDate: "${publishedDate}"`,
    updatedDate ? `updatedDate: "${updatedDate}"` : null,
    `description: ${yamlStr(description)}`,
    heroImage ? `heroImage: ${yamlStr(heroImage)}` : null,
    heroImageAlt ? `heroImageAlt: ${yamlStr(heroImageAlt)}` : null,
    heroImageCaption ? `heroImageCaption: ${yamlStr(heroImageCaption)}` : null,
    `tags: [${postTags.map((t) => `"${t}"`).join(', ')}]`,
    `featured: ${post.featured ? 'true' : 'false'}`,
    (seoTitle || seoDescription)
      ? `seo:\n  title: ${yamlStr(seoTitle)}\n  description: ${yamlStr(seoDescription)}`
      : null,
    `ghostSlug: "${slug}"`,
    `ghostId: "${post.id}"`,
    '---',
  ]
    .filter(Boolean)
    .join('\n');

  // Full MDX file content
  const mdxContent = `${fm}\n\n${bodyHtml}\n`;

  const outPath = path.join(blogDir, `${slug}.mdx`);
  fs.writeFileSync(outPath, mdxContent, 'utf-8');

  // Add redirect entry: /{slug}/ → /blog/{slug}  (301)
  redirectLines.push(`/${slug}/  /blog/${slug}  301`);
  // Also redirect without trailing slash just in case
  redirectLines.push(`/${slug}  /blog/${slug}  301`);

  migrationLog.push({ slug, title, publishedDate, heroImage: !!heroImage });
  console.log(`  ✍️  ${slug}.mdx`);
}

// ─── Write _redirects ─────────────────────────────────────────────────────────

// Add author page redirect
redirectLines.push('');
redirectLines.push('# Author pages');
redirectLines.push('/author/*  /blog  301');
redirectLines.push('');
// Ghost tag pages
redirectLines.push('# Tag pages');
redirectLines.push('/tag/*  /blog  301');

const redirectsPath = path.join(publicDir, '_redirects');
fs.writeFileSync(redirectsPath, redirectLines.join('\n') + '\n', 'utf-8');

// ─── Summary ──────────────────────────────────────────────────────────────────

console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅  Migration complete!

  📝  ${migrationLog.length} MDX files → src/content/blog/
  🔀  ${migrationLog.length * 2} redirect rules → public/_redirects

  Posts without hero images : ${migrationLog.filter((p) => !p.heroImage).length}
  Posts with hero images    : ${migrationLog.filter((p) => p.heroImage).length}

Next steps:
  1. Run: npm run dev  (check blog renders)
  2. Verify redirects in Cloudflare Pages settings
  3. Submit updated sitemap to Google Search Console
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
