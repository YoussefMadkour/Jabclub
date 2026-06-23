import Link from 'next/link';
import Reveal from '@/components/site/Reveal';
import ContactForm from '@/components/site/ContactForm';
import { SITE } from '@/lib/site';

const CONTACT_ITEMS = [
  { label: 'WhatsApp', href: SITE.whatsapp, value: SITE.phoneDisplay },
  { label: 'Call', href: `tel:${SITE.phoneIntl}`, value: SITE.phoneDisplay },
  { label: 'Instagram', href: SITE.instagram, value: '@apexmartialarts.eg' },
];

export default function ContactPage() {
  return (
    <>
      {/* ───────── Hero header ───────── */}
      <section className="relative pt-32 pb-16 lg:pt-40 lg:pb-20 border-b border-line overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: 'linear-gradient(115deg, transparent 49.7%, #fff 49.85%, #fff 50.15%, transparent 50.3%)' }}
          aria-hidden="true"
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="eyebrow mb-4">Contact</p>
          <h1 className="text-4xl lg:text-7xl font-bold text-headline tracking-tight">Come train with us.</h1>
          <p className="mt-5 text-sm text-muted">
            <Link href="/" className="hover:text-headline transition-colors">Home</Link>
            <span className="mx-2">/</span>
            Contact
          </p>
        </div>
      </section>

      {/* ───────── Details + form ───────── */}
      <section className="py-20 lg:py-28 border-t border-line">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16">
            {/* LEFT — contact details */}
            <Reveal>
              <p className="eyebrow mb-4">Reach us</p>
              <h2 className="text-3xl lg:text-5xl font-bold text-headline">Talk to a coach.</h2>
              <p className="mt-4 text-body leading-relaxed max-w-md">
                Questions about programs, a trial class, or membership? Reach out any way you like — we
                usually reply fastest on WhatsApp.
              </p>

              <div className="mt-10 space-y-6">
                {CONTACT_ITEMS.map((item) => (
                  <div key={item.label}>
                    <p className="eyebrow mb-1">{item.label}</p>
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-lg text-headline hover:text-muted transition-colors"
                    >
                      {item.value}
                    </a>
                  </div>
                ))}

                <div>
                  <p className="eyebrow mb-1">Find us</p>
                  <a
                    href={SITE.location.map}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-lg text-headline hover:text-muted transition-colors"
                  >
                    {SITE.location.name}, {SITE.location.gate}
                    <span className="block text-sm text-body mt-1">{SITE.location.area}</span>
                  </a>
                </div>
              </div>

              {/* Hours */}
              <div className="mt-10">
                <p className="eyebrow mb-3">Hours</p>
                <dl className="max-w-sm">
                  {SITE.hours.map((h) => (
                    <div
                      key={h.days}
                      className="flex items-center justify-between py-2 border-b border-dashed border-line"
                    >
                      <dt className="text-body">{h.days}</dt>
                      <dd className="text-headline tabular-nums">{h.time}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </Reveal>

            {/* RIGHT — form panel */}
            <Reveal delay={120}>
              <div className="bg-surface border border-line p-8 lg:p-10">
                <h2 className="text-2xl lg:text-3xl font-bold text-headline">Send a message</h2>
                <p className="mt-3 mb-8 text-body text-sm leading-relaxed">
                  Fill this in and we&apos;ll pick it up on WhatsApp.
                </p>
                <ContactForm />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ───────── Map ───────── */}
      <section className="py-20 lg:py-28 border-t border-line">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <p className="eyebrow mb-4">Location</p>
            <h2 className="text-3xl lg:text-5xl font-bold text-headline">{SITE.location.name}</h2>
            <p className="mt-4 mb-10 text-body">{SITE.location.gate} · {SITE.location.area}</p>
            <iframe
              title="Map to Apex Martial Arts"
              src="https://maps.google.com/maps?q=30.045206,30.999186&z=15&output=embed"
              className="w-full h-[420px] grayscale contrast-125 invert-[0.92] hue-rotate-180 border border-line"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </Reveal>
        </div>
      </section>
    </>
  );
}
