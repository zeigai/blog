import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const now = Date.now();
  const posts = (await getCollection('blog'))
    .filter((p) => p.data.status === 'published' && p.data.pubDate.getTime() <= now)
    .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());

  return rss({
    title: 'Zeig Blog',
    description: 'AI-powered financial analysis — insights, updates & market analysis.',
    site: context.site,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      link: `/blog/${post.data.slug ?? post.id}/`,
    })),
  });
}
