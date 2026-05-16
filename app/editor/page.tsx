'use client'

import { useState, useEffect, useRef } from 'react'
import Editor from '@monaco-editor/react'
import { 
  Files, FolderOpen, FilePlus, FolderPlus, 
  Play, X, ChevronRight, ChevronDown 
} from 'lucide-react'

type FileItem = {
  id: string
  name: string
  type: 'file' | 'folder'
  path: string
  content?: string
  language?: string
  children?: FileItem[]
}

export default function EditorPage() {
  const [items, setItems] = useState<FileItem[]>([
    {
      id: '1',
      name: 'main.py',
      type: 'file',
      path: '/',
      content: '# Welcome to Code Editor\nprint("Hello, World!")',
      language: 'python'
    }
  ])
  const [activeFileId, setActiveFileId] = useState('1')
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['/']))
  const [output, setOutput] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const activeFile = items.find(item => item.id === activeFileId && item.type === 'file')

  const toggleFolder = (path: string) => {
    const newExpanded = new Set(expanded)
    if (newExpanded.has(path)) {
      newExpanded.delete(path)
    } else {
      newExpanded.add(path)
    }
    setExpanded(newExpanded)
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
      path,
      children: []
    }
    setItems([...items, newFolder])
    setExpanded(new Set([...expanded, path]))
  }

  const deleteItem = (id: string) => {
    setItems(items.filter(item => item.id !== id))
    if (activeFileId === id) {
      const firstFile = items.find(item => item.type === 'file' && item.id !== id)
      setActiveFileId(firstFile?.id || '')
    }
  }

  const updateFileContent = (content: string) => {
    setItems(items.map(item => 
      item.id === activeFileId ? { ...item, content } : item
    ))
  }

  const runCode = async () => {
    if (!activeFile) return
    setOutput('Running...')
    // Add your Piston API logic here
    setTimeout(() => {
      setOutput('Hello, World!\n')
    }, 500)
  }

  const getFileTree = (parentPath: string = '/'): FileItem[] => {
    return items.filter(item => item.path === parentPath)
  }

  const renderTree = (parentPath: string = '/', level: number = 0) => {
    const treeItems = getFileTree(parentPath)
    return treeItems.map(item => {
      const itemPath = parentPath === '/' ? `/${item.name}` : `${parentPath}/${item.name}`
      const isExpanded = expanded.has(itemPath)
      
      if (item.type === 'folder') {
        return (
          <div key={item.id}>
            <div 
              className="flex items-center gap-1 px-2 py-1 hover:bg-gray-800 cursor-pointer group"
              style={{ paddingLeft: `${level * 12 + 8}px` }}
              onClick={() => toggleFolder(itemPath)}
            >
              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              {isExpanded ? <FolderOpen size={16} className="text-blue-400" /> : <Folder size={16} className="text-blue-400" />}
              <span className="text-sm text-gray-300 flex-1">{item.name}</span>
              <button 
                onClick={(e) => { e.stopPropagation(); addFile(itemPath) }}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-700 rounded"
              >
                <FilePlus size={14} />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); addFolder(itemPath) }}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-700 rounded"
              >
                <FolderPlus size={14} />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); deleteItem(item.id) }}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-700 rounded text-red-400"
              >
                <X size={14} />
              </button>
            </div>
            {isExpanded && renderTree(itemPath, level + 1)}
          </div>
        )
      }
      
      return (
        <div 
          key={item.id}
          className={`flex items-center gap-2 px-2 py-1 hover:bg-gray-800 cursor-pointer group ${
            activeFileId === item.id ? 'bg-gray-800 border-l-2 border-blue-500' : ''
          }`}
          style={{ paddingLeft: `${level * 12 + 24}px` }}
          onClick={() => setActiveFileId(item.id)}
        >
          <Files size={16} className="text-gray-400" />
          <span className="text-sm text-gray-300 flex-1">{item.name}</span>
          <button 
            onClick={(e) => { e.stopPropagation(); deleteItem(item.id) }}
            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-700 rounded text-red-400"
          >
            <X size={14} />
          </button>
        </div>
      )
    })
  }

  return (
    <div className="h-screen flex flex-col bg-[#1e1e1e] text-gray-300">
      <div className="h-12 bg-[#2d2d2d] border-b border-gray-800 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-gray-700 rounded">
            <Files size={18} />
          </button>
          <span className="font-semibold">Code Editor</span>
        </div>
        <button 
          onClick={runCode}
          className="flex items-center gap-2 px-4 py-1.5 bg-green-600 hover:bg-green-700 rounded text-white text-sm"
        >
          <Play size={16} /> Run
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {sidebarOpen && (
          <div className="w-64 bg-[#252526] border-r border-gray-800 flex flex-col">
            <div className="p-2 border-b border-gray-800 flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-400 uppercase">Explorer</span>
              <div className="flex gap-1">
                <button onClick={() => addFile()} className="p-1 hover:bg-gray-700 rounded">
                  <FilePlus size={16} />
                </button>
                <button onClick={() => addFolder()} className="p-1 hover:bg-gray-700 rounded">
                  <FolderPlus size={16} />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {renderTree()}
            </div>
          </div>
        )}

        <div className="flex-1 flex flex-col">
          {activeFile ? (
            <>
              <div className="h-9 bg-[#2d2d2d] border-b border-gray-800 flex items-center px-4">
                <span className="text-sm">{activeFile.name}</span>
              </div>
              <div className="flex-1">
                <Editor
                  height="100%"
                  language={activeFile.language}
                  value={activeFile.content}
                  onChange={(value) => updateFileContent(value || '')}
                  theme="vs-dark"
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                  }}
                />
              </div>
              <div className="h-48 bg-[#1e1e1e] border-t border-gray-800">
                <div className="h-8 bg-[#2d2d2d] border-b border-gray-800 flex items-center px-4">
                  <span className="text-xs font-semibold text-gray-400 uppercase">Output</span>
                </div>
                <pre className="p-4 text-sm font-mono overflow-y-auto h-[calc(100%-32px)]">
                  {output || 'Click Run to execute code'}
                </pre>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              Select a file or create a new one
            </div>
          )}
        </div>
      </div>
    </div>
  )
}