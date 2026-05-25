import type { MetadataRoute } from 'next'
import { getAllDates } from '@/lib/opportunities'

const SITE_URL = 'https://opportunity-radar-ruby.vercel.app'

export default function sitemap(): MetadataRoute.Sitemap {
  const dates = getAllDates()
  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    ...dates.map((date, i) => ({
      url: `${SITE_URL}/${date}`,
      lastModified: new Date(date),
      changeFrequency: 'monthly' as const,
      priority: i === 0 ? 0.9 : 0.7,
    })),
  ]
}
