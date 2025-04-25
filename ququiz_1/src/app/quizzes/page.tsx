'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'

type Quiz = {
  id: string
  title: string
  questions: any[]
}

export default function QuizzesPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([])

  useEffect(() => {
    const fetchQuizzes = async () => {
      const { data, error } = await supabase.from('quizzes').select('*')

      if (error) {
        console.error('Σφάλμα:', error)
      } else {
        setQuizzes(data || [])
      }
    }

    fetchQuizzes()
  }, [])

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">📚 Όλα τα Κουίζ</h1>

      {quizzes.length === 0 ? (
        <p className="text-gray-600">Δεν υπάρχουν διαθέσιμα κουίζ.</p>
      ) : (
        <ul className="space-y-4">
          {quizzes.map((quiz) => (
            <li key={quiz.id} className="border p-4 rounded shadow">
              <h2 className="text-lg font-semibold">{quiz.title}</h2>
              <p className="text-sm text-gray-600">
                Ερωτήσεις: {quiz.questions.length}
              </p>
              <Link
                href={`/play/${quiz.id}`}
                className="inline-block mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Παίξε τώρα
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
