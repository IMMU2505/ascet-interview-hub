'use client'
import { useState, useEffect } from 'react'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth } from '@/lib/firebase'
import { useRouter } from 'next/navigation'
import Editor from '@monaco-editor/react'
import { Files, FolderOpen, Folder, FilePlus, FolderPlus, Play, X, ChevronRight, ChevronDown } from 'lucide-react'
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
  js: 'javascript',
  jsx: 'javascript',
  ts: 'typescript',
  tsx: 'typescript',
  py: 'python',
  html: 'html',
  css: 'css',
  json: 'json',
  md: 'markdown'
}

export default function EditorPage() {
  const [user, loading] = useAuthState(auth)
  const router = useRouter()
  const [items, setItems] = useState<FileItem[]>([])
  const [activeFileId, setActiveFileId] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['/']))
  const [output, setOutput] = useState('')

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
        content: 'print("Hello from ASCET Interview Hub")'
      }
      setItems([defaultFile])
      setActiveFileId('1')
    }
  }, [])

  useEffect(() => {
    if (items.length > 0) {
      localStorage.setItem('editor-files', JSON.stringify(items))
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
  }

  const deleteItem = (id: string) => {
    setItems(items.filter(i => i.id!== id))
    if (activeFileId === id) setActiveFileId(items[0]?.id || null)
  }

  const updateFileContent = (id: string, content: string) => {
    setItems(items.map(i => i.id === id? {...i, content } : i))
  }

  const runCode = () => {
    const file = items.find(i => i.id === activeFileId)
    if (!file) return
    setOutput('Running...\n')
    setTimeout(() => {
      if (file.name.endsWith('.py')) {
        setOutput(`> python ${file.name}\n${file.content}\n\n[Simulated Output]\nHello from ASCET Interview Hub`)
      } else if (file.name.endsWith('.js')) {
        setOutput(`> node ${file.name}\n[Simulated Output]\nCode executed`)
      } else {
        setOutput('Language not supported yet')
      }
    }, 500)
  }

  const toggleFolder = (path: string) => {
    const newExpanded = new Set(expanded)
    if (newExpanded.has(path)) {
      newExpanded.delete(path)
    } else {
      newExpanded.add(path)
    }
    setExpanded(newExpanded)
  }

  const renderTree = (path: string = '/') => {
    const filtered = items.filter(i => {
      const parent = i.path.substring(0, i.path.lastIndexOf('/')) || '/'
      return parent === path
    })

    return filtered.map(item => (
      <div key={item.id}>
        <div 
          className={`flex items-center gap-1 px-2 py-1 hover:bg-gray-700 cursor-pointer ${activeFileId === item.id? 'bg-blue-600' : ''}`}
          onClick={() => item.type === 'file'? setActiveFileId(item.id) : toggleFolder(item.path)}
        >
          {item.type === 'folder' && (
            expanded.has(item.path)? <ChevronDown size={14} /> : <ChevronRight size={14} />
          )}
          {item.type === 'folder'? <Folder size={14} /> : <Files size={14} />}
          <span className="text-sm flex-1">{item.name}</span>
          <button 
            onClick={(e) => { e.stopPropagation(); deleteItem(item.id) }}
            className="opacity-0 group-hover:opacity-100 hover:text-red-400"
          >
            <X size={12} />
          </button>
        </div>
        {item.type === 'folder' && expanded.has(item.path) && (
          <div className="ml-4">
            {renderTree(item.path)}
          </div>
        )}
      </div>
    ))
  }

  const activeFile = items.find(i => i.id === activeFileId)
  const ext = activeFile?.name.split('.').pop() || ''

  if (loading) return <div className="flex items-center justify-center h-screen bg-gray-900 text-white">Loading...</div>

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Sidebar */}
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
        <div className="flex-1 overflow-auto p-2">
          {renderTree()}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 flex flex-col">
        <div className="h-10 bg-gray-800 border-b border-gray-700 flex items-center px-4 justify-between">
          <span>{activeFile?.name || 'No file open'}</span>
          <button 
            onClick={runCode} 
            disabled={!activeFile}
            className="flex items-center gap-1 px-3 py-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded text-sm"
          >
            <Play size={14} /> Run
          </button>
        </div>
        
        <div className="flex-1">
          {activeFile? (
            <Editor
              height="100%"
              theme="vs-dark"
              language={langMap[ext || ''] || 'python'}
              value={activeFile.content || ''}
              onChange={(v) => updateFileContent(activeFile.id, v || '')}
              options={{
                fontSize: 14,
                minimap: { enabled: false },
                automaticLayout: true
              }}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <FolderOpen size={48} className="mb-2" />
              <p>Select a file to start editing</p>
            </div>
          )}
        </div>

        {/* Output */}
        <div className="h-40 bg-gray-800 border-t border-gray-700">
          <div className="h-8 bg-gray-900 border-b border-gray-700 px-4 flex items-center text-sm">
            TERMINAL
          </div>
          <div className="p-3 font-mono text-sm overflow-auto h-32">
            <pre>{output || 'Click Run to execute code'}</pre>
          </div>
        </div>
      </div>
    </div>
  )
}