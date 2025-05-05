'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function JoinPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [shortId, setShortId] = useState('')
  const [playerName, setPlayerName] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    document.title = 'Join'
    const quizIdFromLink = searchParams.get('quizId')
    if (quizIdFromLink) {
      setShortId(quizIdFromLink)
    }
  }, [searchParams])

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!/^\d{7}$/.test(playerName)) {
      setError('Το όνομα παίκτη πρέπει να είναι ακριβώς 7 ψηφία.')
      return
    }

    if (shortId.length !== 4 && shortId.length !== 36) {
      setError('Ο κωδικός Quiz πρέπει να είναι 4 ψηφία ή πλήρες ID.')
      return
    }

    // Αν έχει ήδη το quizId, χρησιμοποίησέ το απευθείας
    let quizId = shortId

    // Αν είναι 4ψηφιο short ID, βρες το quizId
    if (shortId.length === 4) {
      const { data: quiz, error: quizError } = await supabase
        .from('quizzes')
        .select('id')
        .eq('short_id', shortId)
        .single()

      if (!quiz || quizError) {
        setError('Δεν βρέθηκε Quiz με αυτόν τον κωδικό.')
        return
      }

      quizId = quiz.id
    }

    // Έλεγχος αν ήδη υπάρχει ο παίκτης
    const { data: existingPlayer } = await supabase
      .from('players')
      .select('id')
      .eq('quiz_id', quizId)
      .eq('player_code', playerName)
      .single()

    if (existingPlayer) {
      setError('Αυτός ο κωδικός παίκτη χρησιμοποιείται ήδη ή υπάρχει σφάλμα.')
      return
    }

    // Δημιουργία παίκτη
    const { error: insertError } = await supabase
      .from('players')
      .insert({
        player_code: playerName,
        quiz_id: quizId,
        score: 0,
        finished: false
      })

    if (insertError) {
      console.error(insertError)
      setError('Αποτυχία καταχώρησης παίκτη.')
      return
    }

    router.push(`/play/${quizId}?player=${encodeURIComponent(playerName)}`)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">🎮 Συμμετοχή σε Quiz</h1>

        <form onSubmit={handleJoin} className="space-y-4">
          <div>
            <label className="block mb-1 font-medium">Κωδικός Quiz:</label>
            <input
              type="text"
              value={shortId}
              onChange={(e) => setShortId(e.target.value)}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">Όνομα Παίκτη (7 ψηφία):</label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="w-full border rounded px-3 py-2"
              required
              maxLength={7}
            />
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded"
          >
            Συμμετοχή
          </button>
        </form>
      </div>
    </div>
  )
}
