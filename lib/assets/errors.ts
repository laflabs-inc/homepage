export type AssetErrorCode =
  | "invalid_input"
  | "unsupported_type"
  | "file_too_large"
  | "invalid_image"
  | "pixel_limit_exceeded"
  | "dimension_limit_exceeded"
  | "animated_image"
  | "unsafe_svg"
  | "processing_unavailable"

export class AssetError extends Error {
  constructor(public readonly code: AssetErrorCode) {
    super(code)
    this.name = "AssetError"
  }
}
