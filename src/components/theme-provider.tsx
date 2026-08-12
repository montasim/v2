import * as React from "react"
import { ScriptOnce } from "@tanstack/react-router"

type Theme = "light" | "dark"
const ThemeContext = React.createContext<{
  theme: Theme
  toggleTheme: () => void
} | null>(null)

const themeScript = `try{const s=localStorage.getItem("portfolio-theme");const t=s==="dark"||s==="light"?s:matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.classList.toggle("dark",t==="dark");document.documentElement.style.colorScheme=t}catch{}`

export function ThemeProvider({ children }: React.PropsWithChildren) {
  const [theme, setTheme] = React.useState<Theme>("light")
  React.useEffect(
    () =>
      setTheme(
        document.documentElement.classList.contains("dark") ? "dark" : "light"
      ),
    []
  )
  const toggleTheme = React.useCallback(() => {
    setTheme((current) => {
      const next = current === "dark" ? "light" : "dark"
      document.documentElement.classList.toggle("dark", next === "dark")
      document.documentElement.style.colorScheme = next
      localStorage.setItem("portfolio-theme", next)
      return next
    })
  }, [])
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <ScriptOnce>{themeScript}</ScriptOnce>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const value = React.useContext(ThemeContext)
  if (!value) throw new Error("useTheme must be used within ThemeProvider")
  return value
}
