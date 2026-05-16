import Link from 'next/link'

export default function InterviewPage() {
  return (
    <main style={{padding: '2rem', fontFamily: 'system-ui', maxWidth: '800px', margin: '0 auto'}}>
      <Link href="/" style={{color: '#0070f3', textDecoration: 'none'}}>← Back to Home</Link>
      
      <h1 style={{marginTop: '1rem'}}>🎤 Interview Prep</h1>
      <p style={{color: '#666', marginBottom: '2rem'}}>
        Nail your HR round and group discussions.
      </p>

      <div style={{display: 'grid', gap: '1rem'}}>
        <div style={{border: '1px solid #e5e5e5', borderRadius: '8px', padding: '16px'}}>
          <h3 style={{margin: '0 0 8px 0'}}>Common HR Questions</h3>
          <p style={{margin: 0, color: '#666'}}>Tell me about yourself, strengths, weaknesses, etc.</p>
        </div>
        
        <div style={{border: '1px solid #e5e5e5', borderRadius: '8px', padding: '16px'}}>
          <h3 style={{margin: '0 0 8px 0'}}>Group Discussion Tips</h3>
          <p style={{margin: 0, color: '#666'}}>Do's and don'ts, common topics, how to stand out.</p>
        </div>

        <div style={{border: '1px solid #e5e5e5', borderRadius: '8px', padding: '16px'}}>
          <h3 style={{margin: '0 0 8px 0'}}>Mock Interview Guide</h3>
          <p style={{margin: 0, color: '#666'}}>How to practice and what to expect on the big day.</p>
        </div>
      </div>
    </main>
  )
}