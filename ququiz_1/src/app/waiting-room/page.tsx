'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function WaitingRoomPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const quizId = searchParams.get('quizId')
  const playerCode = searchParams.get('player')

  useEffect(() => {
    document.title =`waiting room`
    const channel = supabase
      .channel(`quiz-status-${quizId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'quizzes',
        filter: `id=eq.${quizId}`,
      }, (payload) => {
        const updated = payload.new
        if (updated.status === 'playing') {
          router.push(`/play/${quizId}?player=${playerCode}`)
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [quizId, playerCode, router])

  return (
    <div className="p-6 text-center">
      <h1 className="text-xl font-semibold mb-2">🕒 Αναμονή για έναρξη...</h1>
      <p className="text-gray-600">Ο host θα ξεκινήσει το κουίζ σύντομα.</p>
    </div>
  )
}