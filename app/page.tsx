import { Landing } from "@/components/landing"
import { SiteFooter } from "@/components/layout/site-footer"
import { SiteHeader } from "@/components/layout/site-header"
import { contactEmail, githubOrg, siteUrl } from "@/lib/content"

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "LafLabs Inc.",
  alternateName: "LafLabs",
  url: siteUrl,
  logo: `${siteUrl}/laflabs-logo.png`,
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
      <Landing />
      <SiteFooter />
    </>
  )
}
