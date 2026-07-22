/**
 * Zeig Publishing Contract — cross-entry / filesystem integrity rules.
 *
 * These are the rules a single-entry schema cannot express: reference
 * resolution, related-not-self, duplicate slugs, and image dimension/existence.
 *
 * PURE & framework-agnostic: no fs, no Astro, no image library. The caller injects
 * how to probe an image (`probeImage`); inline image refs are extracted here as
 * plain string parsing. This keeps the contract reusable — a different consumer
 * just wires a different probe.
 */

import { policy, isUnderApprovedRoot, hasAllowedImageFormat } from './policy';
import type { KnowledgeFrontmatter } from './knowledge';

export interface KnowledgeEntry {
  /** Effective slug = frontmatter.slug ?? filename id. */
  slug: string;
  /** Display path for error messages. */
  file: string;
  data: KnowledgeFrontmatter;
  /** Raw markdown body (for inline image extraction). */
  body: string;
}

export interface ProbeResult {
  exists: boolean;
  width?: number;
  height?: number;
  error?: string;
}

/** Caller-supplied image probe: given a public-rooted path (e.g. /blog/x/cover.webp). */
export type ImageProbe = (publicPath: string) => ProbeResult;

export interface IntegrityError {
  file: string;
  rule: string;
  message: string;
}

/** Extract inline markdown images: returns { alt, src } for each `![alt](src)`. */
export function extractInlineImages(body: string): Array<{ alt: string; src: string }> {
  const re = /!\[([^\]]*)\]\(\s*([^)\s]+)(?:\s+["'][^"']*["'])?\s*\)/g;
  const out: Array<{ alt: string; src: string }> = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(body)) !== null) {
    out.push({ alt: m[1] ?? '', src: m[2] ?? '' });
  }
  return out;
}

export function checkIntegrity(
  entries: readonly KnowledgeEntry[],
  authors: ReadonlyMap<string, { visibility: 'public' | 'internal' }>,
  probeImage: ImageProbe,
): IntegrityError[] {
  const errors: IntegrityError[] = [];
  const slugSet = new Set(entries.map((e) => e.slug));
  const authorIds = new Set(authors.keys());
  const isPublic = (id: string) => authors.get(id)?.visibility === 'public';

  // Duplicate slug detection (global, all entries).
  const slugCounts = new Map<string, string[]>();
  for (const e of entries) {
    const list = slugCounts.get(e.slug) ?? [];
    list.push(e.file);
    slugCounts.set(e.slug, list);
  }
  for (const [slug, files] of slugCounts) {
    if (files.length > 1) {
      errors.push({
        file: files.join(', '),
        rule: 'duplicate-slug',
        message: `slug "${slug}" is used by ${files.length} entries; slugs must be unique`,
      });
    }
  }

  for (const e of entries) {
    const { data, file } = e;

    // Author must resolve AND be a public author (no internal byline leakage).
    if (!authorIds.has(data.author)) {
      errors.push({ file, rule: 'missing-author', message: `author "${data.author}" not found in the authors collection` });
    } else if (!isPublic(data.author)) {
      errors.push({ file, rule: 'non-public-author', message: `author "${data.author}" is an internal user and cannot be a public byline (use a public author such as "chloe")` });
    }

    // Internal references (if set) must resolve. These are governance-only.
    for (const [field, value] of [
      ['reviewer', data.reviewer],
      ['editor', data.editor],
      ['approver', data.approver],
    ] as const) {
      if (value && !authorIds.has(value)) {
        errors.push({ file, rule: `invalid-${field}`, message: `${field} "${value}" not found in the authors collection` });
      }
    }

    // Related links resolve and exclude self.
    for (const rel of data.related ?? []) {
      if (rel === e.slug) {
        errors.push({ file, rule: 'related-self', message: `related includes the entry itself ("${rel}")` });
      } else if (!slugSet.has(rel)) {
        errors.push({ file, rule: 'broken-related', message: `related link "${rel}" does not resolve to any blog entry` });
      }
    }

    // Cover image existence + exact dimensions.
    if (data.coverImage) {
      const probe = probeImage(data.coverImage);
      if (!probe.exists) {
        errors.push({ file, rule: 'missing-cover-image', message: `coverImage "${data.coverImage}" not found on disk${probe.error ? ` (${probe.error})` : ''}` });
      } else if (probe.width != null && probe.height != null) {
        const { width, height } = policy.coverImage;
        if (probe.width !== width || probe.height !== height) {
          errors.push({
            file,
            rule: 'cover-dimensions',
            message: `coverImage "${data.coverImage}" is ${probe.width}x${probe.height}, expected ${width}x${height}`,
          });
        }
      }
    }

    // Inline images — alt required, approved path/format, exists, width bound.
    for (const img of extractInlineImages(e.body)) {
      // Only validate local (site-rooted) images.
      if (!img.src.startsWith('/')) continue;
      if (img.alt.trim() === '') {
        errors.push({ file, rule: 'inline-image-alt', message: `inline image "${img.src}" is missing alt text` });
      }
      if (!isUnderApprovedRoot(img.src, policy.approvedImageRoots)) {
        errors.push({ file, rule: 'inline-image-path', message: `inline image "${img.src}" is not under an approved root (${policy.approvedImageRoots.join(', ')})` });
        continue;
      }
      if (!hasAllowedImageFormat(img.src)) {
        errors.push({ file, rule: 'inline-image-format', message: `inline image "${img.src}" has an unsupported format (allowed: ${policy.allowedImageFormats.join(', ')})` });
        continue;
      }
      const probe = probeImage(img.src);
      if (!probe.exists) {
        errors.push({ file, rule: 'missing-inline-image', message: `inline image "${img.src}" not found on disk${probe.error ? ` (${probe.error})` : ''}` });
      } else if (probe.width != null && probe.width > policy.inlineImageMaxWidth) {
        errors.push({ file, rule: 'inline-image-width', message: `inline image "${img.src}" is ${probe.width}px wide, exceeds max ${policy.inlineImageMaxWidth}px` });
      }
    }
  }

  return errors;
}
