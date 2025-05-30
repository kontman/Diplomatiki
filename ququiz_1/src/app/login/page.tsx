'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) {
      setError("Wrong email or password! Try again.")
    } else {
      window.location.replace(`/host`)
    }
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Σύνδεση</h1>
      
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full p-2 mb-4 border rounded"
      />
      
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full p-2 mb-4 border rounded"
      />
      
      {error && <p className="text-red-600 mb-4">{error}</p>}
      
      <button onClick={handleLogin} className="w-full p-2 bg-blue-600 text-white rounded text-xl hover:opacity-75">
        Σύνδεση
      </button>

      <p className="mt-4 text-center">
        Δεν έχεις λογαριασμό?         
        <a href="/signup" className="text-blue-600 hover:underline"> Εγγραφή</a>
      </p>
    </div>
  )
}
