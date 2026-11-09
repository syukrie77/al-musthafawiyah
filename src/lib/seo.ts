import site from '../data/site.json';

export const SITE_URL = process.env.SITE_URL || 'https://almusthafawiyah.sch.id';

export function absoluteUrl(path = '/') {
  try {
    return new URL(path, SITE_URL).href;
  } catch {
    return SITE_URL + path;
  }
}

export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    '@id': `${SITE_URL}/#organization`,
    name: site.title,
    alternateName: 'Pesantren Al-Musthafawiyah',
    url: `${SITE_URL}/`,
    logo: `${SITE_URL}/favicon.svg`,
    image: absoluteUrl(site.ogImage),
    description: site.description,
    email: site.email,
    telephone: site.phone,
    address: {
      '@type': 'PostalAddress',
      streetAddress: site.address,
      addressLocality: 'Kebumen',
      addressRegion: 'Jawa Tengah',
      addressCountry: 'ID',
    },
    sameAs: Object.values(site.social ?? {}),
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: `+${site.whatsapp}`,
      contactType: 'customer service',
      areaServed: 'ID',
      availableLanguage: ['Indonesian', 'Arabic', 'English'],
    },
  };
}

export function websiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    url: `${SITE_URL}/`,
    name: site.title,
    description: site.description,
    inLanguage: 'id-ID',
    publisher: { '@id': `${SITE_URL}/#organization` },
  };
}

export function breadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: absoluteUrl(it.url),
    })),
  };
}

export function faqSchema(faq: Array<{ q: string; a: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}

export function articleSchema(post: {
  title: string;
  description: string;
  date: Date | string;
  author?: string;
  cover?: string;
  slug: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': absoluteUrl(`/blog/${post.slug}/`),
    },
    headline: post.title,
    description: post.description,
    image: post.cover ? [absoluteUrl(post.cover)] : [absoluteUrl(site.ogImage)],
    datePublished: new Date(post.date).toISOString(),
    dateModified: new Date(post.date).toISOString(),
    author: { '@type': 'Person', name: post.author ?? 'Tim Redaksi Al-Musthafawiyah' },
    publisher: {
      '@type': 'Organization',
      name: site.title,
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/favicon.svg` },
    },
    inLanguage: 'id-ID',
  };
}

export function eventSchema(ev: {
  title: string;
  desc: string;
  date: string;
  time: string;
  place: string;
  type: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: ev.title,
    description: ev.desc,
    startDate: `${ev.date}T${(ev.time.split('-')[0] || '09:00').trim()}:00+07:00`,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/MixedEventAttendanceMode',
    location: {
      '@type': 'Place',
      name: ev.place,
      address: site.address,
    },
    organizer: { '@id': `${SITE_URL}/#organization` },
  };
}

export function jsonLd(...schemas: unknown[]) {
  return schemas.map((s) => `<script type="application/ld+json">${JSON.stringify(s)}</script>`).join('\n');
}
