import { render, screen, within } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

const { reducedMotionMock } = vi.hoisted(() => ({
  reducedMotionMock: vi.fn(() => false),
}))

vi.mock("motion/react", () => ({
  motion: {
    div: ({ children, ...props }: React.ComponentProps<"div"> & Record<string, unknown>) => (
      <div {...props}>{children}</div>
    ),
    span: ({ children, ...props }: React.ComponentProps<"span"> & Record<string, unknown>) => (
      <span {...props}>{children}</span>
    ),
  },
  useReducedMotion: reducedMotionMock,
}))
vi.mock("@/components/home-experiment/evidence-scenes.module.css", () => ({
  default: new Proxy({}, { get: (_target, property) => String(property) }),
}))

import {
  BuildScene,
  IdentityArtifact,
  LafetchArtifact,
  LafwallArtifact,
  MethodScene,
} from "@/components/home-experiment/evidence-scenes"
import { homeExperimentCopy, homeExperimentWork } from "@/lib/home-experiment"

const identity = homeExperimentWork[0].artifact
const lafetch = homeExperimentWork[1].artifact
const lafwall = homeExperimentWork[2].artifact
const ask = homeExperimentCopy.ko.method.items[0]

function renderScenes(compact = false) {
  return render(
    <>
      <BuildScene compact={compact} label={homeExperimentCopy.ko.hero.artifactLabel} />
      <MethodScene compact={compact} item={ask} />
      <IdentityArtifact artifact={identity} compact={compact} locale="ko" />
      <LafetchArtifact artifact={lafetch} compact={compact} locale="ko" />
      <LafwallArtifact artifact={lafwall} compact={compact} locale="ko" />
    </>,
  )
}

beforeEach(() => reducedMotionMock.mockReturnValue(false))

describe("home evidence scenes", () => {
  it("keeps each scene identifiable and carries its verified focal strings", () => {
    const { container } = renderScenes()

    expect(container.querySelector('[data-evidence-scene="build"]')).toBeInTheDocument()
    expect(container.querySelector('[data-evidence-scene="method-ask"]')).toBeInTheDocument()
    expect(container.querySelector('[data-evidence-scene="identity"]')).toBeInTheDocument()
    expect(container.querySelector('[data-evidence-scene="lafetch"]')).toBeInTheDocument()
    expect(container.querySelector('[data-evidence-scene="lafwall"]')).toBeInTheDocument()

    expect(screen.getByText(homeExperimentCopy.ko.hero.artifactLabel)).toBeVisible()
    expect(screen.getByText(ask.caption)).toBeVisible()
    expect(within(container.querySelector('[data-evidence-scene="identity"]')!).getByText("OpenID Connect")).toBeVisible()
    expect(within(container.querySelector('[data-evidence-scene="lafetch"]')!).getByText(/lafetch\.create/)).toBeVisible()
    expect(within(container.querySelector('[data-evidence-scene="lafwall"]')!).getByText("Deny by default")).toBeVisible()
  })

  it("hides explanatory diagrams from assistive technology", () => {
    const { container } = renderScenes()
    const diagrams = [...container.querySelectorAll("svg")]

    expect(diagrams.length).toBeGreaterThan(0)
    expect(diagrams.every((diagram) => diagram.getAttribute("aria-hidden") === "true")).toBe(true)
  })

  it("uses explicit compact compositions and exposes the complete reduced-motion state", () => {
    reducedMotionMock.mockReturnValue(true)
    const { container } = renderScenes(true)
    const scenes = [...container.querySelectorAll("[data-evidence-scene]")]

    expect(scenes).toHaveLength(5)
    expect(scenes.every((scene) => scene.getAttribute("data-compact") === "true")).toBe(true)
    expect(scenes.every((scene) => scene.getAttribute("data-motion-state") === "complete")).toBe(true)
  })
})
