const maxLineLength = 80

function indent(level: number) {
  return "  ".repeat(level)
}

function splitAttributes(source: string) {
  const attributes: string[] = []
  let current = ""
  let quote: '"' | "'" | null = null
  let braceDepth = 0

  for (const character of source.trim()) {
    if (quote) {
      current += character
      if (character === quote) quote = null
      continue
    }

    if (character === '"' || character === "'") {
      quote = character
      current += character
      continue
    }

    if (character === "{") braceDepth += 1
    if (character === "}") braceDepth -= 1

    if (/\s/.test(character) && braceDepth === 0) {
      if (current) attributes.push(current)
      current = ""
      continue
    }

    current += character
  }

  if (current) attributes.push(current)
  return attributes
}

function formatTag(tag: string, level: number) {
  const prefix = indent(level)
  if (prefix.length + tag.length <= maxLineLength) return [prefix + tag]

  const match = tag.match(/^<([^\s/>]+)/)
  if (!match) return [prefix + tag]

  const name = match[1]
  const closing = tag.endsWith("/>") ? "/>" : ">"
  const attributeSource = tag.slice(match[0].length, -closing.length)
  const attributes = splitAttributes(attributeSource)
  if (attributes.length === 0) return [prefix + tag]

  return [
    `${prefix}<${name}`,
    ...attributes.map((attribute) => `${indent(level + 1)}${attribute}`),
    `${prefix}${closing}`,
  ]
}

function tokenizeJsx(source: string) {
  const tokens: string[] = []
  let textStart = 0
  let index = 0

  while (index < source.length) {
    if (source[index] !== "<") {
      index += 1
      continue
    }

    if (index > textStart) tokens.push(source.slice(textStart, index))
    const tagStart = index
    index += 1
    let quote: '"' | "'" | null = null
    let braceDepth = 0

    while (index < source.length) {
      const character = source[index]
      if (quote) {
        if (character === quote) quote = null
      } else if (character === '"' || character === "'") {
        quote = character
      } else if (character === "{") {
        braceDepth += 1
      } else if (character === "}") {
        braceDepth -= 1
      } else if (character === ">" && braceDepth === 0) {
        index += 1
        break
      }
      index += 1
    }

    tokens.push(source.slice(tagStart, index))
    textStart = index
  }

  if (textStart < source.length) tokens.push(source.slice(textStart))
  return tokens.filter((token) => token.trim().length > 0)
}

function tagName(tag: string) {
  return tag.match(/^<\/?([^\s/>]+)/)?.[1]
}

function formatJsxExample(source: string) {
  const tokens = tokenizeJsx(source)
  const lines: string[] = []
  let level = 0

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index].trim()
    const isClosing = token.startsWith("</")
    const isSelfClosing = token.endsWith("/>")
    const isFragmentOpen = token === "<>"
    const isFragmentClose = token === "</>"

    if (!isClosing && !isSelfClosing && !isFragmentOpen) {
      const text = tokens[index + 1]?.trim()
      const close = tokens[index + 2]?.trim()
      if (text && close?.startsWith("</") && tagName(token) === tagName(close)) {
        const inlineLeaf = `${token}${text}${close}`
        if (indent(level).length + inlineLeaf.length <= maxLineLength) {
          lines.push(indent(level) + inlineLeaf)
          index += 2
          continue
        }
      }
    }

    if (isClosing || isFragmentClose) level = Math.max(0, level - 1)

    if (token.startsWith("<")) {
      lines.push(...formatTag(token, level))
    } else {
      lines.push(indent(level) + token)
    }

    if ((!isClosing && !isSelfClosing && token !== "</>") || isFragmentOpen) {
      level += 1
    }
  }

  return lines.join("\n")
}

function formatStatements(source: string) {
  const lines: string[] = []
  let current = ""
  let quote: '"' | "'" | "`" | null = null
  let depth = 0

  for (const character of source.trim()) {
    current += character
    if (quote) {
      if (character === quote) quote = null
      continue
    }
    if (character === '"' || character === "'" || character === "`") {
      quote = character
      continue
    }
    if ("{([".includes(character)) depth += 1
    if ("})]".includes(character)) depth -= 1
    if (character === ";" && depth === 0) {
      lines.push(current.trim())
      current = ""
    }
  }

  if (current.trim()) lines.push(current.trim())
  return lines.join("\n")
}

export function formatComponentImportExample(source: string) {
  const trimmed = source.trim()
  if (trimmed.includes("\n")) return trimmed

  const match = trimmed.match(/^import\s+\{\s*(.*?)\s*\}\s+from\s+(.+)$/)
  if (!match) return trimmed

  const imports = match[1].split(",").map((entry) => entry.trim())
  if (imports.length <= 3 && trimmed.length <= maxLineLength) return trimmed

  return [
    "import {",
    ...imports.map((entry) => `  ${entry},`),
    `} from ${match[2]}`,
  ].join("\n")
}

export function formatComponentUsageExample(source: string) {
  const trimmed = source.trim()
  if (trimmed.includes("\n")) {
    return trimmed
      .split("\n")
      .map((line) => line.trimEnd())
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
  }
  if (trimmed.startsWith("<")) return formatJsxExample(trimmed)
  return formatStatements(trimmed)
}
