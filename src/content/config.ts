import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    publishedDate: z.string(), // ISO date string e.g. "2025-07-29"
    updatedDate: z.string().optional(),
    description: z.string().optional(), // auto-generated excerpt
    heroImage: z.string().optional(),   // Unsplash URL or R2 URL
    heroImageAlt: z.string().optional(),
    heroImageCaption: z.string().optional(),
    tags: z.array(z.string()).default([]),
    featured: z.boolean().default(false),
    seo: z
      .object({
        title: z.string().optional(),
        description: z.string().optional(),
      })
      .optional(),
    // Ghost migration metadata — kept for traceability
    ghostSlug: z.string().optional(),
    ghostId: z.string().optional(),
  }),
});

export const collections = { blog };
