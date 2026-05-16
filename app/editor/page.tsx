"use client"
import { useEffect, useState, Suspense } from 'react'
import Editor from '@monaco-editor/react'
import { auth, db } from '../../lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, setDoc, getDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore'
import toast, { Toaster } from 'react-hot-toast'
import { useRouter, useSearchParams } from 'next/navigation'
import { FiPlus, FiX, FiColumns } from 'react-icons/fi'

type FileTab = {
  id: string
  name: string
  content: string
  language: string
}

function EditorComponent() {
  const [user, setUser] = useState<any>(null)
  const [files, setFiles] = useState<FileTab[]>([
    { id: '1', name: 'main.py', content: 'a = 10\nprint(a)', language: 'python' }
  ])
  const [activeFileId, setActiveFileId] = useState('1')
  const [splitFileId, setSplitFileId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [loading, setLoading] = useState(false)
  const [explaining, setExplaining] = useState(false)
  const [explanation, setExplanation] = useState('')
  const [showExplain, setShowExplain] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const shareId = searchParams.get('share')

  const activeFile = files.find(f => f.id === activeFileId) || files[0]
  const splitFile = files.find(f => f.id === splitFileId)

  useEffect(() => {
    const loadCode = async () => {
      if (shareId) {
        const snap = await getDoc(doc(db, 'snippets', shareId))
        if (snap.exists()) {
          const data = snap.data()
          if (data.files) {
            setFiles(data.files)
            setActiveFileId(data.files[0].id)
          } else {
            setFiles([{ id: '1', name: 'main.py', content: data.code, language: data.language }])
          }
          setInput(data.input || '')
          toast.success('Loaded shared project')
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
          if (data.files) setFiles(data.files)
        }
      })
    }
    loadCode()
  }, [shareId, router])

  const updateFile = (id: string, content: string) => {
    setFiles(files.map(f => f.id === id? {...f, content } : f))
  }

  const addFile = () => {
    const name = prompt('File name? (e.g. utils.py, main.js)')
    if (!name) return
    const ext = name.split('.').pop()
    const langMap: any = { py: 'python', js: 'javascript', java: 'java', cpp: 'cpp', c: 'cpp' }
    const newFile: FileTab = {
      id: Date.now().toString(),
      name,
      content: '',
      language: langMap[ext || ''] || 'python'
    }
    setFiles([...files, newFile])
    setActiveFileId(newFile.id)
  }

  const closeFile = (id: string) => {
    if (files.length === 1) return toast.error('Cannot close last file')
    const newFiles = files.filter(f => f.id!== id)
    setFiles(newFiles)
    if (activeFileId === id) setActiveFileId(newFiles[0].id)
    if (splitFileId === id) setSplitFileId(null)
  }

  const toggleSplit = () => {
    if (splitFileId) {
      setSplitFileId(null)
    } else {
      const otherFile = files.find(f => f.id!== activeFileId)
      if (otherFile) setSplitFileId(otherFile.id)
      else toast.error('Add another file first')
    }
  }

  const runCode = async () => {
    setLoading(true)
    setOutput('Running...')
    try {
      const res = await fetch('/api/run-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: activeFile.content,
          language: activeFile.language,
          stdin: input
        })
      })
      const data = await res.json()
      setOutput(data.error || data.output || 'No output')
    } catch {
      setOutput('Error running code')
    }
    setLoading(false)
  }

  const saveCode = async () => {
    if (!user) return toast.error('Login to save')
    await setDoc(doc(db, 'users', user.uid), {
      files, updatedAt: serverTimestamp()
    })
    toast.success('Project saved')
  }

  const shareCode = async () => {
    if (!user) return toast.error('Login to share')
    const docRef = await addDoc(collection(db, 'snippets'), {
      files, input, createdAt: serverTimestamp()
    })
    const url = `${window.location.origin}/editor?share=${docRef.id}`
    await navigator.clipboard.writeText(url)
    toast.success('Share link copied!')
  }

  const explainCode = async () => {
    if (!activeFile.content.trim()) return toast.error('Write some code first')
    setExplaining(true)
    setShowExplain(true)
    setExplanation('Thinking...')
    try {
      const res = await fetch('/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: activeFile.content, language: activeFile.language })
      })
      const data = await res.json()
      setExplanation(data.explanation || data.error || 'Could not explain')
    } catch {
      setExplanation('Error getting explanation')
    }
    setExplaining(false)
  }

  return (
    <div className="min-h-screen bg-[#0d1117] text-white p-4">
      <Toaster position="top-right" />
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-2xl font-bold">ASCET Editor</h1>
        <div className="flex gap-2">
          <button onClick={toggleSplit} className={`px-3 py-2 rounded ${splitFileId? 'bg-blue-600' : 'bg-gray-600'} hover:opacity-80`}>
            <FiColumns />
          </button>
          <button onClick={runCode} disabled={loading} className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50">
            {loading? 'Running...' : 'Run'}
          </button>
          <button onClick={explainCode} disabled={explaining} className="px-4 py-2 bg-purple-600 rounded hover:bg-purple-700 disabled:opacity-50">
            {explaining? 'Explaining...' : 'Explain'}
          </button>
          <button onClick={saveCode} className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-700">Save</button>
          <button onClick={shareCode} className="px-4 py-2 bg-green-600 rounded hover:bg-green-700">Share</button>
        </div>
      </div>

      <div className="flex items-center gap-1 mb-2 bg-[#161b22] p-1 rounded-t border border-gray-700">
        {files.map(file => (
          <div key={file.id} className={`flex items-center gap-2 px-3 py-1.5 rounded cursor-pointer ${
            activeFileId === file.id? 'bg-[#0d1117] text-white' : 'text-gray-400 hover:bg-[#0d1117]'
          }`} onClick={() => setActiveFileId(file.id)} onDoubleClick={() => setSplitFileId(file.id)}>
            <span className="text-sm">{file.name}</span>
            {files.length > 1 && (
              <FiX className="text-xs hover:text-red-400" onClick={(e) => { e.stopPropagation(); closeFile(file.id) }} />
            )}
          </div>
        ))}
        <button onClick={addFile} className="p-1.5 hover:bg-[#0d1117] rounded text-gray-400">
          <FiPlus />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[calc(100vh-140px)]">
        <div className={`flex gap-2 ${splitFileId? 'col-span-2' : 'col-span-1'}`}>
          <Editor
            height="100%"
            language={activeFile.language}
            value={activeFile.content}
            onChange={v => updateFile(activeFileId, v || '')}
            theme="vs-dark"
            options={{ fontSize: 14, minimap: { enabled: false }, scrollBeyondLastLine: false }}
            className={splitFileId? 'w-1/2' : 'w-full'}
          />
          {splitFileId && splitFile && (
            <Editor
              height="100%"
              language={splitFile.language}
              value={splitFile.content}
              onChange={v => updateFile(splitFileId, v || '')}
              theme="vs-dark"
              options={{ fontSize: 14, minimap: { enabled: false }, scrollBeyondLastLine: false }}
              className="w-1/2"
            />
          )}
        </div>
        <div className={`flex flex-col gap-4 ${splitFileId? 'col-span-2' : ''}`}>
          <div>
            <p className="text-sm mb-1 text-gray-400">Input (stdin):</p>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Input here..."
              className="w-full h-24 bg-[#161b22] p-3 rounded border border-gray-700 font-mono text-sm resize-none focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <p className="text-sm mb-1 text-gray-400">Output:</p>
            <pre className="w-full h-32 bg-black p-3 rounded border border-gray-700 overflow-auto text-green-400 font-mono text-sm">
              {output}
            </pre>
          </div>
          {showExplain && (
            <div className="flex-1 flex flex-col">
              <div className="flex justify-between items-center mb-1">
                <p className="text-sm text-purple-400">AI Explanation:</p>
                <button onClick={() => setShowExplain(false)} className="text-xs text-gray-500 hover:text-gray-300">✕</button>
              </div>
              <div className="w-full flex-1 bg-[#161b22] p-3 rounded border border-purple-700 overflow-auto text-gray-200 text-sm whitespace-pre-wrap">
                {explanation}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Page() {
  return (
    <Suspense fallback={<div className="bg-[#0d1117] text-white p-4">Loading Editor...</div>}>
      <EditorComponent />
    </Suspense>
  )
}