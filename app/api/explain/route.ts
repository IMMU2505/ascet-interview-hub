import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { code, language } = await req.json()
    
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: 'AI key not configured' }, { status: 500 })
    }

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'system',
            content: 'You are a coding tutor. Explain code clearly in simple terms. Use bullet points. Point out key concepts. Keep it under 150 words.'
          },
          {
            role: 'user',
            content: `Explain this ${language} code:\n\n${code}`
          }
        ],
        temperature: 0.3,
        max_tokens: 300
      })
    })

    const data = await res.json()
    const explanation = data.choices[0].message.content
    
    return NextResponse.json({ explanation })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to explain code' }, { status: 500 })
  }
}