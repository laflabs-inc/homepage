import { defaultSchema, type Options } from "rehype-sanitize"

const documentTags = ["abbr", "mark"]

export const documentSanitizeSchema: Options = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames ?? []), ...documentTags],
  attributes: {
    ...defaultSchema.attributes,
    blockquote: [
      ...(defaultSchema.attributes?.blockquote ?? []),
      "data*",
    ],
  },
  protocols: {
    ...defaultSchema.protocols,
    href: [...(defaultSchema.protocols?.href ?? []), "HTTP", "HTTPS", "MAILTO"],
    src: [...(defaultSchema.protocols?.src ?? []), "HTTP", "HTTPS"],
  },
}
