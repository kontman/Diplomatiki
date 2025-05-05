'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function CreateQuizPage() {
  const [title, setTitle] = useState('')
  const [questions, setQuestions] = useState<any[]>([])
  const [currentQuestion, setCurrentQuestion] = useState('')
  const [currentOptions, setCurrentOptions] = useState(['', ''])
  const [correctIndex, setCorrectIndex] = useState<number | null>(null)
  const [currentDuration, setCurrentDuration] = useState<number>(15)
  const [userId, setUserId] = useState<string | null>(null)
  const router = useRouter()
  document.title = `Create`

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser()
      if (!data?.user) {
        router.push('/login')
      } else {
        setUserId(data.user.id)
      }
    }
    checkUser()
  }, [router])

  const addQuestion = () => {
    if (
      !currentQuestion ||
      currentOptions.some(opt => opt === '') ||
      correctIndex === null ||
      !currentDuration
    ) {
      alert('Συμπλήρωσε όλα τα πεδία της ερώτησης.')
      return
    }

    setQuestions(prev => [
      ...prev,
      {
        questionText: currentQuestion,
        options: currentOptions,
        correctIndex,
        duration: currentDuration,
      },
    ])
    setCurrentQuestion('')
    setCurrentOptions(['', ''])
    setCorrectIndex(null)
    setCurrentDuration(15)
  }

  const removeQuestion = (index: number) => {
    setQuestions(prev => prev.filter((_, i) => i !== index))
  }

  const editQuestion = (index: number) => {
    const q = questions[index]
    setCurrentQuestion(q.questionText)
    setCurrentOptions([...q.options])
    setCorrectIndex(q.correctIndex)
    setCurrentDuration(q.duration || 15)
    setQuestions(prev => prev.filter((_, i) => i !== index))
  }

  const updateOption = (value: string, index: number) => {
    const updated = [...currentOptions]
    updated[index] = value
    setCurrentOptions(updated)
  }

  const addOption = () => {
    if (currentOptions.length < 4) setCurrentOptions([...currentOptions, ''])
  }

  const removeOption = (index: number) => {
    if (currentOptions.length > 2) {
      const updated = [...currentOptions]
      updated.splice(index, 1)
      setCurrentOptions(updated)
      if (correctIndex !== null && correctIndex >= index) {
        setCorrectIndex(correctIndex - 1)
      }
    }
  }

  const handleSubmit = async () => {
    if (!title || questions.length === 0 || !userId) {
      alert('Συμπλήρωσε τίτλο και ερωτήσεις.')
      return
    }

    const shortId = Math.floor(1000 + Math.random() * 9000).toString()

    const { data, error } = await supabase
      .from('quizzes')
      .insert({
        title,
        questions,
        short_id: shortId,
        status: 'waiting',
        started: false,
        host_id: userId,
      })
      .select()
      .single()

    if (!error && data) {
      router.push('/host')
    } else {
      console.error('❌ Σφάλμα δημιουργίας:', error)
    }
  }

  const clearAll = () => {
    if (confirm('Θέλεις σίγουρα να διαγράψεις όλες τις ερωτήσεις;')) {
      setQuestions([])
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">📝 Δημιουργία Κουίζ</h1>
        <button
          onClick={clearAll}
          className="text-sm text-red-600 border border-red-500 px-3 py-1 rounded hover:bg-red-50"
        >
          Καθαρισμός Όλων
        </button>
      </div>

      <input
        type="text"
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="Τίτλος κουίζ"
        className="w-full border p-2 mb-4 rounded"
      />

      <div className="border p-4 rounded mb-6">
        <h2 className="text-lg font-semibold mb-2">Προσθήκη Ερώτησης</h2>

        <textarea
          className="w-full border p-2 rounded mb-2"
          rows={2}
          placeholder="Εκφώνηση ερώτησης"
          value={currentQuestion}
          onChange={e => setCurrentQuestion(e.target.value)}
        />

        {currentOptions.map((opt, index) => (
          <div key={index} className="flex items-center gap-2 mb-2">
            <input
              type="text"
              value={opt}
              onChange={e => updateOption(e.target.value, index)}
              className="flex-grow border p-2 rounded"
              placeholder={`Απάντηση ${index + 1}`}
            />
            <input
              type="radio"
              name="correct"
              checked={correctIndex === index}
              onChange={() => setCorrectIndex(index)}
              title="Σωστή απάντηση"
            />
            {currentOptions.length > 2 && (
              <button onClick={() => removeOption(index)} className="text-red-500">✖</button>
            )}
          </div>
        ))}

        {currentOptions.length < 4 && (
          <button onClick={addOption} className="text-blue-600 text-sm mb-2">
            ➕ Προσθήκη Επιλογής
          </button>
        )}

        <div className="mt-2">
          <label className="text-sm font-medium mr-2">Διάρκεια (δευτερόλεπτα):</label>
          <input
            type="number"
            value={currentDuration}
            min={5}
            max={300}
            onChange={e => setCurrentDuration(Number(e.target.value))}
            className="w-24 border p-1 rounded"
          />
        </div>

        <button
          onClick={addQuestion}
          className="w-full mt-4 bg-green-600 text-white py-2 rounded hover:bg-green-700"
        >
          Προσθήκη Ερώτησης
        </button>
      </div>

      {questions.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">📋 Ερωτήσεις</h2>
          <ul className="space-y-3">
            {questions.map((q, index) => (
              <li key={index} className="p-3 border rounded">
                <p className="font-semibold">{index + 1}. {q.questionText}</p>
                <p className="text-sm text-gray-500 mb-1">⏱ Χρόνος: {q.duration}s</p>
                <ul className="pl-5 mt-1 list-disc text-sm">
                  {q.options.map((opt: string, i: number) => (
                    <li key={i} className={i === q.correctIndex ? 'text-green-600 font-semibold' : ''}>
                      {opt}
                    </li>
                  ))}
                </ul>
                <div className="mt-2 flex gap-3">
                  <button
                    onClick={() => editQuestion(index)}
                    className="text-blue-600 text-sm"
                  >
                    ✏️ Επεξεργασία
                  </button>
                  <button
                    onClick={() => removeQuestion(index)}
                    className="text-red-600 text-sm"
                  >
                    🗑️ Διαγραφή
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        onClick={handleSubmit}
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
      >
        ✅ Ολοκλήρωση και Επιστροφή
      </button>
    </div>
  )
}
