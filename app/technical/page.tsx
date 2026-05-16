import Link from 'next/link'

export default function TechnicalPage() {
  return (
    <main style={{padding: '2rem', fontFamily: 'system-ui', maxWidth: '800px', margin: '0 auto'}}>
      <Link href="/" style={{color: '#0070f3', textDecoration: 'none'}}>← Back to Home</Link>
      
      <h1 style={{marginTop: '1rem'}}>💻 Technical</h1>
      <p style={{color: '#666', marginBottom: '2rem'}}>
        Crack the coding and technical rounds.
      </p>

      <div style={{display: 'grid', gap: '1rem'}}>
        <div style={{border: '1px solid #e5e5e5', borderRadius: '8px', padding: '16px'}}>
          <h3 style={{margin: '0 0 8px 0'}}>Data Structures & Algorithms</h3>
          <p style={{margin: 0, color: '#666'}}>Arrays, Linked Lists, Trees, Graphs, DP, etc.</p>
        </div>
        
        <div style={{border: '1px solid #e5e5e5', borderRadius: '8px', padding: '16px'}}>
          <h3 style={{margin: '0 0 8px 0'}}>Core CS Subjects</h3>
          <p style={{margin: 0, color: '#666'}}>DBMS, OS, CN, OOPs - all key concepts covered.</p>
        </div>

        <div style={{border: '1px solid #e5e5e5', borderRadius: '8px', padding: '16px'}}>
          <h3 style={{margin: '0 0 8px 0'}}>Company-Specific Prep</h3>
          <p style={{margin: 0, color: '#666'}}>TCS, Infosys, Wipro, Capgemini previous questions.</p>
        </div>
      </div>
    </main>
  )
}