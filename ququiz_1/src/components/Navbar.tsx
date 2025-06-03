'use client'

import Link from 'next/link'
import ThemeToggle from './ThemeToggle'
import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loaded, setLoaded] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser()
      setUser(data.user)
      setLoaded(true)
    }
    fetchUser()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const handleMobileNav = (path: string) => {
    setMenuOpen(false)
    setTimeout(() => {
      window.location.href = path
    }, 100)
  }

  const linkClass = (path: string) =>
    `hover:underline ${pathname === path ? 'font-semibold text-black' : ''}`

  return (
    <nav
      className={`bg-blue-600 text-white px-6 py-3 flex justify-between items-center transition-all duration-700 ease-out
        ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-5'}`}
    >
      <Link href="/" className="text-2xl font-bold hover:opacity-80">
        Ququiz
      </Link>

      {/* Desktop menu */}
      <div className="hidden md:flex space-x-6 items-center">
        <Link href="/" className={linkClass('/')}>Αρχική</Link>
        <Link href="/join" className={linkClass('/join')}>Συμμετοχή</Link>
        <Link href="/reviews" className={linkClass('/reviews')}>Σχόλια</Link>

        {user ? (
          <>
            <Link href="/host" className={linkClass('/host')}>Διαχείριση</Link>
            <Link href="/host/create" className={linkClass('/host/create')}>Δημιουργία</Link>

            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="border-white px-3 py-1 rounded hover:bg-white hover:text-blue-600"
              >
                Προφίλ
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 bg-blue-100 text-black rounded shadow px-4 py-2 w-56 z-50">
                  <p className="text-sm text-gray-800 mb-2 truncate">{user.email}</p>
                  <button
                    onClick={() => handleMobileNav('/stats')}
                    className="block mb-1 font-semibold text-blue-700 hover:underline text-left w-full"
                  >
                    Στατιστικά
                  </button>
                  <button
                    onClick={handleLogout}
                    className="text-sm text-red-600 hover:underline"
                  >
                    Αποσύνδεση
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <Link href="/login" className={linkClass('/login')}>Σύνδεση</Link>
        )}
      </div>

      <ThemeToggle />

      {/* Mobile menu */}
      <div className="md:hidden">
        <button onClick={() => setMenuOpen(!menuOpen)}>☰</button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="absolute top-full left-0 w-full bg-white text-black px-6 py-4 flex flex-col space-y-4 md:hidden z-50 border-t min-h-[300px] overflow-y-auto">
          <button className="text-left" onClick={() => handleMobileNav('/')}>Αρχική</button>
          <button className="text-left" onClick={() => handleMobileNav('/join')}>Συμμετοχή</button>
          <button className="text-left" onClick={() => handleMobileNav('/reviews')}>Σχόλια</button>
          {user ? (
            <>
              <button className="text-left" onClick={() => handleMobileNav('/host')}>Διαχείριση</button>
              <button className="text-left" onClick={() => handleMobileNav('/host/create')}>Δημιουργία</button>
              <button className="text-left" onClick={() => handleMobileNav('/stats')}>Στατιστικά</button>
              <div className="border-t pt-3">
                <p className="text-sm text-gray-600 truncate">{user.email}</p>
                <button
                  onClick={handleLogout}
                  className="text-sm text-red-600 hover:underline mt-1"
                >
                  Αποσύνδεση
                </button>
              </div>
            </>
          ) : (
            <button className="text-left" onClick={() => handleMobileNav('/login')}>Σύνδεση</button>
          )}
        </div>
      )}
    </nav>
  )
}
