'use client'

import { useEffect, useState } from 'react'

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('theme')
    if (stored === 'dark') {
      document.documentElement.classList.add('dark')
      setIsDark(true)
    }
  }, [])

  const toggleTheme = () => {
    const html = document.documentElement
    const newTheme = isDark ? 'light' : 'dark'
    html.classList.toggle('dark')
    localStorage.setItem('theme', newTheme)
    setIsDark(!isDark)
  }

  return (
    <button
      onClick={toggleTheme}
      className="ml-4 text-sm px-2 py-1 rounded bg-white text-black dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
    >
      {isDark ? '☀️ Light' : '🌙 Dark'}
    </button>
  )
}
