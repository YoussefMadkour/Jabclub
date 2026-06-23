import Link from 'next/link';
import Reveal from '@/components/site/Reveal';
import { SITE } from '@/lib/site';

const PILLARS = [
  { t: 'Elite training', b: 'Expert-led sessions that build strength, technique, and confidence — structured so you actually progress.' },
  { t: 'Strong community', b: 'A supportive room that rewards showing up. Respect on the mats, growth outside them.' },
];

const REASONS = [
  {
    t: 'Expert coaching team',
    b: 'Train with certified professionals and licensed instructors, all certified by the Egyptian Kickboxing Federation, bringing years of real fight and fitness experience.',
  },
  {
    t: 'Supportive community',
    b: 'From first-timers to future champions, we offer tailored programs in Boxing, Kickboxing, Brazilian Jiu-Jitsu, Wrestling, and our elite Apex Pro competitive track.',
  },
  {
    t: 'All ages welcome',
    b: 'Kids, juniors, teens, and adults train together. Whether you want discipline, self-defense, or to compete, there’s a place for you here.',
  },
  {
    t: 'Proven track record',
    list: [
      'National Kickboxing Champions (U18 & Men, 2023)',
      'Certified by the Egyptian Kickboxing Federation',
      'Competitors in the African Wushu Sanda Championships',
    ],
  },
];

export default function About() {
  return (
    <>
      {/* ───────── Hero header ───────── */}
      <section className="relative pt-32 pb-16 lg:pt-40 lg:pb-20 border-b border-line overflow-hidden">
        <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'linear-gradient(115deg, transparent 49.7%, #fff 49.85%, #fff 50.15%, transparent 50.3%)' }} aria-hidden="true" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="eyebrow mb-4">About us</p>
          <h1 className="text-4xl lg:text-7xl font-bold text-headline tracking-tight">The story behind Apex.</h1>
          <p className="mt-5 text-sm text-muted"><Link href="/" className="hover:text-headline transition-colors">Home</Link> <span className="mx-2">/</span> About</p>
        </div>
      </section>

      {/* ───────── Our story ───────── */}
      <section className="py-20 lg:py-28 border-t border-line">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="max-w-3xl">
            <p className="eyebrow mb-4">Our story</p>
            <h2 className="text-3xl lg:text-5xl font-bold text-headline">Built from a fighter&rsquo;s spirit.</h2>
            <p className="mt-6 text-body leading-relaxed">
              Apex Martial Arts grew from a small group of passionate martial artists into one of
              Cairo&rsquo;s fastest-rising combat communities. Since 2020, we&rsquo;ve helped thousands of
              members — from kids to professionals — transform their bodies, build real confidence, and
              unlock their full potential.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ───────── Pillars ───────── */}
      <section className="py-20 lg:py-28 border-t border-line">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-px bg-line border border-line">
          {PILLARS.map((p, i) => (
            <Reveal key={p.t} delay={i * 100} className="bg-surface p-8 lg:p-10">
              <span className="bar-mark mb-6"><span /><span /><span /></span>
              <h2 className="mt-6 text-2xl lg:text-3xl font-bold text-headline">{p.t}</h2>
              <p className="mt-4 text-body leading-relaxed max-w-md">{p.b}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ───────── Why train with us ───────── */}
      <section className="py-20 lg:py-28 border-t border-line">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="mb-12 max-w-2xl">
            <p className="eyebrow mb-3">Why train with us</p>
            <h2 className="text-3xl lg:text-5xl font-bold text-headline">Train with the best.</h2>
          </Reveal>
          <div className="grid sm:grid-cols-2 gap-px bg-line border border-line">
            {REASONS.map((r, i) => (
              <Reveal key={r.t} delay={(i % 2) * 100} as="article" className="bg-surface p-8 lg:p-10">
                <span className="bar-mark mb-6"><span /><span /><span /></span>
                <h3 className="mt-6 text-xl lg:text-2xl font-bold text-headline">{r.t}</h3>
                {r.list ? (
                  <ul className="mt-4 space-y-2">
                    {r.list.map((line) => (
                      <li key={line} className="text-body text-sm leading-relaxed">{line}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-4 text-body text-sm leading-relaxed">{r.b}</p>
                )}
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── CTA (white inversion) ───────── */}
      <section className="bg-primary text-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28 text-center">
          <h2 className="font-display text-3xl lg:text-5xl font-extrabold tracking-tight">Ready to start?</h2>
          <p className="mt-4 text-base lg:text-lg text-black/70 max-w-xl mx-auto">
            Show up, put in the work, become your strongest self. Message us and we&rsquo;ll get you started.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/membership"
              className="inline-flex items-center justify-center px-8 py-3.5 text-sm font-display font-semibold uppercase tracking-wider bg-black text-white border border-black transition-all hover:bg-transparent hover:text-black">
              See membership
            </Link>
            <a href={SITE.whatsapp} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-8 py-3.5 text-sm font-display font-semibold uppercase tracking-wider border border-black text-black transition-all hover:bg-black hover:text-white">
              Message on WhatsApp
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
