import Link from 'next/link';
import Reveal from '@/components/site/Reveal';
import { SITE, PROGRAMS } from '@/lib/site';

const STEPS = [
  {
    num: '01',
    title: 'Reach out',
    body: 'Message us on WhatsApp or call. Tell us your goals and any experience.',
  },
  {
    num: '02',
    title: 'Book a trial',
    body: 'Come in for a trial class. Meet the coaches and feel the room.',
  },
  {
    num: '03',
    title: 'Join Apex',
    body: 'Pick the track that fits, and start training. Manage everything in the member portal.',
  },
];

const TRACKS = [
  {
    name: 'Foundations',
    body: 'For beginners. Build your fundamentals in kickboxing and martial arts at a steady, supported pace.',
  },
  {
    name: 'All-Access',
    body: 'Every class on the schedule — kickboxing and martial arts, all ages — train as much as you want.',
  },
  {
    name: 'Apex Pro',
    body: 'Our competitive track. Fight-focused coaching, sparring, and a path to the podium.',
  },
];

export default function Membership() {
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
          <p className="eyebrow mb-4">Membership</p>
          <h1 className="text-4xl lg:text-7xl font-bold text-headline tracking-tight">Train on your terms.</h1>
          <p className="mt-5 text-sm text-muted">
            <Link href="/" className="hover:text-headline transition-colors">Home</Link>
            <span className="mx-2">/</span>
            Membership
          </p>
        </div>
      </section>

      {/* ───────── How it works ───────── */}
      <section className="py-20 lg:py-28 border-t border-line">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12 max-w-2xl">
            <p className="eyebrow mb-3">How it works</p>
            <h2 className="text-3xl lg:text-5xl font-bold text-headline">Three steps to the mats.</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-px bg-line border border-line">
            {STEPS.map((s, i) => (
              <Reveal key={s.num} delay={i * 100} as="article" className="bg-surface p-8 lg:p-10">
                <span className="font-display text-muted text-sm">{s.num}</span>
                <h3 className="mt-6 text-xl lg:text-2xl font-bold text-headline">{s.title}</h3>
                <p className="mt-4 text-body text-sm leading-relaxed">{s.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── Choose your track ───────── */}
      <section className="py-20 lg:py-28 border-t border-line">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12 max-w-2xl">
            <p className="eyebrow mb-3">Membership tracks</p>
            <h2 className="text-3xl lg:text-5xl font-bold text-headline">Find your track.</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-px bg-line border border-line">
            {TRACKS.map((t, i) => (
              <Reveal key={t.name} delay={i * 100} as="article" className="bg-surface p-8 lg:p-10 flex flex-col">
                <span className="bar-mark mb-6"><span /><span /><span /></span>
                <h3 className="text-xl lg:text-2xl font-bold text-headline">{t.name}</h3>
                <p className="mt-4 text-body text-sm leading-relaxed flex-1">{t.body}</p>
                <a
                  href={SITE.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary mt-8 inline-flex px-6 py-3 text-xs"
                >
                  Ask about pricing
                </a>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── What's included / programs ───────── */}
      <section className="py-20 lg:py-28 border-t border-line">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12 max-w-2xl">
            <p className="eyebrow mb-3">Included</p>
            <h2 className="text-3xl lg:text-5xl font-bold text-headline">Kickboxing &amp; martial arts, one community.</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-px bg-line border border-line">
            {PROGRAMS.map((p, i) => (
              <Reveal key={p.slug} delay={(i % 2) * 100} as="article" className="bg-surface p-8 lg:p-10">
                <h3 className="text-xl lg:text-2xl font-bold text-headline">{p.name}</h3>
                <p className="mt-4 text-body leading-relaxed">{p.tagline}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── Already a member ───────── */}
      <section className="py-20 lg:py-28 border-t border-line">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="border border-line bg-surface p-8 lg:p-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <p className="text-body leading-relaxed max-w-xl">
              Already train with us? Book your classes and manage your membership in the portal.
            </p>
            <Link href="/login" className="btn-primary inline-flex px-8 py-3.5 text-sm shrink-0">
              Member login
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ───────── CTA (white inversion) ───────── */}
      <section className="bg-primary text-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28 text-center">
          <h2 className="font-display text-3xl lg:text-5xl font-extrabold tracking-tight">Start your first class.</h2>
          <p className="mt-4 text-base lg:text-lg text-black/70 max-w-xl mx-auto">
            Show up, put in the work, become your strongest self. Message us and we’ll get you started.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href={SITE.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-8 py-3.5 text-sm font-display font-semibold uppercase tracking-wider bg-black text-white border border-black transition-all hover:bg-transparent hover:text-black"
            >
              Message on WhatsApp
            </a>
            <a
              href={`tel:+${SITE.phoneIntl}`}
              className="inline-flex items-center justify-center px-8 py-3.5 text-sm font-display font-semibold uppercase tracking-wider border border-black text-black transition-all hover:bg-black hover:text-white"
            >
              Call us
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
