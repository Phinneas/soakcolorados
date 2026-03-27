// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import mdx from '@astrojs/mdx';
import keystatic from '@keystatic/astro';

// https://astro.build/config
export default defineConfig({
  output: 'static', // static by default; API routes + Keystatic admin opt into SSR with prerender = false
  adapter: cloudflare({
    platformProxy: { enabled: true },
    sessionKVBindingName: undefined, // disable auto-session, we don't use Astro sessions
    imageService: 'compile',         // sharp at build time, not runtime
  }),
  integrations: [
    mdx(),
    keystatic(),
  ],
  trailingSlash: 'never',
  site: 'https://www.soakcolorado.com',
});
