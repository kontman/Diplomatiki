// ✅ Signup Page (/signup/page.tsx)
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSignup = async () => {
    const { error } = await supabase.auth.signUp({ email, password })

    if (error) setError(error.message)
    else router.push('/login')
  }

  return (
    <div className="max-w-md mx-auto p-6 text-center">
      <h1 className="text-2xl font-bold mb-4">Εγγραφή</h1>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full border p-2 rounded mb-4"
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full border p-2 rounded mb-4"
      />
      <button
        onClick={handleSignup}
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
      >
        Εγγραφή
      </button>
      {error && <p className="text-red-500 mt-2">{error}</p>}
    </div>
  )
}