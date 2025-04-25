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
  const router = useRouter()

  useEffect(() => {
    const fetchQuizzes = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const { data, error } = await supabase
        .from('quizzes')
        .select('id, title, short_id, status')
        .eq('host_id', user.id)
        .order('created_at', { ascending: false })

      if (!error && data) {
        setQuizzes(data)
      }

      setLoading(false)
    }

    fetchQuizzes()
  }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handleCreateQuiz = () => {
    router.push('/host/create')
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">🎛️ Πίνακας Ελέγχου</h1>
        <button
          onClick={handleLogout}
          className="text-sm bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700"
        >
          Αποσύνδεση
        </button>
      </div>

      <button
        onClick={handleCreateQuiz}
        className="mb-6 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        ➕ Δημιουργία Νέου Quiz
      </button>

      {loading ? (
        <p>Φόρτωση...</p>
      ) : quizzes.length === 0 ? (
        <p>Δεν έχεις δημιουργήσει ακόμα κανένα quiz.</p>
      ) : (
        <ul className="space-y-4">
          {quizzes.map((quiz) => (
            <li
              key={quiz.id}
              className="p-4 border rounded cursor-pointer hover:bg-gray-50"
              onClick={() => router.push(`/host/${quiz.id}`)}
            >
              <p className="text-lg font-semibold">{quiz.title}</p>
              <p className="text-sm text-gray-500">
                Short ID: <span className="font-mono">{quiz.short_id}</span>
              </p>
              <p className="text-sm text-gray-500">Κατάσταση: {quiz.status}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
