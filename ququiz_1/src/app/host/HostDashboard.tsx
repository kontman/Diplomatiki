'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

type Quiz = {
  id: string
  title: string
  short_id: string
  status: string
}

export default function HostDashboard() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteQuizError, setDeleteQuizError] = useState<string | null>(null)

  const router = useRouter()

  useEffect(() => {
    const fetchQuizzes = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data, error } = await supabase
        .from('quizzes')
        .select('id, title, short_id, status')
        .eq('host_id', user.id)

      if (!error && data) {
        setQuizzes(data)
      } else {
        console.error('⚠️ Σφάλμα φόρτωσης κουίζ:', error)
      }

      setLoading(false)
    }

    fetchQuizzes()
  }, [router])

  const handleDelete = async (quiz: Quiz) => {
    if (!confirm(`Είσαι σίγουρος ότι θέλεις να διαγράψεις το quiz "${quiz.title}";`)) {
      return
    }

    try {
      console.log('➡️ Διαγραφή παικτών για quiz:', quiz.id)
      const { error: playersError } = await supabase
        .from('players')
        .delete()
        .eq('quiz_id', quiz.id)

      if (playersError) {
        throw playersError
      }

      console.log('✅ Παίκτες διαγράφηκαν')

      console.log('➡️ Διαγραφή quiz:', quiz.id)
      const { error: quizError } = await supabase
        .from('quizzes')
        .delete()
        .eq('id', quiz.id)

      if (quizError) {
        throw quizError
      }

      console.log('✅ Quiz διαγράφηκε')
      setQuizzes(prev => prev.filter(q => q.id !== quiz.id))
    } catch (err: any) {
      console.error('❌ Σφάλμα διαγραφής quiz:', err.message)
      setDeleteQuizError(err.message)
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-center mb-6">🧾 Πίνακας Ελέγχου</h1>

      {loading && <p>Φόρτωση...</p>}
      {deleteQuizError && (
        <p className="text-red-600 mb-4">Σφάλμα: {deleteQuizError}</p>
      )}

      <ul className="space-y-4">
        {quizzes.map((quiz) => (
          <li key={quiz.id} className="p-4 border rounded">
            <h2 className="font-semibold text-lg">{quiz.title}</h2>
            <p className="text-sm text-gray-600">
              Short ID: {quiz.short_id} | Κατάσταση: {quiz.status}
            </p>
            <div className="flex gap-3 mt-3">
              <button
                onClick={() => handleDelete(quiz)}
                className="px-4 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
              >
                🗑️ Διαγραφή
              </button>
              <button
                onClick={() => {
                  localStorage.setItem('edit_quiz_id', quiz.id)
                  localStorage.setItem('edit_quiz_title', quiz.title)
                  router.push('/host/create')
                }}
                className="px-4 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-sm"
              >
                ✏️ Επεξεργασία
              </button>
              <button
                onClick={() => router.push(`/host/${quiz.id}`)}
                className="px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
              >
                📥 Είσοδος
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
