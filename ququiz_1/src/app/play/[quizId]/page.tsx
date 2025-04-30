'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'



const QUESTION_TIME = 15
const MAX_SCORE = 1000

type Question = {
  questionText: string
  options: string[]
  correctIndex: number
}

type Quiz = {
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

  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [quizStarted, setQuizStarted] = useState(false)
  const [quizFinished, setQuizFinished] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showAnswer, setShowAnswer] = useState(false)
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME)

  


  // 👉 Φόρτωση του quiz
  useEffect(() => {
    document.title = `play`
    const fetchQuiz = async () => {
      const { data } = await supabase
        .from('quizzes')
        .select('*')
        .eq('id', quizId)
        .single()

      if (data) {
        setQuiz(data)
        setQuizStarted(data.started)
        setQuizFinished(data.status === 'finished')
      }
    }

    if (quizId) fetchQuiz()

    const channel = supabase
      .channel(`quiz-${quizId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'quizzes', filter: `id=eq.${quizId}` }, (payload) => {
        const updated = payload.new as Quiz
        setQuizStarted(updated.started)
        setQuizFinished(updated.status === 'finished')
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [quizId])

  // 👉 Timer
  useEffect(() => {
    if (!quizStarted || showAnswer || quizFinished) return
    if (timeLeft === 0) {
      setShowAnswer(true)
      return
    }

    const timer = setTimeout(() => setTimeLeft((prev) => prev - 1), 1000)
    return () => clearTimeout(timer)
  }, [timeLeft, showAnswer, quizStarted, quizFinished])

  // 👉 Επιλογή απάντησης
  const handleAnswer = async (index: number) => {
    if (!quiz || !playerCode || showAnswer) return

    setSelectedAnswer(index)
    setShowAnswer(true)

    const question = quiz.questions[currentIndex]
    if (index === question.correctIndex) {
      const { data } = await supabase
        .from('players')
        .select('score')
        .eq('quiz_id', quizId)
        .eq('player_code', playerCode)
        .single()

      if (data) {
        const newScore = data.score + Math.floor((timeLeft / QUESTION_TIME) * MAX_SCORE)
        await supabase
          .from('players')
          .update({ score: newScore })
          .eq('quiz_id', quizId)
          .eq('player_code', playerCode)
      }
    }
  }

  // 👉 Επόμενη ερώτηση ή Τέλος κουίζ
  const nextQuestion = async () => {
    if (!quiz || !playerCode) return

    if (currentIndex + 1 >= quiz.questions.length) {
      // Ολοκλήρωση παίκτη
      await supabase
        .from('players')
        .update({ finished: true })
        .eq('quiz_id', quizId)
        .eq('player_code', playerCode)

      const { data: allPlayers } = await supabase
        .from('players')
        .select('finished')
        .eq('quiz_id', quizId)

      const allFinished = allPlayers?.every((p) => p.finished)
      if (allFinished) {
        await supabase
          .from('quizzes')
          .update({ status: 'finished' })
          .eq('id', quizId)
      }

      setQuizFinished(true)
      return
    }

    setCurrentIndex((prev) => prev + 1)
    setSelectedAnswer(null)
    setShowAnswer(false)
    setTimeLeft(QUESTION_TIME)
  }

  if (!quiz || !playerCode) return <p className="p-6">Φόρτωση...</p>
  if (!quizStarted) return <p className="text-center text-xl">🕓 Αναμονή για έναρξη από τον host...</p>
  if (quizFinished) return <p className="text-center text-2xl mt-10">🎉 Το κουίζ ολοκληρώθηκε!</p>

  const question = quiz.questions[currentIndex]


  
   
  


  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">{quiz.title}</h1>

      <div className="mb-4">
        <p>Ερώτηση {currentIndex + 1} / {quiz.questions.length}</p>
        <p className="text-gray-700 mt-2">{question.questionText}</p>
        <p className="text-gray-500 text-sm mt-1">⏳ {timeLeft}s</p>
      </div>

      <div className="space-y-2 mt-4">
        {question.options.map((opt, i) => {
          const isSelected = selectedAnswer === i
          const isCorrect = i === question.correctIndex

          return (
            <button
              key={i}
              onClick={() => handleAnswer(i)}
              disabled={showAnswer}
              className={`block w-full px-4 py-2 rounded border ${
                showAnswer
                  ? isCorrect
                    ? 'bg-green-200'
                    : isSelected
                    ? 'bg-red-300'
                    : 'opacity-50'
                  : 'bg-white hover:bg-gray-100'
              }`}
            >
              {opt}
            </button>
          )
        })}
      </div>

      {showAnswer && (
        <div className="mt-6 text-center">
          {selectedAnswer === question.correctIndex ? (
            <p className="text-green-600 font-semibold">Σωστό!</p>
          ) : (
            <p className="text-red-600 font-semibold">Λάθος απάντηση.</p>
          )}
          <button
            onClick={nextQuestion}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            {currentIndex + 1 === quiz.questions.length ? 'Ολοκλήρωση Κουίζ' : 'Επόμενη Ερώτηση'}
          </button>
        </div>
      )}
    </div>
  )
}
