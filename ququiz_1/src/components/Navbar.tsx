'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function Navbar() {
  const pathname = usePathname()
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

  const linkClass = (path: string) =>
    `hover:underline ${
      pathname === path ? 'font-semibold text-black' : ''
    }`

  return (
    <nav
      className={`bg-blue-600 text-white px-6 py-3 flex justify-between items-center transition-all duration-700 ease-out
        ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-5'}
      `}
    >
      <Link href="/" className="text-2xl font-bold hover:opacity-80">
        Ququiz
      </Link>

      {/* Desktop menu */}
      <div className="hidden md:flex space-x-6">
        <Link href="/" className={linkClass('/')}>Αρχική</Link>
        <Link href="/join" className={linkClass('/join')}>Συμμετοχή</Link>

        {user ? (
          <>
            <Link href="/host" className={linkClass('/host')}>Διαχείριση</Link>
            <Link href="/host/create" className={linkClass('/host/create')}>Δημιουργία</Link>
            <button onClick={handleLogout} className="hover:underline">Αποσύνδεση</button>
          </>
        ) : (
          <Link href="/login" className={linkClass('/login')}>Σύνδεση</Link>
        )}
      </div>

      {/* Mobile menu button */}
      <div className="md:hidden">
        <button onClick={() => setMenuOpen(!menuOpen)}>
          ☰
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="absolute top-full left-0 w-full bg-blue-700 text-white px-6 py-4 flex flex-col space-y-3 md:hidden z-50">
          <Link href="/" className={linkClass('/')} onClick={() => setMenuOpen(false)}>Αρχική</Link>
          <Link href="/join" className={linkClass('/join')} onClick={() => setMenuOpen(false)}>Συμμετοχή</Link>
          {user ? (
            <>
              <Link href="/host" className={linkClass('/host')} onClick={() => setMenuOpen(false)}>Διαχείριση</Link>
              <Link href="/host/create" className={linkClass('/host/create')} onClick={() => setMenuOpen(false)}>Δημιουργία</Link>
              <button onClick={handleLogout}>Αποσύνδεση</button>
            </>
          ) : (
            <Link href="/login" className={linkClass('/login')} onClick={() => setMenuOpen(false)}>Σύνδεση</Link>
          )}
        </div>
      )}
    </nav>
  )
}
