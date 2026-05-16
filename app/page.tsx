export default function Home() {
  const cardStyle: React.CSSProperties = {
    border: '1px solid #e5e5e5',
    borderRadius: '12px',
    padding: '24px',
    textDecoration: 'none',
    color: 'inherit',
    display: 'block',
    transition: 'box-shadow 0.2s',
  };

  return (
    <main style={{
      padding: '2rem', 
      fontFamily: 'system-ui', 
      maxWidth: '800px', 
      margin: '0 auto'
    }}>
      <h1 style={{textAlign: 'center', marginBottom: '8px'}}>
        ASCET Interview Hub
      </h1>
      <p style={{textAlign: 'center', color: '#666', marginBottom: '3rem'}}>
        Crack your next placement. Built by ASCET, for ASCET.
      </p>

      <div style={{
        display: 'grid', 
        gap: '1.5rem', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))'
      }}>
        
        <a href="/aptitude" style={cardStyle}>
          <h2 style={{margin: '0 0 8px 0'}}>📊 Aptitude</h2>
          <p style={{margin: 0, color: '#666'}}>
            Practice quantitative, logical reasoning, and verbal ability questions.
          </p>
        </a>

        <a href="/technical" style={cardStyle}>
          <h2 style={{margin: '0 0 8px 0'}}>💻 Technical</h2>
          <p style={{margin: 0, color: '#666'}}>
            DSA, core subjects, and company-specific coding problems.
          </p>
        </a>

        <a href="/interview" style={cardStyle}>
          <h2 style={{margin: '0 0 8px 0'}}>🎤 Interview Prep</h2>
          <p style={{margin: 0, color: '#666'}}>
            HR questions, group discussion tips, and mock interview guides.
          </p>
        </a>

      </div>
    </main>
  )
}