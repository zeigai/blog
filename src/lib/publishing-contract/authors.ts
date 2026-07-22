/**
 * Zeig Publishing Contract — `authors` collection (v1).
 *
 * author/reviewer references in blog entries resolve to entries here.
 * Plain `zod` only — framework-agnostic.
 */

import { z } from 'zod';
import { avatarImagePath } from './blocks';

export const AUTHOR_ROLES = ['author', 'reviewer', 'editor'] as const;
export type AuthorRole = (typeof AUTHOR_ROLES)[number];

export const AUTHOR_VISIBILITY = ['public', 'internal'] as const;
export type AuthorVisibility = (typeof AUTHOR_VISIBILITY)[number];

export const authorObject = z.object({
  name: z.string().min(1),
  role: z.enum(AUTHOR_ROLES),
  /**
   * Public author = a byline shown on the website (a Zeig brand identity,
   * e.g. Chloe). Internal = reviewer/editor/approver used for governance only,
   * never rendered publicly. Defaults to internal so people are private by default.
   */
  visibility: z.enum(AUTHOR_VISIBILITY).default('internal'),
  bio: z.string().optional(),
  avatar: avatarImagePath.optional(),
  avatarAlt: z.string().optional(),
  links: z.array(z.object({ label: z.string(), href: z.string() })).optional(),
});

export const authorSchema = authorObject.superRefine((data, ctx) => {
  if (data.avatar && !data.avatarAlt) {
    ctx.addIssue({ code: 'custom', path: ['avatarAlt'], message: 'avatarAlt is required when avatar is set' });
  }
});

export type Author = z.infer<typeof authorObject>;
