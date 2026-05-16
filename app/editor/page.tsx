"use client"
import { useEffect, useState, Suspense } from 'react'
import Editor from '@monaco-editor/react'
import { auth, db } from '../../lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, setDoc, getDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore'
import toast, { Toaster } from 'react-hot-toast'
import { useRouter, useSearchParams } from 'next/navigation'

function EditorComponent() {
  const [user, setUser] = useState<any>(null)
  const [code, setCode] = useState('print("Hello ASCET")')
  const [language, setLanguage] = useState('python')
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const shareId = searchParams.get('share')

  useEffect(() => {
    const loadCode = async () => {
      if (shareId) {
        const snap = await getDoc(doc(db, 'snippets', shareId))
        if (snap.exists()) {
          const data = snap.data()
          setCode(data.code)
          setLanguage(data.language)
          setInput(data.input || '')
          toast.success('Loaded shared code')
        } else {
          toast.error('Share link not found')
        }
        return
      }

      onAuthStateChanged(auth, async (currentUser) => {
        if (!currentUser) return router.push('/login')
        setUser(currentUser)
        const snap = await getDoc(doc(db, 'users', currentUser.uid))
        if (snap.exists()) {
          const data = snap.data()
          setCode(data.code || code)
          setLanguage(data.language || language)
        }
      })
    }
    loadCode()
  }, [shareId])

  const runCode = async () => {
    setLoading(true)
    setOutput('Running...')
    try {
      const res = await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language, input })
      })
      const data = await res.json()
      setOutput(data.output || data.error || 'No output')
    } catch {
      setOutput('Error running code')
    }
    setLoading(false)
  }

  const saveCode = async () => {
    if (!user) return toast.error('Login to save')
    await setDoc(doc(db, 'users', user.uid), {
      code, language, updatedAt: serverTimestamp()
    })
    toast.success('Saved to your account')
  }

  const shareCode = async () => {
    if (!user) return toast.error('Login to share')
    const docRef = await addDoc(collection(db, 'snippets'), {
      code, language, input, createdAt: serverTimestamp()
    })
    const url = `${window.location.origin}/editor?share=${docRef.id}`
    await navigator.clipboard.writeText(url)
    toast.success('Share link copied!')
  }

  return (
    <div className="min-h-screen bg-[#0d1117] text-white p-4">
      <Toaster />
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">ASCET Editor</h1>
        <div className="flex gap-2">
          <select value={language} onChange={e => setLanguage(e.target.value)} className="bg-[#161b22] px-3 py-2 rounded">
            <option value="python">Python</option>
            <option value="javascript">JavaScript</option>
            <option value="java">Java</option>
            <option value="cpp">C++</option>
          </select>
          <button onClick={runCode} disabled={loading} className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50">
            {loading? 'Running...' : 'Run'}
          </button>
          <button onClick={saveCode} className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-700">Save</button>
          <button onClick={shareCode} className="px-4 py-2 bg-green-600 rounded hover:bg-green-700">Share</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[calc(100vh-100px)]">
        <Editor
          height="100%"
          language={language}
          value={code}
          onChange={v => setCode(v || '')}
          theme="vs-dark"
          options={{ fontSize: 14, minimap: { enabled: false } }}
        />
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-sm mb-1">Input (stdin):</p>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Input here..."
              className="w-full h-32 bg-[#161b22] p-3 rounded font-mono text-sm resize-none"
            />
          </div>
          <div>
            <p className="text-sm mb-1">Output:</p>
            <pre className="w-full h-64 bg-black p-3 rounded overflow-auto text-green-400 font-mono text-sm">{output}</pre>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Page() {
  return (
    <Suspense fallback={<div className="bg-[#0d1117] text-white p-4">Loading...</div>}>
      <EditorComponent />
    </Suspense>
  )
}