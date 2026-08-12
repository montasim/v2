const themeButtons = document.querySelectorAll("[data-theme-toggle]")
const menuButton = document.querySelector("[data-mobile-toggle]")
const menu = document.querySelector("[data-mobile-menu]")

function syncThemeButtons() {
  const dark = document.documentElement.classList.contains("dark")
  themeButtons.forEach((button) => {
    button.setAttribute(
      "aria-label",
      dark ? "Switch to light mode" : "Switch to dark mode"
    )
    button.querySelector("i").className = dark ? "ph ph-sun" : "ph ph-moon"
  })
}

themeButtons.forEach((button) =>
  button.addEventListener("click", () => {
    const dark = document.documentElement.classList.toggle("dark")
    try {
      localStorage.setItem("portfolio-theme", dark ? "dark" : "light")
    } catch {}
    syncThemeButtons()
  })
)
syncThemeButtons()

function closeMenu() {
  if (!menu || !menuButton) return
  menu.classList.add("hidden")
  menuButton.setAttribute("aria-expanded", "false")
  menuButton.setAttribute("aria-label", "Open menu")
  menuButton.querySelector("i").className = "ph ph-list"
}

menuButton?.addEventListener("click", () => {
  const opening = menu.classList.contains("hidden")
  menu.classList.toggle("hidden")
  menuButton.setAttribute("aria-expanded", String(opening))
  menuButton.setAttribute("aria-label", opening ? "Close menu" : "Open menu")
  menuButton.querySelector("i").className = opening ? "ph ph-x" : "ph ph-list"
})

menu
  ?.querySelectorAll("a")
  .forEach((link) => link.addEventListener("click", closeMenu))
document.querySelector("header")?.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !menu?.classList.contains("hidden")) {
    closeMenu()
    menuButton?.focus()
  }
})

function initPortfolioFilters(root = document) {
  root.querySelectorAll("[data-filter-group]").forEach((group) => {
    if (group.dataset.filterReady === "true") return
    group.dataset.filterReady = "true"

    const section = group.closest("section")
    const buttons = group.querySelectorAll("[data-filter-value]")
    const status = group.querySelector("[data-filter-status]")
    const label = group.dataset.filterLabel || "item"

    buttons.forEach((button) =>
      button.addEventListener("click", () => {
        const value = button.dataset.filterValue
        const items = section?.querySelectorAll("[data-filter-item]") ?? []
        let visibleCount = 0

        buttons.forEach((candidate) => {
          candidate.setAttribute("aria-pressed", String(candidate === button))
        })

        items.forEach((item) => {
          const tags = item.dataset.filterTags?.split(" ") ?? []
          const visible = value === "all" || tags.includes(value)
          item.hidden = !visible
          if (visible) visibleCount += 1
        })

        if (status) {
          status.textContent = `${visibleCount} ${label}${visibleCount === 1 ? "" : "s"} shown`
        }
      })
    )
  })
}

window.initPortfolioFilters = initPortfolioFilters
initPortfolioFilters()

function initContributionGraph() {
  const root = document.querySelector("[data-contributions-root]")
  const data = window.portfolioContributions
  if (!root) return

  const loading = root.querySelector("[data-contributions-loading]")
  const content = root.querySelector("[data-contributions-content]")
  const months = root.querySelector("[data-contribution-months]")
  const cells = root.querySelector("[data-contribution-cells]")
  const total = root.querySelector("[data-contribution-total]")

  if (!data?.weeks?.length || !content || !months || !cells || !total) {
    if (loading)
      loading.textContent = "GitHub contributions are temporarily unavailable."
    return
  }

  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ]
  const labels = []
  let currentMonth = -1
  let spanStart = 0

  data.weeks.forEach((week, index) => {
    const firstDay = week.contributionDays.find((day) => day.date)
    if (!firstDay) return
    const month = new Date(`${firstDay.date}T00:00:00Z`).getUTCMonth()
    if (month === currentMonth) return
    if (currentMonth !== -1)
      labels.push({
        month: currentMonth,
        start: spanStart,
        span: index - spanStart,
      })
    currentMonth = month
    spanStart = index
  })
  if (currentMonth !== -1)
    labels.push({
      month: currentMonth,
      start: spanStart,
      span: data.weeks.length - spanStart,
    })

  months.style.setProperty("--contribution-weeks", data.weeks.length)
  labels.forEach(({ month, start, span }) => {
    const label = document.createElement("span")
    label.style.gridColumn = `${start + 1} / span ${span}`
    label.textContent = span >= 2 ? monthNames[month] : ""
    months.append(label)
  })

  const contributionLevel = (count) => {
    if (count === 0) return 0
    if (count <= 2) return 1
    if (count <= 5) return 2
    if (count <= 8) return 3
    return 4
  }

  data.weeks.forEach((week) =>
    week.contributionDays.forEach((day) => {
      const cell = document.createElement("span")
      const level = contributionLevel(day.contributionCount)
      cell.className = `contribution-cell${level ? ` contribution-level-${level}` : ""}`
      cell.title = `${day.date}: ${day.contributionCount} contribution${day.contributionCount === 1 ? "" : "s"}`
      cells.append(cell)
    })
  )

  total.textContent = `${Number(data.totalContributions).toLocaleString()} GitHub contributions in the last year`
  if (loading) loading.hidden = true
  content.hidden = false
}

