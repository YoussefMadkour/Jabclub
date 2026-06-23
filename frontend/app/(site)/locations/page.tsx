import Link from 'next/link';
import Reveal from '@/components/site/Reveal';
import { SITE } from '@/lib/site';

const FACILITIES = [
  {
    title: 'Professional area',
    body: 'Large matted areas for safe, effective training. Dedicated space for striking, grappling, and sparring.',
  },
  {
    title: 'Boxing & Muay Thai rings',
    body: 'Full-sized rings for real fight experience, plus pads, focus mitts, and kick shields.',
  },
  {
    title: 'Conditioning zone',
    body: 'Free weights, kettlebells, and resistance machines. Functional tools to build power.',
  },
  {
    title: 'Wellness area',
    body: 'Mobility and stretching space for injury prevention, plus ice baths, sauna, and physiotherapy.',
  },
];

export default function LocationsPage() {
  return (
    <>
      {/* ───────── Page hero ───────── */}
      <section className="relative pt-32 pb-16 lg:pt-40 lg:pb-20 border-b border-line overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: 'linear-gradient(115deg, transparent 49.7%, #fff 49.85%, #fff 50.15%, transparent 50.3%)' }}
          aria-hidden="true"
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="eyebrow mb-4">Our location</p>
          <h1 className="text-4xl lg:text-7xl font-bold text-headline tracking-tight">Find us at Zed Park.</h1>
          <p className="mt-5 text-sm text-muted">
            <Link href="/" className="hover:text-headline transition-colors">Home</Link>
            <span className="mx-2">/</span>
            Locations
          </p>
        </div>
      </section>

      {/* ───────── Location + map ───────── */}
      <section className="py-20 lg:py-28 border-t border-line">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-px bg-line border border-line">
            {/* LEFT — details */}
            <Reveal className="bg-surface p-8 lg:p-12">
              <p className="eyebrow mb-4">Train here</p>
              <h2 className="text-2xl lg:text-3xl font-bold text-headline">{SITE.location.name}</h2>
              <p className="mt-4 text-body leading-relaxed">{SITE.location.gate}</p>
              <p className="text-body leading-relaxed">{SITE.location.area}</p>
              <p className="mt-4">
                <a href={`tel:${SITE.phoneIntl}`} className="text-body hover:text-headline transition-colors">
                  {SITE.phoneDisplay}
                </a>
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <a
                  href={SITE.location.map}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary px-7 py-3 text-sm"
                >
                  Get directions
                </a>
                <a
                  href={SITE.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary px-7 py-3 text-sm"
                >
                  Message on WhatsApp
                </a>
              </div>

              <dl className="mt-10 border-t border-line pt-8 space-y-3">
                {SITE.hours.map((h) => (
                  <div key={h.days} className="flex items-baseline justify-between gap-6">
                    <dt className="text-sm text-muted">{h.days}</dt>
                    <dd className="text-sm text-body">{h.time}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>

            {/* RIGHT — embedded map */}
            <Reveal delay={120} className="bg-surface">
              <iframe
                title="Map to Apex Martial Arts"
                src="https://maps.google.com/maps?q=30.045206,30.999186&z=15&output=embed"
                className="w-full h-full min-h-[360px] grayscale contrast-125 invert-[0.92] hue-rotate-180"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ───────── Main facilities ───────── */}
      <section className="py-20 lg:py-28 border-t border-line">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12 max-w-2xl">
            <p className="eyebrow mb-3">Main facilities</p>
            <h2 className="text-3xl lg:text-5xl font-bold text-headline">Training with elite equipment.</h2>
            <p className="mt-4 text-body">State-of-the-art facilities for an optimal training experience.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-line border border-line">
            {FACILITIES.map((f, i) => (
              <Reveal key={f.title} delay={(i % 4) * 80} as="article" className="bg-surface p-8 lg:p-10">
                <span className="bar-mark mb-6"><span /><span /><span /></span>
                <h3 className="mt-6 text-xl font-bold text-headline">{f.title}</h3>
                <p className="mt-4 text-body text-sm leading-relaxed">{f.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── CTA (white inversion) ───────── */}
      <section className="bg-primary text-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28 text-center">
          <h2 className="font-display text-3xl lg:text-5xl font-extrabold tracking-tight">Come see the space.</h2>
          <p className="mt-4 text-base lg:text-lg text-black/70 max-w-xl mx-auto">
            Drop by and tour the mats, rings, and conditioning zone. We&rsquo;ll show you around.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href={SITE.location.map}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-8 py-3.5 text-sm font-display font-semibold uppercase tracking-wider bg-black text-white border border-black transition-all hover:bg-transparent hover:text-black"
            >
              Get directions
            </a>
            <a
              href={SITE.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-8 py-3.5 text-sm font-display font-semibold uppercase tracking-wider border border-black text-black transition-all hover:bg-black hover:text-white"
            >
              Message on WhatsApp
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
