import { useId } from 'react'

/**
 * The iRetina mark — a crisp vector eye with a concentric retina/iris.
 * Rendered as inline SVG so it stays razor-sharp at any size and never washes
 * out to grey on the Mica backdrop the way the old raster PNG did.
 */
export default function Logo({
  size = 28,
  style
}: {
  size?: number
  style?: React.CSSProperties
}) {
  const id = useId().replace(/:/g, '')
  const iris = `iris-${id}`
  const eye = `eye-${id}`
  const glow = `glow-${id}`

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      role="img"
      aria-label="iRetina"
      style={{ display: 'block', ...style }}
    >
      <defs>
        <linearGradient id={eye} x1="4" y1="7" x2="28" y2="25" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7DD3FC" />
          <stop offset="1" stopColor="#2F7BE0" />
        </linearGradient>
        <radialGradient id={iris} cx="0.5" cy="0.42" r="0.62">
          <stop stopColor="#8AE0FF" />
          <stop offset="0.55" stopColor="#2A8FE8" />
          <stop offset="1" stopColor="#0B4FA6" />
        </radialGradient>
        <radialGradient id={glow} cx="0.5" cy="0.5" r="0.5">
          <stop stopColor="#BEE8FF" stopOpacity="0.9" />
          <stop offset="1" stopColor="#BEE8FF" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Eye almond outline */}
      <path
        d="M16 6.5C23.2 6.5 28.8 12.4 30.5 16C28.8 19.6 23.2 25.5 16 25.5C8.8 25.5 3.2 19.6 1.5 16C3.2 12.4 8.8 6.5 16 6.5Z"
        fill={`url(#${eye})`}
        opacity="0.16"
      />
      <path
        d="M16 6.5C23.2 6.5 28.8 12.4 30.5 16C28.8 19.6 23.2 25.5 16 25.5C8.8 25.5 3.2 19.6 1.5 16C3.2 12.4 8.8 6.5 16 6.5Z"
        stroke={`url(#${eye})`}
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {/* Iris / retina */}
      <circle cx="16" cy="16" r="6.6" fill={`url(#${iris})`} />
      {/* Concentric retina ring */}
      <circle cx="16" cy="16" r="6.6" fill="none" stroke="#BEE8FF" strokeOpacity="0.35" strokeWidth="0.9" />
      <circle cx="16" cy="16" r="3.4" fill="#062A5C" />
      {/* Catchlight */}
      <circle cx="13.9" cy="13.9" r="1.5" fill={`url(#${glow})`} />
      <circle cx="14" cy="14" r="0.9" fill="#FFFFFF" opacity="0.95" />
    </svg>
  )
}
