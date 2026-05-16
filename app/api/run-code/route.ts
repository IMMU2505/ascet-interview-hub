import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { language, code } = await request.json();
  
  const langMap: Record<string, { language: string; version: string }> = {
    java: { language: 'java', version: '15.0.2' },
    python: { language: 'python', version: '3.10.0' },
    javascript: { language: 'javascript', version: '18.15.0' },
    cpp: { language: 'c++', version: '10.2.0' },
  };

  if (!langMap[language]) {
    return NextResponse.json({ error: 'Language not supported' }, { status: 400 });
  }

  try {
    const response = await fetch('https://emkc.org/api/v2/piston/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language: langMap[language].language,
        version: langMap[language].version,
        files: [{ content: code }]
      })
    });

    const data = await response.json();
    return NextResponse.json({ 
      output: data.run?.output || '', 
      error: data.run?.stderr || data.message 
    });
  } catch (err) {
    return NextResponse.json({ error: 'Execution failed' }, { status: 500 });
  }
}