import { SiteFooter } from "@/components/layout/site-footer"
import { SiteHeader } from "@/components/layout/site-header"

function HomeExperimentPreview() {
  return <main id="top" data-home-experiment="true" />
}

export default function HomeExperimentPage() {
  return (
    <>
      <SiteHeader />
      <HomeExperimentPreview />
      <SiteFooter />
    </>
  )
}
