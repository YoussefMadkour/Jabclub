'use client';

import Link from 'next/link';
import ApexLogo from '@/components/layout/ApexLogo';
import { SITE } from '@/lib/site';

const COLUMNS = [
  {
    title: 'Company',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Events', href: '/events' },
      { label: 'Schedule', href: '/#schedule' },
    ],
  },
  {
    title: 'Programs',
    links: [
      { label: 'Kickboxing', href: '/#programs' },
      { label: 'Martial Arts', href: '/#programs' },
      { label: 'Schedule', href: '/#schedule' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'Membership', href: '/membership' },
      { label: 'Contact', href: '/contact' },
      { label: 'Locations', href: '/locations' },
      { label: 'Member Login', href: '/login' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Terms of Service', href: '/terms-of-service' },
      { label: 'Privacy Policy', href: '/privacy-policy' },
    ],
  },
];

export default function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-black border-t border-line">
      {/* Hours + contact band */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-px bg-line border-x border-line">
          <div className="bg-surface p-8 lg:p-12">
            <p className="eyebrow mb-6">Operational Time</p>
            <dl className="space-y-0">
              {SITE.hours.map((h, i) => (
                <div
                  key={h.days}
                  className={`flex items-center justify-between py-3 ${
                    i < SITE.hours.length - 1 ? 'border-b border-dashed border-line' : ''
                  }`}
                >
                  <dt className="text-foreground font-display uppercase tracking-wider text-sm">{h.days}</dt>
                  <dd className="text-headline font-display text-sm">{h.time}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="bg-surface p-8 lg:p-12 flex flex-col justify-center">
            <p className="eyebrow mb-6">Get in touch</p>
            <a
              href={`tel:${SITE.phoneIntl}`}
              className="block text-2xl lg:text-3xl font-display font-bold text-headline hover:text-foreground transition-colors"
            >
              {SITE.phoneDisplay}
            </a>
            <a
              href={SITE.location.map}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 text-sm text-foreground hover:text-headline transition-colors"
            >
              {SITE.location.name} · {SITE.location.gate}
            </a>
          </div>
        </div>
      </div>

      {/* Link columns */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-10">
          <div className="col-span-2 lg:col-span-1">
            <ApexLogo className="h-6 text-headline" />
            <p className="mt-4 text-sm text-muted max-w-xs">
              Train at your apex. Kickboxing and martial arts for every level and every age.
            </p>
            <div className="mt-6 flex items-center gap-3">
              <a
                href={SITE.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="w-10 h-10 flex items-center justify-center border border-line text-foreground hover:text-black hover:bg-white transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.72 3.72 0 01-1.38-.9 3.72 3.72 0 01-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16zm0 1.62c-3.15 0-3.52.01-4.76.07-1.15.05-1.77.24-2.19.41-.55.21-.94.47-1.35.88-.41.41-.67.8-.88 1.35-.17.42-.36 1.04-.41 2.19-.06 1.24-.07 1.61-.07 4.76s.01 3.52.07 4.76c.05 1.15.24 1.77.41 2.19.21.55.47.94.88 1.35.41.41.8.67 1.35.88.42.17 1.04.36 2.19.41 1.24.06 1.61.07 4.76.07s3.52-.01 4.76-.07c1.15-.05 1.77-.24 2.19-.41.55-.21.94-.47 1.35-.88.41-.41.67-.8.88-1.35.17-.42.36-1.04.41-2.19.06-1.24.07-1.61.07-4.76s-.01-3.52-.07-4.76c-.05-1.15-.24-1.77-.41-2.19a3.63 3.63 0 00-.88-1.35 3.63 3.63 0 00-1.35-.88c-.42-.17-1.04-.36-2.19-.41-1.24-.06-1.61-.07-4.76-.07zm0 2.76a5.3 5.3 0 110 10.6 5.3 5.3 0 010-10.6zm0 1.62a3.68 3.68 0 100 7.36 3.68 3.68 0 000-7.36zm5.48-1.62a1.24 1.24 0 110 2.48 1.24 1.24 0 010-2.48z" />
                </svg>
              </a>
              <a
                href={SITE.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="w-10 h-10 flex items-center justify-center border border-line text-foreground hover:text-black hover:bg-white transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M.06 24l1.68-6.13A11.86 11.86 0 01.16 11.9C.16 5.34 5.5.01 12.06.01a11.82 11.82 0 018.4 3.49 11.82 11.82 0 013.48 8.41c0 6.56-5.34 11.9-11.9 11.9a11.9 11.9 0 01-5.7-1.45L.06 24zM6.6 20.2c1.68 1 3.28 1.6 5.46 1.6 5.45 0 9.9-4.43 9.9-9.88a9.82 9.82 0 00-2.9-7 9.82 9.82 0 00-7-2.9c-5.46 0-9.9 4.44-9.9 9.9 0 2.24.65 3.92 1.75 5.6l-.99 3.63 3.68-.95zm10.96-5.5c-.07-.12-.27-.2-.57-.34-.3-.16-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51l-.57-.01c-.2 0-.52.07-.79.37-.27.3-1.04 1.01-1.04 2.48 0 1.46 1.06 2.87 1.21 3.07.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.62.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2-1.41.25-.7.25-1.29.18-1.41z" />
                </svg>
              </a>
              <a
                href={SITE.facebook}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="w-10 h-10 flex items-center justify-center border border-line text-foreground hover:text-black hover:bg-white transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5 3.66 9.15 8.44 9.94v-7.03H7.9v-2.9h2.54V9.85c0-2.51 1.49-3.9 3.78-3.9 1.1 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.78-1.63 1.57v1.88h2.78l-.44 2.9h-2.34V22c4.78-.79 8.43-4.94 8.43-9.94z" />
                </svg>
              </a>
            </div>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="eyebrow mb-4">{col.title}</h4>
              <ul className="space-y-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-sm text-muted hover:text-headline transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-6 border-t border-line flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-muted text-sm">© {year} {SITE.name}. All rights reserved.</p>
          <p className="text-muted text-xs uppercase tracking-widest">Cairo · {SITE.location.area}</p>
        </div>
      </div>
    </footer>
  );
}
