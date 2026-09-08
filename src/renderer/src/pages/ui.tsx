import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { makeStyles, mergeClasses } from '@fluentui/react-components'

/** Restrained, native-feeling primitives. Solid surfaces, one accent, 8px rhythm. */
export const useUi = makeStyles({
  page: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    padding: '32px 36px 48px',
    maxWidth: '820px',
    width: '100%',
    margin: '0 auto',
    boxSizing: 'border-box'
  },
  head: { display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '2px' },
  title: { fontSize: '22px', fontWeight: '600', letterSpacing: '-0.01em', color: 'var(--text)' },
  subtitle: { fontSize: '13px', color: 'var(--text-mute)' },

  section: { display: 'flex', flexDirection: 'column', gap: '8px' },
  sectionLabel: {
    fontSize: '11px',
    fontWeight: '600',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: 'var(--text-mute)',
    paddingLeft: '2px'
  },
  card: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    boxShadow: 'var(--shadow-sm)',
    overflow: 'hidden'
  },

  row: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '14px 16px',
    minHeight: '32px'
  },
  rowDivider: { borderTop: '1px solid var(--border)' },
  rowIcon: {
    width: '30px',
    height: '30px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    fontSize: '16px',
    color: 'var(--text-dim)',
    background: 'var(--surface-2)'
  },
  rowText: { display: 'flex', flexDirection: 'column', gap: '2px', flex: 1, minWidth: 0 },
  rowTitle: { fontSize: '13px', fontWeight: '600', color: 'var(--text)' },
  rowDesc: { fontSize: '12px', lineHeight: 1.45, color: 'var(--text-mute)' },
  rowRight: { display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 },
  rowValue: {
    fontSize: '13px',
    fontWeight: '600',
    color: 'var(--text)',
    fontVariantNumeric: 'tabular-nums',
    minWidth: '58px',
    textAlign: 'right'
  },

  body: { fontSize: '13px', lineHeight: 1.6, color: 'var(--text-dim)' },

  btn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '7px',
    height: '32px',
    padding: '0 14px',
    borderRadius: '8px',
    border: '1px solid transparent',
    fontFamily: 'inherit',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'background 160ms ease, border-color 160ms ease, opacity 160ms ease',
    ':focus-visible': { outline: '2px solid var(--focus)', outlineOffset: '2px' },
    ':disabled': { opacity: 0.45, cursor: 'default' }
  },
  btnPrimary: {
    background: 'var(--accent)',
    color: 'var(--on-accent)',
    ':hover': { background: 'var(--accent-hover)' },
    ':active': { background: 'var(--accent-press)' }
  },
  btnGhost: {
    background: 'var(--surface-2)',
    color: 'var(--text)',
    border: '1px solid var(--border)',
    ':hover': { background: 'var(--surface-hover)' },
    ':active': { background: 'var(--surface-active)' }
  },
  btnSubtle: {
    background: 'transparent',
    color: 'var(--text-dim)',
    ':hover': { background: 'var(--surface-2)', color: 'var(--text)' }
  },
  btnDanger: {
    background: 'var(--danger-soft)',
    color: 'var(--danger)',
    border: '1px solid transparent',
    ':hover': { border: '1px solid var(--danger)' }
  },
  btnSm: { height: '28px', padding: '0 10px', fontSize: '12px' }
})

export function Page({
  title,
  subtitle,
  children
}: {
  title: string
  subtitle?: string
  children: ReactNode
}) {
  const s = useUi()
  return (
    <div className={s.page}>
      <div className={s.head}>
        <div className={s.title}>{title}</div>
        {subtitle && <div className={s.subtitle}>{subtitle}</div>}
      </div>
      {children}
    </div>
  )
}

export function Section({ label, children }: { label?: string; children: ReactNode }) {
  const s = useUi()
  return (
    <div className={s.section}>
      {label && <div className={s.sectionLabel}>{label}</div>}
      {children}
    </div>
  )
}

export function Card({ children }: { children: ReactNode }) {
  const s = useUi()
  return <div className={s.card}>{children}</div>
}

export function Row({
  icon,
  title,
  desc,
  right,
  value,
  first
}: {
  icon?: ReactNode
  title: ReactNode
  desc?: ReactNode
  right?: ReactNode
  value?: ReactNode
  first?: boolean
}) {
  const s = useUi()
  return (
    <div className={mergeClasses(s.row, first ? undefined : s.rowDivider)}>
      {icon != null && <div className={s.rowIcon}>{icon}</div>}
      <div className={s.rowText}>
        <div className={s.rowTitle}>{title}</div>
        {desc != null && <div className={s.rowDesc}>{desc}</div>}
      </div>
      {(right != null || value != null) && (
        <div className={s.rowRight}>
          {value != null && <span className={s.rowValue}>{value}</span>}
          {right}
        </div>
      )}
    </div>
  )
}

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost' | 'subtle' | 'danger'
  size?: 'md' | 'sm'
  icon?: ReactNode
}

export function Btn({ variant = 'ghost', size = 'md', icon, children, className, ...rest }: BtnProps) {
  const s = useUi()
  const v =
    variant === 'primary'
      ? s.btnPrimary
      : variant === 'subtle'
        ? s.btnSubtle
        : variant === 'danger'
          ? s.btnDanger
          : s.btnGhost
  return (
    <button
      type="button"
      className={mergeClasses(s.btn, v, size === 'sm' ? s.btnSm : undefined, className)}
      {...rest}
    >
      {icon}
      {children}
    </button>
  )
}
