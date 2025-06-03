'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

interface QuizWithStats {
  id: string
  title: string
  created_at: string
  status: string
  total_players: number
  average_score: number
}

export default function StatsPage() {
  const [quizzes, setQuizzes] = useState<QuizWithStats[]>([])
  const router = useRouter()

  useEffect(() => {
    const fetchStats = async () => {
      const { data: quizData } = await supabase
        .from('quizzes')
        .select('id, title, created_at, status, questions')
        .order('created_at', { ascending: false })

      if (!quizData) return

      const statsWithCounts = await Promise.all(
        quizData.map(async (quiz) => {
          const { count: playerCount } = await supabase
            .from('players')
            .select('*', { count: 'exact', head: true })
            .eq('quiz_id', quiz.id)

          

          const { data: playerScores } = await supabase
            .from('players')
            .select('score')
            .eq('quiz_id', quiz.id)

          const scores = playerScores?.map(p => p.score || 0) || []
          const totalScore = scores.reduce((a, b) => a + b, 0)
          const maxScore = scores.length * (quiz.questions.length * 100)
          const average_score = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0

          return {
            id: quiz.id,
            title: quiz.title,
            created_at: quiz.created_at,
            status: quiz.status,
            total_players: playerCount || 0,
            average_score
          }
        })
      )

      setQuizzes(statsWithCounts)
    }

    fetchStats()
  }, [])

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-xl font-bold mb-4">📊 Στατιστικά Quiz</h1>
      {quizzes.map((q) => (
        <div
          key={q.id}
          className="border p-4 mb-4 rounded cursor-pointer hover:bg-gray-50"
          onClick={() => router.push(`/stats/${q.id}`)}
        >
          <p className="font-semibold text-lg text-blue-600 hover:underline">{q.title}</p>
          <p className="text-sm text-gray-500">Κατάσταση: {q.status}</p>
          <p className="text-sm text-gray-500">Παίκτες: {q.total_players}</p>
          <p className="text-sm text-gray-500">Μέση Επίδοση: {q.average_score}%</p>
          <p className="text-xs text-gray-400 mt-1">
            Δημιουργήθηκε: {new Date(q.created_at).toLocaleString()}
          </p>
        </div>
      ))}
    </div>
  )
}