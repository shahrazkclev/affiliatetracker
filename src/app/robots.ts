import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/portal/', '/api/', '/_next/'],
    },
    sitemap: 'https://affiliatemango.com/sitemap.xml',
  }
}
