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
  const [status, setStatus] = useState('')
  const [started, setStarted] = useState(false)

  const [players, setPlayers] = useState<Player[]>([])
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [copied, setCopied] = useState(false)
  const [joinUrl, setJoinUrl] = useState('')

  const [completedCount, setCompletedCount] = useState(0)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setJoinUrl(`${window.location.origin}/join?quizId=${quizId}`)
    }
  }, [quizId])

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

        if (
          quiz &&
          finishedCount === pl.length &&
          quiz.status !== 'finished'
        ) {
          await supabase
            .from('quizzes')
            .update({ status: 'finished' })
            .eq('id', quizId)
        }
      }
    }

    fetchAll()

    const playerChannel = supabase
      .channel(`players-${quizId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'players',
          filter: `quiz_id=eq.${quizId}`,
        },
        () => fetchAll()
      )
      .subscribe()

    const statusChannel = supabase
      .channel(`quiz-${quizId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'quizzes',
          filter: `id=eq.${quizId}`,
        },
        (payload) => {
          const q = payload.new
          setStatus(q.status)
          setStarted(q.started)
          console.log('📡 Realtime update:', q.status, q.started)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(playerChannel)
      supabase.removeChannel(statusChannel)
    }
  }, [quizId])

  const handleCopy = () => {
    navigator.clipboard.writeText(joinUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleStart = async () => {
    const { error } = await supabase
      .from('quizzes')
      .update({ started: true, status: 'playing' })
      .eq('id', quizId)
  
    if (error) {
      console.error('❌ Σφάλμα έναρξης κουίζ:', error.message)
    } else {
      console.log('✅ Quiz ξεκίνησε (status: playing)')
    }
  }
  

  const handleRestart = async () => {
    await supabase.from('players').delete().eq('quiz_id', quizId)
    await supabase
      .from('quizzes')
      .update({ started: false, status: 'waiting' })
      .eq('id', quizId)
    setShowLeaderboard(false)
    setStarted(false)
    setStatus('waiting')
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

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-center">{quizTitle}</h1>
      <p className="text-center text-sm text-gray-600 mb-4">
        Κωδικός Quiz: <span className="font-mono">{shortId}</span>
      </p>

      {joinUrl && (
        <div className="text-center mb-6">
          <QRCode value={joinUrl} size={160} />
          <p className="text-sm mt-2 break-all">{joinUrl}</p>
          <button
            onClick={handleCopy}
            className="mt-2 px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            {copied ? 'Αντιγράφηκε!' : 'Αντιγραφή Συνδέσμου'}
          </button>
        </div>
      )}

      <h2 className="text-lg font-semibold mb-2">Συνδεδεμένοι Παίκτες:</h2>
      <p className="mb-2">Ολοκλήρωσαν: {completedCount} / {players.length}</p>
      <ul className="list-disc list-inside mb-4">
        {players.map((p) => (
          <li key={p.id}>
            Παίκτης #{p.player_code} {p.finished && '✅'}
          </li>
        ))}
      </ul>

      {status === 'waiting' && !started && (
        <button
          onClick={handleStart}
          className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Έναρξη Κουίζ
        </button>
      )}

      {status === 'finished' && !showLeaderboard && (
        <button
          onClick={handleShowLeaderboard}
          className="w-full bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
        >
          Εμφάνιση Πίνακα Κατάταξης
        </button>
      )}

      {showLeaderboard && (
        <>
          <h2 className="text-xl font-bold mt-6 mb-2">Πίνακας Κατάταξης</h2>
          <ol className="list-decimal pl-5 space-y-1">
            {players.map((p) => (
              <li key={p.id}>
                Παίκτης #{p.player_code} – {p.score} πόντοι
              </li>
            ))}
          </ol>

          <div className="flex justify-between mt-6">
            <button
              onClick={handleRestart}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Επαναφορά Quiz
            </button>
            <button
              onClick={() => router.push('/host')}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Πίσω στο Dashboard
            </button>
          </div>
        </>
      )}
    </div>
  )
}
