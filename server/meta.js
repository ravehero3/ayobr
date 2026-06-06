const BASE_URL = 'https://typebeatz.voodoo808.com';
const OG_IMAGE = `${BASE_URL}/og-image.jpg`;
const DEFAULT_DESC_EN = 'Drop your audio and images. TypeBeatz auto-pairs them and renders all your YouTube-ready type beat videos in one click. Free to start.';
const DEFAULT_DESC_CS = 'Nahraj audio a obrázky. TypeBeatz je automaticky spáruje a vygeneruje všechna tvá YouTube type beat videa jedním kliknutím. Zdarma k vyzkoušení.';

const ROUTES = {
  '/': {
    title: 'TypeBeatz — Batch Generate Type Beat YouTube Videos',
    titleCs: 'TypeBeatz — Generuj Type Beat videa hromadně jedním kliknutím',
    description: DEFAULT_DESC_EN,
    descriptionCs: DEFAULT_DESC_CS,
    image: OG_IMAGE,
    noindex: false,
    jsonLd: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'TypeBeatz',
      url: BASE_URL,
      description: DEFAULT_DESC_EN,
      applicationCategory: 'MultimediaApplication',
      operatingSystem: 'Web',
      offers: [
        { '@type': 'Offer', name: 'Free', price: '0', priceCurrency: 'USD', description: '5 free video generations per month' },
        { '@type': 'Offer', name: 'Pro', price: '9.99', priceCurrency: 'USD', description: '50 video generations per month' },
        { '@type': 'Offer', name: 'Unlimited', price: '19.99', priceCurrency: 'USD', description: 'Unlimited video generations' },
      ],
      creator: { '@type': 'Organization', name: 'TypeBeatz', url: BASE_URL },
    }),
  },
  '/upgrade': {
    title: 'TypeBeatz Pricing — Pro & Unlimited Plans for Music Producers',
    titleCs: 'TypeBeatz Ceník — Pro & Neomezený plán pro hudební producenty',
    description: 'Get unlimited type beat video generation. Upgrade to Pro or Unlimited and publish more beats on YouTube today. Start free.',
    descriptionCs: 'Získej neomezené generování type beat videí. Upgraduj na Pro nebo Neomezený a začni zveřejňovat více beatů na YouTube.',
    image: OG_IMAGE,
    noindex: false,
  },
  '/terms': {
    title: 'Terms of Service — TypeBeatz',
    titleCs: 'Podmínky používání — TypeBeatz',
    description: 'TypeBeatz terms of service. Learn about usage rules, intellectual property, and your rights as a user.',
    descriptionCs: 'Podmínky používání TypeBeatz. Přečti si pravidla, duševní vlastnictví a tvá práva jako uživatele.',
    noindex: false,
  },
  '/privacy': {
    title: 'Privacy Policy — TypeBeatz',
    titleCs: 'Zásady ochrany osobních údajů — TypeBeatz',
    description: 'TypeBeatz privacy policy — how we collect, use, and protect your personal data.',
    descriptionCs: 'Zásady ochrany osobních údajů TypeBeatz — jak shromažďujeme, používáme a chráníme tvá osobní data.',
    noindex: false,
  },
  '/refund': {
    title: 'Refund Policy — TypeBeatz',
    titleCs: 'Zásady vrácení peněz — TypeBeatz',
    description: 'TypeBeatz refund policy — conditions and process for subscription refunds.',
    descriptionCs: 'Zásady vrácení peněz TypeBeatz — podmínky a postup pro vrácení předplatného.',
    noindex: false,
  },
  '/login': {
    title: 'Sign In — TypeBeatz',
    description: 'Sign in to TypeBeatz and start generating type beat videos.',
    noindex: true,
  },
  '/app': {
    title: 'TypeBeatz App — Generate Type Beat Videos',
    description: 'Batch generate type beat videos from your audio and images.',
    noindex: true,
  },
  '/account': {
    title: 'My Account — TypeBeatz',
    description: 'Manage your TypeBeatz account and subscription.',
    noindex: true,
  },
  '/success': {
    title: 'Payment Successful — TypeBeatz',
    description: 'Your TypeBeatz subscription is now active.',
    noindex: true,
  },
  '/admin': {
    title: 'Admin — TypeBeatz',
    description: '',
    noindex: true,
  },
};

function getRouteMeta(pathname) {
  return ROUTES[pathname] || ROUTES['/'];
}

function injectMeta(html, pathname, lang) {
  const meta = getRouteMeta(pathname);
  const isCs = lang === 'cs';

  const title = (isCs && meta.titleCs) ? meta.titleCs : meta.title;
  const description = (isCs && meta.descriptionCs) ? meta.descriptionCs : (meta.description || '');
  const image = meta.image || OG_IMAGE;
  const canonicalUrl = `${BASE_URL}${pathname === '/' ? '' : pathname}/`.replace(/\/\/$/, '/');

  const injected = [
    `<meta name="robots" content="${meta.noindex ? 'noindex, nofollow' : 'index, follow'}">`,
    `<link rel="canonical" href="${canonicalUrl}">`,
    !meta.noindex ? `<link rel="alternate" hreflang="en" href="${BASE_URL}${pathname}">` : '',
    !meta.noindex ? `<link rel="alternate" hreflang="cs" href="${BASE_URL}${pathname}">` : '',
    !meta.noindex ? `<link rel="alternate" hreflang="x-default" href="${BASE_URL}${pathname}">` : '',
    `<meta property="og:type" content="website">`,
    `<meta property="og:url" content="${canonicalUrl}">`,
    `<meta property="og:title" content="${title}">`,
    `<meta property="og:description" content="${description}">`,
    `<meta property="og:image" content="${image}">`,
    `<meta property="og:image:width" content="1200">`,
    `<meta property="og:image:height" content="630">`,
    `<meta property="og:image:type" content="image/jpeg">`,
    `<meta property="og:site_name" content="TypeBeatz">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:url" content="${canonicalUrl}">`,
    `<meta name="twitter:title" content="${title}">`,
    `<meta name="twitter:description" content="${description}">`,
    `<meta name="twitter:image" content="${image}">`,
    meta.jsonLd ? `<script type="application/ld+json">${meta.jsonLd}</script>` : '',
  ].filter(Boolean).join('\n    ');

  return html
    .replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`)
    .replace(/<meta name="description"[^>]*>/, `<meta name="description" content="${description}">`)
    .replace('</head>', `    ${injected}\n</head>`);
}

module.exports = { injectMeta };
