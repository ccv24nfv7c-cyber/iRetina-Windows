import { useId } from 'react'

/**
 * The iRetina glasses mark, drawn as inline SVG so it stays razor-sharp and
 * properly blue at any size (the old raster PNG went soft and grey when scaled).
 */
export default function Logo({
  size = 28,
  style
}: {
  size?: number
  style?: React.CSSProperties
}) {
  const id = useId().replace(/:/g, '')
  const grad = `g-${id}`
  // Wider than tall — keep the aspect and center it in the requested box.
  const h = Math.round(size * 0.62)

  return (
    <svg
      width={size}
      height={h}
      viewBox="0 0 48 30"
      fill="none"
      role="img"
      aria-label="iRetina"
      style={{ display: 'block', overflow: 'visible', ...style }}
    >
      <defs>
        <linearGradient id={grad} x1="2" y1="6" x2="44" y2="24" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7DD3FC" />
          <stop offset="1" stopColor="#2F7BE0" />
        </linearGradient>
      </defs>
      <g
        stroke={`url(#${grad})`}
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      >
        {/* Left lens */}
        <rect x="4" y="8.5" width="16.5" height="14" rx="5.5" />
        {/* Right lens */}
        <rect x="27.5" y="8.5" width="16.5" height="14" rx="5.5" />
        {/* Bridge */}
        <path d="M20.5 12.5c1.6-1.4 5.4-1.4 7 0" />
        {/* Temple arms */}
        <path d="M4 11.5 1 10.2" />
        <path d="M44 11.5 47 10.2" />
      </g>
    </svg>
  )
}
