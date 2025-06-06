'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

interface Option {
  text: string
  imageUrl?: string
}

interface Question {
  id: string
  questionText: string
  options: Option[]
  correctIndex: number
  imageUrl?: string
}

interface AnswerStats {
  [optionIndex: number]: number
}

interface Review {
  id: string
  player_code: string
  quiz_code: string
  comment: string
  created_at: string
}

export default function QuizStatsPage() {
  const { quizId } = useParams()
  const router = useRouter()
  const [questions, setQuestions] = useState<Question[]>([])
  const [answerStats, setAnswerStats] = useState<Record<string, AnswerStats>>({})
  const [viewMode, setViewMode] = useState<'detailed' | 'summary' | 'reviews'>('detailed')
  const [reviews, setReviews] = useState<Review[]>([])
  const [quizCode, setQuizCode] = useState<string>('')


  useEffect(() => {
      document.title =` Stats | ${viewMode} `
    }, [viewMode])


  useEffect(() => {
    const fetchQuiz = async () => {
      const { data } = await supabase.from('quizzes').select('questions, short_id').eq('id', quizId).single()
      if (data) {
        setQuestions(data.questions)
        setQuizCode(data.short_id)
        //console.log('📦 Fetched quiz with code:', data.short_id)
      }
    }
    if (quizId) fetchQuiz()
  }, [quizId])

  useEffect(() => {
    const fetchAnswers = async () => {
      const { data: answers } = await supabase
        .from('player_answers')
        .select('question_id, selected_index')
        .eq('quiz_id', quizId)

      const stats: Record<string, AnswerStats> = {}
      answers?.forEach(({ question_id, selected_index }) => {
        if (!stats[question_id]) stats[question_id] = {}
        stats[question_id][selected_index] = (stats[question_id][selected_index] || 0) + 1
      })
      setAnswerStats(stats)
    }
    if (quizId) fetchAnswers()
  }, [quizId])

  useEffect(() => {
    if (viewMode === 'reviews' && quizCode) {
      const fetchReviews = async () => {
        //console.log('🔍 Fetching reviews for quiz_code:', quizCode)
        const { data, error } = await supabase
          .from('reviews')
          .select('*')
          .eq('quiz_code', quizCode)
          .order('created_at', { ascending: false })

        if (error) {
          console.error('❌ Error fetching reviews:', error)
        } else {
          console.log('✅ Reviews loaded:', data)
          setReviews(data || [])
        }
      }
      fetchReviews()
    }
  }, [viewMode, quizCode])

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold">📈 Στατιστικά Ερωτήσεων</h1>
        <button
          onClick={() => router.push('/stats')}
          className="text-sm text-blue-600 border px-3 py-1 rounded hover:bg-blue-50"
        >
          ⬅️ Πίσω
        </button>
      </div>

      <div className="mb-6 flex gap-4">
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="view"
            value="detailed"
            checked={viewMode === 'detailed'}
            onChange={() => setViewMode('detailed')}
          />
          Αναλυτικά
        </label>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="view"
            value="summary"
            checked={viewMode === 'summary'}
            onChange={() => setViewMode('summary')}
          />
          Συνοπτικά
        </label>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="view"
            value="reviews"
            checked={viewMode === 'reviews'}
            onChange={() => setViewMode('reviews')}
          />
          Σχόλια
        </label>
      </div>

      {viewMode === 'reviews' ? (
        <div>
          {reviews.length === 0 ? (
            <p className="text-gray-600">Δεν υπάρχουν σχόλια για αυτό το quiz.</p>
          ) : (
            <div className="space-y-4">
              {reviews.map((rev, index) => (
                <div key={rev.id || index} className="border p-4 rounded bg-gray-50">
                  <p className="text-sm text-gray-700 font-semibold mb-1">Παίκτης: {rev.player_code}</p>
                  <p className="text-gray-800 whitespace-pre-line">{rev.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        questions.map((q, i) => {
          const totalAnswers = Object.values(answerStats[q.id] || {}).reduce((a, b) => a + b, 0)
          if (viewMode === 'summary') {
            return (
              <div key={q.id} className="border p-4 mb-4 rounded">
                <p className="font-semibold mb-2">Ερώτηση {i + 1}</p>
                {q.options.map((opt, idx) => {
                  const count = answerStats[q.id]?.[idx] || 0
                  const percent = totalAnswers > 0 ? (count / totalAnswers) * 100 : 0
                  return (
                    <div key={idx} className="mb-2">
                      <div className="flex justify-between text-sm mb-1">
                        <span className={idx === q.correctIndex ? 'text-green-600 font-semibold' : ''}>{opt.text}</span>
                        <span className="text-gray-600">{percent.toFixed(0)}% ({count} απαντήσεις)</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded h-3">
                        <div
                          className={`h-3 rounded ${idx === q.correctIndex ? 'bg-green-500' : 'bg-blue-400'}`}
                          style={{ width: `${percent}%` }}
                        ></div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          }

          return (
            <div key={q.id} className="border p-4 mb-4 rounded">
              <p className="font-semibold mb-1">{i + 1}. {q.questionText}</p>
              {q.imageUrl && <img src={q.imageUrl} alt="" className="max-h-48 mb-2" />}
              <ul className="pl-4 text-sm list-disc">
                {q.options.map((opt, idx) => {
                  const count = answerStats[q.id]?.[idx] || 0
                  const percent = totalAnswers > 0 ? ((count / totalAnswers) * 100).toFixed(1) : '0.0'
                  return (
                    <li key={idx} className={idx === q.correctIndex ? 'text-green-600 font-medium' : ''}>
                      {opt.text} — {count} απαντήσεις ({percent}%)
                    </li>
                  )
                })}
              </ul>
            </div>
          )
        })
      )}
    </div>
  )
}
