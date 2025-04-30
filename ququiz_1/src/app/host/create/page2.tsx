'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

type Question = {
  questionText: string
  options: string[]
  correctIndex: number
}

export default function CreateQuizPage() {
  const router = useRouter()

  const [title, setTitle] = useState('')
  const [questions, setQuestions] = useState<Question[]>([
    { questionText: '', options: ['', ''], correctIndex: 0 }
  ])
  const [loading, setLoading] = useState(false)

  const handleAddQuestion = () => {
    setQuestions(prev => [...prev, { questionText: '', options: ['', ''], correctIndex: 0 }])
  }

  const handleQuestionChange = (index: number, field: string, value: any) => {
    const updated = [...questions]
    if (field === 'questionText') {
      updated[index].questionText = value
    } else if (field.startsWith('option-')) {
      const optIndex = parseInt(field.split('-')[1])
      updated[index].options[optIndex] = value
    } else if (field === 'correctIndex') {
      updated[index].correctIndex = parseInt(value)
    }
    setQuestions(updated)
  }

  const handleAddOption = (index: number) => {
    const updated = [...questions]
    if (updated[index].options.length < 4) {
      updated[index].options.push('')
      setQuestions(updated)
    }
  }

  const handleRemoveOption = (qIndex: number, optIndex: number) => {
    const updated = [...questions]
    updated[qIndex].options.splice(optIndex, 1)
    setQuestions(updated)
  }

  const handleSubmit = async () => {
    if (!title.trim() || questions.some(q => q.questionText.trim() === '' || q.options.some(opt => opt.trim() === ''))) {
      alert('Συμπλήρωσε όλα τα πεδία σωστά.')
      return
    }

    setLoading(true)

    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user) {
      alert('Πρέπει να είσαι συνδεδεμένος.')
      setLoading(false)
      return
    }

    const shortId = Math.floor(1000 + Math.random() * 9000).toString()

    const { data, error } = await supabase
      .from('quizzes')
      .insert({
        title,
        short_id: shortId,
        status: 'waiting',
        started: false,
        host_id: user.id,
        questions
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Σφάλμα δημιουργίας quiz:', error.message)
      alert('Προέκυψε πρόβλημα.')
    } else if (data) {
      router.push(`/host/${data.id}`)
    }

    setLoading(false)
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Δημιουργία Νέου Quiz</h1>

      <div className="mb-6">
        <label className="block font-semibold mb-1">Τίτλος Quiz:</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border p-2 rounded"
        />
      </div>

      <h2 className="text-xl font-bold mb-4">Ερωτήσεις:</h2>
      {questions.map((q, index) => (
        <div key={index} className="border p-4 rounded mb-6">
          <div className="mb-3">
            <label className="block mb-1 font-medium">Εκφώνηση:</label>
            <input
              type="text"
              value={q.questionText}
              onChange={(e) => handleQuestionChange(index, 'questionText', e.target.value)}
              className="w-full border p-2 rounded"
            />
          </div>

          <div className="mb-3">
            <label className="block mb-2 font-medium">Απαντήσεις:</label>
            {q.options.map((opt, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => handleQuestionChange(index, `option-${i}`, e.target.value)}
                  className="flex-1 border p-2 rounded"
                />
                {q.options.length > 2 && (
                  <button
                    onClick={() => handleRemoveOption(index, i)}
                    className="text-red-500"
                  >
                    ✖
                  </button>
                )}
              </div>
            ))}

            {q.options.length < 4 && (
              <button
                onClick={() => handleAddOption(index)}
                className="mt-1 text-blue-600"
              >
                ➕ Προσθήκη Απάντησης
              </button>
            )}
          </div>

          <div className="mb-3">
            <label className="block mb-1 font-medium">Σωστή Απάντηση:</label>
            <select
              value={q.correctIndex}
              onChange={(e) => handleQuestionChange(index, 'correctIndex', e.target.value)}
              className="border p-2 rounded w-full"
            >
              {q.options.map((opt, i) => (
                <option key={i} value={i}>
                  {opt || `Απάντηση ${i + 1}`}
                </option>
              ))}
            </select>
          </div>
        </div>
      ))}

      <button
        onClick={handleAddQuestion}
        className="mb-6 w-full bg-yellow-500 text-white py-2 rounded hover:bg-yellow-600"
      >
        ➕ Προσθήκη Ερώτησης
      </button>

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full bg-green-600 text-white py-3 rounded hover:bg-green-700"
      >
        {loading ? 'Αποθήκευση...' : 'Ολοκλήρωση Quiz'}
      </button>
    </div>
  )
}
