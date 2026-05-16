'use client'
import { useState, useEffect } from 'react'
import Editor from '@monaco-editor/react'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth } from '@/lib/firebase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function EditorPage() {
  const [user, loading] = useAuthState(auth)
  const router = useRouter()
  
  const [code, setCode] = useState(`public class Main {
    public static void main(String[] args) {
        System.out.println("Hello from ASCET Hub!");
    }
}`)
  const [language, setLanguage] = useState('java')
  const [output, setOutput] = useState('Click Run Code to see output')
  const [isRunning, setIsRunning] = useState(false)

  useEffect(() => {
    if (!loading && !user) router.push('/')
  }, [user, loading, router])

  const runCode = async () => {
    setIsRunning(true)
    setOutput('Running...')
    
    const res = await fetch('/api/run-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language, code })
    })
    
    const data = await res.json()
    setOutput(data.error || data.output || 'No output')
    setIsRunning(false)
  }

  if (loading) return <div className="p-4">Loading...</div>
  if (!user) return null

  return (
    <div className="p-4 bg-gray-950 min-h-screen text-white">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">ASCET Code Runner</h1>
        <Link href="/dashboard" className="text-blue-400">Dashboard</Link>
      </div>
      
      <div className="flex gap-2 mb-2">
        <select 
          value={language} 
          onChange={(e) => setLanguage(e.target.value)}
          className="bg-gray-800 text-white p-2 rounded border border-gray-700"
        >
          <option value="java">Java</option>
          <option value="python">Python</option>
          <option value="javascript">JavaScript</option>
          <option value="cpp">C++</option>
        </select>
        <button 
          onClick={runCode} 
          disabled={isRunning}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {isRunning? 'Running...' : 'Run Code'}
        </button>
      </div>
      
      <Editor
        height="50vh"
        language={language === 'cpp' ? 'cpp' : language}
        value={code}
        onChange={(value) => setCode(value || '')}
        theme="vs-dark"
        options={{ fontSize: 14, minimap: { enabled: false } }}
      />
      
      <div className="bg-black text-green-400 p-4 font-mono mt-2 h-40 overflow-auto rounded border border-gray-700">
        <div className="text-gray-500 text-xs mb-2">Output:</div>
        <pre>{output}</pre>
      </div>
    </div>
  )
}