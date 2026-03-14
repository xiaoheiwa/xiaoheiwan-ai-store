"use client"

import { useState, useEffect } from "react"
import { Moon, Sun } from "lucide-react"

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)

    try {
      // Check for saved theme preference or default to light mode
      const savedTheme = localStorage.getItem("theme")
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches

      if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
        setIsDark(true)
        document.documentElement.classList.add("dark")
      }
    } catch (error) {
      console.log("[v0] Theme toggle initialization error:", error)
      // Default to light mode if there's an error
      setIsDark(false)
    }
  }, [])

  const toggleTheme = () => {
    if (!mounted) return

    const newTheme = !isDark
    setIsDark(newTheme)

    try {
      if (newTheme) {
        document.documentElement.classList.add("dark")
        localStorage.setItem("theme", "dark")
      } else {
        document.documentElement.classList.remove("dark")
        localStorage.setItem("theme", "light")
      }
    } catch (error) {
      console.log("[v0] Theme toggle error:", error)
    }
  }

  if (!mounted) {
    return (
      <div className="fixed top-4 right-4 z-50 p-3 bg-card/80 glass-effect rounded-full border border-border/30 w-[52px] h-[52px]" />
    )
  }

  return (
    <button
      onClick={toggleTheme}
      className="fixed top-4 right-4 z-50 p-3 bg-card/80 glass-effect rounded-full border border-border/30 hover:border-border/60 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 hover:scale-110 active:scale-95"
      aria-label={isDark ? "切换到亮色模式" : "切换到暗色模式"}
    >
      {isDark ? <Sun className="w-5 h-5 text-primary" /> : <Moon className="w-5 h-5 text-primary" />}
    </button>
  )
}
