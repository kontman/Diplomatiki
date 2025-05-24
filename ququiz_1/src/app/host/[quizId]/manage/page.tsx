"use client"

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
  duration: number
  imageUrl?: string
}

interface Quiz {
  id: string
  title: string
  questions: Question[]
  current_question_id: string | null
  started: boolean
  status: string
}

export default function HostManagePage() {
  const { quizId } = useParams()
  const router = useRouter()
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number | null>(null)
  const [timeLeft, setTimeLeft] = useState<number>(0)
  const [showAnswers, setShowAnswers] = useState(false)
  const [stats, setStats] = useState<number[]>([])
  const [playerCount, setPlayerCount] = useState<number>(0)

  useEffect(() => {
    if (!quizId) return
    const fetchQuiz = async () => {
      const { data } = await supabase.from('quizzes').select('*').eq('id', quizId).single()
      if (data) {
        setQuiz(data)
        const index = data.questions.findIndex((q: Question) => q.id === data.current_question_id)
        setCurrentQuestionIndex(index >= 0 ? index : null)
        if (index >= 0) setTimeLeft(data.questions[index].duration || 15)
      }
    }
    fetchQuiz()
  }, [quizId])

  useEffect(() => {
    if (!showAnswers && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000)
      return () => clearTimeout(timer)
    } else if (!showAnswers && timeLeft === 0) {
      setShowAnswers(true)
      fetchAnswerStats()
    }
  }, [timeLeft, showAnswers])

  const nextQuestion = async () => {
    if (!quiz || quiz.questions.length === 0) return
    const nextIndex = currentQuestionIndex === null ? 0 : currentQuestionIndex + 1

    if (nextIndex >= quiz.questions.length) {
      await supabase.from('quizzes').update({ current_question_id: null, status: 'finished' }).eq('id', quiz.id)
      setCurrentQuestionIndex(null)
      return
    }

    const nextId = quiz.questions[nextIndex].id
    await supabase.from('quizzes').update({ current_question_id: nextId }).eq('id', quiz.id)

    setCurrentQuestionIndex(nextIndex)
    setShowAnswers(false)
    setStats([])
    setTimeLeft(quiz.questions[nextIndex].duration || 15)
  }

  const fetchAnswerStats = async () => {
    if (!quiz || currentQuestionIndex === null) return

    const question = quiz.questions[currentQuestionIndex]
    const questionId = String(question.id).trim()
    const quizId = quiz.id.trim()

    const { data: answers, error } = await supabase
      .from('player_answers')
      .select('selected_index')
      .eq('quiz_id', quizId)
      .eq('question_id', questionId)

    if (error) {
      console.warn('⚠️ Σφάλμα στατιστικών:', error.message)
      return
    }

    const { data: players } = await supabase
      .from('players')
      .select('player_code')
      .eq('quiz_id', quizId)

    setPlayerCount(players?.length ?? 0)

    const counts = new Array(question.options.length).fill(0)
    if (answers) {
      for (const row of answers) {
        if (row.selected_index !== null && row.selected_index < counts.length) {
          counts[row.selected_index]++
        }
      }
    }

    setStats(counts)
  }

  if (!quiz) return <p className="p-6">Φόρτωση...</p>

  const question = currentQuestionIndex !== null ? quiz.questions[currentQuestionIndex] : null

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">🕒 Διαχείριση Quiz | {quiz.title}</h1>
        <button
          onClick={() => router.push(`/host/${quiz.id}`)}
          className="text-sm bg-gray-200 px-3 py-1 rounded hover:bg-gray-300"
        >
          🔙 Επιστροφή
        </button>
      </div>

      {question ? (
        <div className="mb-6">
          <p className="text-lg font-semibold">
            Ερώτηση {currentQuestionIndex! + 1} / {quiz.questions.length}
          </p>
          <p className="text-gray-700 mb-2">{question.questionText}</p>
          <p className="text-sm text-gray-500 mb-2">Χρόνος: {timeLeft}s</p>

          {question.imageUrl && (
            <img src={question.imageUrl} alt="Εικόνα" className="max-h-64 mb-3 object-contain" />
          )}

          <ul className="list-disc pl-6">
            {question.options.map((opt, i) => (
              <li
                key={i}
                className={
                  showAnswers && i === question.correctIndex ? 'text-green-600 font-semibold' : ''
                }
              >
                {opt.text} {opt.imageUrl && <img src={opt.imageUrl} className="inline-block max-h-16 ml-2" />}
              </li>
            ))}
          </ul>

          {showAnswers && stats.length > 0 && (
            <div className="mt-4">
              <h2 className="font-bold mb-2">📊 Στατιστικά:</h2>
              <p className="text-sm text-gray-600 mb-1">🧍 Παίκτες που συμμετέχουν: {playerCount}</p>
              <ul className="list-disc pl-6 text-sm">
                {question.options.map((opt, i) => {
                  const count = stats[i]
                  const percent = playerCount > 0 ? ((count / playerCount) * 100).toFixed(0) : '0'
                  return (
                    <li key={i}>
                      {opt.text}: {count} απαντήσεις ({percent}%)
                    </li>
                  )
                })}
              </ul>
            </div>
          )}

          <button
            onClick={nextQuestion}
            className="mt-6 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            ➡️ Επόμενη Ερώτηση
          </button>
        </div>
      ) : (
        <div className="text-center py-6">
          <p className="mb-4">Καμία ερώτηση σε προβολή.</p>
          <button
            onClick={nextQuestion}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            ▶️ Ξεκίνα το Quiz
          </button>
        </div>
      )}
    </div>
  )
}