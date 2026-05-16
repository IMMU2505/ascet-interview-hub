"use client"
import { useEffect, useState } from 'react'
import { auth } from '../lib/firebase'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { useRouter } from 'next/navigation'
import toast, { Toaster } from 'react-hot-toast'

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const handleSignOut = async () => {
    await signOut(auth)
    toast.success('Signed out')
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <Toaster />
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-4xl font-bold mb-2">ASCET Interview Hub</h1>
          {user ? (
            <div className="flex flex-col items-start gap-4">
              <p className="text-gray-600">Welcome, {user.email}</p>
              <button onClick={handleSignOut} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Sign Out</button>
            </div>
          ) : (
            <button onClick={() => router.push('/login')} className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700">Login</button>
          )}
        </div>

        {user && (
          <>
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-2">💻 Live Code Editor</h2>
              <p className="text-gray-600 mb-4">Write Python, C++, Java with Monaco Editor.</p>
              <button onClick={() => router.push('/editor')} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Open Editor →</button>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-2">🏆 Aptitude Tests</h2>
              <p className="text-gray-600 mb-4">Practice Quantitative, Logical, and Verbal reasoning.</p>
              <button onClick={() => router.push('/aptitude')} className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700">Start Test →</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}