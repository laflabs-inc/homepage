import { SiteFooter } from "@/components/layout/site-footer"
import { SiteHeader } from "@/components/layout/site-header"
import { Cta } from "@/components/sections/cta"
import { Hero } from "@/components/sections/hero"
import { NameStory } from "@/components/sections/name-story"
import { OpenSource } from "@/components/sections/open-source"
import { Principles } from "@/components/sections/principles"
import { Products } from "@/components/sections/products"
import { StackStrip } from "@/components/sections/stack-strip"
import { Statement } from "@/components/sections/statement"
import { contactEmail, githubOrg, siteUrl } from "@/lib/content"

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "LafLabs Inc.",
  alternateName: "LafLabs",
  url: siteUrl,
  logo: `${siteUrl}/favicon.svg`,
  email: contactEmail,
  slogan: "Build quietly. Work reliably.",
  description:
    "A software company building identity, payments, and cloud infrastructure as one coherent experience.",
  address: { "@type": "PostalAddress", addressCountry: "KR", addressLocality: "Seoul" },
  sameAs: [githubOrg],
}

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <SiteHeader />
      <main>
        <Hero />
        <Statement />
        <Products />
        <StackStrip />
        <OpenSource />
        <Principles />
        <NameStory />
        <Cta />
      </main>
      <SiteFooter />
    </>
  )
}
