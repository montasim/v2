import { ScriptOnce } from "@tanstack/react-router"

const loaderDurationMs = 2100

// Runs before first paint. html[data-motion] lets scroll reveals start hidden from the first
// frame instead of flashing in from the server HTML. The loader shows on the home page only,
// once per tab session; while html[data-loading] is set, styles.css holds the entrances back.
const loaderScript = `try{const d=document.documentElement;if(!matchMedia("(prefers-reduced-motion: reduce)").matches){d.dataset.motion="";if(location.pathname==="/"&&!sessionStorage.getItem("portfolio-loader")){sessionStorage.setItem("portfolio-loader","1");d.dataset.loading="";setTimeout(()=>{delete d.dataset.loading},${loaderDurationMs})}}}catch{}`

let replayTimer: number | undefined

// Shows the loader again on demand (the brand link). The SVG's own draw animation only runs
// when the image loads, so the mark gets a fresh URL, and its CSS shrink is restarted too.
export function replaySiteLoader() {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return
  const root = document.documentElement
  const mark = document.querySelector<HTMLImageElement>(".site-loader-mark")
  if (mark) {
    mark.style.animation = "none"
    void mark.offsetWidth
    mark.style.animation = ""
    mark.src = `/images/logo-animated.svg?replay=${Date.now()}`
  }
  delete root.dataset.loading
  void root.offsetWidth
  root.dataset.loading = ""
  window.clearTimeout(replayTimer)
  replayTimer = window.setTimeout(() => {
    delete root.dataset.loading
  }, loaderDurationMs)
}

export function SiteLoader() {
  return (
    <>
      <ScriptOnce>{loaderScript}</ScriptOnce>
      <div className="site-loader" aria-hidden="true">
        {/* The neon switch-on lives in the SVG itself, so the same file can be reused elsewhere. */}
        <img
          src="/images/logo-animated.svg"
          alt=""
          width="96"
          height="96"
          className="site-loader-mark"
        />
      </div>
    </>
  )
}
