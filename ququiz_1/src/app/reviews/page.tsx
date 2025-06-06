'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useSearchParams } from 'next/navigation'


export default function VotePage() {
  const searchParams = useSearchParams()
  const [playerCode, setPlayerCode] = useState(searchParams.get('player') || '')
  const [quizCode, setQuizCode] = useState(searchParams.get('quiz') || '')
  const [comment, setComment] = useState('')
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    document.title = 'Reviews | Ququiz'
  }, [])

  const handleSubmit = async () => {
    setError('')
    setSuccess(false)

    if (!/^[0-9]{7}$/.test(playerCode)) {
      setError('Ο κωδικός παίκτη πρέπει να είναι 7 ψηφία.')
      return
    }

    if (!/^[0-9]{4}$/.test(quizCode)) {
      setError('Ο κωδικός quiz πρέπει να είναι 4 ψηφία.')
      return
    }

    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .select('id')
      .eq('short_id', quizCode)
      .single()

    if (quizError || !quiz) {
      setError('Το quiz δεν βρέθηκε.')
      return
    }

    const { data: player, error: playerError } = await supabase
      .from('players')
      .select('id')
      .eq('quiz_id', quiz.id)
      .eq('player_code', playerCode)
      .single()

    if (playerError || !player) {
      setError('Δεν βρέθηκε παίκτης με αυτό τον κωδικό για το συγκεκριμένο quiz.')
      return
    }
console.log('📌 Εισαγωγή σχολίου για quiz ID:', quiz.id,playerCode,quizCode,comment)
console.table({ player_code: playerCode, quiz_code: quizCode, quiz_id: quiz.id, comment })

    
    const { error: insertError } = await supabase.from('reviews').insert({
      player_code: playerCode,
      quiz_code: quizCode,
      comment,
    })

    if (insertError) {
      console.error('❌ insertError:', insertError)
      setError('Σφάλμα κατά την αποθήκευση του σχολίου.')
    } else {
      setSuccess(true)
      setPlayerCode('')
      setQuizCode('')
      setComment('')
    }
  }

  return (
    <div className="min-h-screen bg-emerald-100 dark:bg-emerald-800 justify-center mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4 text-center p-6">📝 Αξιολόγηση Quiz</h1>

      {error && <p className="text-red-600 mb-2">{error}</p>}
      {success && <p className="text-green-600 mb-2">✅ Το σχόλιο καταχωρήθηκε με επιτυχία!</p>}

      <input
        type="text"
        value={playerCode}
        onChange={(e) => setPlayerCode(e.target.value)}
        placeholder="Κωδικός παίκτη (7 ψηφία)"
        className="w-full border-2 p-2 mb-3 rounded placeholder:text-gray-600 dark:placeholder:text-gray-200"
        maxLength={7}
      />

      <input
        type="text"
        value={quizCode}
        onChange={(e) => setQuizCode(e.target.value)}
        placeholder="Κωδικός quiz (4 ψηφία)"
        className="w-full border-2 p-2 mb-3 rounded placeholder:text-gray-600 dark:placeholder:text-gray-200"
        maxLength={4}
      />

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Γράψε την άποψη σου ή προτάσεις για βελτίωση..."
        rows={4}
        className="w-full border-2 p-2 mb-4 rounded placeholder:text-gray-600 dark:placeholder:text-gray-200"
      />

      <button
        onClick={handleSubmit}
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
      >
        Υποβολή
      </button>
    </div>
  )
}
