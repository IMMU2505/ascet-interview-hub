"use client"
import { useEffect, useState, Suspense } from 'react'
import Editor from '@monaco-editor/react'
import { auth, db } from '../../lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, setDoc, getDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore'
import toast, { Toaster } from 'react-hot-toast'
import { useRouter, useSearchParams } from 'next/navigation'
import { FiPlus, FiX, FiColumns, FiFile, FiFolder, FiChevronDown, FiChevronRight, FiFolderPlus } from 'react-icons/fi'

type FileNode = {
  id: string
  name: string
  type: 'file' | 'folder'
  content?: string
  language?: string
  children?: FileNode[]
  parentId?: string | null
}

function EditorComponent() {
  const [user, setUser] = useState<any>(null)
  const [tree, setTree] = useState<FileNode[]>([
    { 
      id: 'root', 
      name: 'ASCET-PROJECT', 
      type: 'folder', 
      children: [
        { id: '1', name: 'main.py', type: 'file', content: 'a = 10\nprint(a)', language: 'python', parentId: 'root' }
      ]
    }
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
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['root']))
  const router = useRouter()
  const searchParams = useSearchParams()
  const shareId = searchParams.get('share')

  const findFile = (nodes: FileNode[], id: string): FileNode | null => {
    for (const node of nodes) {
      if (node.id === id) return node
      if (node.children) {
        const found = findFile(node.children, id)
        if (found) return found
      }
    }
    return null
  }

  const getAllFiles = (nodes: FileNode[]): FileNode[] => {
    let files: FileNode[] = []
    for (const node of nodes) {
      if (node.type === 'file') files.push(node)
      if (node.children) files = [...files,...getAllFiles(node.children)]
    }
    return files
  }

  const activeFile = findFile(tree, activeFileId)
  const splitFile = splitFileId? findFile(tree, splitFileId) : null
  const allFiles = getAllFiles(tree)

  useEffect(() => {
    const loadCode = async () => {
      if (shareId) {
        const snap = await getDoc(doc(db, 'snippets', shareId))
        if (snap.exists()) {
          const data = snap.data()
          if (data.tree) {
            setTree(data.tree)
            const firstFile = getAllFiles(data.tree)[0]
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
        if (snap.exists()) {
          const data = snap.data()
          if (data.tree) setTree(data.tree)
        }
      })
    }
    loadCode()
  }, [shareId, router])

  useEffect(() => {
    if (!user || shareId) return
    const timer = setTimeout(async () => {
      try {
        await setDoc(doc(db, 'users', user.uid), {
          tree, updatedAt: serverTimestamp()
        })
        setLastSaved(new Date().toLocaleTimeString())
      } catch (e) {
        console.log('Auto-save failed')
      }
    }, 3000)
    return () => clearTimeout(timer)
  }, [tree, user, shareId])

  const updateFileContent = (id: string, content: string) => {
    const updateNode = (nodes: FileNode[]): FileNode[] => {
      return nodes.map(node => {
        if (node.id === id) return {...node, content }
        if (node.children) return {...node, children: updateNode(node.children) }
        return node
      })
    }
    setTree(updateNode(tree))
  }

  const addFile = (parentId: string = 'root') => {
    const name = prompt('File name? (e.g. utils.py, main.js)')
    if (!name) return
    const ext = name.split('.').pop()
    const langMap: any = { py: 'python', js: 'javascript', java: 'java', cpp: 'cpp', c: 'cpp', ts: 'typescript', html: 'html', css: 'css' }
    const newFile: FileNode = {
      id: Date.now().toString(),
      name,
      type: 'file',
      content: '',
      language: langMap[ext || ''] || 'python',
      parentId
    }
    
    const addToTree = (nodes: FileNode[]): FileNode[] => {
      return nodes.map(node => {
        if (node.id === parentId) {
          return {...node, children: [...(node.children || []), newFile] }
        }
        if (node.children) return {...node, children: addToTree(node.children) }
        return node
      })
    }
    setTree(addToTree(tree))
    setActiveFileId(newFile.id)
    setExpanded(new Set([...expanded, parentId]))
  }

  const addFolder = (parentId: string = 'root') => {
    const name = prompt('Folder name?')
    if (!name) return
    const newFolder: FileNode = {
      id: Date.now().toString(),
      name,
      type: 'folder',
      children: [],
      parentId
    }
    
    const addToTree = (nodes: FileNode[]): FileNode[] => {
      return nodes.map(node => {
        if (node.id === parentId) {
          return {...node, children: [...(node.children || []), newFolder] }
        }
        if (node.children) return {...node, children: addToTree(node.children) }
        return node
      })
    }
    setTree(addToTree(tree))
    setExpanded(new Set([...expanded, parentId, newFolder.id]))
  }

  const deleteNode = (id: string) => {
    if (allFiles.length === 1 && findFile(tree, id)?.type === 'file') {
      return toast.error('Cannot delete last file')
    }
    if (!confirm('Delete this?')) return
    
    const removeFromTree = (nodes: FileNode[]): FileNode[] => {
      return nodes.filter(node => {
        if (node.id === id) return false
        if (node.children) node.children = removeFromTree(node.children)
        return true
      })
    }
    setTree(removeFromTree(tree))
    if (activeFileId === id) {
      const firstFile = getAllFiles(tree.filter(n => n.id!== id))[0]
      if (firstFile) setActiveFileId(firstFile.id)
    }
    if (splitFileId === id) setSplitFileId(null)
  }

  const toggleFolder = (id: string) => {
    const newExpanded = new Set(expanded)
    if (newExpanded.has(id)) newExpanded.delete(id)
    else newExpanded.add(id)
    setExpanded(newExpanded)
  }

  const toggleSplit = () => {
    if (splitFileId) {
      setSplitFileId(null)
    } else {
      const otherFile = allFiles.find(f => f.id!== activeFileId)
      if (otherFile) setSplitFileId(otherFile.id)
      else toast.error('Add another file first')
    }
  }

  const runCode = async () => {
    if (!activeFile || activeFile.type!== 'file') return
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
      tree, updatedAt: serverTimestamp()
    })
    setLastSaved(new Date().toLocaleTimeString())
    toast.success('Project saved')
  }

  const shareCode = async () => {
    if (!user) return toast.error('Login to share')
    const docRef = await addDoc(collection(db, 'snippets'), {
      tree, input, createdAt: serverTimestamp()
    })
    const url = `${window.location.origin}/editor?share=${docRef.id}`
    await navigator.clipboard.writeText(url)
    toast.success('Share link copied!')
  }

  const explainCode = async () => {
    if (!activeFile ||!activeFile.content?.trim()) return toast.error('Write some code first')
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

  const getFileIcon = (name: string) => {
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

  const renderTree = (nodes: FileNode[], depth = 0) => {
    return nodes.map(node => (
      <div key={node.id}>
        <div 
          className={`flex items-center gap-1 px-2 py-1 rounded cursor-pointer text-sm group ${
            node.type === 'file' && activeFileId === node.id? 'bg-[#0d1117] text-white' : 'text-gray-300 hover:bg-[#0d1117]'
          }`}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          onClick={() => node.type === 'file'? setActiveFileId(node.id) : toggleFolder(node.id)}
        >
          {node.type === 'folder' && (
            expanded.has(node.id)? <FiChevronDown className="text-xs" /> : <FiChevronRight className="text-xs" />
          )}
          {node.type === 'folder'? <FiFolder className="text-blue-400 text-xs" /> : <span className="text-xs">{getFileIcon(node.name)}</span>}
          <span className="flex-1 truncate">{node.name}</span>
          <div className="opacity-0 group-hover:opacity-100 flex gap-1">
            {node.type === 'folder' && (
              <>
                <FiFile className="text-xs hover:text-green-400" onClick={(e) => { e.stopPropagation(); addFile(node.id) }} />
                <FiFolderPlus className="text-xs hover:text-blue-400" onClick={(e) => { e.stopPropagation(); addFolder(node.id) }} />
              </>
            )}
            {node.id!== 'root' && (
              <FiX className="text-xs hover:text-red-400" onClick={(e) => { e.stopPropagation(); deleteNode(node.id) }} />
            )}
          </div>
        </div>
        {node.type === 'folder' && expanded.has(node.id) && node.children && renderTree(node.children, depth + 1)}
      </div>
    ))
  }

  return (
    <div className="min-h-screen bg-[#0d1117] text-white flex">
      <Toaster position="top-right" />
      
      {sidebarOpen && (
        <div className="w-60 bg-[#161b22] border-r border-gray-700 flex flex-col">
          <div className="p-3 border-b border-gray-700 flex justify-between items-center">
            <span className="text-sm font-semibold">EXPLORER</span>
            <div className="flex gap-1">
              <button onClick={() => addFile()} className="p-1 hover:bg-gray-700 rounded" title="New File">
                <FiFile className="text-sm" />
              </button>
              <button onClick={() => addFolder()} className="p-1 hover:bg-gray-700 rounded" title="New Folder">
                <FiFolderPlus className="text-sm" />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-1">
            {renderTree(tree)}
          </div>
          {lastSaved && (
            <div className="p-2 border-t border-gray-700 text-xs text-gray-500">
              Saved {lastSaved}
            </div>
          )}
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
          {allFiles.map(file => (
            <div key={file.id} className={`flex items-center gap-2 px-3 py-1.5 rounded-t cursor-pointer text-sm ${
              activeFileId === file.id? 'bg-[#0d1117] text-white' : 'text-gray-400 hover:bg-[#0d1117]'
            }`} onClick={() => setActiveFileId(file.id)} onDoubleClick={() => setSplitFileId(file.id)}>
              <span>{getFileIcon(file.name)}</span>
              <span>{file.name}</span>
              {allFiles.length > 1 && (
                <FiX className="text-xs hover:text-red-400" onClick={(e) => { e.stopPropagation(); deleteNode(file.id) }} />
              )}
            </div>
          ))}
        </div>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-0">
          <div className={`flex gap-0.5 ${splitFileId? 'col-span-2' : 'col-span-1'}`}>
            {activeFile && activeFile.type === 'file' && (
              <Editor
                height="100%"
                language={activeFile.language}
                value={activeFile.content}
                onChange={v => updateFileContent(activeFileId, v || '')}
                theme="vs-dark"
                options={{ fontSize: 14, minimap: { enabled: false }, scrollBeyondLastLine: false }}
                className={splitFileId? 'w-1/2' : 'w-full'}
              />
            )}
            {splitFileId && splitFile && splitFile.type === 'file' && (
              <Editor
                height="100%"
                language={splitFile.language}
                value={splitFile.content}
                onChange={v => updateFileContent(splitFileId, v || '')}
                theme="vs-dark"
                options={{ fontSize: 14, minimap: { enabled: false }, scrollBeyondLastLine: false }}
                className="w-1/2"
              />
            )}
          </div>
          <div className={`flex flex-col gap-2 p-2 bg-[#0d1117] ${splitFileId? 'col-span-2' : ''}`}>
            <div>
              <p className="text-xs mb-1 text-gray-400">Input (stdin):</p>
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Input here..."
                className="w-full h-20 bg-[#161b22] p-2 rounded border border-gray-700 font-mono text-xs resize-none focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <p className="text-xs mb-1 text-gray-400">Output:</p>
              <pre className="w-full h-28 bg-black p-2 rounded border border-gray-700 overflow-auto text-green-400 font-mono text-xs">
                {output}
              </pre>
            </div>
            {showExplain && (
              <div className="flex-1 flex flex-col">
                <div className="flex justify-between items-center mb-1">
                  <p className="text-xs text-purple-400">AI Explanation:</p>
                  <button onClick={() => setShowExplain(false)} className="text-xs text-gray-500 hover:text-gray-300">✕</button>
                </div>
                <div className="w-full flex-1 bg-[#161b22] p-2 rounded border border-purple-700 overflow-auto text-gray-200 text-xs whitespace-pre-wrap">
                  {explanation}
                </div>
              </div>
            )}
          </div>
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