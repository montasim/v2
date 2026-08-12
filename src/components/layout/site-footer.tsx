import profile from "@/data/profile.json"
import { Separator } from "@/components/ui/separator"
import { SiteContainer } from "@/components/shared/site-container"

export function SiteFooter() {
  return (
    <SiteContainer asChild className="py-10">
      <footer>
        <Separator />
        <div className="pt-8 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} {profile.name}
        </div>
      </footer>
    </SiteContainer>
  )
}
