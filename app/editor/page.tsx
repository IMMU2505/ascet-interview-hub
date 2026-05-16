'use client'
import { useState, useEffect } from 'react'
import Editor from '@monaco-editor/react'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth, db } from '@/lib/firebase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp } from 'firebase/firestore'

export default function EditorPage() {
  const [user, loading] = useAuthState(auth)
  const router = useRouter()
  
  const [code, setCode] = useState(`import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        System.out.print("Enter name: ");
        String name = sc.nextLine();
        System.out.println("Hello " + name);
    }
}`)
  const [language, setLanguage] = useState('java')
  const [userInput, setUserInput] = useState('ASCET')
  const [output, setOutput] = useState('Click Run Code to see output')
  const [isRunning, setIsRunning] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [snippets, setSnippets] = useState<any[]>([])

  useEffect(() => {
    if (!loading &&!user) router.push('/')
    if (user) loadSnippets()
  }, [user, loading, router])

  const loadSnippets = async () => {
    if (!user) return
    const q = query(collection(db, `users/${user.uid}/snippets`), orderBy('createdAt', 'desc'))
    const querySnapshot = await getDocs(q)
    setSnippets(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
  }

  const saveCode = async () => {
    if (!user) return
    setIsSaving(true)
    try {
      await addDoc(collection(db, `users/${user.uid}/snippets`), {
        code,
        language,
        userInput,
        createdAt: serverTimestamp(),
        name: `${language} snippet ${new Date().toLocaleTimeString()}`
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
    setOutput('Loaded snippet!')
  }

  const runCode = async () => {
    setIsRunning(true)
    setOutput('Running...')
    
    const res = await fetch('/api/run-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language, code, stdin: userInput })
    })
    
    const data = await res.json()
    setOutput(data.error || data.output || 'No output')
    setIsRunning(false)
  }

  if (loading) return <div className="p-4 bg-gray-950 min-h-screen text-white">Loading...</div>
  if (!user) return null

  return (
    <div className="p-4 bg-gray-950 min-h-screen text-white">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">ASCET Code Runner</h1>
        <Link href="/dashboard" className="text-blue-400">Dashboard</Link>
      </div>
      
      <div className="flex gap-2 mb-2 flex-wrap">
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
        <button 
          onClick={saveCode} 
          disabled={isSaving}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded disabled:opacity-50"
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
        height="45vh"
        language={language === 'cpp'? 'cpp' : language}
        value={code}
        onChange={(value) => setCode(value || '')}
        theme="vs-dark"
        options={{ fontSize: 14, minimap: { enabled: false } }}
      />
      
      <div className="grid grid-cols-2 gap-2 mt-2">
        <div>
          <div className="text-gray-400 text-xs mb-1">Input (stdin):</div>
          <textarea
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Enter input here..."
            className="w-full h-20 bg-gray-900 text-white p-2 font-mono rounded border border-gray-700 resize-none"
          />
        </div>
        <div>
          <div className="text-gray-400 text-xs mb-1">Output:</div>
          <div className="bg-black text-green-400 p-2 font-mono h-20 overflow-auto rounded border border-gray-700">
            <pre>{output}</pre>
          </div>
        </div>
      </div>
    </div>
  )
}