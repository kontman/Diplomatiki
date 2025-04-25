'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function CreatePage() {
  const router = useRouter()
  const [quizTitle, setQuizTitle] = useState('')
  const [question, setQuestion] = useState('')
  const [answers, setAnswers] = useState(['', '', '', ''])
  const [correctIndex, setCorrectIndex] = useState<number | null>(null)
  const [optionCount, setOptionCount] = useState<2 | 4>(4)
  const [questionsList, setQuestionsList] = useState<any[]>([])
  const shortId = Math.floor(1000 + Math.random() * 9000).toString()

  const resetForm = () => {
    setQuestion('')
    setAnswers(['', '', '', ''])
    setCorrectIndex(null)
    setOptionCount(4)
  }

  const handleAddQuestion = () => {
    if (!question || answers.slice(0, optionCount).some(a => !a) || correctIndex === null) {
      alert('Συμπλήρωσε όλα τα πεδία και επίλεξε σωστή απάντηση.')
      return
    }

    const newQuestion = {
      questionText: question.trim(),
      options: answers.slice(0, optionCount),
      correctIndex
    }

    setQuestionsList([...questionsList, newQuestion])
    resetForm()
  }

  const handleFinishQuiz = async () => {
    if (!quizTitle.trim()) {
      alert('Δώσε έναν τίτλο για το κουίζ.')
      return
    }

    if (questionsList.length === 0) {
      alert('Δεν έχεις προσθέσει ερωτήσεις.')
      return
    }

    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser()

    if (userError || !user) {
      alert('Πρέπει να είσαι συνδεδεμένος για να δημιουργήσεις κουίζ.')
      return
    }

    const { error } = await supabase.from('quizzes').insert([
  {
    title: quizTitle,
    questions: questionsList,
    creator_id: user.id,
    short_id: shortId,
    status: 'waiting',
    started: false,
  },
])

    if (error) {
      console.error('Σφάλμα αποθήκευσης:', error)
      alert('Κάτι πήγε στραβά.')
    } else {
      alert('Το κουίζ δημιουργήθηκε!')
      router.push('/host')
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Δημιουργία Κουίζ</h1>

      <div className="mb-4">
        <label className="block font-medium mb-1">Τίτλος Κουίζ:</label>
        <input
          type="text"
          value={quizTitle}
          onChange={(e) => setQuizTitle(e.target.value)}
          className="w-full border p-2 rounded"
        />
      </div>

      <div className="mb-6">
        <label className="block font-medium mb-1">Πλήθος Απαντήσεων:</label>
        <div className="flex gap-4">
          {[2, 4].map((count) => (
            <button
              key={count}
              type="button"
              onClick={() => setOptionCount(count as 2 | 4)}
              className={`px-4 py-2 border rounded ${
                optionCount === count ? 'bg-blue-600 text-white' : ''
              }`}
            >
              {count}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <label className="block font-medium mb-1">Εκφώνηση:</label>
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="w-full border p-2 rounded"
        />
      </div>

      <div className="mb-4">
        <label className="block font-medium mb-2">Απαντήσεις:</label>
        {Array.from({ length: optionCount }).map((_, i) => (
          <div key={i} className="flex items-center mb-2">
            <input
              type="radio"
              name="correctAnswer"
              checked={correctIndex === i}
              onChange={() => setCorrectIndex(i)}
              className="mr-2"
            />
            <input
              type="text"
              placeholder={`Απάντηση ${i + 1}`}
              value={answers[i]}
              onChange={(e) => {
                const newAns = [...answers]
                newAns[i] = e.target.value
                setAnswers(newAns)
              }}
              className="flex-1 border p-2 rounded"
            />
          </div>
        ))}
      </div>

      <div className="flex gap-4">
        <button
          onClick={handleAddQuestion}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Προσθήκη Ερώτησης
        </button>
        <button
          onClick={handleFinishQuiz}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Ολοκλήρωση Κουίζ
        </button>
      </div>

      {questionsList.length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-2">Προεπισκόπηση:</h2>
          <ul className="list-disc list-inside space-y-1">
            {questionsList.map((q, i) => (
              <li key={i}>
                <strong>Ερώτηση {i + 1}:</strong> {q.questionText}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
