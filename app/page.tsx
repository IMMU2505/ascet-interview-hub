"use client"
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto space-y-4">
        
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-4xl font-bold mb-2">ASCET Interview Hub</h1>
          <p className="text-gray-600">Live Code Editor • Aptitude Tests • Interviews</p>
          <div className="mt-4">
            <button 
              onClick={() => router.push('/login')}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
            >
              Login
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-2">💻 Live Code Editor</h2>
          <p className="text-gray-600 mb-4">Real-time coding with Monaco Editor</p>
          <button 
            onClick={() => router.push('/editor')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Open Editor →
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-2">🏆 Aptitude Tests</h2>
          <p className="text-gray-600 mb-4">Test your skills with timed quizzes</p>
          <button 
            onClick={() => router.push('/aptitude')}
            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
          >
            Start Test →
          </button>
        </div>

      </div>
    </div>
  )
}