initContributionGraph()

function initRecommendationCarousel() {
  const carousel = document.querySelector("[data-recommendation-carousel]")
  const track = carousel?.querySelector("[data-carousel-track]")
  const previousButton = carousel?.querySelector("[data-carousel-prev]")
  const nextButton = carousel?.querySelector("[data-carousel-next]")
  const status = carousel?.querySelector("[data-carousel-status]")
  if (!carousel || !track || !previousButton || !nextButton) return

  const originalSlides = Array.from(
    track.querySelectorAll(".recommendation-slide")
  )
  const slideCount = originalSlides.length
  if (slideCount < 2) return

  originalSlides.forEach((slide) => {
    const clone = slide.cloneNode(true)
    clone.setAttribute("aria-hidden", "true")
    clone
      .querySelectorAll("a, button, input, select, textarea, [tabindex]")
      .forEach((element) => element.setAttribute("tabindex", "-1"))
    track.append(clone)
  })

  const slides = Array.from(track.querySelectorAll(".recommendation-slide"))
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)")
  let activeIndex = 0
  let paused = false
  let visible = true
  let resetTimer = 0
  let scrollTimer = 0

  previousButton.hidden = false
  nextButton.hidden = false

  const slidePosition = (index) =>
    slides[index].offsetLeft - slides[0].offsetLeft

  const updateStatus = (index) => {
    activeIndex = (index + slideCount) % slideCount
    if (status)
      status.textContent = `Recommendation ${activeIndex + 1} of ${slideCount}`
  }

  const scrollToSlide = (index, behavior = "smooth") => {
    track.scrollTo({ left: slidePosition(index), behavior })
  }

  const showNext = () => {
    window.clearTimeout(resetTimer)
    if (activeIndex === slideCount - 1) {
      scrollToSlide(slideCount)
      updateStatus(0)
      resetTimer = window.setTimeout(
        () => scrollToSlide(0, "auto"),
        reducedMotion.matches ? 0 : 650
      )
      return
    }
    updateStatus(activeIndex + 1)
    scrollToSlide(activeIndex)
  }

  const showPrevious = () => {
    window.clearTimeout(resetTimer)
    if (activeIndex === 0) {
      scrollToSlide(slideCount, "auto")
      requestAnimationFrame(() => {
        updateStatus(slideCount - 1)
        scrollToSlide(activeIndex)
      })
      return
    }
    updateStatus(activeIndex - 1)
    scrollToSlide(activeIndex)
  }

  previousButton.addEventListener("click", showPrevious)
  nextButton.addEventListener("click", showNext)

  const setPaused = (value) => {
    paused = value
  }
  carousel.addEventListener("mouseenter", () => setPaused(true))
  carousel.addEventListener("mouseleave", () => setPaused(false))
  carousel.addEventListener("focusin", () => setPaused(true))
  carousel.addEventListener("focusout", (event) => {
    if (!carousel.contains(event.relatedTarget)) setPaused(false)
  })
  carousel.addEventListener("pointerdown", () => setPaused(true))
  carousel.addEventListener("pointerup", () => setPaused(false))
  carousel.addEventListener("pointercancel", () => setPaused(false))

  if ("IntersectionObserver" in window) {
    visible = false
    new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting
      },
      { threshold: 0.35 }
    ).observe(carousel)
  }

  track.addEventListener(
    "scroll",
    () => {
      window.clearTimeout(scrollTimer)
      scrollTimer = window.setTimeout(() => {
        const closestIndex = slides.reduce(
          (closest, slide, index) => {
            const distance = Math.abs(track.scrollLeft - slidePosition(index))
            return distance < closest.distance ? { index, distance } : closest
          },
          { index: 0, distance: Infinity }
        ).index
        updateStatus(closestIndex)
        if (closestIndex >= slideCount)
          scrollToSlide(closestIndex - slideCount, "auto")
      }, 120)
    },
    { passive: true }
  )

  window.setInterval(() => {
    if (visible && !paused && !document.hidden && !reducedMotion.matches)
      showNext()
  }, 5000)
}

initRecommendationCarousel()
