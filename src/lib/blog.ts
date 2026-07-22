/**
 * Website-side query helpers over the `blog` collection.
 *
 * This is CONSUMER/adapter code (it may import astro:content). It reads content
 * that already satisfies the framework-agnostic publishing contract
 * (src/lib/publishing-contract) — it does not define or validate the contract.
 */

import { getCollection, type CollectionEntry } from 'astro:content';
import { categoryLabel } from './publishing-contract';

export type BlogEntry = CollectionEntry<'blog'>;
export type AuthorEntry = CollectionEntry<'authors'>;

/** Effective slug = explicit frontmatter slug, else the file id. */
export function entrySlug(entry: BlogEntry): string {
  return entry.data.slug ?? entry.id;
}

export function postUrl(entry: BlogEntry): string {
  return `/blog/${entrySlug(entry)}/`;
}

/** Visible on the live site: published and not future-dated. */
export function isPublished(entry: BlogEntry): boolean {
  return entry.data.status === 'published' && entry.data.pubDate.getTime() <= Date.now();
}

/** All published posts, newest first. */
export async function getPublishedPosts(): Promise<BlogEntry[]> {
  const all = await getCollection('blog');
  return all
    .filter(isPublished)
    .sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime());
}

/** Resolve an author entry by id (or undefined). */
export async function getAuthor(id: string): Promise<AuthorEntry | undefined> {
  const all = await getCollection('authors');
  return all.find((a) => a.id === id);
}

export { categoryLabel };

/** Short, locale-stable date for display. */
export function formatDate(d: Date): string {
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}
