import Link from 'next/link'

export default function AptitudePage() {
  return (
    <main style={{padding: '2rem', fontFamily: 'system-ui', maxWidth: '800px', margin: '0 auto'}}>
      <Link href="/" style={{color: '#0070f3', textDecoration: 'none'}}>← Back to Home</Link>
      
      <h1 style={{marginTop: '1rem'}}>📊 Aptitude</h1>
      <p style={{color: '#666', marginBottom: '2rem'}}>
        Master the aptitude rounds for placements.
      </p>

      <div style={{display: 'grid', gap: '1rem'}}>
        <div style={{border: '1px solid #e5e5e5', borderRadius: '8px', padding: '16px'}}>
          <h3 style={{margin: '0 0 8px 0'}}>Quantitative Aptitude</h3>
          <p style={{margin: 0, color: '#666'}}>Percentages, Profit & Loss, Time & Work, etc.</p>
        </div>
        
        <div style={{border: '1px solid #e5e5e5', borderRadius: '8px', padding: '16px'}}>
          <h3 style={{margin: '0 0 8px 0'}}>Logical Reasoning</h3>
          <p style={{margin: 0, color: '#666'}}>Puzzles, Blood Relations, Coding-Decoding, etc.</p>
        </div>

        <div style={{border: '1px solid #e5e5e5', borderRadius: '8px', padding: '16px'}}>
          <h3 style={{margin: '0 0 8px 0'}}>Verbal Ability</h3>
          <p style={{margin: 0, color: '#666'}}>Reading Comprehension, Grammar, Vocabulary, etc.</p>
        </div>
      </div>
    </main>
  )
}