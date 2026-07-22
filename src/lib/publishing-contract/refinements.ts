/**
 * Zeig Publishing Contract — per-entry cross-field rules (the "thick system").
 *
 * These run at content-load time and validate a SINGLE entry in isolation.
 * Cross-entry / filesystem rules (reference resolution, related-not-self, duplicate
 * slugs, image dimensions/existence) live in the separate integrity step
 * (checkIntegrity), not here.
 */

import type { z } from 'zod';
import { policy } from './policy';

type KnowledgeShape = {
  status: string;
  author: string;
  reviewer?: string;
  reviewedDate?: Date;
  pubDate: Date;
  updatedDate?: Date;
  coverImage?: string;
  coverImageAlt?: string;
  imageSource?: string;
  imageApproved?: boolean;
};

/** superRefine callback applied to the knowledge frontmatter object. */
export function refineKnowledge(data: KnowledgeShape, ctx: z.RefinementCtx): void {
  // Review metadata is OPTIONAL for publishing (small team; byline is always the
  // Chloe brand identity; reviewer/editor/approver are recorded only when used and
  // are not exposed in the CMS). A future stricter gate (or Operon) can re-require
  // them. The self-review policy still applies *if* a reviewer is set.
  if (data.status === 'published' && !policy.allowSelfReview && data.reviewer && data.reviewer === data.author) {
    ctx.addIssue({
      code: 'custom',
      path: ['reviewer'],
      message: 'self-review is not permitted: reviewer must differ from author',
    });
  }

  // A cover image requires alt text. (imageSource defaults to 'original' in the
  // schema, so it is always present — no explicit requirement is needed here.)
  if (data.coverImage && !data.coverImageAlt) {
    ctx.addIssue({ code: 'custom', path: ['coverImageAlt'], message: 'coverImageAlt is required when coverImage is set' });
  }

  // AI-generated images must never auto-publish without explicit human approval.
  if (data.imageSource === 'ai_generated' && data.status === 'published' && data.imageApproved !== true) {
    ctx.addIssue({
      code: 'custom',
      path: ['imageApproved'],
      message: 'AI-generated images require imageApproved: true before status: published',
    });
  }

  // updatedDate cannot predate pubDate.
  if (data.updatedDate && data.updatedDate < data.pubDate) {
    ctx.addIssue({ code: 'custom', path: ['updatedDate'], message: 'updatedDate must be on or after pubDate' });
  }
}
