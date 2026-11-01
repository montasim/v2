import { z } from "zod"

/** Languages that blog posts, case studies and projects can be read in. */
export const contentLanguageSchema = z.enum(["en", "bn"])

export type ContentLanguage = z.infer<typeof contentLanguageSchema>

/** English is the default, so it stays out of the URL. */
export const contentLanguageSearchSchema = z.object({
  lang: contentLanguageSchema.optional().catch(undefined),
})
