// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  server: { port: 4321 },
  adapter: node({
    mode: 'standalone',
  }),
  vite: {
    ssr: {
      external: ['@prisma/client'],
    },
  },
});
