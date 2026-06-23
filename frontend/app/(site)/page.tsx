import Link from 'next/link';
import ApexLogo from '@/components/layout/ApexLogo';
import Reveal from '@/components/site/Reveal';
import PublicSchedule from '@/components/site/PublicSchedule';
import { CountUp, SkillBar } from '@/components/site/Metrics';
import HeroVideo from '@/components/site/HeroVideo';
import { SITE, PROGRAMS } from '@/lib/site';

const STATS = [
  { value: 6, suffix: '', label: 'Days a week' },
  { value: 200, suffix: '+', label: 'Active members' },
  { value: 12, suffix: '', label: 'Classes a week' },
  { value: 100, suffix: '%', label: 'All ages welcome', isText: 'All ages' },
];

const EVENTS = [
  {
    title: 'Self-Defense Training Camp',
    date: '06 Aug · 11 AM – 8 PM',
    body: 'Essential self-defense for all ages — practical techniques for staying safe in real situations.',
  },
  {
    title: 'Competitive Sparring Tournament',
    date: '24 Aug · 8 AM – 6 PM',
    body: 'Test and sharpen your skills against committed fighters in a controlled, competitive setting.',
  },
];

const REVIEWS = [
  { quote: 'The coaching is sharp and genuinely attentive. I feel stronger and more capable than I have in years.', name: 'Ahmed A.' },
  { quote: 'My kids actually look forward to training. Discipline, confidence, and real skill — all in one place.', name: 'Mariam S.' },
  { quote: 'Walked in a beginner, stayed for the community. The standard here pushes you to show up.', name: 'Omar K.' },
];

