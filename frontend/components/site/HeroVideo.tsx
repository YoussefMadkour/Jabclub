'use client';

/**
 * Self-hosted background clip — a plain muted/looping <video> so there are no
 * player controls and the loop is seamless (no reload flash like a YouTube embed).
 */
export default function HeroVideo() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-black" aria-hidden="true">
      <video
        className="absolute inset-0 w-full h-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        poster="/hero-poster.jpg"
      >
        <source src="/hero.mp4" type="video/mp4" />
      </video>

      {/* Overlays — lightened */}
      <div className="absolute inset-0 bg-black/45" />
      <div
        className="absolute inset-0 opacity-[0.08]"
        style={{ backgroundImage: 'linear-gradient(115deg, transparent 49.7%, #fff 49.85%, #fff 50.15%, transparent 50.3%)' }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-black/40" />
    </div>
  );
}
