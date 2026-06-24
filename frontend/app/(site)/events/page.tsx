import Link from 'next/link';
import Reveal from '@/components/site/Reveal';
import { SITE } from '@/lib/site';

const EVENTS = [
  {
    date: '06 Aug · 11 AM – 8 PM',
    title: 'Self-Defense Training Camp',
    body: 'Essential self-defense for all ages — practical techniques for staying safe in real-life situations.',
  },
  {
    date: '24 Aug · 8 AM – 6 PM',
    title: 'Competitive Sparring Tournament',
    body: 'Test and refine your skills against committed martial artists in a controlled, competitive environment.',
  },
  {
    date: '07 Sep · 10 AM – 2 PM',
    title: 'Kids Fundamentals Workshop',
    body: 'A focused intro to striking and grappling for kids — discipline and fun in a safe, structured session.',
  },
  {
    date: '21 Sep · 6 PM – 9 PM',
    title: 'Open Mat & Community Night',
    body: 'Roll, spar, and train with the whole community. All levels welcome — bring a friend.',
  },
];

export default function EventsPage() {
  return (
    <>
      {/* ───────── Hero header ───────── */}
      <section className="relative pt-32 pb-16 lg:pt-40 lg:pb-20 border-b border-line overflow-hidden">
        <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'linear-gradient(115deg, transparent 49.7%, #fff 49.85%, #fff 50.15%, transparent 50.3%)' }} aria-hidden="true" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="eyebrow mb-4">Events</p>
          <h1 className="text-4xl lg:text-7xl font-bold text-headline tracking-tight">Combat events &amp; workshops.</h1>
          <p className="mt-5 text-sm text-muted"><Link href="/" className="hover:text-headline transition-colors">Home</Link> <span className="mx-2">/</span> Events</p>
        </div>
      </section>

      {/* ───────── Upcoming ───────── */}
      <section className="py-20 lg:py-28 border-t border-line">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12 max-w-2xl">
            <p className="eyebrow mb-3">Upcoming</p>
            <h2 className="text-3xl lg:text-5xl font-bold text-headline">What&apos;s next on the calendar.</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-px bg-line border border-line">
            {EVENTS.map((e, i) => (
              <Reveal key={e.title} delay={(i % 2) * 100} as="article" className="bg-surface p-8 lg:p-10">
                <p className="font-display text-sm uppercase tracking-wider text-foreground">{e.date}</p>
                <h3 className="mt-3 text-2xl font-bold text-headline">{e.title}</h3>
                <p className="mt-3 text-body text-sm leading-relaxed">{e.body}</p>
                <p className="mt-5 text-sm text-muted">{SITE.location.name} · {SITE.location.gate}</p>
                <a href={SITE.whatsapp} target="_blank" rel="noopener noreferrer" className="btn-primary mt-6 inline-flex px-6 py-2.5 text-xs">Join event</a>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── Host / private events ───────── */}
      <section className="py-20 lg:py-28 border-t border-line">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="bg-surface p-8 lg:p-10 border border-line">
            <h3 className="text-2xl font-bold text-headline">Want a private workshop?</h3>
            <p className="mt-3 text-body leading-relaxed max-w-2xl">
              We run tailored sessions for teams, schools, and groups. Tell us what you need.
            </p>
            <a href={SITE.whatsapp} target="_blank" rel="noopener noreferrer" className="btn-secondary mt-6 inline-flex px-7 py-3 text-sm">Message on WhatsApp</a>
          </Reveal>
        </div>
      </section>

      {/* ───────── CTA (white inversion) ───────── */}
      <section className="bg-primary text-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28 text-center">
          <h2 className="font-display text-3xl lg:text-5xl font-extrabold tracking-tight">See you on the mats.</h2>
          <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
            <a href={SITE.whatsapp} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-8 py-3.5 text-sm font-display font-semibold uppercase tracking-wider bg-black text-white border border-black transition-all hover:bg-transparent hover:text-black">
              Message on WhatsApp
            </a>
            <Link href="/#schedule"
              className="inline-flex items-center justify-center px-8 py-3.5 text-sm font-display font-semibold uppercase tracking-wider border border-black text-black transition-all hover:bg-black hover:text-white">
              View schedule
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
