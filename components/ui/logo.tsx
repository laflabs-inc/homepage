/**
 * LafLabs mark. Square geometry to match the system's `--radius: 0`:
 * an "L" built from two blocks, plus one accent square — the "Laf" half
 * of the name is the only thing on the page allowed to be playful.
 */
export function LogoMark({ size = 26, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <rect x="4" y="4" width="8" height="24" fill="var(--brand)" />
      <rect x="12" y="20" width="16" height="8" fill="var(--brand)" />
      <rect x="22" y="4" width="6" height="6" fill="var(--spark)" />
    </svg>
  )
}

export function Logo({ size = 26 }: { size?: number }) {
  return (
    <span className="laf-logo" aria-label="LafLabs">
      <LogoMark size={size} className="laf-logo-mark" />
      <span className="laf-logo-text">
        <b>Laf</b>
        <span>Labs</span>
      </span>
    </span>
  )
}
