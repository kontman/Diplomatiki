// Προσαρμοσμένη έκδοση με εμφάνιση εικόνας σε κάθε απάντηση (αν υπάρχει)
'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

interface Option {
  text: string
  imageUrl?: string
}

interface Question {
  questionText: string
  options: Option[]
  correctIndex: number
  duration: number
  imageUrl?: string
}

interface Quiz {
  id: string
  title: string
  started: boolean
  status: string
  questions: Question[]
}

export default function PlayQuizPage() {
  const { quizId } = useParams()
  const searchParams = useSearchParams()
  const playerCode = searchParams.get('player')
  const router = useRouter()

  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [quizStarted, setQuizStarted] = useState(false)
  const [quizFinished, setQuizFinished] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showAnswer, setShowAnswer] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)

  useEffect(() => {
    if (quiz && quizStarted) document.title = `Play | ${quiz.title}`
  }, [quiz, quizStarted])

  useEffect(() => {
    if (!quizId) return

    const fetchQuiz = async () => {
      const { data } = await supabase.from('quizzes').select('*').eq('id', quizId).single()
      if (data) {
        setQuiz(data)
        setQuizStarted(data.started)
        setQuizFinished(data.status === 'finished')
        setTimeLeft(data.questions[0]?.duration || 15)
      }
    }

    fetchQuiz()
  }, [quizId])

  useEffect(() => {
    const channel = supabase.channel(`quiz-${quizId}`).on('postgres_changes', {
      event: 'UPDATE', schema: 'public', table: 'quizzes', filter: `id=eq.${quizId}`
    }, (payload) => {
      const updated = payload.new as Quiz
      setQuizStarted(updated.started)
      setQuizFinished(updated.status === 'finished')
    }).subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [quizId])

  useEffect(() => {
    if (!quizStarted || showAnswer || quizFinished) return
    if (timeLeft === 0) return setShowAnswer(true)
    const timer = setTimeout(() => setTimeLeft((prev) => prev - 1), 1000)
    return () => clearTimeout(timer)
  }, [timeLeft, showAnswer, quizStarted, quizFinished])

  const handleAnswer = async (index: number) => {
    if (showAnswer || !playerCode || !quiz) return
    const q = quiz.questions[currentIndex]
    const isCorrect = index === q.correctIndex
    const rawScore = ((q.duration - (q.duration - timeLeft)) / q.duration) * 100
    const earned = isCorrect ? Math.floor(rawScore) : 0
    setSelectedAnswer(index)
    setShowAnswer(true)

    if (earned > 0) {
      const { data } = await supabase.from('players').select('score').eq('quiz_id', quizId).eq('player_code', playerCode).single()
      const current = data?.score || 0
      await supabase.from('players').update({ score: current + earned }).eq('quiz_id', quizId).eq('player_code', playerCode)
    }
  }

  const nextQuestion = async () => {
    if (!quiz || !playerCode || !quizId) return
    const next = currentIndex + 1
    if (next >= quiz.questions.length) {
      await supabase.from('players').update({ finished: true }).eq('quiz_id', quizId).eq('player_code', playerCode)
      const { data: all } = await supabase.from('players').select('finished').eq('quiz_id', quizId)
      if (all?.every(p => p.finished)) await supabase.from('quizzes').update({ status: 'finished' }).eq('id', quizId)
      setQuizFinished(true)
      return setTimeout(() => router.push('/join'), 3000)
    }
    setCurrentIndex(next)
    setSelectedAnswer(null)
    setShowAnswer(false)
    setTimeLeft(quiz.questions[next].duration || 15)
  }

  if (!quiz || !playerCode) return <p className="p-6">Φόρτωση...</p>

  if (!quizStarted) return <div className="p-6 text-center"><p className="text-xl font-semibold">Αναμονή για έναρξη από τον host...</p></div>

  if (quizFinished) return <div className="p-6 text-center"><h1 className="text-2xl font-bold mb-4">{quiz.title}</h1><p className="text-lg text-green-700 font-semibold">Το κουίζ έχει ολοκληρωθεί 🎉</p></div>

  const question = quiz.questions[currentIndex]
  const isCorrect = selectedAnswer === question.correctIndex

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-xl font-bold mb-4">{quiz.title}</h1>
      <div className="mb-4">
        <p className="text-lg font-medium">Ερώτηση {currentIndex + 1} / {quiz.questions.length}</p>
        {question.imageUrl && (
          <img src={question.imageUrl} alt="Εικόνα ερώτησης" className="max-h-64 my-4 mx-auto object-contain rounded" />
        )}
        <p className="text-gray-700">{question.questionText}</p>
        <p className="text-sm text-gray-500">Χρόνος: {timeLeft}s</p>
      </div>

      <div className="space-y-4">
        {question.options.map((option, i) => {
          const isSelected = selectedAnswer === i
          const isCorrectAnswer = i === question.correctIndex

          return (
            <button
              key={i}
              disabled={showAnswer}
              onClick={() => handleAnswer(i)}
              className={`w-full text-left px-4 py-2 border rounded flex flex-col items-start gap-2 ${
                showAnswer
                  ? isCorrectAnswer
                    ? 'bg-green-200 border-green-600'
                    : isSelected
                    ? 'bg-red-200 border-red-600'
                    : 'opacity-50'
                  : 'hover:bg-gray-100'
              }`}
            >
              <span>{option.text}</span>
              {option.imageUrl && (
                <img
                  src={option.imageUrl}
                  alt={`Απάντηση ${i + 1}`}
                  className="max-h-32 object-contain"
                />
              )}
            </button>
          )
        })}
      </div>

      {showAnswer && (
        <div className="mt-4">
          {isCorrect ? (
            <p className="text-green-600 font-semibold">Σωστό!</p>
          ) : (
            <p className="text-red-600 font-semibold">Λάθος απάντηση.</p>
          )}
          <button
            onClick={nextQuestion}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded"
          >
            {currentIndex + 1 < quiz.questions.length ? 'Επόμενη Ερώτηση' : 'Ολοκλήρωση Κουίζ'}
          </button>
        </div>
      )}
    </div>
  )
}
