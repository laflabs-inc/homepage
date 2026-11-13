import { EvidenceHome } from "@/components/home-experiment/evidence-home"
import { SiteFooter } from "@/components/layout/site-footer"
import { SiteHeader } from "@/components/layout/site-header"

export default function HomeExperimentPage() {
  return (
    <>
      <SiteHeader />
      <EvidenceHome />
      <SiteFooter />
    </>
  )
}
