# Zeig Blog

The Zeig blog (`blog.zeig.ai`) — a standalone Astro site. Content is managed via
[Pages CMS](https://pagescms.org) on top of this repo; **git is the system of record**.

## Content model

The frontmatter schema is the **Zeig Publishing Contract**
(`src/lib/publishing-contract/`), mirrored 1:1 from the VeloxOps Publishing
Contract so the same authors get the same editing experience on both sites and
the same producers (Operon) can write to both repos. Only the category taxonomy,
image roots (`/blog/`), the public byline (Chloe), and the CTA default are
site-specific.

- `.pages.yml` defines the Pages CMS author form (11 fields). All other contract
  fields are auto-defaulted at build or set programmatically via git — never by
  the CMS.
- Posts live in `src/content/blog/*.md`; authors in `src/content/authors/*.json`
  (git-managed, not in the CMS). The public byline is always **Chloe**; real
  people are internal governance entries only.

## Publishing pipeline

```
Author (Pages CMS, on main) ──▶ commit to main
                                   ▼
                     GitHub Actions build (npm run build)
                     │  prebuild = mandatory content validator
                     ▼
                live at blog.zeig.ai  (~1–2 min, if the build passes)
```

- **Publish = set Status → Published and Save.** Draft / Ready for review /
  Archived posts never appear on the live site (excluded from pages, index, RSS,
  and sitemap; future-dated posts are also held back).
- **Every build runs `npm run validate:content` first.** Invalid content fails
  the build and nothing ships — the previous version stays live. Pages CMS does
  not surface build failures: if a publish doesn't appear within a few minutes,
  check the repo's Actions tab (or run `npm run validate:content` locally).
- Common validation failures: meta description not 50–160 chars, cover image not
  exactly 1200×630, cover without alt text, AI-generated cover not approved.

## Local development

```bash
npm install
npm run validate:content   # the same gate CI runs; explicit pass/fail
npm run dev                # local dev server
npm run build              # full build incl. validator
```

## Rollback

Content is git-versioned. Set `status` back to `draft`/`archived` and save, or
`git revert` the commit — either triggers a rebuild that removes the article.
Nothing is destructive.
