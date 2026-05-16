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
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <Toaster />
      <h1 className="text-4xl font-bold mb-8">ASCET Interview Hub</h1>
      
      {user ? (
        <div className="flex flex-col items-center gap-4">
          <p>Welcome, {user.email}</p>
          <button 
            onClick={() => router.push('/editor')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to Editor
          </button>
          <button 
            onClick={handleSignOut}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Sign Out
          </button>
        </div>
      ) : (
        <button 
          onClick={() => router.push('/login')}
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          Login
        </button>
      )}
    </div>
  )
}