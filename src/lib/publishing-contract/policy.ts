/**
 * Zeig Publishing Contract — configurable policies.
 *
 * Policy is configuration, NOT contract shape. Producers don't read it; consumers
 * enforce it. Changing a value here is a deployment decision; changing the schema
 * shape is a version decision (see version.ts).
 */

import { SUPPORTED_VERSIONS } from './version';

export interface PublishingPolicy {
  /**
   * Whether an entry's author may also be its reviewer.
   *
   * Default *model* is author !== reviewer. Phase 0 = true (single reviewer).
   * LONG-TERM INTENT: false. Flip once a second reviewer exists. Do not rely on
   * self-review permanently.
   */
  allowSelfReview: boolean;
  /** Allowed root paths for cover/inline images. */
  approvedImageRoots: readonly string[];
  /** Allowed root paths for author avatars. */
  approvedAvatarRoots: readonly string[];
  /** Allowed image file extensions (lowercase, no dot). webp preferred. */
  allowedImageFormats: readonly string[];
  /** Exact required cover-image dimensions (enforced in the integrity step). */
  coverImage: { width: number; height: number };
  /** Max inline image width in px (enforced in the integrity step). */
  inlineImageMaxWidth: number;
  /** Contract versions this consumer accepts. */
  supportedVersions: readonly number[];
}

export const policy: PublishingPolicy = {
  allowSelfReview: true, // Phase 0 only — long-term intent: false.
  approvedImageRoots: ['/blog/'],
  approvedAvatarRoots: ['/team/'],
  allowedImageFormats: ['webp', 'jpg', 'jpeg', 'png'],
  coverImage: { width: 1200, height: 630 },
  inlineImageMaxWidth: 1600,
  supportedVersions: SUPPORTED_VERSIONS,
};

/** True if `path` sits under one of the approved roots. */
export function isUnderApprovedRoot(path: string, roots: readonly string[]): boolean {
  return roots.some((root) => path.startsWith(root));
}

/** True if `path` ends in an allowed image extension. */
export function hasAllowedImageFormat(path: string, formats = policy.allowedImageFormats): boolean {
  const lower = path.toLowerCase();
  return formats.some((ext) => lower.endsWith(`.${ext}`));
}
