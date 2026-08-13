import { Separator } from "@/components/ui/separator"
import { SiteContainer } from "@/components/shared/site-container"
import { MotionReveal } from "@/components/shared/motion-reveal"
import { profileCatalog } from "@/lib/content/profile"

export function SiteFooter() {
  const { profile } = profileCatalog
  return (
    <MotionReveal asChild delay={80}>
      <SiteContainer asChild className="py-10">
        <footer>
          <Separator />
          <div className="pt-8 text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} {profile.name}
          </div>
        </footer>
      </SiteContainer>
    </MotionReveal>
  )
}
