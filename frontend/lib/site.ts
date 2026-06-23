// Apex Martial Arts — public site constants (single source of truth for the marketing pages)

export const SITE = {
  name: 'Apex Martial Arts',
  phoneDisplay: '+20 114 829 1087',
  phoneIntl: '201148291087',
  whatsapp: 'https://wa.me/201148291087',
  instagram: 'https://www.instagram.com/apexmartialarts.eg',
  facebook: 'https://www.facebook.com/',
  location: {
    name: 'Nexus — Zed Park',
    gate: 'Gate 2',
    area: 'Zed Park, Sheikh Zayed, Cairo',
    map: 'https://maps.google.com/?q=30.045206,30.999186',
  },
  hours: [
    { days: 'Mon – Wed', time: '9 AM – 4 PM' },
    { days: 'Thu – Fri', time: '9 AM – 5 PM' },
    { days: 'Weekend', time: 'Closed' },
  ],
} as const;

export const PROGRAMS = [
  {
    slug: 'boxing',
    name: 'Boxing',
    tagline: 'Footwork, speed, and punching accuracy.',
    body: 'Sharpen your hands and your head. Boxing builds the footwork, timing, and conditioning every striker is measured against.',
  },
  {
    slug: 'kickboxing',
    name: 'Kickboxing',
    tagline: 'Power, conditioning, real striking.',
    body: 'Burn fat, build power, and learn striking that holds up under pressure — punches, kicks, knees, and the engine to throw them.',
  },
  {
    slug: 'kids-mma',
    name: 'Kids MMA',
    tagline: 'Striking and grappling, safely structured.',
    body: 'The foundations of striking and grappling for kids, taught in a safe, structured environment that builds discipline and confidence.',
  },
  {
    slug: 'private',
    name: 'Private Training',
    tagline: 'One-on-one, faster results.',
    body: 'Preparing to compete or just want to progress faster? Private sessions are built around you and accelerate everything.',
  },
] as const;
