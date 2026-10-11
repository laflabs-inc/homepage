"use client"

import Link from "next/link"
import { ArrowRight } from "@phosphor-icons/react/dist/ssr"

import { useLocale } from "@/components/i18n/locale-provider"
import { SiteFooter } from "@/components/layout/site-footer"
import { SiteHeader } from "@/components/layout/site-header"
import type { CareerRole, CareersPageContent, LocalizedText } from "@/lib/careers"
import type { Locale } from "@/lib/i18n"

import { CareersWorkField } from "./careers-work-field"
import styles from "./careers.module.css"

const pageCopy = {
  ko: {
    heroAction: "일하는 기준 보기",
    workFieldLabel: "LafLabs가 일을 확장하는 방식",
    rolesTitle: "열린 역할",
    rolesEmpty: "현재 공개된 역할은 없습니다.",
    rolesEmptyBody: "정해진 공고가 없어도 함께 풀고 싶은 문제가 있다면 먼저 이야기를 보내 주세요.",
    rolesAction: "먼저 이야기하기",
    problemsTitle: "우리가 다루는 문제",
    principlesTitle: "함께 일하는 기준",
    processTitle: "대화를 시작하는 과정",
    applicationAction: "이메일 보내기",
  },
  en: {
    heroAction: "See how we work",
    workFieldLabel: "How LafLabs expands its work",
    rolesTitle: "Open roles",
    rolesEmpty: "There are no public openings right now.",
    rolesEmptyBody: "You can still tell us about a problem you want to solve together.",
    rolesAction: "Start a conversation",
    problemsTitle: "Problems we take on",
    principlesTitle: "How we work together",
    processTitle: "How a conversation starts",
    applicationAction: "Send an email",
  },
} as const

function localize(value: LocalizedText, locale: Locale) {
  return value[locale]
}

export function CareersRoleList({ roles }: { roles: readonly CareerRole[] }) {
  const locale = useLocale()

  if (roles.length === 0) return null

  return (
    <ul className={styles.roleList}>
      {roles.map((role) => (
        <li key={role.id}>
          <Link
            href={role.href ?? `/careers/${role.slug}`}
            data-analytics-event="career_role_click"
            data-analytics-target={role.slug}
          >
            <span className={styles.roleTeam}>{localize(role.team, locale)}</span>
            <span className={styles.roleMain}>
              <strong>{localize(role.title, locale)}</strong>
              <span>{localize(role.summary, locale)}</span>
            </span>
            <ArrowRight aria-hidden size={18} weight="bold" />
          </Link>
        </li>
      ))}
    </ul>
  )
}

export function CareersPage({ content }: { content: CareersPageContent }) {
  const locale = useLocale()
  const t = pageCopy[locale]
  const hasRoles = content.roles.length > 0

  return (
    <>
      <SiteHeader homeHref="/" />
      <main className={styles.root}>
        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <h1>{localize(content.hero.title, locale)}</h1>
            <p>{localize(content.hero.body, locale)}</p>
            <a
              className={styles.textAction}
              href="#working-principles"
              data-analytics-event="careers_principles_click"
            >
              {t.heroAction}
              <ArrowRight aria-hidden size={16} weight="bold" />
            </a>
          </div>
          <CareersWorkField label={t.workFieldLabel} />
        </section>

        <section className={styles.roles} aria-labelledby="careers-roles-title">
          <h2 id="careers-roles-title">{t.rolesTitle}</h2>
          {hasRoles ? (
            <CareersRoleList roles={content.roles} />
          ) : (
            <div className={styles.emptyRole}>
              <div>
                <strong>{t.rolesEmpty}</strong>
                <p>{t.rolesEmptyBody}</p>
              </div>
              <a href="#open-application" data-analytics-event="careers_open_application_view">
                {t.rolesAction}
                <ArrowRight aria-hidden size={16} weight="bold" />
              </a>
            </div>
          )}
        </section>

        <section className={styles.problems} aria-labelledby="careers-problems-title">
          <h2 id="careers-problems-title">{t.problemsTitle}</h2>
          <div className={styles.problemGrid}>
            {content.problems.map((problem) => (
              <article key={problem.id}>
                <span>{problem.mark}</span>
                <h3>{localize(problem.title, locale)}</h3>
                <p>{localize(problem.body, locale)}</p>
              </article>
            ))}
          </div>
        </section>

        <section
          id="working-principles"
          className={styles.principles}
          aria-labelledby="careers-principles-title"
        >
          <h2 id="careers-principles-title">{t.principlesTitle}</h2>
          <ol className={styles.principleList}>
            {content.principles.map((principle, index) => (
              <li key={principle.id}>
                <span className={styles.principleMark}>{principle.mark}</span>
                <div>
                  <h3>{localize(principle.title, locale)}</h3>
                  <p>{localize(principle.body, locale)}</p>
                </div>
                <span className={styles.principleIndex}>{String(index + 1).padStart(2, "0")}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className={styles.process} aria-labelledby="careers-process-title">
          <h2 id="careers-process-title">{t.processTitle}</h2>
          <ol>
            {content.process.map((step, index) => (
              <li key={step.id}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h3>{localize(step.title, locale)}</h3>
                <p>{localize(step.body, locale)}</p>
              </li>
            ))}
          </ol>
        </section>

        <section id="open-application" className={styles.openApplication}>
          <div>
            <h2>{localize(content.openApplication.title, locale)}</h2>
            <p>{localize(content.openApplication.body, locale)}</p>
          </div>
          <a
            href={`mailto:${content.openApplication.email}?subject=LafLabs%20open%20application`}
            data-analytics-event="contact_click"
            data-analytics-target="career-open-application"
          >
            {t.applicationAction}
            <ArrowRight aria-hidden size={18} weight="bold" />
          </a>
        </section>
      </main>
      <SiteFooter homeHref="/" />
    </>
  )
}
