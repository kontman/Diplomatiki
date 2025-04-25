
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function JoinPage() {
  const [playerCode, setPlayerCode] = useState('')
  const [shortCode, setShortCode] = useState('')
  const [quizId, setQuizId] = useState<string | null>(null)
  const [quizTitle, setQuizTitle] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const id = searchParams.get('quizId')
    if (id) {
      setQuizId(id)
      fetchQuizDetails(id)
    }
  }, [searchParams])

  const fetchQuizDetails = async (quizId: string) => {
    const { data } = await supabase
      .from('quizzes')
      .select('short_id, title')
      .eq('id', quizId)
      .single()
    if (data) {
      setQuizTitle(data.title)
    }
  }

  const handleJoin = async () => {
    setError('')
    const code = playerCode.trim()

    if (!/^\d{7}$/.test(code)) {
      setError('Ο κωδικός παίκτη πρέπει να είναι ακριβώς 7 ψηφία.')
      return
    }

    let resolvedQuizId = quizId

    if (!resolvedQuizId && shortCode) {
      const { data } = await supabase
        .from('quizzes')
        .select('id')
        .eq('short_id', shortCode.trim())
        .single()
      if (!data) {
        setError('Το quiz δεν βρέθηκε.')
        return
      }
      resolvedQuizId = data.id
    }

    const { data: existing } = await supabase
      .from('players')
      .select('id')
      .eq('player_code', code)
      .eq('quiz_id', resolvedQuizId)

    if (existing && existing.length > 0) {
      setError('Αυτός ο κωδικός έχει ήδη χρησιμοποιηθεί.')
      return
    }

    await supabase.from('players').insert([{
      quiz_id: resolvedQuizId,
      player_code: code,
      score: 0,
    }])

    router.push(`/waiting-room?quizId=${resolvedQuizId}&player=${code}`)
  }

  return (
    <div className="max-w-md mx-auto p-6 text-center">
      <h1 className="text-2xl font-bold mb-4">{quizTitle || 'Συμμετοχή σε Κουίζ'}</h1>
      <input
        type="text"
        placeholder="7ψήφιο όνομα παίκτη"
        value={playerCode}
        onChange={(e) => setPlayerCode(e.target.value)}
        className="w-full border p-2 rounded mb-4 text-center"
        maxLength={7}
      />
      <button
        onClick={handleJoin}
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
      >
        Έναρξη
      </button>
      {error && <p className="text-red-600 mt-2 text-sm">{error}</p>}
    </div>
  )
}
