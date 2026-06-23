'use client';

import { useEffect, useRef } from 'react';

const VIDEO_ID = 'h8m7O1Mo4qQ';
// controls=0 removes the control bar; enablejsapi lets us force playback so the
// center play button never lingers.
const VIDEO_SRC =
  `https://www.youtube.com/embed/${VIDEO_ID}` +
  `?autoplay=1&mute=1&loop=1&playlist=${VIDEO_ID}` +
  `&controls=0&rel=0&showinfo=0&modestbranding=1&playsinline=1&disablekb=1&fs=0&iv_load_policy=3&enablejsapi=1`;

export default function HeroVideo() {
  const ref = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const iframe = ref.current;
    if (!iframe) return;
    const cmd = (func: string) =>
      iframe.contentWindow?.postMessage(JSON.stringify({ event: 'command', func, args: [] }), '*');
    // Nudge it to mute + play a few times in case autoplay is throttled on load.
    const play = () => { cmd('mute'); cmd('playVideo'); };
    const timers = [400, 1200, 2500].map((t) => window.setTimeout(play, t));
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden bg-black" aria-hidden="true">
      <iframe
        ref={ref}
        src={VIDEO_SRC}
        title="Apex Martial Arts training"
        allow="autoplay; encrypted-media"
        tabIndex={-1}
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[177.78vh] min-w-full h-[56.25vw] min-h-full scale-110"
      />
      {/* Transparent shield: blocks all interaction so the player can never be paused */}
      <div className="absolute inset-0" />

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