export default function Home() {
  return (
    <>
      {/* ───────── Hero ───────── */}
      <section className="relative min-h-[100svh] flex items-center overflow-hidden">
        {/* Video background + lightened overlays */}
        <HeroVideo />

        <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
          <div className="max-w-3xl">
            <p className="eyebrow mb-6 text-foreground">Cairo · {SITE.location.name}</p>
            <h1 className="font-display font-extrabold text-headline text-[2.75rem] leading-[0.95] sm:text-7xl lg:text-8xl tracking-tight">
              Fight like
              <br />
              a pro.
            </h1>
            <p className="mt-6 text-base sm:text-lg text-body max-w-xl leading-relaxed">
              Kickboxing and MMA, taught by certified coaches. Push your limits, build real
              power, and master technique — for every level and every age.
            </p>
            <div className="mt-9 flex flex-col sm:flex-row gap-3">
              <Link href="/membership" className="btn-primary px-8 py-3.5 text-sm">Start training</Link>
              <Link href="#schedule" className="btn-secondary px-8 py-3.5 text-sm">View schedule</Link>
            </div>
          </div>
        </div>

        {/* scroll cue */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 hidden sm:flex flex-col items-center gap-2 text-muted">
          <span className="eyebrow text-[0.6rem]">Scroll</span>
          <span className="w-px h-8 bg-gradient-to-b from-foreground to-transparent" />
        </div>
      </section>

      {/* ───────── Stats ───────── */}
      <section className="border-y border-line bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4">
            {STATS.map((s, i) => (
              <Reveal
                key={s.label}
                delay={i * 80}
                className={`py-10 lg:py-14 px-2 text-center border-line ${i % 2 === 0 ? 'border-r' : ''} ${
                  i < 2 ? 'border-b lg:border-b-0' : ''
                } ${i === 1 || i === 3 ? '' : ''} lg:border-r ${i === 3 ? 'lg:border-r-0' : ''}`}
              >
                <div className="font-display font-bold text-headline text-4xl lg:text-6xl tabular-nums">
                  {s.isText ? s.isText : <CountUp to={s.value} suffix={s.suffix} />}
                </div>
                <div className="mt-2 eyebrow">{s.label}</div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── Pillars ───────── */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-px bg-line border border-line">
          {[
            { t: 'Elite training', b: 'Expert-led sessions that build strength, technique, and confidence — structured so you actually progress.' },
            { t: 'Strong community', b: 'A supportive room that rewards showing up. Respect on the mats, growth outside them.' },
          ].map((p) => (
            <Reveal key={p.t} className="bg-surface p-10 lg:p-14">
              <span className="bar-mark mb-6"><span /><span /><span /></span>
              <h2 className="mt-6 text-2xl lg:text-3xl font-bold text-headline">{p.t}</h2>
              <p className="mt-4 text-body leading-relaxed max-w-md">{p.b}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ───────── About teaser ───────── */}
      <section className="py-20 lg:py-28 border-t border-line">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-12 gap-10 items-center">
          <Reveal className="lg:col-span-7">
            <p className="eyebrow mb-4">About Apex</p>
            <h2 className="text-3xl lg:text-5xl font-bold text-headline leading-tight">
              More than a gym — a community that builds character.
            </h2>
            <p className="mt-6 text-body leading-relaxed max-w-2xl">
              Whether you’re a total beginner or training to compete, our certified coaches guide you
              every step of the way. Show up, put in the work, and become someone you’re proud of.
            </p>
            <Link href="/about" className="btn-secondary mt-8 inline-flex px-7 py-3 text-sm">Our story</Link>
          </Reveal>
          <Reveal delay={120} className="lg:col-span-5">
            <div className="border border-line bg-surface p-10 flex items-center justify-center aspect-square">
              <ApexLogo className="h-20 lg:h-28 text-headline" showSubtitle subtitleClassName="text-muted" />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ───────── Programs ───────── */}
      <section id="programs" className="py-20 lg:py-28 border-t border-line scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12 max-w-2xl">
            <p className="eyebrow mb-3">Our programs</p>
            <h2 className="text-3xl lg:text-5xl font-bold text-headline">Programs for every fighter</h2>
            <p className="mt-4 text-body">
              Precision, endurance, and discipline for all levels and ages — plus Brazilian Jiu-Jitsu,
              wrestling, and our competitive <span className="text-headline">Apex Pro</span> track.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-px bg-line border border-line">
            {PROGRAMS.map((p, i) => (
              <Reveal key={p.slug} delay={(i % 2) * 100} as="article" className="bg-surface p-8 lg:p-10 group">
                <div className="flex items-baseline justify-between">
                  <h3 className="text-xl lg:text-2xl font-bold text-headline">{p.name}</h3>
                  <span className="font-display text-muted text-sm tabular-nums">0{i + 1}</span>
                </div>
                <p className="mt-1 text-sm text-foreground uppercase tracking-wide font-display">{p.tagline}</p>
                <p className="mt-4 text-body text-sm leading-relaxed">{p.body}</p>
                <Link href="/membership" className="mt-6 inline-flex items-center gap-2 text-sm font-display uppercase tracking-wider text-headline group-hover:gap-3 transition-all">
                  Start {p.name}
                  <span aria-hidden="true">→</span>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── Why choose us ───────── */}
      <section className="py-20 lg:py-28 border-t border-line">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          <Reveal className="lg:col-span-6">
            <p className="eyebrow mb-4">Why choose us</p>
            <h2 className="text-3xl lg:text-5xl font-bold text-headline leading-tight">
              Unlock your full potential.
            </h2>
            <p className="mt-6 text-body leading-relaxed max-w-lg">
              Train with certified instructors and transform mind and body. Build confidence,
              endurance, and technique in a room that holds a real standard.
            </p>
          </Reveal>
          <Reveal delay={120} className="lg:col-span-6 space-y-8">
            <SkillBar label="MMA coaching" value={95} />
            <SkillBar label="Functional training" value={90} />
            <SkillBar label="Strength training" value={88} />
          </Reveal>
        </div>
      </section>

      {/* ───────── Schedule (live) ───────── */}
      <section id="schedule" className="py-20 lg:py-28 border-t border-line scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10 max-w-2xl">
            <p className="eyebrow mb-3">This week</p>
            <h2 className="text-3xl lg:text-5xl font-bold text-headline">Live class schedule</h2>
            <p className="mt-4 text-body">
              Straight from our booking system — what’s on the mats this week. Members reserve their
              spot in the portal.
            </p>
          </div>
          <PublicSchedule />
        </div>
      </section>

      {/* ───────── Events ───────── */}
      <section className="py-20 lg:py-28 border-t border-line">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-12">
            <div>
              <p className="eyebrow mb-3">Our events</p>
              <h2 className="text-3xl lg:text-5xl font-bold text-headline max-w-xl">Upcoming training events &amp; workshops</h2>
            </div>
            <Link href="/events" className="btn-secondary px-6 py-3 text-sm">View all events</Link>
          </div>
          <div className="grid md:grid-cols-2 gap-px bg-line border border-line">
            {EVENTS.map((e, i) => (
              <Reveal key={e.title} delay={i * 100} as="article" className="bg-surface p-8 lg:p-10">
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

      {/* ───────── Reviews ───────── */}
      <section className="py-20 lg:py-28 border-t border-line">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12 max-w-2xl">
            <p className="eyebrow mb-3">Members review</p>
            <h2 className="text-3xl lg:text-5xl font-bold text-headline">Why fighters train with Apex</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-px bg-line border border-line">
            {REVIEWS.map((r, i) => (
              <Reveal key={r.name} delay={i * 90} as="article" className="bg-surface p-8 lg:p-10 flex flex-col">
                <span className="bar-mark mb-6"><span /><span /><span /></span>
                <p className="text-body leading-relaxed flex-1">“{r.quote}”</p>
                <p className="mt-6 font-display uppercase tracking-wider text-sm text-headline">— {r.name}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── CTA (white inversion) ───────── */}
      <section className="bg-primary text-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28 text-center">
          <h2 className="font-display text-3xl lg:text-5xl font-extrabold tracking-tight">Take your first class.</h2>
          <p className="mt-4 text-base lg:text-lg text-black/70 max-w-xl mx-auto">
            Show up, put in the work, become your strongest self. Message us and we’ll get you started.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
            <a href={SITE.whatsapp} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-8 py-3.5 text-sm font-display font-semibold uppercase tracking-wider bg-black text-white border border-black transition-all hover:bg-transparent hover:text-black">
              Message on WhatsApp
            </a>
            <Link href="/membership"
              className="inline-flex items-center justify-center px-8 py-3.5 text-sm font-display font-semibold uppercase tracking-wider border border-black text-black transition-all hover:bg-black hover:text-white">
              See membership
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
