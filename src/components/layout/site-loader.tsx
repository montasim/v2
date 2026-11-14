import { ScriptOnce } from "@tanstack/react-router"

const loaderDurationMs = 2100

// Runs before first paint. html[data-motion] lets scroll reveals start hidden from the first
// frame instead of flashing in from the server HTML. The loader shows on the home page only,
// once per tab session; while html[data-loading] is set, styles.css holds the entrances back.
const loaderScript = `try{const d=document.documentElement;if(!matchMedia("(prefers-reduced-motion: reduce)").matches){d.dataset.motion="";if(location.pathname==="/"&&!sessionStorage.getItem("portfolio-loader")){sessionStorage.setItem("portfolio-loader","1");d.dataset.loading="";setTimeout(()=>{delete d.dataset.loading},${loaderDurationMs})}}}catch{}`

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
