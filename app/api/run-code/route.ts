import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { language, code, stdin } = await request.json();

  const langMap: Record<string, number> = {
    java: 62,
    py: 71,
    js: 63,
    ts: 74,
    cpp: 54,
    c: 50,
  };

  const languageId = langMap[language];

  if (!languageId) {
    return NextResponse.json({
      output: '',
      error: `Language '${language}' not supported`
    });
  }

  try {
    const response = await fetch('https://ce.judge0.com/submissions?base64_encoded=false&wait=true', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language_id: languageId,
        source_code: code,
        stdin: stdin || ''
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