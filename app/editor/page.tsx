"use client"
import { useEffect, useState, Suspense } from 'react'
import Editor from '@monaco-editor/react'
import { auth, db } from '../../lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, setDoc, getDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore'
import toast, { Toaster } from 'react-hot-toast'
import { useRouter, useSearchParams } from 'next/navigation'
import { FiPlus, FiX, FiColumns, FiFolder, FiChevronDown, FiChevronRight, FiFolderPlus, FiFile } from 'react-icons/fi'

type FileItem = {
  id: string
  name: string
  type: 'file' | 'folder'
  path: string
  content?: string
  language?: string
}

function EditorComponent() {
  const [user, setUser] = useState<any>(null)
  const [items, setItems] = useState<FileItem[]>([
    { id: '1', name: 'main.py', type: 'file', path: '/', content: 'a = 10\nprint(a)', language: 'python' }
  ])
  const [activeFileId, setActiveFileId] = useState('1')
  const [splitFileId, setSplitFileId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [loading, setLoading] = useState(false)
  const [explaining, setExplaining] = useState(false)
  const [explanation, setExplanation] = useState('')
  const [showExplain, setShowExplain] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [lastSaved, setLastSaved] = useState('')
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['/']))
  const router = useRouter()
  const searchParams = useSearchParams()
  const shareId = searchParams.get('share')

  const activeFile = items.find(i => i.id === activeFileId && i.type === 'file')
  const splitFile = items.find(i => i.id === splitFileId && i.type === 'file')
  const files = items.filter(i => i.type === 'file')

  useEffect(() => {
    const loadCode = async () => {
      if (shareId) {
        const snap = await getDoc(doc(db, 'snippets', shareId))
        if (snap.exists()) {
          const data = snap.data()
          if (data.items) {
            setItems(data.items)
            const firstFile = data.items.find((i: FileItem) => i.type === 'file')
            if (firstFile) setActiveFileId(firstFile.id)
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
        if (snap.exists() && snap.data().items) setItems(snap.data().items)
      })
    }
    loadCode()
  }, [shareId, router])

  useEffect(() => {
    if (!user || shareId) return
    const timer = setTimeout(async () => {
      try {
        await setDoc(doc(db, 'users', user.uid), {
          items, updatedAt: serverTimestamp()
        })
        setLastSaved(new Date().toLocaleTimeString())
      } catch (e) {
        console.log('Auto-save failed')
      }
    }, 3000)
    return () => clearTimeout(timer)
  }, [items, user, shareId])

  const updateFile = (id: string, content: string) => {
    setItems(items.map(i => i.id === id? {...i, content } : i))
  }

  const addFile = (path: string = '/') => {
    const name = prompt('File name? (e.g. utils.py, main.js)')
    if (!name) return
    const ext = name.split('.').pop()
    const langMap: any = { py: 'python', js: 'javascript', java: 'java', cpp: 'cpp', c: 'cpp', ts: 'typescript', html: 'html', css: 'css' }
    const newFile: FileItem = {
      id: Date.now().toString(),
      name,
      type: 'file',
      path,
      content: '',
      language: langMap[ext || ''] || 'python'
    }
    setItems([...items, newFile])
    setActiveFileId(newFile.id)
    setExpanded(new Set([...expanded, path]))
  }

  const addFolder = (path: string = '/') => {
    const name = prompt('Folder name?')
    if (!name) return
    const newFolder: FileItem = {
      id: Date.now().toString(),
      name,
      type: 'folder',
      path
    }
    setItems([...items, newFolder])
    setExpanded(new Set([...expanded, path, `${path}${name}/`]))
  }

  const deleteItem = (id: string) => {
    const item = items.find(i => i.id === id)
    if (!item) return
    if (files.length === 1 && item.type === 'file') {
      return toast.error('Cannot delete last file')
    }
    if (!confirm(`Delete ${item.name}?`)) return
    
    const itemPath = item.type === 'folder'? `${item.path}${item.name}/` : ''
    setItems(items.filter(i => i.id!== id && (item.type!== 'folder' ||!i.path.startsWith(itemPath))))
    
    if (activeFileId === id) {
      const remainingFiles = files.filter(f => f.id!== id)
      if (remainingFiles[0]) setActiveFileId(remainingFiles[0].id)
    }
    if (splitFileId === id) setSplitFileId(null)
  }

  const toggleFolder = (path: string) => {
    const newExpanded = new Set(expanded)
    if (newExpanded.has(path)) newExpanded.delete(path)
    else newExpanded.add(path)
    setExpanded(newExpanded)
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
    if (!activeFile) return
    setLoading(true)
    setOutput('Running...')
    try {
      const res = await fetch('/api/run-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: activeFile.content, language: activeFile.language, stdin: input })
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
    await setDoc(doc(db, 'users', user.uid), { items, updatedAt: serverTimestamp() })
    setLastSaved(new Date().toLocaleTimeString())
    toast.success('Project saved')
  }

  const shareCode = async () => {
    if (!user) return toast.error('Login to share')
    const docRef = await addDoc(collection(db, 'snippets'), {
      items, input, createdAt: serverTimestamp()
    })
    const url = `${window.location.origin}/editor?share=${docRef.id}`
    await navigator.clipboard.writeText(url)
    toast.success('Share link copied!')
  }

  const explainCode = async () => {
    if (!activeFile?.content?.trim()) return toast.error('Write some code first')
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

  const getIcon = (name: string) => {
    const ext = name.split('.').pop()
    if (ext === 'py') return '🐍'
    if (ext === 'js') return '📜'
    if (ext === 'ts') return '📘'
    if (ext === 'java') return '☕'
    if (ext === 'cpp' || ext === 'c') return '⚙️'
    if (ext === 'html') return '🌐'
    if (ext === 'css') return '🎨'
    return '📄'
  }

  const renderItems = (currentPath: string, depth = 0) => {
    const children = items.filter(i => i.path === currentPath)
    return children.map(item => {
      const fullPath = `${item.path}${item.name}${item.type === 'folder'? '/' : ''}`
      return (
        <div key={item.id}>
          <div 
            className={`flex items-center gap-1 px-2 py-1 rounded cursor-pointer text-sm group ${
              item.type === 'file' && activeFileId === item.id? 'bg-[#0d1117] text-white' : 'text-gray-300 hover:bg-[#0d1117]'
            }`}
            style={{ paddingLeft: `${depth * 12 + 8}px` }}
            onClick={() => item.type === 'file'? setActiveFileId(item.id) : toggleFolder(fullPath)}
          >
            {item.type === 'folder' && (expanded.has(fullPath)? <FiChevronDown className="text-xs" /> : <FiChevronRight className="text-xs" />)}
            {item.type === 'folder'? <FiFolder className="text-blue-400 text-xs" /> : <span className="text-xs">{getIcon(item.name)}</span>}
            <span className="flex-1 truncate">{item.name}</span>
            <div className="opacity-0 group-hover:opacity-100 flex gap-1">
              {item.type === 'folder' && (
                <>
                  <FiFile className="text-xs hover:text-green-400" onClick={(e) => { e.stopPropagation(); addFile(fullPath) }} />
                  <FiFolderPlus className="text-xs hover:text-blue-400" onClick={(e) => { e.stopPropagation(); addFolder(fullPath) }} />
                </>
              )}
              <FiX className="text-xs hover:text-red-400" onClick={(e) => { e.stopPropagation(); deleteItem(item.id) }} />
            </div>
          </div>
          {item.type === 'folder' && expanded.has(fullPath) && renderItems(fullPath, depth + 1)}
        </div>
      )
    })
  }

  return (
    <div className="min-h-screen bg-[#0d1117] text-white flex">
      <Toaster position="top-right" />
      
      {sidebarOpen && (
        <div className="w-60 bg-[#161b22] border-r border-gray-700 flex flex-col">
          <div className="p-3 border-b border-gray-700 flex justify-between items-center">
            <span className="text-sm font-semibold">EXPLORER</span>
            <div className="flex gap-1">
              <button onClick={() => addFile('/')} className="p-1 hover:bg-gray-700 rounded" title="New File">
                <FiFile className="text-sm" />
              </button>
              <button onClick={() => addFolder('/')} className="p-1 hover:bg-gray-700 rounded" title="New Folder">
                <FiFolderPlus className="text-sm" />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-1">
            {renderItems('/')}
          </div>
          {lastSaved && <div className="p-2 border-t border-gray-700 text-xs text-gray-500">Saved {lastSaved}</div>}
        </div>
      )}

      <div className="flex-1 flex flex-col">
        <div className="flex justify-between items-center p-2 border-b border-gray-700 bg-[#161b22]">
          <div className="flex items-center gap-2">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-gray-700 rounded">
              <FiFolder />
            </button>
            <h1 className="text-lg font-bold">ASCET Editor</h1>
          </div>
          <div className="flex gap-2">
            <button onClick={toggleSplit} className={`px-3 py-1.5 rounded text-sm ${splitFileId? 'bg-blue-600' : 'bg-gray-600'} hover:opacity-80`}>
              <FiColumns />
            </button>
            <button onClick={runCode} disabled={loading} className="px-3 py-1.5 bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 text-sm">
              {loading? 'Running...' : 'Run'}
            </button>
            <button onClick={explainCode} disabled={explaining} className="px-3 py-1.5 bg-purple-600 rounded hover:bg-purple-700 disabled:opacity-50 text-sm">
              {explaining? '...' : 'Explain'}
            </button>
            <button onClick={saveCode} className="px-3 py-1.5 bg-gray-600 rounded hover:bg-gray-700 text-sm">Save</button>
            <button onClick={shareCode} className="px-3 py-1.5 bg-green-600 rounded hover:bg-green-700 text-sm">Share</button>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-[#161b22] p-1 border-b border-gray-700 overflow-x-auto">
          {files.map(file => (
            <div key={file.id} className={`flex items-center gap-2 px-3 py-1.5 rounded-t cursor-pointer text-sm ${
              activeFileId === file.id? 'bg-[#0d1117] text-white' : 'text-gray-400 hover:bg-[#0d1117]'
            }`} onClick={() => setActiveFileId(file.id)} onDoubleClick={() => setSplitFileId(file.id)}>
              <span>{getIcon(file.name)}</span>
              <span>{file.name}</span>
              {files.length > 1 && <FiX className="text-xs hover:text-red-400" onClick={(e) => { e.stopPropagation(); deleteItem(file.id) }} />}
            </div>
          ))}
        </div>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-0">
          <div className={`flex gap-0.5 ${splitFileId? 'col-span-2' : 'col-span-1'}`}>
            {activeFile && (
              <Editor
                height="100%"
                language={activeFile.language}
                value={activeFile.content}
                onChange={v => updateFile(activeFileId, v || '')}
                theme="vs-dark"
                options={{ fontSize: 14, minimap: { enabled: false }, scrollBeyondLastLine: false }}
                className={splitFileId? 'w-1/2' : 'w-full'}
              />
            )}
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
          <div className={`flex flex-col gap-2 p-2 bg-[#0d1117] ${splitFileId? 'col-span-2' : ''}`}>
            <div>
              <p className="text-xs mb-1 text-gray-400">Input (stdin):</p>
              <textarea value={input} onChange={e => setInput(e.target.value)} placeholder="Input here..." className="w-full h-20 bg-[#161b22] p-2 rounded border border-gray-700 font-mono text-xs resize-none focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <p className="text-xs mb-1 text-gray-400">Output:</p>
              <pre className="w-full h-28 bg-black p-2 rounded border border-gray-700 overflow-auto text-green-400 font-mono text-xs">{output}</pre>
            </div>
            {showExplain && (
              <div className="flex-1 flex flex-col">
                <div className="flex justify-between items-center mb-1">
                  <p className="text-xs text-purple-400">AI Explanation:</p>
                  <button onClick={() => setShowExplain(false)} className="text-xs text-gray-500 hover:text-gray-300">✕</button>
                </div>
                <div className="w-full flex-1 bg-[#161b22] p-2 rounded border border-purple-700 overflow-auto text-gray-200 text-xs whitespace-pre-wrap">{explanation}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Page(){
  return (
    <Suspense fallback={<div className="bg-[#0d1117] text-white p-4">Loading Editor...</div>}>
      <EditorComponent />
    </Suspense>
  )
}