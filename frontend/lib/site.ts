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
    { days: 'Sat – Thu', time: '9 AM – 10 PM' },
    { days: 'Friday', time: 'Closed' },
  ],
} as const;

// Only what we actually run on the schedule: Adults Kickboxing + Kids & Juniors MMA.
export const PROGRAMS = [
  {
    slug: 'kickboxing',
    name: 'Kickboxing',
    tagline: 'Power, conditioning, real striking.',
    body: 'Burn fat, build power, and learn striking that holds up under pressure — punches, kicks, knees, and the engine to throw them. Built for teens and adults.',
  },
  {
    slug: 'mma',
    name: 'MMA',
    tagline: 'Striking and grappling, safely structured.',
    body: 'The foundations of mixed martial arts for kids and juniors — striking and grappling in a safe, structured environment that builds discipline and confidence.',
  },
] as const;
