import type { DesignSystemMeta } from "./schema"

export const designSystemMeta = {
  name: "LafLabs Web Design",
  skillName: "laflabs-web-design",
  version: "2026.11.0",
  updatedAt: "2026-11-07",
  canonicalPath: "/design",
  publicOrigin: "https://www.laflabs.co",
  locales: ["ko", "en"],
} as const satisfies DesignSystemMeta
