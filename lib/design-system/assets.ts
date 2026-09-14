import type { AssetEntry } from "./schema"

export const assets = [
  {
    id: "official-logo",
    name: "Official logo",
    path: "/laflabs-logo.png",
    format: "PNG",
    dimensions: "460 × 460 px",
    usage: {
      ko: "LafLabs 로고가 필요한 공개 화면에서 원본 비율로 사용합니다.",
      en: "Use at its original proportions wherever the LafLabs logo is required on a public surface.",
    },
    downloadable: true,
  },
  {
    id: "system-loop-poster",
    name: "System loop poster",
    path: "/laf-system-loop-poster.png",
    format: "PNG",
    dimensions: "1080 × 1080 px",
    usage: {
      ko: "System loop 영상이 재생되기 전이나 정지 상태일 때 표시합니다.",
      en: "Use as the poster before the System loop video plays or when it remains still.",
    },
    downloadable: true,
  },
  {
    id: "system-loop-webm",
    name: "System loop motion",
    path: "/laf-system-loop.webm",
    format: "WebM",
    dimensions: "1080 × 1080 px",
    usage: {
      ko: "지원하는 브라우저에서 System loop의 WebM 소스로 사용합니다.",
      en: "Use as the WebM source for the System loop in supporting browsers.",
    },
    downloadable: true,
  },
  {
    id: "system-loop-mp4",
    name: "System loop motion",
    path: "/laf-system-loop.mp4",
    format: "MP4",
    dimensions: "1080 × 1080 px",
    usage: {
      ko: "System loop의 MP4 대체 소스로 사용합니다.",
      en: "Use as the MP4 fallback source for the System loop.",
    },
    downloadable: true,
  },
] as const satisfies readonly AssetEntry[]
