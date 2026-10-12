"use client"

import { List } from "@phosphor-icons/react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"

import { AdminLanguageToggle } from "@/components/admin/admin-language-toggle"
import { AdminNav } from "@/components/admin/admin-nav"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/ui/logo"
import {
  SidePanel,
  SidePanelContent,
  SidePanelHeader,
  SidePanelTitle,
  SidePanelTrigger,
} from "@/components/ui/side-panel"
import { useLocale } from "@/components/i18n/locale-provider"
import { adminCopy } from "@/lib/admin/i18n"
import { activeAdminNavItem } from "@/lib/admin/navigation"
import styles from "./admin-workspace.module.css"

function WorkspaceFooter() {
  const locale = useLocale()
  const t = adminCopy[locale].nav

  return (
    <div className={styles.workspaceFooter}>
      <AdminLanguageToggle />
      <Link className={styles.publicLink} href="/">{t.publicSite}</Link>
    </div>
  )
}

function WorkspaceIdentity() {
  const locale = useLocale()
  const t = adminCopy[locale].shell

  return (
    <div className={styles.identity}>
      <Link href="/" aria-label={t.homeLabel}><Logo /></Link>
      <span>{t.privateLabel}</span>
    </div>
  )
}

export function AdminWorkspace({ children }: { children: React.ReactNode }) {
  const locale = useLocale()
  const pathname = usePathname()
  const t = adminCopy[locale]
  const [mobileOpen, setMobileOpen] = useState(false)
  const currentId = activeAdminNavItem(pathname)
  const currentLabel = currentId ? t.nav[currentId] : t.nav.label

  return (
    <div className={styles.workspace}>
      <aside className={styles.desktopSidebar}>
        <WorkspaceIdentity />
        <AdminNav />
        <WorkspaceFooter />
      </aside>

      <div className={styles.mobileBar}>
        <Link href="/" aria-label={t.shell.homeLabel}><Logo /></Link>
        <div className={styles.mobileSection}>
          <span>{t.nav.currentSection}</span>
          <strong>{currentLabel}</strong>
        </div>
        <SidePanel open={mobileOpen} onOpenChange={setMobileOpen}>
          <SidePanelTrigger asChild>
            <Button aria-label={t.nav.openMenu} size="icon" variant="outline">
              <List aria-hidden size={20} weight="bold" />
            </Button>
          </SidePanelTrigger>
          <SidePanelContent
            className={styles.mobilePanel}
            closeLabel={t.nav.closeMenu}
            side="left"
          >
            <SidePanelHeader className={styles.mobilePanelHeader}>
              <WorkspaceIdentity />
              <SidePanelTitle className={styles.mobilePanelTitle}>{t.nav.label}</SidePanelTitle>
            </SidePanelHeader>
            <AdminNav onNavigate={() => setMobileOpen(false)} />
            <WorkspaceFooter />
          </SidePanelContent>
        </SidePanel>
      </div>

      <main className={styles.main}>{children}</main>
    </div>
  )
}
