import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    title: z.string().min(1).max(80),
    description: z.string().min(1).max(200),
    pubDatetime: z.coerce.date(),
    updatedDatetime: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    category: z.string().optional(),
    draft: z.boolean().default(false),
    math: z.boolean().default(false),
    mermaid: z.boolean().default(false),
  }),
});

export const collections = { blog };
