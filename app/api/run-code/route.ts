import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { language, code } = await request.json();
  
  const langMap: Record<string, number> = {
    java: 62,
    python: 71, 
    javascript: 63,
    cpp: 54,
  };

  try {
    const response = await fetch('https://ce.judge0.com/submissions?base64_encoded=false&wait=true', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language_id: langMap[language],
        source_code: code
      })
    });

    const data = await response.json();
    
    return NextResponse.json({ 
      output: data.stdout || '', 
      error: data.stderr || data.compile_output || null 
    });
  } catch (err) {
    return NextResponse.json({ error: 'Execution failed' }, { status: 500 });
  }
}