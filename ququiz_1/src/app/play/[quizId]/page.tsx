'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
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
  status: string
  started: boolean
}

export default function PlayQuizPage() {
  const { quizId } = useParams()
  const searchParams = useSearchParams()
  const playerCode = searchParams.get('player')

  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [waiting, setWaiting] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)
  const router = useRouter()

  const fetchQuiz = async () => {
    const { data } = await supabase
      .from('quizzes')
      .select('id, title, questions, current_question_id, status, started')
      .eq('id', quizId)
      .single()

    if (data) {
      setQuiz(data)
      const current = data.questions.find((q: Question) => q.id === data.current_question_id)
      setActiveQuestion(current || null)
      setSelectedAnswer(null)
      setSubmitted(false)
      setWaiting(false)
      setTimeLeft(current?.duration || 15)
    }
  }

  useEffect(() => {
    if (quiz?.title && typeof window !== 'undefined') {
      document.title = `Playing | ${quiz.title}`
    }
  }, [quiz?.title])

  useEffect(() => {
    if (quizId) fetchQuiz()
  }, [quizId])

  useEffect(() => {
    const channel = supabase
      .channel(`quiz-${quizId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'quizzes',
        filter: `id=eq.${quizId}`
      }, () => {
        fetchQuiz()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [quizId])

  useEffect(() => {
    if (!submitted && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [timeLeft, submitted])

  useEffect(() => {
    if (quiz?.status === 'finished') {
      if (playerCode && quiz.id) {
        supabase.from('players')
          .update({ finished: true })
          .eq('quiz_id', quiz.id)
          .eq('player_code', playerCode.trim())
      }

      const timeout = setTimeout(() => {
        router.push('/join')
      }, 3000)

      return () => clearTimeout(timeout)
    }
  }, [quiz?.status])

  const handleAnswer = async (index: number) => {
    if (!quiz || !playerCode || !quiz.current_question_id) return

    const fullQuestion = quiz.questions.find(q => q.id === quiz.current_question_id)
    if (!fullQuestion) {
      console.warn('❌ Δεν βρέθηκε η ερώτηση με το id:', quiz.current_question_id)
      return
    }

    const correct = index === fullQuestion.correctIndex
    const duration = fullQuestion.duration || 15
    const timeUsed = duration - timeLeft
    const rawScore = ((duration - timeUsed) / duration) * 100
    const earned = correct ? Math.floor(rawScore) : 0

    setSelectedAnswer(index)
    setSubmitted(true)
    setWaiting(true)

    

    /*console.log('🎯 PLAYER INSERT:', {
        quiz_id: quiz.id,
        question_id: fullQuestion.id,
        player_code: playerCode.trim(),
        selected_index: index
      })*/

    await supabase.from('player_answers').insert({
      quiz_id: quiz.id,
      question_id: fullQuestion.id,
      player_code: playerCode.trim(),
      selected_index: index
    })

    if (earned > 0) {
      await supabase.rpc('award_score', {
        quiz_id_input: quiz.id,
        player_code_input: playerCode,
        score_input: earned
      })
    }
  }

  

  if (!quiz || !playerCode) return <p className="p-6">Φόρτωση...</p>
  if (!quiz.current_question_id) {
    if (!quiz.started) {
      return <p className="p-6 text-center">Αναμονή για έναρξη από τον host...</p>
    }
    return <p className="p-6 text-center">Αναμονή για την επόμενη ερώτηση...</p>
  }
  if (!activeQuestion) {
    return <p className="p-6 text-center">Αναμονή για έναρξη από τον host...</p>
  }




  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-xl font-bold mb-4">{quiz.title}</h1>
      <p className="text-lg font-medium mb-1">{activeQuestion.questionText}</p>
      {activeQuestion.imageUrl && (
        <img src={activeQuestion.imageUrl} className="max-h-64 object-contain mb-3" alt="Ερώτηση" />
      )}

      <p className="text-sm text-gray-500 mb-3">Χρόνος: {timeLeft}s</p>

      <div className="space-y-2">
        {activeQuestion.options.map((opt, i) => (
          <button
            key={i}
            disabled={submitted}
            onClick={() => handleAnswer(i)}
            className={`w-full text-left px-4 py-2 border rounded flex flex-col items-start gap-2 ${
              submitted && i === selectedAnswer ? 'bg-blue-100 border-blue-400' : 'hover:bg-gray-100'
            }`}
          >
            <span>{opt.text}</span>
            {opt.imageUrl && <img src={opt.imageUrl} className="max-h-32 object-contain" alt="" />}
          </button>
        ))}
      </div>

      {waiting && (
        <div className="mt-6 text-center text-blue-600 font-semibold">
          ✅ Απάντηση καταχωρήθηκε - Αναμονή για επόμενη ερώτηση...
        </div>
      )}
    </div>
  )
}
