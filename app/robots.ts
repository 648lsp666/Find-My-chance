import type { MetadataRoute } from 'next'

const SITE_URL = 'https://opportunity-radar-ruby.vercel.app'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
