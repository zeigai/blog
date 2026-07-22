/**
 * Zeig Publishing Contract — reusable, composable field blocks.
 *
 * These blocks are content-type-agnostic by design: a future `case-study` or
 * `landing-page` type reuses the same SEO / CTA / source blocks verbatim.
 * Plain `zod` only — no Astro/website imports.
 */

import { z } from 'zod';
import { ORIGINS, IMAGE_SOURCES } from './taxonomy';
import { policy, isUnderApprovedRoot, hasAllowedImageFormat } from './policy';

/** URL-safe slug: lowercase, hyphen-separated. */
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const slugString = z
  .string()
  .regex(SLUG_PATTERN, 'must be URL-safe (lowercase, digits, single hyphens)');

/** Normalize a free-form label into a URL-safe slug (lowercase, hyphenated). */
export function toSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Tag list — author-friendly: tags are free-form labels that are AUTO-NORMALIZED
 * to slugs (e.g. "Automation" → "automation", "Audit Trail" → "audit-trail"),
 * de-duplicated, and empties dropped. We normalize rather than reject so a build
 * never fails on tag casing/spacing (Pages CMS can't validate tag format inline).
 */
export const tagList = z
  .array(z.string())
  .default([])
  .transform((arr) => [...new Set(arr.map(toSlug).filter(Boolean))]);

/** Reusable SEO block. */
export const seoBlock = z
  .object({
    metaTitle: z.string().max(60, 'metaTitle should be <= 60 chars').optional(),
    metaDescription: z
      .string()
      .min(50, 'metaDescription should be >= 50 chars')
      .max(160, 'metaDescription should be <= 160 chars')
      .optional(),
    // Empty string = "use own URL"; otherwise a valid absolute URL.
    canonicalUrl: z.union([z.string().url(), z.literal('')]).default(''),
    noindex: z.boolean().default(false),
    ogType: z.string().default('article'),
  })
  .default({});

/** Reusable CTA block. Defaults to the site-wide standard. */
export const ctaBlock = z
  .object({
    label: z.string().default('Explore Zeig'),
    href: z.string().default('https://zeig.ai'),
  })
  .default({ label: 'Explore Zeig', href: 'https://zeig.ai' });

/**
 * Reusable provenance block — the key to multi-producer interoperability.
 * Defaults to a human origin so hand/CMS authors don't deal with provenance
 * plumbing; producers like Operon set these explicitly.
 */
export const sourceBlock = z
  .object({
    origin: z.enum(ORIGINS).default('human'),
    originId: z.string().optional(),
    originSystem: z.string().optional(),
  })
  .default({});

/** A content-image path: must sit under an approved root and use an allowed format. */
export const contentImagePath = z
  .string()
  .refine(
    (p) => isUnderApprovedRoot(p, policy.approvedImageRoots),
    (p) => ({ message: `image path "${p}" is not under an approved root (${policy.approvedImageRoots.join(', ')})` }),
  )
  .refine(
    (p) => hasAllowedImageFormat(p),
    (p) => ({ message: `image "${p}" has an unsupported format (allowed: ${policy.allowedImageFormats.join(', ')})` }),
  );

/** An avatar path: must sit under an approved avatar root and use an allowed format. */
export const avatarImagePath = z
  .string()
  .refine(
    (p) => isUnderApprovedRoot(p, policy.approvedAvatarRoots),
    (p) => ({ message: `avatar path "${p}" is not under an approved root (${policy.approvedAvatarRoots.join(', ')})` }),
  )
  .refine(
    (p) => hasAllowedImageFormat(p),
    (p) => ({ message: `avatar "${p}" has an unsupported format (allowed: ${policy.allowedImageFormats.join(', ')})` }),
  );
