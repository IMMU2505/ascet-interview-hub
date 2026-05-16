'use client'
import { useState, useEffect } from 'react'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth, db } from '@/lib/firebase'
import { doc, setDoc, collection, addDoc } from 'firebase/firestore'
import { useRouter } from 'next/navigation'
import { Clock, CheckCircle, XCircle, Trophy, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'

interface Question {
  id: number
  category: 'quant' | 'logical' | 'verbal'
  question: string
  options: string[]
  correct: number
  explanation: string
}

const QUESTIONS: Question[] = [
  {
    id: 1,
    category: 'quant',
    question: 'If 15% of a number is 45, what is the number?',
    options: ['200', '250', '300', '350'],
    correct: 2,
    explanation: '15% = 45, so 1% = 3. Therefore 100% = 300.'
  },
  {
    id: 2,
    category: 'logical',
    question: 'Find the next number: 2, 6, 12, 20, 30,?',
    options: ['40', '42', '44', '46'],
    correct: 1,
    explanation: 'Pattern: +4, +6, +8, +10, +12. So 30 + 12 = 42.'
  },
  {
    id: 3,
    category: 'verbal',
    question: 'Choose the synonym of "CANDID"',
    options: ['Secretive', 'Frank', 'Rude', 'Clever'],
    correct: 1,
    explanation: 'Candid means truthful and straightforward. Frank is a synonym.'
  },
  {
    id: 4,
    category: 'quant',
    question: 'A train runs 60 km in 1.5 hours. Speed in m/s?',
    options: ['11.11', '40', '16.67', '22.22'],
    correct: 0,
    explanation: 'Speed = 60/1.5 = 40 km/h. 40 * 5/18 = 11.11 m/s.'
  },
  {
    id: 5,
    category: 'logical',
    question: 'If CAT = 3120, DOG = 4157, then BAT =?',
    options: ['2120', '2110', '2130', '3120'],
    correct: 0,
    explanation: 'Position of letters: C=3,A=1,T=20 → 3120. B=2,A=1,T=20 → 2120.'
  }
]

export default function AptitudePage() {
  const [user, loading] = useAuthState(auth)
  const router = useRouter()
  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState<number[]>([])
  const [showResult, setShowResult] = useState(false)
  const [timeLeft, setTimeLeft] = useState(600) // 10 mins
  const [started, setStarted] = useState(false)
  const [category, setCategory] = useState<'all' | 'quant' | 'logical' | 'verbal'>('all')

  const filteredQuestions = category === 'all'
   ? QUESTIONS
    : QUESTIONS.filter(q => q.category === category)

  useEffect(() => {
    if (!loading &&!user) router.push('/login')
  }, [user, loading, router])

  useEffect(() => {
    if (!started || showResult) return
    if (timeLeft === 0) {
      submitTest()
      return
    }
    const timer = setInterval(() => setTimeLeft(t => t - 1), 1000)
    return () => clearInterval(timer)
  }, [started, timeLeft, showResult])

  const startTest = () => {
    setStarted(true)
    setAnswers(new Array(filteredQuestions.length).fill(-1))
  }

  const selectAnswer = (optionIndex: number) => {
    const newAnswers = [...answers]
    newAnswers[currentQ] = optionIndex
    setAnswers(newAnswers)
  }

  const submitTest = async () => {
    setShowResult(true)
    const score = answers.reduce((acc, ans, idx) =>
      ans === filteredQuestions[idx].correct? acc + 1 : acc, 0
    )

    if (user) {
      await addDoc(collection(db, 'test_results'), {
        userId: user.uid,
        email: user.email,
        score,
        total: filteredQuestions.length,
        category,
        timestamp: new Date(),
        answers
      })
      toast.success('Result saved!')
    }
  }

  const score = answers.reduce((acc, ans, idx) =>
    ans === filteredQuestions[idx].correct? acc + 1 : acc, 0
  )

  if (loading) return <div className="flex items-center justify-center h-screen bg-gray-900 text-white">Loading...</div>

  if (!started) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-2xl mx-auto">
          <button onClick={() => router.push('/editor')} className="flex items-center gap-2 mb-6 text-gray-400 hover:text-white">
            <ArrowLeft size={20} /> Back to Editor
          </button>
          <h1 className="text-3xl font-bold mb-4">Aptitude Test</h1>
          <p className="text-gray-400 mb-6">Test your quantitative, logical, and verbal reasoning skills.</p>

          <div className="bg-gray-800 p-6 rounded-lg mb-6">
            <h2 className="font-bold mb-4">Select Category:</h2>
            <div className="flex gap-3 flex-wrap">
              {['all', 'quant', 'logical', 'verbal'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat as any)}
                  className={`px-4 py-2 rounded capitalize ${
                    category === cat? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                >
                  {cat === 'all'? 'All Topics' : cat}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <div className="flex items-center gap-4 mb-4 text-sm text-gray-400">
              <span className="flex items-center gap-1"><Clock size={16} /> 10 Minutes</span>
              <span>{filteredQuestions.length} Questions</span>
            </div>
            <button
              onClick={startTest}
              className="w-full py-3 bg-green-600 hover:bg-green-700 rounded font-bold"
            >
              Start Test
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (showResult) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-gray-800 p-8 rounded-lg text-center mb-6">
            <Trophy size={48} className="mx-auto mb-4 text-yellow-400" />
            <h1 className="text-3xl font-bold mb-2">Test Complete!</h1>
            <p className="text-2xl mb-4">
              Score: <span className="text-green-400">{score}</span> / {filteredQuestions.length}
            </p>
            <p className="text-gray-400 mb-6">
              {score / filteredQuestions.length >= 0.8? 'Excellent!' :
               score / filteredQuestions.length >= 0.6? 'Good job!' : 'Keep practicing!'}
            </p>
            <div className="flex gap-4 justify-center">
              <button onClick={() => window.location.reload()} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded">
                Retake Test
              </button>
              <button onClick={() => router.push('/editor')} className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded">
                Back to Editor
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {filteredQuestions.map((q, idx) => (
              <div key={q.id} className="bg-gray-800 p-6 rounded-lg">
                <div className="flex items-start gap-3 mb-3">
                  {answers[idx] === q.correct?
                    <CheckCircle className="text-green-400 mt-1" size={20} /> :
                    <XCircle className="text-red-400 mt-1" size={20} />
                  }
                  <div className="flex-1">
                    <p className="font-semibold mb-2">{idx + 1}. {q.question}</p>
                    <p className="text-sm text-gray-400 mb-1">
                      Your answer: {answers[idx] >= 0? q.options[answers[idx]] : 'Not answered'}
                    </p>
                    <p className="text-sm text-green-400 mb-2">
                      Correct: {q.options[q.correct]}
                    </p>
                    <p className="text-sm text-gray-300 bg-gray-900 p-3 rounded">
                      <span className="font-bold">Explanation:</span> {q.explanation}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const q = filteredQuestions[currentQ]

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold">Question {currentQ + 1} / {filteredQuestions.length}</h1>
          <div className="flex items-center gap-2 text-yellow-400 font-mono">
            <Clock size={20} />
            {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg mb-6">
          <div className="text-xs text-blue-400 mb-2 uppercase">{q.category}</div>
          <p className="text-lg mb-6">{q.question}</p>

          <div className="space-y-3">
            {q.options.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => selectAnswer(idx)}
                className={`w-full text-left p-4 rounded border-2 transition ${
                  answers[currentQ] === idx
                   ? 'border-blue-500 bg-blue-600/20'
                    : 'border-gray-700 hover:border-gray-600 bg-gray-900'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-between">
          <button
            onClick={() => setCurrentQ(q => Math.max(0, q - 1))}
            disabled={currentQ === 0}
            className="px-6 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 rounded"
          >
            Previous
          </button>

          {currentQ === filteredQuestions.length - 1? (
            <button
              onClick={submitTest}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 rounded font-bold"
            >
              Submit Test
            </button>
          ) : (
            <button
              onClick={() => setCurrentQ(q => q + 1)}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded"
            >
              Next
            </button>
          )}
        </div>

        <div className="mt-6 flex gap-1 justify-center">
          {filteredQuestions.map((_, idx) => (
            <div
              key={idx}
              className={`w-2 h-2 rounded-full ${
                idx === currentQ? 'bg-blue-500' :
                answers[idx] >= 0? 'bg-green-500' : 'bg-gray-700'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}