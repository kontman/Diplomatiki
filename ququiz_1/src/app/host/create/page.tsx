'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { v4 as uuidv4 } from 'uuid'

interface Option {
  text: string
  imageUrl?: string
  tempPreviewUrl?: string
}

interface Question {
  id: string
  questionText: string
  options: Option[]
  correctIndex: number
  duration: number
  imageUrl?: string
  isSurvey?: boolean
}

export default function CreateQuizPage() {
  const [title, setTitle] = useState('')
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestion, setCurrentQuestion] = useState('')
  const [currentOptions, setCurrentOptions] = useState<Option[]>([{ text: '' }, { text: '' }])
  const [correctIndex, setCorrectIndex] = useState<number | null>(null)
  const [currentDuration, setCurrentDuration] = useState<number>(15)
  const [currentImage, setCurrentImage] = useState<File | null>(null)
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null)
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [isSurvey, setIsSurvey] = useState(false)
  const router = useRouter()

  useEffect(() => {
    document.title = 'Create | Ququiz'
  }, [])

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser()
      if (!data?.user) router.push('/login')
      else setUserId(data.user.id)
    }
    checkUser()
    const saved = localStorage.getItem('quiz_progress')
    if (saved) setQuestions(JSON.parse(saved))
  }, [])

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
    if (!currentQuestion || !currentDuration || (!isSurvey && correctIndex === null)) {
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

    const newQuestion: Question = {
      id: editingQuestionId ?? uuidv4(),
      questionText: currentQuestion,
      options: currentOptions.map(({ tempPreviewUrl, ...rest }) => rest),
      correctIndex: isSurvey ? -1 : (correctIndex ?? -1),
      duration: currentDuration,
      imageUrl: imageUrl ?? undefined,
      isSurvey
    }

    let updatedQuestions: Question[]
    if (editingQuestionId) {
      updatedQuestions = questions.map(q => q.id === editingQuestionId ? newQuestion : q)
    } else {
      updatedQuestions = [...questions, newQuestion]
    }

    setQuestions(updatedQuestions)
    localStorage.setItem('quiz_progress', JSON.stringify(updatedQuestions))
    setCurrentQuestion('')
    setCurrentOptions([{ text: '' }, { text: '' }])
    setCorrectIndex(null)
    setCurrentDuration(15)
    setCurrentImage(null)
    setCurrentImageUrl(null)
    setEditingQuestionId(null)
    setIsSurvey(false)
  }

  const editQuestion = (index: number) => {
    const q = questions[index]
    setCurrentQuestion(q.questionText)
    setCurrentOptions([...q.options])
    setCorrectIndex(q.correctIndex >= 0 ? q.correctIndex : null)
    setCurrentDuration(q.duration || 15)
    setCurrentImageUrl(q.imageUrl || null)
    setCurrentImage(null)
    setEditingQuestionId(q.id)
    setIsSurvey(q.isSurvey || false)
  }

  const removeQuestion = (index: number) => {
    const updated = questions.filter((_, i) => i !== index)
    setQuestions(updated)
    localStorage.setItem('quiz_progress', JSON.stringify(updated))
  }

  const handleSubmit = async () => {
    if (!title || questions.length === 0 || !userId) {
      alert('Συμπλήρωσε τίτλο και ερωτήσεις.')
      return
    }

    const { data: existingQuiz } = await supabase.from('quizzes').select('title').eq('title', title).single()
    if (existingQuiz) {
      alert('Υπάρχει ήδη κουίζ με αυτόν τον τίτλο.')
      return
    }

    const shortId = Math.floor(1000 + Math.random() * 9000).toString()
    const { error } = await supabase.from('quizzes').insert({
      title,
      questions,
      short_id: shortId,
      status: 'waiting',
      started: false,
      host_id: userId,
    })

    if (!error) {
      localStorage.removeItem('quiz_progress')
      router.push('/host')
    } else {
      console.error('❌ Σφάλμα δημιουργίας:', error)
    }
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

  const clearAll = () => {
    if (confirm('Θέλεις σίγουρα να διαγράψεις όλες τις ερωτήσεις;')) {
      setQuestions([])
      localStorage.removeItem('quiz_progress')
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

      <label className="block text-sm font-medium mb-2">
          <input
            type="checkbox"
            checked={isSurvey}
            onChange={(e) => setIsSurvey(e.target.checked)}
            className="mr-2"
          />
          Χωρίς σωστή απάντηση / χωρίς βαθμολογία (ερωτηματολόγιο)
        </label>

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
          {currentImageUrl && <img src={currentImageUrl} alt="Preview" className="mt-2 max-h-40 object-contain" />}
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
                <img src={opt.tempPreviewUrl || opt.imageUrl} alt={`Preview ${index + 1}`} className="max-h-32 mb-1" />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={e => e.target.files?.[0] && handleOptionImage(e.target.files[0], index)}
              />
            </div>
            <div className="flex flex-col items-center">
              {!isSurvey && (
                <input type="radio" name="correct" checked={correctIndex === index} onChange={() => setCorrectIndex(index)} />
              )}
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
              <li key={q.id} className="p-3 border rounded">
                <p className="font-semibold">{index + 1}. {q.questionText}</p>
                {q.imageUrl && (
                  <img src={q.imageUrl} alt={`Ερώτηση ${index + 1}`} className="max-h-48 mt-2 object-contain" />
                )}
                <p className="text-sm text-gray-500 mb-1">⏱ Χρόνος: {q.duration}s</p>
                <ul className="pl-5 mt-1 list-disc text-sm">
                  {q.options.map((opt, i) => (
                    <li key={i} className={i === q.correctIndex && !q.isSurvey ? 'text-green-600 font-semibold' : ''}>
                      {opt.text}
                      {opt.imageUrl && <img src={opt.imageUrl} alt={`Απ. ${i + 1}`} className="max-h-24 mt-1" />}
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
