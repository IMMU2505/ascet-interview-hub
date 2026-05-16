'use client'
import { useEffect } from 'react'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth } from '@/lib/firebase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Dashboard() {
  const [user, loading] = useAuthState(auth)
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-start md:items-center flex-col md:flex-row gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                Welcome, {user.displayName || 'User'}! 👋
              </h1>
              <p className="text-gray-600 mt-1">{user.email}</p>
            </div>
            <button
              onClick={() => auth.signOut()}
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg font-semibold transition"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="grid gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-2">💻 Live Code Editor</h2>
            <p className="text-gray-600 mb-4">
              Write HTML, CSS, and JavaScript with live preview. Perfect for interviews and practice.
            </p>
            <Link
              href="/editor"
              className="inline-block bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition"
            >
              Open Editor →
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 opacity-60">
            <h2 className="text-xl font-bold text-gray-800 mb-2">🚀 More Features Coming Soon</h2>
            <p className="text-gray-600">
              Code saving, multiple files, AI code review, and interview templates.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}