import React from 'react';

interface ApexLogoProps {
  /** Tailwind height class controls the wordmark size, e.g. "h-7" */
  className?: string;
  /** Show the tracked "MARTIAL ARTS" line beneath the wordmark */
  showSubtitle?: boolean;
  subtitleClassName?: string;
}

/**
 * APEX wordmark, recreated as geometric SVG to match the brand letterforms:
 *  A — caret / chevron (no crossbar)
 *  P — stem + rounded bowl
 *  E — three stacked bars (no stem)
 *  X — crossed diagonals
 * Uses currentColor so it themes with the surrounding text color.
 */
const ApexLogo: React.FC<ApexLogoProps> = ({
  className = 'h-7',
  showSubtitle = false,
  subtitleClassName = '',
}) => {
  return (
    <span className="inline-flex flex-col items-center leading-none" aria-label="Apex Martial Arts">
      <svg
        className={`${className} w-auto`}
        viewBox="-9 -9 360 118"
        fill="none"
        role="img"
        aria-hidden="true"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* A — chevron */}
        <polyline
          points="0,100 39,8 78,100"
          stroke="currentColor"
          strokeWidth="15"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* P — stem + rounded bowl */}
        <path
          d="M104,100 V0 H132 A26 26 0 0 1 132 52 H104"
          stroke="currentColor"
          strokeWidth="15"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* E — three bars */}
        <rect x="184" y="0" width="60" height="15" rx="1" fill="currentColor" />
        <rect x="184" y="42.5" width="60" height="15" rx="1" fill="currentColor" />
        <rect x="184" y="85" width="60" height="15" rx="1" fill="currentColor" />
        {/* X — crossed diagonals */}
        <line x1="270" y1="0" x2="342" y2="100" stroke="currentColor" strokeWidth="15" strokeLinecap="round" />
        <line x1="342" y1="0" x2="270" y2="100" stroke="currentColor" strokeWidth="15" strokeLinecap="round" />
      </svg>
      {showSubtitle && (
        <span className={`eyebrow mt-2 ${subtitleClassName}`} style={{ letterSpacing: '0.4em' }}>
          Martial&nbsp;Arts
        </span>
      )}
    </span>
  );
};

export default ApexLogo;
