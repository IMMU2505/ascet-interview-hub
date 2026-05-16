"use client"
import { useEffect, useState } from 'react'
import Editor from '@monaco-editor/react'
import { auth, db } from '../../lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, setDoc, getDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore'
import toast, { Toaster } from 'react-hot-toast'
import { useRouter, useSearchParams } from 'next/navigation'

export default function EditorPage() {
  const [user, setUser] = useState<any>(null)
  const [code, setCode] = useState('// Write your code here')
  const [language, setLanguage] = useState('javascript')
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const shareId = searchParams.get('share')

  useEffect(() => {
    const loadCode = async () => {
      // If share link, load that snippet
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

      // Otherwise load user's own saved code
      const unsub = onAuthStateChanged(auth, async (currentUser) => {
        if (!currentUser) return router.push('/login')
        setUser(currentUser)
        const snap = await getDoc(doc(db, 'users', currentUser.uid))
        if (snap.exists()) {
          const data = snap.data()
          setCode(data.code || code)
          setLanguage(data.language || language)
        }
      })
      return () => unsub()
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
        <h1 className="text-2xl font-bold">ASCET Code Runner</h1>
        <div className="flex gap-2">
          <select value={language} onChange={e => setLanguage(e.target.value)} className="bg-[#161b22] px-3 py-2 rounded">
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
            <option value="java">Java</option>
            <option value="cpp">C++</option>
          </select>
          <button onClick={saveCode} className="px-4 py-2 bg-purple-600 rounded hover:bg-purple-700">Save</button>
          <button onClick={shareCode} className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700">Share</button>
          <button onClick={runCode} disabled={loading} className="px-4 py-2 bg-green-600 rounded hover:bg-green-700 disabled:opacity-50">
            {loading? 'Running...' : 'Run'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 h-[calc(100vh-100px)]">
        <Editor
          height="100%"
          language={language}
          value={code}
          onChange={v => setCode(v || '')}
          theme="vs-dark"
          options={{ fontSize: 14, minimap: { enabled: false } }}
        />
        <div className="flex flex-col gap-4">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Input for stdin..."
            className="h-1/2 bg-[#161b22] p-3 rounded font-mono text-sm resize-none"
          />
          <pre className="h-1/2 bg-black p-3 rounded overflow-auto text-green-400 font-mono text-sm">{output}</pre>
        </div>
      </div>
    </div>
  )
}
