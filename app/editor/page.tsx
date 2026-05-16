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
  const [code, setCode] = useState(`<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: system-ui, sans-serif;
      padding: 40px;
      background: #f8fafc;
    }
   .container {
      max-width: 600px;
      margin: 0 auto;
      background: white;
      padding: 32px;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    h1 {
      color: #3b82f6;
      margin-bottom: 16px;
    }
    button {
      background: #3b82f6;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 16px;
    }
    button:hover {
      background: #2563eb;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>ASCET Interview Hub</h1>
    <p>Welcome to the live code editor! Edit this HTML/CSS/JS and see changes instantly.</p>
    <button onclick="alert('It works!')">Click Me</button>
  </div>

  <script>
    console.log('Editor ready! Start coding.');
  </script>
</body>
</html>`)

  useEffect(() => {
    if (!loading &&!user) router.push('/')
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-md px-4 md:px-6 py-3 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-blue-500 hover:text-blue-700 font-semibold">
            ← Dashboard
          </Link>
          <h1 className="text-lg md:text-xl font-bold">Live Code Editor</h1>
        </div>
        <div className="flex gap-3 items-center">
          <span className="text-sm text-gray-600 hidden md:block">{user.email}</span>
          <button
            onClick={() => auth.signOut()}
            className="bg-red-500 hover:bg-red-600 text-white px-3 md:px-4 py-2 rounded text-sm"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Editor + Preview */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 overflow-hidden">
        {/* Code Editor */}
        <div className="border-r border-gray-300 min-h-[300px] lg:min-h-0">
          <Editor
            height="100%"
            defaultLanguage="html"
            theme="vs-dark"
            value={code}
            onChange={(value) => setCode(value || '')}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              wordWrap: 'on',
              scrollBeyondLastLine: false,
            }}
          />
        </div>

        {/* Live Preview */}
        <div className="bg-white min-h-[300px] lg:min-h-0">
          <iframe
            srcDoc={code}
            title="preview"
            className="w-full h-full border-0"
            sandbox="allow-scripts allow-same-origin"
          />
        </div>
      </div>
    </div>
  )
}