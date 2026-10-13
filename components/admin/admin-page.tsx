import { useId, type ComponentPropsWithoutRef, type ReactNode } from "react"

import styles from "./admin-page.module.css"

function classes(...values: Array<string | undefined>) {
  return values.filter(Boolean).join(" ")
}

export type AdminPageProps = ComponentPropsWithoutRef<"section">

export function AdminPage({ className, ...props }: AdminPageProps) {
  return <section className={classes(styles.page, className)} {...props} />
}

export type AdminPageHeaderProps = {
  eyebrow?: ReactNode
  title: ReactNode
  description?: ReactNode
  breadcrumbs?: ReactNode
  actions?: ReactNode
}

export function AdminPageHeader({
  actions,
  breadcrumbs,
  description,
  eyebrow,
  title,
}: AdminPageHeaderProps) {
  return (
    <header className={styles.pageHeader}>
      {breadcrumbs ? <div className={styles.breadcrumbs}>{breadcrumbs}</div> : null}
      <div className={styles.headerCopy}>
        {eyebrow ? <p className={styles.eyebrow}>{eyebrow}</p> : null}
        <h1>{title}</h1>
        {description ? <p className={styles.description}>{description}</p> : null}
      </div>
      {actions ? <div className={styles.headerActions}>{actions}</div> : null}
    </header>
  )
}

export type AdminToolbarProps = ComponentPropsWithoutRef<"section"> & {
  label: string
}

export function AdminToolbar({ className, label, ...props }: AdminToolbarProps) {
  return (
    <section
      aria-label={label}
      className={classes(styles.toolbar, className)}
      {...props}
    />
  )
}

export type AdminSectionProps = ComponentPropsWithoutRef<"section"> & {
  title?: ReactNode
  description?: ReactNode
  actions?: ReactNode
}

export function AdminSection({
  actions,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  children,
  className,
  description,
  title,
  ...props
}: AdminSectionProps) {
  const generatedHeadingId = useId()
  const headingId = title && !ariaLabel && !ariaLabelledBy ? generatedHeadingId : undefined

  return (
    <section
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy ?? headingId}
      className={classes(styles.section, className)}
      {...props}
    >
      {title || description || actions ? (
        <div className={styles.sectionHeader}>
          <div className={styles.sectionCopy}>
            {title ? <h2 id={headingId}>{title}</h2> : null}
            {description ? <p>{description}</p> : null}
          </div>
          {actions ? <div className={styles.sectionActions}>{actions}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  )
}
