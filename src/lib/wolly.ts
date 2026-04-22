const CMS_API_URL = import.meta.env.CMS_API_URL || "https://wollycms.buzzuw2.workers.dev/api/content";
const SITE_SLUG = "soakcolorados";

interface WollyPage {
  id: number;
  title: string;
  slug: string;
  status: string;
  fields: Record<string, any>;
  meta: { created_at: string; updated_at: string; published_at: string | null };
}

async function fetchAPI(path: string) {
  const res = await fetch(`${CMS_API_URL}${path}`);
  if (!res.ok) throw new Error(`WollyCMS API error: ${res.status}`);
  return res.json();
}

export async function getWollyBlogEntries() {
  const data = await fetchAPI(`/pages?type=blog&site=${SITE_SLUG}&status=published&limit=200`);
  const pages: WollyPage[] = data.data || [];
  return pages.map(formatAsBlogEntry);
}

export async function getWollyBlogEntry(slug: string) {
  const data = await fetchAPI(`/pages?slug=${slug}&site=${SITE_SLUG}&status=published`);
  const pages: WollyPage[] = data.data || [];
  if (pages.length === 0) return null;
  return formatAsBlogEntry(pages[0]);
}

function formatAsBlogEntry(page: WollyPage) {
  return {
    id: page.slug,
    collection: "blog",
    data: {
      title: page.title,
      description: page.fields.excerpt || "",
      date: page.meta.published_at || page.meta.created_at,
      image: page.fields.featured_image ? { src: page.fields.featured_image } : undefined,
      categories: page.fields.categories || [],
      tags: page.fields.tags || [],
      draft: page.status !== "published",
    },
    body: page.fields.body || "",
    slug: page.slug,
    render() {
      const body = page.fields.body || "";
      return {
        Content: {
          render() {
            return { html: body };
          },
        },
        headings: extractHeadings(body),
      };
    },
  };
}

function extractHeadings(markdown: string) {
  const headings: { depth: number; slug: string; text: string }[] = [];
  const lines = markdown.split("\n");
  for (const line of lines) {
    const match = line.match(/^(#{1,3})\s+(.+)/);
    if (match) {
      const depth = match[1].length;
      const text = match[2].replace(/[*_`#]/g, "").trim();
      const slug = text.toLowerCase().replace(/[^\w]+/g, "-").replace(/^-|-$/g, "");
      headings.push({ depth, slug, text });
    }
  }
  return headings;
}
