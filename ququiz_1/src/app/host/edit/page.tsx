// Βασισμένο στο CreateQuizPage, αλλά προσαρμοσμένο για επεξεργασία υπάρχοντος κουίζ
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

interface Option {
  text: string
  imageUrl?: string
  tempPreviewUrl?: string
}

export default function EditQuizPage() {
  const [title, setTitle] = useState('')
  const [questions, setQuestions] = useState<any[]>([])
  const [currentQuestion, setCurrentQuestion] = useState('')
  const [currentOptions, setCurrentOptions] = useState<Option[]>([{ text: '' }, { text: '' }])
  const [correctIndex, setCorrectIndex] = useState<number | null>(null)
  const [currentDuration, setCurrentDuration] = useState<number>(15)
  const [currentImage, setCurrentImage] = useState<File | null>(null)
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null)

  const [quizId, setQuizId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  const router = useRouter()

  useEffect(() => {
    if (typeof window !== 'undefined') document.title = 'Edit'
  }, [])

  useEffect(() => {
    const loadQuiz = async () => {
      const id = localStorage.getItem('edit_quiz_id')
      const storedTitle = localStorage.getItem('edit_quiz_title')

      if (!id) {
        router.push('/host')
        return
      }

      setQuizId(id)

      const storedQuestions = localStorage.getItem('edit_quiz_questions')
      if (storedTitle) setTitle(storedTitle)
      if (storedQuestions) setQuestions(JSON.parse(storedQuestions))
      else {
        const { data } = await supabase.from('quizzes').select('title, questions').eq('id', id).single()
        if (data) {
          setTitle(data.title)
          setQuestions(data.questions)
        }
      }
    }

    const checkUser = async () => {
      const { data } = await supabase.auth.getUser()
      if (!data?.user) router.push('/login')
      else setUserId(data.user.id)
    }

    loadQuiz()
    checkUser()
  }, [router])

  const uploadImage = async (file: File) => {
    if (!userId) return null
    const ext = file.name.split('.').pop()
    const name = `${Math.random().toString(36).substring(2)}.${ext}`
    const path = `${userId}/${name}`
    const { error } = await supabase.storage.from('quiz-images').upload(path, file)
    if (error) return null
    const { data } = supabase.storage.from('quiz-images').getPublicUrl(path)
    return data.publicUrl
  }

  const onImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setCurrentImage(e.target.files[0])
      setCurrentImageUrl(URL.createObjectURL(e.target.files[0]))
    }
  }

  const handleOptionImage = async (file: File, index: number) => {
    const preview = URL.createObjectURL(file)
    setCurrentOptions((prev) => {
      const updated = [...prev]
      updated[index].tempPreviewUrl = preview
      return updated
    })
    const url = await uploadImage(file)
    if (!url) return
    setCurrentOptions((prev) => {
      const updated = [...prev]
      updated[index].imageUrl = url
      delete updated[index].tempPreviewUrl
      return updated
    })
  }

  const addQuestion = async () => {
    if (!currentQuestion || correctIndex === null || !currentDuration) {
      alert('Συμπλήρωσε όλα τα πεδία της ερώτησης.')
      return
    }

    const allOptionsValid = currentOptions.every(opt => opt.text.trim() !== '' || opt.imageUrl || opt.tempPreviewUrl)
    if (!allOptionsValid) {
      alert('Κάθε απάντηση πρέπει να έχει είτε κείμενο είτε εικόνα.')
      return
    }

    let imageUrl = null
    if (currentImage) {
      imageUrl = await uploadImage(currentImage)
      if (!imageUrl) return alert('Αποτυχία ανέβασματος εικόνας ερώτησης.')
    }

    const newQuestions = [...questions, {
      questionText: currentQuestion,
      options: currentOptions.map(({ tempPreviewUrl, ...rest }) => rest),
      correctIndex,
      duration: currentDuration,
      imageUrl,
    }]

    setQuestions(newQuestions)
    localStorage.setItem('edit_quiz_questions', JSON.stringify(newQuestions))
    setCurrentQuestion('')
    setCurrentOptions([{ text: '' }, { text: '' }])
    setCorrectIndex(null)
    setCurrentDuration(15)
    setCurrentImage(null)
    setCurrentImageUrl(null)
  }

  const removeQuestion = (index: number) => {
    const updated = questions.filter((_, i) => i !== index)
    setQuestions(updated)
    localStorage.setItem('edit_quiz_questions', JSON.stringify(updated))
  }

  const editQuestion = (index: number) => {
    const q = questions[index]
    setCurrentQuestion(q.questionText)
    setCurrentOptions(q.options)
    setCorrectIndex(q.correctIndex)
    setCurrentDuration(q.duration || 15)
    setCurrentImageUrl(q.imageUrl || null)
    setCurrentImage(null)
    setQuestions(prev => prev.filter((_, i) => i !== index))
  }

  const updateOptionText = (value: string, index: number) => {
    const updated = [...currentOptions]
    updated[index].text = value
    setCurrentOptions(updated)
  }

  const addOption = () => {
    if (currentOptions.length < 4) setCurrentOptions([...currentOptions, { text: '' }])
  }

  const removeOption = (index: number) => {
    if (currentOptions.length > 2) {
      const updated = [...currentOptions]
      updated.splice(index, 1)
      setCurrentOptions(updated)
      if (correctIndex !== null && correctIndex >= index) setCorrectIndex(correctIndex - 1)
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
      alert('Υπάρχει ήδη κουίζ με αυτόν τον τίτλο. Δοκιμάστε άλλον τίτλο.')
      return
    }

    const { error: updateError } = await supabase
      .from('quizzes')
      .update({
        title,
        questions,
        status: 'waiting',
        started: false,
      })
      .eq('id', quizId)

    if (updateError) {
      console.error('❌ Σφάλμα επεξεργασίας:', updateError)
    } else {
      localStorage.removeItem('edit_quiz_id')
      localStorage.removeItem('edit_quiz_title')
      localStorage.removeItem('edit_quiz_questions')
      router.push('/host')
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

        <div className="mb-2">
          <label className="block mb-1 font-medium">Εικόνα Ερώτησης (προαιρετικά):</label>
          <input type="file" accept="image/*" onChange={onImageChange} />
          {currentImageUrl && (
            <img src={currentImageUrl} alt="Preview" className="mt-2 max-h-40 object-contain" />
          )}
        </div>

        {currentOptions.map((opt, index) => (
          <div key={index} className="flex items-start gap-2 mb-2">
            <div className="flex-grow">
              <input
                type="text"
                value={opt.text}
                onChange={e => updateOptionText(e.target.value, index)}
                className="w-full border p-2 rounded mb-1"
                placeholder={`Απάντηση ${index + 1}`}
              />
              {(opt.tempPreviewUrl || opt.imageUrl) && (
                <img
                  src={opt.tempPreviewUrl || opt.imageUrl}
                  alt={`Εικόνα απάντησης ${index + 1}`}
                  className="max-h-32 mb-1"
                />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={e => e.target.files?.[0] && handleOptionImage(e.target.files[0], index)}
              />
            </div>
            <div className="flex flex-col items-center">
              <input type="radio" name="correct" checked={correctIndex === index} onChange={() => setCorrectIndex(index)} />
              {currentOptions.length > 2 && (
                <button onClick={() => removeOption(index)} className="text-red-500 text-xs mt-1">✖</button>
              )}
            </div>
          </div>
        ))}

        {currentOptions.length < 4 && (
          <button onClick={addOption} className="text-blue-600 text-sm mb-2">➕ Προσθήκη Επιλογής</button>
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
                {q.imageUrl && (
                  <img src={q.imageUrl} alt={`Ερώτηση ${index + 1}`} className="max-h-48 mt-2 object-contain" />
                )}
                <p className="text-sm text-gray-500 mb-1">⏱ Χρόνος: {q.duration}s</p>
                <ul className="pl-5 mt-1 list-disc text-sm">
                  {q.options.map((opt: Option, i: number) => (
                    <li key={i} className={i === q.correctIndex ? 'text-green-600 font-semibold' : ''}>
                      {opt.text}
                      {opt.imageUrl && (
                        <div>
                          <img src={opt.imageUrl} alt={`Απάντηση ${i + 1}`} className="max-h-24 mt-1" />
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
                <div className="mt-2 flex gap-3">
                  <button onClick={() => editQuestion(index)} className="text-blue-600 text-sm">✏️ Επεξεργασία</button>
                  <button onClick={() => removeQuestion(index)} className="text-red-600 text-sm">🗑️ Διαγραφή</button>
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