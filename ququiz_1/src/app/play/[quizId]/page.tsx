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
  short_id: string
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
  const [correctCount, setCorrectCount] = useState<number | null>(null)
  const [totalCount, setTotalCount] = useState<number | null>(null)


  const router = useRouter()

  useEffect(() => {
    if (quiz?.title && typeof window !== 'undefined') {
      document.title = `Playing | ${quiz.title}`
    }
  }, [quiz?.title])

  const fetchQuiz = async () => {
    const { data } = await supabase
      .from('quizzes')
      .select('id, title,short_id, questions, current_question_id, status, started')
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
  const checkCompletion = async () => {
  if (!quiz || !playerCode) return

  interface PlayerAnswer {
    question_id: string
    selected_index: number
  }

  const { data: answersRaw } = await supabase
    .from('player_answers')
    .select('question_id, selected_index')
    .eq('quiz_id', quiz.id)
    .eq('player_code', playerCode)

  const answers = answersRaw as PlayerAnswer[] || []
  const answeredCount = answers.length
  const totalCount = quiz.questions.length

  if (answeredCount === totalCount) {
    let correct = 0

    for (const q of quiz.questions) {
      const a = answers.find(ans => ans.question_id === q.id)
      if (a && a.selected_index === q.correctIndex) correct++
    }

    setCorrectCount(correct)
    setTotalCount(totalCount)

    setTimeout(() => {
      router.push(`/reviews?player=${playerCode}&quiz=${quiz.short_id}`)
    }, 6000)
  }
}
    

   const checkAndUpdatePlayer = async () => {
    if (quiz?.status === 'finished') {
      if (playerCode && quiz.id) {
        const { data: playerRow, error } = await supabase
          .from('players')
          .select('*')
          .eq('quiz_id', quiz.id)
          .eq('player_code', playerCode.trim())
          .maybeSingle()

        //console.log('Βρέθηκε εγγραφή:', playerRow, error)

        if (playerRow && !playerRow.finished) {
          await supabase
            .from('players')
            .update({ finished: true })
            .eq('quiz_id', quiz.id)
            .eq('player_code', playerCode.trim())

        //  console.log('✅ Ενημερώθηκε ως finished:', quiz.id, playerCode.trim())
        }
      }
    }

    checkCompletion()
  }

  checkAndUpdatePlayer()
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

  const [score, setScore] = useState<number | null>(null)

useEffect(() => {
  const fetchPlayerScore = async () => {
    if (!quiz || !playerCode) return
    const { data, error } = await supabase
      .from('players')
      .select('score')
      .eq('quiz_id', quiz.id)
      .eq('player_code', playerCode.trim())
      .single()

    if (data?.score !== undefined) {
      setScore(data.score)
    }
  }

  if (quiz?.status === 'finished') {
    fetchPlayerScore()
  }
}, [quiz?.status])


  if (!quiz || !playerCode) return <p className="p-6">Φόρτωση...</p>
  if (!quiz.current_question_id) {
    if (!quiz.current_question_id) {
      if (quiz.status === 'finished' && correctCount !== null) {
        return (
          <div>
          <p className="p-6 text-center text-green-700 font-semibold">
                         🏁 Ολοκλήρωσες το κουίζ! </p>
            <p className="p-6 text-center text-green-700 font-semibold"> 
            Απάντησες σωστά σε {correctCount}/{totalCount} ερωτήσεις!
          </p>
          <p className="p-6 text-center text-green-700 font-semibold"> 
            Συγχαρητήρια συγκέντρωσες {score ?? '...'} πόντους!
          </p>
          </div>
        )
      }

      if (!quiz.started) {
        return <div className="min-h-screen bg-emerald-200 dark:bg-emerald-800 flex items-center justify-center">
            <p className="text-center text-lg font-medium text-gray-900 dark:text-white">
                Αναμονή για έναρξη από τον host...
             </p>
              </div>
        
      }

      return <div className="min-h-screen bg-emerald-200 dark:bg-emerald-800 flex items-center justify-center">
            <p className="text-center text-lg font-medium text-gray-900 dark:text-white">
                Αναμονή για την επόμενη ερώτηση...
             </p>
              </div>
    }}

  return (
    <div className="min-h-screen  max-w-2xl mx-auto bg-emerald-100 dark:bg-emerald-900 text-gray-900 dark:text-white p-6">
      <h1 className="text-xl font-bold mb-4">{quiz.title}</h1>
      <p className="text-lg font-medium mb-1">{activeQuestion!.questionText}</p>
      {activeQuestion!.imageUrl && (
        <img src={activeQuestion!.imageUrl} className="max-h-64 object-contain mb-3" alt="Ερώτηση" />
      )}

      <p className="text-sm text-gray-500 mb-3">Χρόνος: {timeLeft}s</p>

      <div className="space-y-2">
        {activeQuestion!.options.map((opt, i) => (
          <button
            key={i}
            disabled={submitted}
            onClick={() => handleAnswer(i)}
            className={`w-full text-left px-4 py-2 border rounded flex flex-col items-start gap-2 ${
              submitted && i === selectedAnswer ? 'bg-blue-100 border-blue-400: dark:bg-blue-900 dark:border-blue-500'
        : 'hover:bg-gray-100 dark:hover:bg-gray-700'
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

      {correctCount !== null && (
        <div className="mt-6 text-center text-green-700 font-semibold">
          🏁 Ολοκλήρωσες το κουίζ! Σωστές απαντήσεις: {correctCount}
        </div>
      )}
    </div>
  )
}
