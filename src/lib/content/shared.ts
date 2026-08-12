import { z } from "zod"

export const optionalUrlSchema = z.string().url().or(z.literal(""))

export type CatalogFilter<TValue extends string | number = string> = {
  value: TValue
  label: string
}

export function uniqueDescending(values: readonly string[]) {
  return Array.from(new Set(values)).sort().reverse()
}

export function catalogFilterNavigation<TFilter extends string | number>(
  filter: TFilter
) {
  return { search: { filter }, replace: true as const }
}
