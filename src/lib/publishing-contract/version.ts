/**
 * Zeig Publishing Contract — version constants.
 *
 * Mirrored 1:1 from the VeloxOps Publishing Contract (VeloxOps_Site
 * src/lib/publishing-contract) — same fields, same rules, so the same authors
 * and the same producers (Operon) work identically against both blogs.
 * Framework-agnostic. No website/Astro imports.
 */

/** The contract version this codebase emits/expects. */
export const CONTENT_MODEL_VERSION = 1 as const;

/** Versions a consumer will accept. Grows during a migration window, never silently. */
export const SUPPORTED_VERSIONS: readonly number[] = [1];

export function isSupportedVersion(v: number): boolean {
  return SUPPORTED_VERSIONS.includes(v);
}
