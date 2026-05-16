'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, provider } from '../lib/firebase';
import { signInWithPopup, onAuthStateChanged } from 'firebase/auth';

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.push('/dashboard');
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await signInWithPopup(auth, provider);
      router.push('/dashboard');
    } catch (err) {
      console.error(err);
      alert('Login failed. Check if popups are blocked.');
      setLoading(false);
    }
  };

  return (
    <main style={{display:'flex',justifyContent:'center',alignItems:'center',height:'100vh',background:'#f3f4f6'}}>
      <div style={{background:'white',padding:'40px',borderRadius:'12px',boxShadow:'0 4px 6px rgba(0,0,0,0.1)',textAlign:'center',maxWidth:'400px'}}>
        <h1 style={{fontSize:'28px',fontWeight:'bold',marginBottom:'8px'}}>ASCET Interview Hub</h1>
        <p style={{color:'#6b7280',marginBottom:'24px'}}>Sign in with your college Google account</p>
        <button 
          onClick={handleGoogleLogin} 
          disabled={loading} 
          style={{
            background:'#4285F4',
            color:'white',
            border:'none',
            padding:'12px 24px',
            borderRadius:'8px',
            fontSize:'16px',
            cursor: loading? 'not-allowed' : 'pointer',
            width:'100%',
            opacity: loading? 0.7 : 1
          }}
        >
          {loading? 'Signing in...' : 'Sign in with Google'}
        </button>
      </div>
    </main>
  );
}