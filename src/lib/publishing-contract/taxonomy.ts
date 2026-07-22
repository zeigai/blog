/**
 * Zeig Publishing Contract — fixed category taxonomy.
 *
 * URL slugs are STABLE (immutable for SEO). Display labels may evolve.
 * Adding a category is an additive (minor) change.
 *
 * The category LIST is the only deliberately site-specific value in the
 * contract (Zeig's editorial taxonomy differs from VeloxOps'); the mechanism
 * is identical.
 */

export const CATEGORIES = [
  { slug: 'market-analysis', label: 'Market Analysis' },
  { slug: 'product', label: 'Product' },
] as const;

export type CategorySlug = (typeof CATEGORIES)[number]['slug'];

export const CATEGORY_SLUGS = CATEGORIES.map((c) => c.slug) as [CategorySlug, ...CategorySlug[]];

export function categoryLabel(slug: string): string {
  return CATEGORIES.find((c) => c.slug === slug)?.label ?? slug;
}

/** Content asset types. Phase 0: only the knowledge article. Extendable. */
export const CONTENT_TYPES = ['knowledge-article'] as const;
export type ContentType = (typeof CONTENT_TYPES)[number];

/** Editorial status lifecycle. */
export const STATUSES = ['draft', 'in_review', 'approved', 'published', 'archived'] as const;
export type Status = (typeof STATUSES)[number];

/** Provenance origin classes. Extendable in future versions. */
export const ORIGINS = ['human', 'operon', 'imported'] as const;
export type Origin = (typeof ORIGINS)[number];

/** Image source classes. */
export const IMAGE_SOURCES = ['original', 'stock', 'ai_generated'] as const;
export type ImageSource = (typeof IMAGE_SOURCES)[number];
