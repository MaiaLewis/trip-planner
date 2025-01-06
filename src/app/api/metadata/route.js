import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { url } = await request.json()
    
    const response = await fetch(url)
    const html = await response.text()
    
    // Basic metadata extraction
    const titleMatch = html.match(/<title>(.*?)<\/title>/)
    const descriptionMatch = html.match(/<meta name="description" content="(.*?)"/)
    const imageMatch = html.match(/<meta property="og:image" content="(.*?)"/)
    
    return NextResponse.json({
      title: titleMatch ? titleMatch[1] : '',
      description: descriptionMatch ? descriptionMatch[1] : '',
      image: imageMatch ? imageMatch[1] : '',
      url
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch metadata' }, { status: 500 })
  }
}

