"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { useLocale } from "@/components/i18n/locale-provider"
import { adminCopy } from "@/lib/admin/i18n"
import { activeAdminNavItem, adminNavigation } from "@/lib/admin/navigation"
import styles from "./admin-workspace.module.css"

export function AdminNav({ onNavigate }: { onNavigate?: () => void }) {
  const t = adminCopy[useLocale()].nav
  const activeItem = activeAdminNavItem(usePathname())

  return (
    <nav className={styles.adminNav} aria-label={t.label}>
      {adminNavigation.map((group) => (
        <section className={styles.navGroup} key={group.id}>
          <p className={styles.navGroupLabel}>{t.groups[group.id]}</p>
          <ul className={styles.navList}>
            {group.items.map((item) => (
              <li
                key={item.id}
                data-parent={"parentId" in item ? item.parentId : undefined}
              >
                <Link
                  aria-current={activeItem === item.id ? "page" : undefined}
                  className={styles.navItem}
                  href={item.href}
                  onClick={onNavigate}
                >
                  {t[item.id]}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </nav>
  )
}
