'use client'
import { useState, useEffect } from 'react'
import Editor from '@monaco-editor/react'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth, db } from '@/lib/firebase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { collection, addDoc, getDocs, getDoc, doc, query, orderBy, serverTimestamp } from 'firebase/firestore'

type TestCase = { input: string, output: string }
type Problem = {
  id: string
  title: string
  description: string
  difficulty: string
  starterCode: { [key: string]: string }
  testCases: TestCase[]
}

export default function EditorPage() {
  const [user, loading] = useAuthState(auth)
  const router = useRouter()

  const [problem, setProblem] = useState<Problem | null>(null)
  const [code, setCode] = useState('')
  const [language, setLanguage] = useState('java')
  const [userInput, setUserInput] = useState('')
  const [output, setOutput] = useState('Loading problem...')
  const [isRunning, setIsRunning] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [snippets, setSnippets] = useState<any[]>([])
  const [problems, setProblems] = useState<Problem[]>([])
  const [testResults, setTestResults] = useState<any[]>([])

  useEffect(() => {
    if (!loading &&!user) router.push('/')
    if (user) {
      loadSnippets()
      loadProblems()
      loadProblem('two-sum')
    }
  }, [user, loading, router])

  const loadProblems = async () => {
    const querySnapshot = await getDocs(collection(db, 'problems'))
    setProblems(querySnapshot.docs.map(doc => ({ id: doc.id,...doc.data() } as Problem)))
  }

  const loadProblem = async (problemId: string) => {
    const docSnap = await getDoc(doc(db, 'problems', problemId))
    if (docSnap.exists()) {
      const p = { id: docSnap.id,...docSnap.data() } as Problem
      setProblem(p)
      setCode(p.starterCode?.[language] || '')
      setUserInput(p.testCases?.[0]?.input || '')
      setOutput('Problem loaded. Write your solution and hit Run.')
      setTestResults([])
    } else {
      setOutput('Problem not found in Firestore')
    }
  }

  const loadSnippets = async () => {
    if (!user) return
    const q = query(collection(db, `users/${user.uid}/snippets`), orderBy('createdAt', 'desc'))
    const querySnapshot = await getDocs(q)
    setSnippets(querySnapshot.docs.map(doc => ({ id: doc.id,...doc.data() })))
  }

  const saveCode = async () => {
    if (!user) return
    setIsSaving(true)
    try {
      await addDoc(collection(db, `users/${user.uid}/snippets`), {
        code,
        language,
        userInput,
        problemId: problem?.id,
        createdAt: serverTimestamp(),
        name: `${problem?.title || language} - ${new Date().toLocaleTimeString()}`
      })
      await loadSnippets()
      setOutput('Saved successfully!')
    } catch (e) {
      setOutput('Save failed')
    }
    setIsSaving(false)
  }

  const loadSnippet = (snippet: any) => {
    setCode(snippet.code)
    setLanguage(snippet.language)
    setUserInput(snippet.userInput || '')
    if (snippet.problemId) loadProblem(snippet.problemId)
    setOutput('Loaded snippet!')
  }

  const runSingle = async (stdin: string) => {
    const res = await fetch('/api/run-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language, code, stdin })
    })
    const data = await res.json()
    return data.error || data.output || ''
  }

  const runCode = async () => {
    setIsRunning(true)
    setOutput('Running...')
    const result = await runSingle(userInput)
    setOutput(result)
    setTestResults([])
    setIsRunning(false)
  }

  const submitCode = async () => {
    if (!problem) return
    setIsRunning(true)
    setOutput('Running test cases...')
    const results = []

    for (let i = 0; i < problem.testCases.length; i++) {
      const tc = problem.testCases[i]
      const got = await runSingle(tc.input)
      const passed = got.trim() === tc.output.trim()
      results.push({ case: i + 1, input: tc.input, expected: tc.output, got, passed })
    }

    setTestResults(results)
    const allPassed = results.every(r => r.passed)
    setOutput(allPassed? 'All test cases passed! ✅' : 'Some test cases failed ❌')
    setIsRunning(false)
  }

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang)
    if (problem?.starterCode?.[lang]) {
      setCode(problem.starterCode[lang])
    }
  }

  if (loading) return <div className="p-4 bg-gray-950 min-h-screen text-white">Loading...</div>
  if (!user) return null

  return (
    <div className="flex bg-gray-950 min-h-screen text-white">
      <div className="w-1/3 p-4 border-r border-gray-800 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold">ASCET Problems</h1>
          <Link href="/dashboard" className="text-blue-400 text-sm">Dashboard</Link>
        </div>

        <select
          onChange={(e) => e.target.value && loadProblem(e.target.value)}
          className="bg-gray-800 text-white p-2 rounded border border-gray-700 w-full mb-4"
          value={problem?.id || ""}
        >
          <option value="">Select Problem...</option>
          {problems.map(p => (
            <option key={p.id} value={p.id}>{p.title} - {p.difficulty}</option>
          ))}
        </select>

        {problem && (
          <div>
            <h2 className="text-lg font-bold mb-2">{problem.title}</h2>
            <span className={`text-xs px-2 py-1 rounded ${problem.difficulty === 'Easy'? 'bg-green-900 text-green-300' : problem.difficulty === 'Medium'? 'bg-yellow-900 text-yellow-300' : 'bg-red-900 text-red-300'}`}>
              {problem.difficulty}
            </span>
            <p className="text-gray-300 text-sm mt-3 whitespace-pre-wrap">{problem.description}</p>

            <h3 className="font-bold mt-4 mb-2 text-sm">Example Test Cases:</h3>
            {problem.testCases?.map((tc, i) => (
              <div key={i} className="bg-gray-900 p-2 rounded mb-2 text-xs">
                <div><span className="text-gray-500">Input:</span> {tc.input.replace('\n', ' | ')}</div>
                <div><span className="text-gray-500">Output:</span> {tc.output}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="w-2/3 p-4 flex flex-col">
        <div className="flex gap-2 mb-2 flex-wrap">
          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="bg-gray-800 text-white p-2 rounded border border-gray-700"
          >
            <option value="java">Java</option>
            <option value="python">Python</option>
          </select>
          <button
            onClick={runCode}
            disabled={isRunning}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {isRunning? 'Running...' : 'Run'}
          </button>
          <button
            onClick={submitCode}
            disabled={isRunning ||!problem}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            Submit
          </button>
          <button
            onClick={saveCode}
            disabled={isSaving}
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {isSaving? 'Saving...' : 'Save'}
          </button>
          <select
            onChange={(e) => e.target.value && loadSnippet(snippets.find(s => s.id === e.target.value))}
            className="bg-gray-800 text-white p-2 rounded border border-gray-700"
            value=""
          >
            <option value="">Load Snippet...</option>
            {snippets.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <Editor
          height="50vh"
          language={language}
          value={code}
          onChange={(value) => setCode(value || '')}
          theme="vs-dark"
          options={{ fontSize: 14, minimap: { enabled: false } }}
        />

        <div className="grid grid-cols-2 gap-2 mt-2 flex-1">
          <div className="flex flex-col">
            <div className="text-gray-400 text-xs mb-1">Input (stdin):</div>
            <textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Test input here..."
              className="w-full flex-1 bg-gray-900 text-white p-2 font-mono rounded border border-gray-700 resize-none"
            />
          </div>
          <div className="flex flex-col">
            <div className="text-gray-400 text-xs mb-1">Output / Results:</div>
            <div className="bg-black text-green-400 p-2 font-mono flex-1 overflow-auto rounded border border-gray-700 text-sm">
              <pre>{output}</pre>
              {testResults.length > 0 && (
                <div className="mt-2">
                  {testResults.map(r => (
                    <div key={r.case} className={`mb-2 p-2 rounded ${r.passed? 'bg-green-900/30' : 'bg-red-900/30'}`}>
                      <div className="font-bold">Case {r.case}: {r.passed? 'PASS ✅' : 'FAIL ❌'}</div>
                      <div>Input: {r.input}</div>
                      <div>Expected: {r.expected}</div>
                      <div>Got: {r.got}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}