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
    const { error } = await supabase.auth.signUp({
      email,
      password,
    })
    
    if (error) {
      setError(error.message)
    } else {
      router.push('/login') // Ανακατεύθυνση στην σελίδα σύνδεσης μετά την εγγραφή
    }
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Εγγραφή</h1>
      
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
      
      <button onClick={handleSignup} className="w-full p-2 bg-blue-600 text-white rounded">
        Εγγραφή
      </button>

      <p className="mt-4 text-center">
        Έχεις ήδη λογαριασμό? 
        <a href="/login" className="text-blue-600">Σύνδεση</a>
      </p>
    </div>
  )
}
