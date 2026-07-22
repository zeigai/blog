/**
 * Zeig Publishing Contract — `knowledge-article` content type (v1).
 *
 * Mirrored 1:1 from the VeloxOps Publishing Contract so the same authors and
 * producers (Operon) work identically against both blogs. Composed from the
 * reusable blocks so future types (case-study, landing-page, …) can reuse them.
 * Plain `zod` only — framework-agnostic.
 */

import { z } from 'zod';
import { CONTENT_MODEL_VERSION, isSupportedVersion } from './version';
import { CATEGORY_SLUGS, CONTENT_TYPES, STATUSES, IMAGE_SOURCES } from './taxonomy';
import { slugString, tagList, seoBlock, ctaBlock, sourceBlock, contentImagePath } from './blocks';
import { refineKnowledge } from './refinements';

/** The raw object schema (no cross-field refinements) — used for JSON Schema export. */
export const knowledgeObject = z.object({
  // Identity & versioning
  contentModelVersion: z
    .number()
    .int()
    .refine(isSupportedVersion, (v) => ({ message: `unsupported contentModelVersion: ${v}` }))
    .default(CONTENT_MODEL_VERSION),
  contentType: z.enum(CONTENT_TYPES).default('knowledge-article'),
  title: z.string().min(1).max(120),
  slug: slugString.optional(),
  description: z
    .string()
    .min(50, 'description should be >= 50 chars')
    .max(160, 'description should be <= 160 chars'),
  pubDate: z.coerce.date(),
  updatedDate: z.coerce.date().optional(),

  // Editorial / workflow (references are slug strings; resolution is an integrity-step check)
  // New entries default to draft — authors can never accidentally publish on create.
  status: z.enum(STATUSES).default('draft'),
  // Public byline. Defaults to the Zeig brand identity (Chloe). Must reference
  // a PUBLIC author (enforced in the integrity step).
  author: slugString.default('chloe'),
  // Internal governance metadata — NEVER rendered publicly.
  reviewer: slugString.optional(),
  reviewedDate: z.coerce.date().optional(),
  editor: slugString.optional(),
  approver: slugString.optional(),
  approvedDate: z.coerce.date().optional(),

  // Taxonomy & linking
  category: z.enum(CATEGORY_SLUGS),
  tags: tagList, // free-form labels, auto-normalized to slugs (never fails the build)
  related: z.array(slugString).default([]),

  // Reusable SEO block
  seo: seoBlock,

  // Visuals
  coverImage: contentImagePath.optional(),
  coverImageAlt: z.string().min(1).max(160).optional(),
  coverImageCredit: z.string().optional(),
  // Defaults to 'original' so a cover added via the CMS (which does NOT write
  // imageSource) never fails the build for a missing source. Set explicitly to
  // 'stock' or 'ai_generated' when that's the case (ai_generated still gates
  // publish on imageApproved via refinements).
  imageSource: z.enum(IMAGE_SOURCES).default('original'),
  imageApproved: z.boolean().optional(),

  // Reusable CTA block
  cta: ctaBlock,

  // Reusable provenance block
  source: sourceBlock,
});

/** The enforced schema (object + per-entry cross-field rules). Use this for validation. */
export const knowledgeSchema = knowledgeObject.superRefine(refineKnowledge);

export type KnowledgeFrontmatter = z.infer<typeof knowledgeObject>;
