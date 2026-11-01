import type { ContentLanguage } from "@/lib/content/content-language"
import { cn } from "@/lib/utils"

const languageOptions = [
  { value: "en", label: "English" },
  { value: "bn", label: "বাংলা" },
] as const satisfies ReadonlyArray<{ value: ContentLanguage; label: string }>

/** English and Bangla toggle shown beside the title of translated content. */
export function LanguageSwitch({
  language,
  onChange,
  label = "Content language",
}: {
  language: ContentLanguage
  onChange: (language: ContentLanguage) => void
  label?: string
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="inline-flex items-center rounded-lg border bg-background p-0.5"
    >
      {languageOptions.map((option) => (
        <button
          key={option.value}
          type="button"
          lang={option.value}
          aria-pressed={language === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "rounded-md px-3 py-1 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2",
            language === option.value
              ? "bg-muted text-strong-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
