import {
  DOMParser,
  XMLSerializer,
  type Attr as XmlAttr,
  type Document as XmlDocument,
  type Element as XmlElement,
  type Node as XmlNode,
} from "@xmldom/xmldom"

import { AssetError } from "@/lib/assets/errors"
import { MAX_SVG_BYTES } from "@/lib/assets/policy"

const SVG_NAMESPACE = "http://www.w3.org/2000/svg"
const XLINK_NAMESPACE = "http://www.w3.org/1999/xlink"

const allowedElements = new Set([
  "svg",
  "g",
  "path",
  "rect",
  "circle",
  "ellipse",
  "line",
  "polyline",
  "polygon",
  "text",
  "tspan",
  "defs",
  "linearGradient",
  "radialGradient",
  "stop",
  "clipPath",
  "mask",
  "use",
  "title",
  "desc",
])

const allowedAttributes = new Set([
  "xmlns",
  "xmlns:xlink",
  "id",
  "class",
  "viewBox",
  "width",
  "height",
  "x",
  "y",
  "x1",
  "y1",
  "x2",
  "y2",
  "cx",
  "cy",
  "r",
  "rx",
  "ry",
  "d",
  "points",
  "transform",
  "fill",
  "fill-opacity",
  "fill-rule",
  "stroke",
  "stroke-width",
  "stroke-linecap",
  "stroke-linejoin",
  "stroke-miterlimit",
  "stroke-dasharray",
  "stroke-dashoffset",
  "stroke-opacity",
  "opacity",
  "clip-path",
  "clip-rule",
  "mask",
  "offset",
  "stop-color",
  "stop-opacity",
  "gradientUnits",
  "gradientTransform",
  "spreadMethod",
  "preserveAspectRatio",
  "vector-effect",
  "text-anchor",
  "font-family",
  "font-size",
  "font-weight",
  "role",
  "href",
  "xlink:href",
])

const localReference = /^#[A-Za-z_][A-Za-z0-9_.:-]*$/
const localPaintReference = /^url\(#[A-Za-z_][A-Za-z0-9_.:-]*\)$/
const numericValue = /^[+]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/

export type SanitizedSvg = {
  bytes: Uint8Array
  width: number | null
  height: number | null
}

function unsafe(): never {
  throw new AssetError("unsafe_svg")
}

function parseSvg(source: string): XmlDocument {
  try {
    return new DOMParser({
      onError() {
        throw new Error("invalid_svg_xml")
      },
    }).parseFromString(source, "image/svg+xml")
  } catch {
    return unsafe()
  }
}

function validateAttribute(attribute: XmlAttr): void {
  const name = attribute.name
  const value = attribute.value.trim()
  if (!allowedAttributes.has(name) && !/^aria-[a-z][a-z0-9-]*$/.test(name)) unsafe()
  if (/^on/i.test(name) || name === "style") unsafe()

  if (name === "xmlns") {
    if (value !== SVG_NAMESPACE) unsafe()
    return
  }
  if (name === "xmlns:xlink") {
    if (value !== XLINK_NAMESPACE) unsafe()
    return
  }
  if (name === "href" || name === "xlink:href") {
    if (!localReference.test(value)) unsafe()
    return
  }

  if (/javascript:|data:|https?:|\/\//i.test(value)) unsafe()
  if (/url\(/i.test(value) && !localPaintReference.test(value)) unsafe()
}

function validateNode(node: XmlNode): void {
  if (node.nodeType === 1) {
    const element = node as XmlElement
    if (element.namespaceURI !== SVG_NAMESPACE || !allowedElements.has(element.tagName)) unsafe()
    for (let index = 0; index < element.attributes.length; index += 1) {
      validateAttribute(element.attributes.item(index)!)
    }
  } else if (![3, 4, 8, 9].includes(node.nodeType)) {
    unsafe()
  }

  for (let child = node.firstChild; child; child = child.nextSibling) validateNode(child)
}

function positiveNumber(value: string | null): number | null {
  if (!value || !numericValue.test(value.trim())) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

function dimensions(root: XmlElement): { width: number | null; height: number | null } {
  const viewBox = root.getAttribute("viewBox")?.trim().split(/[\s,]+/).map(Number)
  if (
    viewBox?.length === 4 &&
    viewBox.every(Number.isFinite) &&
    viewBox[2]! > 0 &&
    viewBox[3]! > 0
  ) {
    return { width: viewBox[2]!, height: viewBox[3]! }
  }

  const width = positiveNumber(root.getAttribute("width"))
  const height = positiveNumber(root.getAttribute("height"))
  return width !== null && height !== null ? { width, height } : { width: null, height: null }
}

export function sanitizeSvg(input: Uint8Array): SanitizedSvg {
  if (input.byteLength === 0 || input.byteLength > MAX_SVG_BYTES) unsafe()

  let source: string
  try {
    source = new TextDecoder("utf-8", { fatal: true }).decode(input)
  } catch {
    return unsafe()
  }
  if (/<!DOCTYPE|<!ENTITY/i.test(source)) unsafe()

  const document = parseSvg(source)
  const root = document.documentElement
  if (!root || root.tagName !== "svg" || root.namespaceURI !== SVG_NAMESPACE) unsafe()
  validateNode(document)

  const size = dimensions(root)
  const serialized = new XMLSerializer().serializeToString(root)
  const reparsed = parseSvg(serialized)
  if (!reparsed.documentElement || reparsed.documentElement.tagName !== "svg") unsafe()

  return { bytes: new TextEncoder().encode(serialized), ...size }
}
