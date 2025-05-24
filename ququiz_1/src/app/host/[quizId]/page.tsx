'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import QRCode from 'react-qr-code'

interface Player {
  id: string
  player_code: string
  score: number
  finished: boolean
}

export default function HostQuizPage() {
  const { quizId } = useParams()
  const router = useRouter()

  const [quizTitle, setQuizTitle] = useState('')
  const [shortId, setShortId] = useState('')
  const [players, setPlayers] = useState<Player[]>([])
  const [status, setStatus] = useState('')
  const [started, setStarted] = useState(false)
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [showPlayers, setShowPlayers] = useState(true)
  const [completedCount, setCompletedCount] = useState(0)

  const [clientSide, setClientSide] = useState(false)

  useEffect(() => {
    setClientSide(true) // Απενεργοποιούμε το window μέχρι να είμαστε στον client-side
  }, [])

  useEffect(() => {
    document.title = `Host | ${quizTitle}`
  }, [quizTitle])

  useEffect(() => {
    const fetchAll = async () => {
      const { data: quiz } = await supabase
        .from('quizzes')
        .select('title, short_id, status, started')
        .eq('id', quizId)
        .single()

      if (quiz) {
        setQuizTitle(quiz.title)
        setShortId(quiz.short_id)
        setStatus(quiz.status)
        setStarted(quiz.started)
      }

      const { data: pl } = await supabase
        .from('players')
        .select('id, player_code, score, finished')
        .eq('quiz_id', quizId)

      if (pl) {
        setPlayers(pl)
        const finishedCount = pl.filter((p) => p.finished).length
        setCompletedCount(finishedCount)

        if (quiz && finishedCount === pl.length && pl.length > 0 && quiz.status !== 'finished') {
          await supabase.from('quizzes').update({ status: 'finished' }).eq('id', quizId)
        }
      }
    }

    fetchAll()

    const playerChannel = supabase
      .channel(`players-${quizId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players', filter: `quiz_id=eq.${quizId}` }, fetchAll)
      .subscribe()

    const quizChannel = supabase
      .channel(`quiz-${quizId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'quizzes', filter: `id=eq.${quizId}` }, (payload) => {
        const q = payload.new
        setStatus(q.status)
        setStarted(q.started)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(playerChannel)
      supabase.removeChannel(quizChannel)
    }
  }, [quizId])

  const handleStart = async () => {
    await supabase.from('quizzes')
    .update({ started: true, status: 'playing' })
    .eq('id', quizId)

    router.push(`/host/${quizId}/manage`)
  }

  const handleRestart = async () => {
    if (status !== 'finished') {
      const confirm = window.confirm('⚠️ Το quiz δεν έχει ολοκληρωθεί. Θέλεις σίγουρα να κάνεις επαναφορά; Οι παίκτες θα χαθούν.')
      if (!confirm) return
    }

    await supabase.from('player_answers').delete().eq('quiz_id', quizId)
    await supabase.from('players').delete().eq('quiz_id', quizId)
    await supabase.from('quizzes').update({ started: false, status: 'waiting' }).eq('id', quizId)

    setPlayers([])
    setStarted(false)
    setStatus('waiting')
    setShowLeaderboard(false)
    setCompletedCount(0)
  }

  const handleShowLeaderboard = async () => {
    const { data } = await supabase
      .from('players')
      .select('*')
      .eq('quiz_id', quizId)
      .order('score', { ascending: false })

    if (data) {
      setPlayers(data)
      setShowLeaderboard(true)
    }
  }

  const handleFinish = async () => {
    await supabase.from('quizzes').update({ status: 'finished' }).eq('id', quizId)
    setStatus('finished')
  }


  const exportToCSV = () => {
  const headers = ['Player Code', 'Score']
  const rows = players.map(p => [p.player_code, p.score])

  const csvContent =
    'data:text/csv;charset=utf-8,' +
    [headers, ...rows].map(row => row.join(';')).join('\n')

  const encodedUri = encodeURI(csvContent)
  const link = document.createElement('a')
  link.setAttribute('href', encodedUri)
  link.setAttribute('download', 'leaderboard.csv')
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}


  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-center mb-6">{quizTitle}</h1>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 mb-6">
        <div className="flex items-center gap-6">
          {/* Εμφανίζουμε το QRCode μόνο αν είμαστε στον client */}
          {clientSide && (
            <QRCode value={`${window.location.origin}/join?quizId=${quizId}`} size={140} />
          )}
          <div className="text-xl font-bold">
            Κωδικός Quiz: <span className="font-mono text-blue-700">{shortId}</span>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:items-end">
          <button
            onClick={handleRestart}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            🔄 Επαναφορά Quiz
          </button>
          <button
            onClick={() => router.push('/host')}
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
          >
            🔙 Πίσω στο Dashboard
          </button>
        </div>
      </div>

      {status === 'finished' && !showLeaderboard && (
        <button
          onClick={handleShowLeaderboard}
          className="mb-6 bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700"
        >
          📊 Εμφάνιση Πίνακα Κατάταξης
        </button>
      )}

      <div className="mb-4">
        <label className="inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={showPlayers}
            onChange={() => setShowPlayers((prev) => !prev)}
            className="mr-2"
          />
          Εμφάνιση Λίστας Παικτών ({completedCount}/{players.length})
        </label>

        {showPlayers && (
          <ul className="list-disc list-inside bg-gray-50 p-4 rounded border mt-2">
            {players.map((p) => (
              <li key={p.id}>
                Παίκτης #{p.player_code} {p.finished && '✅'}
              </li>
            ))}
          </ul>
        )}
      </div>

      {status === 'waiting' && !started && (
        <div className="mt-4">
          <button
            onClick={handleStart}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            ✅ Έναρξη Κουίζ
          </button>
        </div>
      )}

      {/* Το κουμπί τερματισμού προστίθεται εδώ */}
      {status === 'playing' && (
        <div className="mt-4">
          <button
            onClick={handleFinish}
            className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700"
          >
            Τερματισμός
          </button>
        </div>
      )}

      {showLeaderboard && (
        <>
          <h2 className="text-xl font-bold mt-10 mb-2">📊 Πίνακας Κατάταξης</h2>
          <table className="w-full mt-4 border border-gray-300 rounded">
            <thead>
              <tr className="bg-blue-100 text-left text-blue-800 font-semibold">
                <th className="px-4 py-2 border-b">Παίκτης</th>
                <th className="px-4 py-2 border-b">Πόντοι</th>
              </tr>
            </thead>
            <tbody>
              {players.map((p) => (
                <tr key={p.id} className="hover:bg-gray-100 bg-white">
                  <td className="px-4 py-2 border-b">#{p.player_code}</td>
                  <td className="px-4 py-2 border-b">{p.score}</td>
                </tr>
              ))}
            </tbody>
          </table>

        <button
          onClick={exportToCSV}
          className="mt-4 bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
        >
          📥 Εξαγωγή σε CSV
        </button>


        </>
      )}
    </div>
  )
}
