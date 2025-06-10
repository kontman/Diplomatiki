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
  isSurvey?: boolean
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
  const [score, setScore] = useState<number | null>(null)
  const [showOptions, setShowOptions] = useState(false);



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
      setTimeLeft(current?.duration+3 || 15)
    }
  } 

  useEffect(() => {
    if (quizId) fetchQuiz()
  }, [quizId])

  useEffect(() => {
  const interval = setInterval(fetchQuiz, 5000)
  return () => clearInterval(interval)
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
const { data: existingPlayer } = await supabase
  .from('players')
  .select('score')
  .eq('quiz_id', quiz.id)
  .eq('player_code', playerCode.trim())
  .single()

if (existingPlayer?.score === 0 || existingPlayer?.score === null) {
  await supabase
    .from('players')
    .update({ score: correct })
    .eq('quiz_id', quiz.id)
    .eq('player_code', playerCode.trim())
}


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

          console.log('✅ Ενημερώθηκε ως finished:', quiz.id, playerCode.trim())
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
    //console.log('score υπολογίστηκε:', { correct, timeUsed, earned })

    if (earned > 0) {
      await supabase.rpc('award_score', {
        quiz_id_input: quiz.id,
        player_code_input: playerCode,
        score_input: earned
      })
    }
  }

  

useEffect(() => {
  if (!quiz || !playerCode || quiz.status !== 'finished') return;

  const fetchPlayerScore = async () => {
    const { data, error } = await supabase
      .from('players')
      .select('score')
      .eq('quiz_id', quiz.id)
      .eq('player_code', playerCode.trim())
      .single();

    //console.log("Fetched score:", data?.score, "error:", error);

    if (typeof data?.score === 'number') {
      setScore(data.score);
    }
    else {
      // Προσπάθησε ξανά μετά από λίγο
      setTimeout(fetchPlayerScore, 500); // ή 1000ms
    }
  };

  fetchPlayerScore();
  
}, [quiz?.id, quiz?.status, playerCode]);

useEffect(() => {
  if (activeQuestion) {
    setShowOptions(false); // Απόκρυψη αρχικά
    const timeout = setTimeout(() => {
      setShowOptions(true); // Εμφάνιση μετά από 3"
    }, 3000);

    return () => clearTimeout(timeout); // cleanup
  }
}, [activeQuestion]);



  if (!quiz || !playerCode) return <p className="p-6">Φόρτωση...</p>
  const isSurvey = quiz.questions?.[0]?.isSurvey;


// ✅ Αν το κουίζ τελείωσε, δείξε σκορ
if (quiz.status === 'finished' && correctCount !== null) {
  if (score === null ) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-emerald-100 dark:bg-emerald-900">
        <p className="text-center text-lg font-medium text-gray-900 dark:text-white">
          Υπολογισμός σκορ...
        </p>
      </div>
    )
  }

  return (
  isSurvey ? (
    <div className="p-6 text-center text-blue-600 font-semibold">
      📋 Ολοκλήρωσες το ερωτηματολόγιο! Ευχαριστούμε για τη συμμετοχή σου.
    </div>
  ) : (
    <div>
      <p className="p-6 text-center text-green-700 font-semibold">
        🏁 Ολοκλήρωσες το κουίζ!
      </p>
      <p className="p-6 text-center text-green-700 font-semibold">
        Απάντησες σωστά σε {correctCount}/{totalCount} ερωτήσεις!
      </p>
      <p className="p-6 text-center text-green-700 font-semibold">
        Συγχαρητήρια, συγκέντρωσες {score} πόντους!
      </p>
    </div>
  )
)

}

// ✅ Αναμονή αν δεν υπάρχει ενεργή ερώτηση
if (!quiz.current_question_id || !activeQuestion) {
  return (
    <div className="min-h-screen bg-emerald-200 dark:bg-emerald-800 flex items-center justify-center">
      <p className="text-center text-lg font-medium text-gray-900 dark:text-white">
        {quiz.started
          ? 'Αναμονή για την επόμενη ερώτηση...'
          : 'Αναμονή για έναρξη από τον host...'}
      </p>
    </div>
  )


    }

  return (
    <div className="min-h-screen  max-w mx-auto bg-emerald-300 dark:bg-emerald-900 text-gray-900 dark:text-white p-6">
      <h1 className="text-xl font-bold mb-4">{quiz.title}</h1>
       {activeQuestion && (
  <p className="text-lg font-medium mb-1">{activeQuestion.questionText}</p>
)}

      {timeLeft !== null && (
  <div className="text-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
    Υπολειπόμενος χρόνος: {timeLeft} δευτερόλεπτα
  </div>
)}


      {showOptions && activeQuestion?.options.map((opt, i) => (
        <button
          key={i}
          disabled={submitted}
          onClick={() => handleAnswer(i)}
          className={`w-full text-left px-5 py-2 border-2 border-black rounded flex flex-col items-start gap-2 m-2 ${
            submitted && i === selectedAnswer
              ? 'bg-blue-200 border-blue-600 dark:bg-blue-900 dark:border-blue-500'
              : 'hover:bg-blue-300 dark:hover:bg-gray-700'
          }`}
        >
          <span>{opt.text}</span>
          {opt.imageUrl && <img src={opt.imageUrl} className="max-h-32 object-contain" alt="" />}
        </button>
      ))}


      {waiting && (
        <div className="mt-6 text-center text-blue-600 font-semibold">
          ✅ Απάντηση καταχωρήθηκε - Αναμονή για επόμενη ερώτηση...
        </div>
      )}

      
    </div>
  )
}
