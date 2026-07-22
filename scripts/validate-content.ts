/**
 * Mandatory content gate. Runs at `prebuild` (so it blocks every production build,
 * incl. the GitHub Actions deploy) and standalone via `npm run validate:content`.
 *
 * Two layers, both fatal:
 *   1. Per-entry schema (the contract's zod schema) — structural + conditional rules.
 *   2. Integrity (checkIntegrity) — references, related-self, duplicate slugs,
 *      image existence/dimensions.
 *
 * Exits non-zero with explicit, file-scoped errors. Never modifies anything.
 */

import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { resolve, dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import imageSize from 'image-size';
import {
  knowledgeSchema,
  authorSchema,
  checkIntegrity,
  type KnowledgeEntry,
  type IntegrityError,
  type ProbeResult,
} from '../src/lib/publishing-contract/index';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BLOG_DIR = resolve(root, 'src/content/blog');
const AUTHORS_DIR = resolve(root, 'src/content/authors');
const PUBLIC_DIR = resolve(root, 'public');

type Issue = { file: string; field: string; message: string };
const issues: Issue[] = [];

function walk(dir: string, ext: string): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walk(full, ext));
    else if (name.toLowerCase().endsWith(ext)) out.push(full);
  }
  return out;
}

const rel = (p: string) => relative(root, p).replace(/\\/g, '/');
const baseName = (p: string, ext: string) => p.split(/[\\/]/).pop()!.slice(0, -ext.length);

// --- Authors -----------------------------------------------------------------
const authors = new Map<string, { visibility: 'public' | 'internal' }>();
for (const file of walk(AUTHORS_DIR, '.json')) {
  const id = baseName(file, '.json');
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(file, 'utf8'));
  } catch (e) {
    authors.set(id, { visibility: 'internal' });
    issues.push({ file: rel(file), field: '(json)', message: `invalid JSON: ${(e as Error).message}` });
    continue;
  }
  const parsed = authorSchema.safeParse(raw);
  if (!parsed.success) {
    authors.set(id, { visibility: 'internal' });
    for (const i of parsed.error.issues) {
      issues.push({ file: rel(file), field: i.path.join('.') || '(root)', message: i.message });
    }
    continue;
  }
  authors.set(id, { visibility: parsed.data.visibility });
}

// --- Blog posts ----------------------------------------------------------------
const entries: KnowledgeEntry[] = [];
for (const file of walk(BLOG_DIR, '.md')) {
  const id = baseName(file, '.md');
  const fm = matter(readFileSync(file, 'utf8'));
  const parsed = knowledgeSchema.safeParse(fm.data);
  if (!parsed.success) {
    for (const i of parsed.error.issues) {
      issues.push({ file: rel(file), field: i.path.join('.') || '(root)', message: i.message });
    }
    continue; // can't run integrity on an invalid entry
  }
  entries.push({ slug: parsed.data.slug ?? id, file: rel(file), data: parsed.data, body: fm.content });
}

// --- Image probe -------------------------------------------------------------
const probeImage = (publicPath: string): ProbeResult => {
  const full = join(PUBLIC_DIR, publicPath.replace(/^\//, ''));
  if (!existsSync(full)) return { exists: false };
  try {
    const dims = imageSize(readFileSync(full));
    return { exists: true, width: dims.width, height: dims.height };
  } catch (e) {
    return { exists: true, error: (e as Error).message };
  }
};

// --- Integrity ---------------------------------------------------------------
const integrityErrors: IntegrityError[] = checkIntegrity(entries, authors, probeImage);

// --- Report ------------------------------------------------------------------
const total = issues.length + integrityErrors.length;
if (total === 0) {
  console.log(`✓ content valid — ${entries.length} blog entr${entries.length === 1 ? 'y' : 'ies'}, ${authors.size} author(s)`);
  process.exit(0);
}

console.error(`\n✗ content validation failed — ${total} error(s):\n`);
if (issues.length) {
  console.error('  Schema errors:');
  for (const i of issues) console.error(`    ${i.file} → ${i.field}: ${i.message}`);
}
if (integrityErrors.length) {
  console.error('  Integrity errors:');
  for (const e of integrityErrors) console.error(`    ${e.file} [${e.rule}]: ${e.message}`);
}
console.error('');
process.exit(1);
