'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

// Προσωρινό στατικό ID host
const HOST_ID = 'admin123'

export default function DashboardPage() {
  const router = useRouter()
  const [quizzes, setQuizzes] = useState<any[]>([])

  useEffect(() => {
    const fetchQuizzes = async () => {
      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .eq('owner_id', HOST_ID)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Σφάλμα κατά την ανάκτηση των κουίζ:', error)
        return
      }

      setQuizzes(data || [])
    }

    fetchQuizzes()
  }, [])

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Τα Κουίζ μου</h1>

      {quizzes.length === 0 ? (
        <p className="text-gray-600">Δεν έχεις δημιουργήσει ακόμα κουίζ.</p>
      ) : (
        <ul className="space-y-4">
          {quizzes.map((quiz) => (
            <li
              key={quiz.id}
              className="p-4 border rounded hover:bg-gray-100 cursor-pointer"
              onClick={() => router.push(`/host/${quiz.id}`)}
            >
              <div className="font-semibold text-lg">{quiz.title}</div>
              <div className="text-sm text-gray-600">
                Ερωτήσεις: {quiz.questions?.length || 0} — Κατάσταση:{' '}
                <span className="font-medium">{quiz.status}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
