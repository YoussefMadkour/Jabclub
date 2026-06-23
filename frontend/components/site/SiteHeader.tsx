'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ApexLogo from '@/components/layout/ApexLogo';

const NAV = [
  { label: 'Programs', href: '/#programs' },
  { label: 'Schedule', href: '/#schedule' },
  { label: 'Locations', href: '/locations' },
  { label: 'About', href: '/about' },
  { label: 'Membership', href: '/membership' },
  { label: 'Contact', href: '/contact' },
];

export default function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-colors duration-300 ${
        scrolled || open ? 'bg-black/95 backdrop-blur border-b border-line' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          <Link href="/" aria-label="Apex Martial Arts home" className="flex items-center text-headline">
            <ApexLogo className="h-6 lg:h-7" />
          </Link>

          <nav className="hidden lg:flex items-center gap-8">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-display uppercase tracking-wider text-foreground hover:text-headline transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-display uppercase tracking-wider text-foreground hover:text-headline transition-colors"
            >
              Member Login
            </Link>
            <Link href="/#schedule" className="btn-primary text-xs px-5 py-2.5">
              Start Training
            </Link>
          </div>

          <button
            onClick={() => setOpen((v) => !v)}
            className="lg:hidden p-2 -mr-2 text-headline"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {open ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7h16M4 12h16M4 17h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="lg:hidden border-t border-line bg-black">
          <nav className="px-4 sm:px-6 py-4 flex flex-col">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="py-3 text-base font-display uppercase tracking-wider text-foreground hover:text-headline border-b border-line/60"
              >
                {item.label}
              </Link>
            ))}
            <Link href="/login" className="py-3 text-base font-display uppercase tracking-wider text-foreground hover:text-headline">
              Member Login
            </Link>
            <Link href="/#schedule" className="btn-primary mt-3 w-full">
              Start Training
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
