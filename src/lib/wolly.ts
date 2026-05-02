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

async function fetchAllBlogPages(): Promise<WollyPage[]> {
  const allPages: WollyPage[] = [];
  let offset = 0;
  const limit = 50;
  // WollyCMS content API caps at 50 per request; paginate to get all posts
  while (true) {
    const data = await fetchAPI(`/pages?type=blog&status=published&limit=${limit}&offset=${offset}`);
    const pages: WollyPage[] = (data.data || []).filter(
      (p: WollyPage) => p.fields?.site === SITE_SLUG
    );
    allPages.push(...pages);
    const total = data.meta?.total || 0;
    offset += limit;
    if (offset >= total) break;
  }
  return allPages;
}

export async function getWollyBlogEntries() {
  const pages = await fetchAllBlogPages();
  return pages.map(formatAsBlogEntry);
}

export async function getWollyBlogEntry(slug: string) {
  const data = await fetchAPI(`/pages?slug=${slug}&status=published`);
  const pages: WollyPage[] = (data.data || []).filter(
    (p: WollyPage) => p.fields?.site === SITE_SLUG
  );
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
