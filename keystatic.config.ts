import { config, collection, fields } from '@keystatic/core';

export default config({
  storage: {
    // Switch to { kind: 'github', repo: 'your-org/washingtonhotsprings.com' }
    // after connecting the GitHub repo in Keystatic Cloud
    kind: 'local',
  },
  collections: {
    blog: collection({
      label: 'Blog Posts',
      slugField: 'title',
      path: 'src/content/blog/*',
      format: { contentField: 'content' },
      schema: {
        title: fields.slug({ name: { label: 'Title' } }),
        publishedDate: fields.date({
          label: 'Published Date',
          validation: { isRequired: true },
        }),
        updatedDate: fields.date({ label: 'Updated Date' }),
        description: fields.text({
          label: 'Excerpt / Description',
          multiline: true,
          description: 'Used in cards and meta description if no SEO description set.',
        }),
        heroImage: fields.url({
          label: 'Hero Image URL',
          description: 'Unsplash or Cloudflare R2 URL',
        }),
        heroImageAlt: fields.text({ label: 'Hero Image Alt Text' }),
        heroImageCaption: fields.text({
          label: 'Hero Image Caption',
          multiline: true,
        }),
        tags: fields.array(fields.text({ label: 'Tag' }), {
          label: 'Tags',
          itemLabel: (props) => props.value || 'Tag',
        }),
        featured: fields.checkbox({
          label: 'Featured',
          defaultValue: false,
        }),
        seo: fields.object(
          {
            title: fields.text({ label: 'SEO Title' }),
            description: fields.text({
              label: 'SEO Description',
              multiline: true,
            }),
          },
          { label: 'SEO' }
        ),
        // Ghost migration traceability — hidden in UI but preserved in frontmatter
        ghostSlug: fields.text({ label: 'Ghost Slug (migration ref)' }),
        ghostId: fields.text({ label: 'Ghost ID (migration ref)' }),
        content: fields.mdx({ label: 'Content' }),
      },
    }),
  },
});
