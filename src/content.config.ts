/**
 * Astro content collections.
 *
 * This file is the WEBSITE'S ADAPTER onto the Zeig Publishing Contract — it
 * binds the framework-agnostic schemas (src/lib/publishing-contract) to Astro's
 * content layer. The contract itself knows nothing about Astro or this website.
 */

import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { knowledgeSchema, authorSchema } from './lib/publishing-contract';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: knowledgeSchema,
});

const authors = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/authors' }),
  schema: authorSchema,
});

export const collections = { blog, authors };
