import { getViteConfig } from 'astro/config';
import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));

const astroConfig = getViteConfig(
  {
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        '@components': fileURLToPath(new URL('./src/components', import.meta.url)),
        '@layouts': fileURLToPath(new URL('./src/layouts', import.meta.url)),
        '@utils': fileURLToPath(new URL('./src/utils', import.meta.url)),
        '@consts': fileURLToPath(new URL('./src/consts.ts', import.meta.url)),
      },
    },
  },
  { root },
);

export default defineConfig(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async (env: any) => {
    const base = await astroConfig(env);
    return {
      ...base,
      test: {
        environment: 'happy-dom',
        include: ['tests/**/*.test.ts'],
        globals: true,
      },
    };
  },
);
