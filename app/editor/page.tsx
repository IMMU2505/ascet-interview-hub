'use client'
import { useState, useEffect } from 'react'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth } from '@/lib/firebase'
import { useRouter } from 'next/navigation'
import Editor from '@monaco-editor/react'
import { Files, FolderOpen, Folder, FilePlus, FolderPlus, Play, X, ChevronRight, ChevronDown, Download, Edit3, Save, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'

interface FileItem {
  id: string
  name: string
  type: 'file' | 'folder'
  path: string
  content?: string
  children?: FileItem[]
}

const langMap: { [key: string]: string } = {
  js: 'javascript', jsx: 'javascript', ts: 'typescript', tsx: 'typescript',
  py: 'python', html: 'html', css: 'css', json: 'json', md: 'markdown', cpp: 'cpp', c: 'c'
}

export default function EditorPage() {
  const [user, loading] = useAuthState(auth)
  const router = useRouter()
  const [items, setItems] = useState<FileItem[]>([])
  const [activeFileId, setActiveFileId] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['/']))
  const [output, setOutput] = useState('')
  const [stdin, setStdin] = useState('')
  const [aiExplanation, setAiExplanation] = useState('')
  const [saved, setSaved] = useState(true)
  const [running, setRunning] = useState(false)
  const [explaining, setExplaining] = useState(false)

  useEffect(() => {
    if (!loading &&!user) router.push('/login')
  }, [user, loading, router])

  useEffect(() => {
    const saved = localStorage.getItem('editor-files')
    if (saved) {
      const parsed = JSON.parse(saved)
      setItems(parsed)
      if (parsed.length > 0) setActiveFileId(parsed[0].id)
    } else {
      const defaultFile = {
        id: '1',
        name: 'main.py',
        type: 'file' as const,
        path: '/main.py',
        content: 'name = input()\nprint(f"Hello {name}")'
      }
      setItems([defaultFile])
      setActiveFileId('1')
    }
  }, [])

  useEffect(() => {
    if (items.length > 0) {
      localStorage.setItem('editor-files', JSON.stringify(items))
      setSaved(true)
    }
  }, [items])

  const addFile = (path: string = '/') => {
    const name = prompt('File name:')
    if (!name) return
    const newFile: FileItem = {
      id: Date.now().toString(),
      name,
      type: 'file',
      path: `${path}${name}`,
      content: ''
    }
    setItems([...items, newFile])
    setActiveFileId(newFile.id)
    setExpanded(new Set(Array.from(expanded).concat(path)))
    toast.success('File created')
  }

  const addFolder = (path: string = '/') => {
    const name = prompt('Folder name:')
    if (!name) return
    const newFolder: FileItem = {
      id: Date.now().toString(),
      name,
      type: 'folder',
      path: `${path}${name}`,
      children: []
    }
    setItems([...items, newFolder])
    setExpanded(new Set(Array.from(expanded).concat(path)))
    toast.success('Folder created')
  }

  const deleteItem = (id: string) => {
    if (!confirm('Delete this item?')) return
    setItems(items.filter(i => i.id!== id))
    if (activeFileId === id) setActiveFileId(items[0]?.id || null)
    toast.success('Deleted')
  }

  const renameItem = (id: string) => {
    const item = items.find(i => i.id === id)
    if (!item) return
    const name = prompt('New name:', item.name)
    if (!name || name === item.name) return
    setItems(items.map(i => i.id === id? {...i, name, path: i.path.replace(item.name, name) } : i))
    toast.success('Renamed')
  }

  const downloadFile = (id: string) => {
    const file = items.find(i => i.id === id)
    if (!file || file.type!== 'file') return
    const blob = new Blob([file.content || ''], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = file.name
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Downloaded')
  }

  const updateFileContent = (id: string, content: string) => {
    setSaved(false)
    setItems(items.map(i => i.id === id? {...i, content } : i))
  }

  const runCode = async () => {
    const file = items.find(i => i.id === activeFileId)
    if (!file) return
    setRunning(true)
    setOutput('Running...')
    try {
      const res = await fetch('/api/run-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: file.content,
          language: file.name.split('.').pop(),
          stdin
        })
      })
      const data = await res.json()
      if (data.error) {
        setOutput(`Error: ${data.error}`)
      } else {
        setOutput(data.output || 'No output')
      }
    } catch {
      setOutput('Error: Could not connect to /api/run-code')
    } finally {
      setRunning(false)
    }
  }

  const explainCode = async () => {
    const file = items.find(i => i.id === activeFileId)
    if (!file ||!file.content) {
      toast.error('No code to explain')
      return
    }

    setExplaining(true)
    setAiExplanation('AI is analyzing your code...')

    const language = file.name.split('.').pop() || 'python'

    try {
      const res = await fetch('/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: file.content, language })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setAiExplanation(data.explanation)
    } catch (err) {
      setAiExplanation('Error: Could not get AI explanation. Check GROQ_API_KEY in Vercel.')
      toast.error('AI explain failed')
    } finally {
      setExplaining(false)
    }
  }

  const toggleFolder = (path: string) => {
    const newExpanded = new Set(expanded)
    if (newExpanded.has(path)) newExpanded.delete(path)
    else newExpanded.add(path)
    setExpanded(newExpanded)
  }

  const renderTree = (path: string = '/') => {
    const filtered = items.filter(i => {
      const parent = i.path.substring(0, i.path.lastIndexOf('/')) || '/'
      return parent === path
    })

    return filtered.map(item => (
      <div key={item.id} className="group">
        <div
          className={`flex items-center gap-1 px-2 py-1 hover:bg-gray-700 cursor-pointer ${activeFileId === item.id? 'bg-blue-600' : ''}`}
          onClick={() => item.type === 'file'? setActiveFileId(item.id) : toggleFolder(item.path)}
        >
          {item.type === 'folder' && (expanded.has(item.path)? <ChevronDown size={14} /> : <ChevronRight size={14} />)}
          {item.type === 'folder'? <Folder size={14} /> : <Files size={14} />}
          <span className="text-sm flex-1 truncate">{item.name}</span>
          <div className="hidden group-hover:flex gap-1">
            {item.type === 'file' && (
              <button onClick={(e) => { e.stopPropagation(); downloadFile(item.id) }} className="hover:text-green-400" title="Download">
                <Download size={12} />
              </button>
            )}
            <button onClick={(e) => { e.stopPropagation(); renameItem(item.id) }} className="hover:text-yellow-400" title="Rename">
              <Edit3 size={12} />
            </button>
            <button onClick={(e) => { e.stopPropagation(); deleteItem(item.id) }} className="hover:text-red-400" title="Delete">
              <X size={12} />
            </button>
          </div>
        </div>
        {item.type === 'folder' && expanded.has(item.path) && (
          <div className="ml-4">{renderTree(item.path)}</div>
        )}
      </div>
    ))
  }

  const activeFile = items.find(i => i.id === activeFileId)
  const ext = activeFile?.name.split('.').pop() || ''

  if (loading) return <div className="flex items-center justify-center h-screen bg-gray-900 text-white">Loading...</div>

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
        <div className="p-3 border-b border-gray-700 flex items-center justify-between">
          <span className="font-bold">EXPLORER</span>
          <div className="flex gap-1">
            <button onClick={() => addFile()} className="p-1 hover:bg-gray-700 rounded" title="New File">
              <FilePlus size={16} />
            </button>
            <button onClick={() => addFolder()} className="p-1 hover:bg-gray-700 rounded" title="New Folder">
              <FolderPlus size={16} />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-2">{renderTree()}</div>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="h-10 bg-gray-800 border-b border-gray-700 flex items-center px-4 justify-between">
          <div className="flex items-center gap-2">
            <span>{activeFile?.name || 'No file open'}</span>
            {activeFile &&!saved && <Save size={14} className="text-yellow-400" />}
          </div>
          <div className="flex gap-2">
            <button
              onClick={explainCode}
              disabled={!activeFile || explaining}
              className="flex items-center gap-1 px-3 py-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 rounded text-sm"
            >
              <Sparkles size={14} /> {explaining? 'Explaining...' : 'AI Explain'}
            </button>
            <button
              onClick={runCode}
              disabled={!activeFile || running}
              className="flex items-center gap-1 px-3 py-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded text-sm"
            >
              <Play size={14} /> {running? 'Running...' : 'Run'}
            </button>
          </div>
        </div>

        <div className="flex-1">
          {activeFile? (
            <Editor
              height="100%"
              theme="vs-dark"
              language={langMap[ext || ''] || 'python'}
              value={activeFile.content || ''}
              onChange={(v) => updateFileContent(activeFile.id, v || '')}
              options={{ fontSize: 14, minimap: { enabled: false }, automaticLayout: true }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <FolderOpen size={48} className="mb-2" />
              <p>Select a file to start editing</p>
            </div>
          )}
        </div>

        <div className="h-80 bg-gray-800 border-t border-gray-700 flex flex-col">
          <div className="flex h-28">
            <div className="flex-1 border-r border-gray-700">
              <div className="h-8 bg-gray-900 border-b border-gray-700 px-4 flex items-center text-sm font-bold">
                Input (stdin):
              </div>
              <textarea
                value={stdin}
                onChange={(e) => setStdin(e.target.value)}
                placeholder="Input here..."
                className="w-full h-20 bg-gray-800 p-2 text-sm outline-none resize-none"
              />
            </div>
            <div className="flex-1">
              <div className="h-8 bg-gray-900 border-b border-gray-700 px-4 flex items-center text-sm font-bold">
                Output:
              </div>
              <div className="p-2 font-mono text-sm overflow-auto h-20">
                <pre>{output || 'Click Run to execute code'}</pre>
              </div>
            </div>
          </div>

          <div className="flex-1 border-t border-gray-700">
            <div className="h-8 bg-gray-900 border-b border-gray-700 px-4 flex items-center text-sm text-purple-400 font-bold">
              AI Explanation:
            </div>
            <div className="p-3 text-sm overflow-auto h-36">
              <pre className="whitespace-pre-wrap">{aiExplanation || 'Click AI Explain to analyze your code'}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}