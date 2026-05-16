'use client'
import { useEffect } from 'react'
import { auth, provider } from '../lib/firebase'
import { signInWithPopup } from 'firebase/auth'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        router.push('/dashboard')
      }
    })
    return () => unsubscribe()
  }, [router])

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, provider)
      toast.success('Signed in successfully!')
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-lg text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">ASCET Interview Hub</h1>
        <p className="text-gray-600 mb-8">College Interview & Aptitude Platform</p>
        <button
          onClick={signInWithGoogle}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
        >
          Sign in with Google
        </button>
      </div>
    </div>
  )
}