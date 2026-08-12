import * as React from "react"
import useEmblaCarousel from "embla-carousel-react"
import type {
  EmblaCarouselType,
  EmblaOptionsType,
  EmblaPluginType,
} from "embla-carousel"
import { cn } from "@/lib/utils"

type CarouselContextValue = {
  carouselRef: ReturnType<typeof useEmblaCarousel>[0]
  api: EmblaCarouselType | undefined
  options?: EmblaOptionsType
}

const CarouselContext = React.createContext<CarouselContextValue | null>(null)

function useCarousel() {
  const context = React.useContext(CarouselContext)
  if (!context) throw new Error("Carousel modules must be used within Carousel")
  return context
}

export function Carousel({
  options,
  plugins,
  setApi,
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  options?: EmblaOptionsType
  plugins?: EmblaPluginType[]
  setApi?: (api: EmblaCarouselType) => void
}) {
  const [carouselRef, api] = useEmblaCarousel(options, plugins)

  React.useEffect(() => {
    if (api) setApi?.(api)
  }, [api, setApi])

  return (
    <CarouselContext.Provider value={{ carouselRef, api, options }}>
      <div className={cn("relative", className)} role="region" {...props}>
        {children}
      </div>
    </CarouselContext.Provider>
  )
}

export function CarouselContent({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { carouselRef } = useCarousel()
  return (
    <div ref={carouselRef} className="overflow-hidden">
      <div className={cn("flex touch-pan-y", className)} {...props} />
    </div>
  )
}

export function CarouselItem({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      role="group"
      aria-roledescription="slide"
      className={cn("min-w-0 shrink-0 grow-0 basis-full", className)}
      {...props}
    />
  )
}

export type CarouselApi = EmblaCarouselType
