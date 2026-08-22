import { useLocale } from "@/components/i18n/locale-provider"
import { copy, stack } from "@/lib/content"

/** Two identical tracks scrolling as one, with only the duplicate hidden from assistive tech. */
export function StackStrip() {
  const locale = useLocale()
  const t = copy[locale]

  const track = (duplicate = false) => (
    <ul className="strip-track" aria-hidden={duplicate || undefined}>
      {stack.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  )

  return (
    <section className="strip" aria-label={t.stripLabel}>
      <div className="strip-label">{t.stripLabel}</div>

      <div className="strip-viewport">
        <div className="strip-marquee">
          {track()}
          {track(true)}
        </div>
      </div>
    </section>
  )
}
