import glasses from './glasses.png'
import glasses2x from './glasses@2x.png'

/** The official iRetina glasses mark. */
export default function Logo({ size = 28, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <img
      src={glasses}
      srcSet={`${glasses} 1x, ${glasses2x} 2x`}
      width={size}
      height={size}
      alt="iRetina"
      draggable={false}
      style={{ display: 'block', objectFit: 'contain', ...style }}
    />
  )
}
