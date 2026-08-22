import Image from "next/image"

export function Logo({ size = 24 }: { size?: number }) {
  return (
    <span className="laf-logo" aria-label="LafLabs">
      <Image src="/laflabs-logo.png" width={size} height={size} alt="" />
      <span className="laf-logo-text">
        <b>Laf</b>
        <span>Labs</span>
      </span>
    </span>
  )
}
