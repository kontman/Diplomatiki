'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function EditQuizPage() {
  const [title, setTitle] = useState('')
  const [questions, setQuestions] = useState<any[]>([])
  const [currentQuestion, setCurrentQuestion] = useState('')
  const [currentOptions, setCurrentOptions] = useState(['', ''])
  const [correctIndex, setCorrectIndex] = useState<number | null>(null)
  const [currentDuration, setCurrentDuration] = useState<number>(15)
  const [quizId, setQuizId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const router = useRouter()


  useEffect(() => {
      if (typeof window !== 'undefined') {
        document.title = 'Edit';
      }
    }, []);
 

  // Φόρτωση δεδομένων από το localStorage
  useEffect(() => {
    const fetchData = () => {
      const quizIdFromStorage = localStorage.getItem('edit_quiz_id')
      if (!quizIdFromStorage) {
        router.push('/host') // Αν δεν υπάρχει ID κουίζ, ανακατευθύνουμε στο Dashboard
        return
      }

      setQuizId(quizIdFromStorage)

      // Φόρτωση του τίτλου και των ερωτήσεων από το localStorage
      const quizTitle = localStorage.getItem('edit_quiz_title')
      const quizQuestions = localStorage.getItem('edit_quiz_questions')

      if (quizTitle && quizQuestions) {
        setTitle(quizTitle)
        setQuestions(JSON.parse(quizQuestions))
      } else {
        // Αν δεν υπάρχουν δεδομένα στο localStorage, φορτώνουμε από τη βάση δεδομένων
        const fetchQuiz = async () => {
          const { data } = await supabase
            .from('quizzes')
            .select('title, questions')
            .eq('id', quizIdFromStorage)
            .single()

          if (data) {
            setTitle(data.title)
            setQuestions(data.questions)
          }
        }

        fetchQuiz()
      }
    }

    fetchData()

    // Αν ο χρήστης δεν είναι συνδεδεμένος, ανακατευθύνουμε στο login
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
  
    const newQuestions = [
      ...questions,
      {
        questionText: currentQuestion,
        options: currentOptions,
        correctIndex,
        duration: currentDuration,
      }
    ]
  
    setQuestions(newQuestions)
  
    // Αποθήκευση στο localStorage
    localStorage.setItem('edit_quiz_questions', JSON.stringify(newQuestions))
  
    // Εκκαθάριση των πεδίων για την επόμενη ερώτηση
    setCurrentQuestion('')
    setCurrentOptions(['', ''])
    setCorrectIndex(null)
    setCurrentDuration(15)
  }
  

  const removeQuestion = (index: number) => {
    const updatedQuestions = questions.filter((_, i) => i !== index)
    setQuestions(updatedQuestions)
  
    // Ενημέρωση στο localStorage
    localStorage.setItem('edit_quiz_questions', JSON.stringify(updatedQuestions))
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
    if (!title || questions.length === 0 || !userId || !quizId) {
      alert('Συμπλήρωσε τίτλο και ερωτήσεις.')
      return
    }

    const { data: existingQuiz, error } = await supabase
    .from('quizzes')
    .select('title')
    .eq('title', title)
    .single()

    if (existingQuiz && title !== localStorage.getItem('edit_quiz_title')) {
        // Αν υπάρχει, εμφανίζουμε μήνυμα στον χρήστη
        alert('Υπάρχει ήδη κουίζ με αυτόν τον τίτλο. Δοκιμάστε άλλον τίτλο.')
        return
    }
  
    try {
      // Ενημέρωση του υπάρχοντος κουίζ (δεν δημιουργούμε νέο)
      const { data, error } = await supabase
        .from('quizzes')
        .update({
          title,
          questions,
          status: 'waiting',  // Προεπιλεγμένη κατάσταση
          started: false,  // Δεν έχει ξεκινήσει
        })
        .eq('id', quizId) // Ενημέρωση του υπάρχοντος κουίζ βάσει ID
  
      if (error) {
        throw error
      }
  
      localStorage.removeItem('edit_quiz_id')  // Καθαρισμός localStorage
      localStorage.removeItem('edit_quiz_title')
      localStorage.removeItem('edit_quiz_questions')
      router.push('/host')  // Επιστροφή στο Dashboard
  
    } catch (error) {
      console.error('❌ Σφάλμα επεξεργασίας:', error)
    }
  }
  

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold">✏️ Επεξεργασία Κουίζ</h1>

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
