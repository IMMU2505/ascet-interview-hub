'use client'
import { useState } from 'react'
import { Toaster, toast } from 'react-hot-toast'
import { FaUserTie, FaCode, FaBrain, FaVideo, FaChartLine, FaFileAlt, FaUsers } from 'react-icons/fa'

export default function Home() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [email, setEmail] = useState('')

  const handleLogin = () => {
    if (!email) return toast.error('Enter college email')
    setLoggedIn(true)
    toast.success('Welcome to ASCET Interview Hub')
  }

  const features = [
    { icon: <FaCode/>, title: 'Live Code Editor', desc: 'Monaco editor + Groq AI evaluation' },
    { icon: <FaBrain/>, title: 'Aptitude Tests', desc: 'Company-wise MCQ banks' },
    { icon: <FaVideo/>, title: 'Mock Interviews', desc: 'Video proctored sessions' },
    { icon: <FaUserTie/>, title: 'HR Round Prep', desc: 'Behavioral questions + AI feedback' },
    { icon: <FaChartLine/>, title: 'Performance Analytics', desc: 'Track progress across skills' },
    { icon: <FaFileAlt/>, title: 'Resume Analyzer', desc: 'ATS score + improvement tips' },
    { icon: <FaUsers/>, title: 'Leaderboard', desc: 'Compete with batchmates' },
  ]

  if (!loggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-center mb-2">ASCET Interview Hub</h1>
          <p className="text-gray-500 text-center mb-8">College placement prep platform</p>
          <input 
            type="email" 
            placeholder="College email"
            className="w-full border rounded-lg p-3 mb-4"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button 
            onClick={handleLogin}
            className="w-full bg-blue-600 text-white rounded-lg p-3 font-semibold hover:bg-blue-700"
          >
            Enter Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">ASCET Interview Hub</h1>
          <button 
            onClick={() => setLoggedIn(false)}
            className="bg-red-500 text-white px-4 py-2 rounded-lg"
          >
            Logout
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div 
              key={i}
              onClick={() => toast('Coming soon!')}
              className="bg-white p-6 rounded-xl shadow hover:shadow-lg cursor-pointer border border-gray-100"
            >
              <div className="text-3xl text-blue-600 mb-4">{f.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{f.title}</h3>
              <p className="text-gray-600">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}