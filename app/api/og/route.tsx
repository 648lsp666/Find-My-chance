import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'

export const runtime = 'nodejs'

let fontCache: ArrayBuffer | null = null

async function getFont(): Promise<ArrayBuffer> {
  if (fontCache) return fontCache
  try {
    // satori requires TTF/OTF/WOFF — NOT woff2. Use .woff file.
    const buf = readFileSync(join(process.cwd(), 'public', 'fonts', 'NotoSansSC-700.woff'))
    fontCache = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer
    return fontCache
  } catch {
    // Fallback: fetch from own Vercel CDN
    const res = await fetch('https://opportunity-radar-ruby.vercel.app/fonts/NotoSansSC-700.woff')
    if (!res.ok) throw new Error(`Font fetch failed: ${res.status}`)
    fontCache = await res.arrayBuffer()
    return fontCache
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const date   = searchParams.get('date') ?? ''
    const count  = searchParams.get('count') ?? '0'
    const t0     = searchParams.get('t0') ?? ''
    const t1     = searchParams.get('t1') ?? ''
    const t2     = searchParams.get('t2') ?? ''
    const titles = [t0, t1, t2].filter(Boolean).slice(0, 3)

    const font = await getFont()

    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            background: '#F5F4FF',
            display: 'flex',
            flexDirection: 'column',
            padding: '52px 60px',
            fontFamily: '"Noto Sans SC"',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '36px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ color: '#7C3AED', fontSize: '26px' }}>⌖</span>
              <span style={{ color: '#1E1B4B', fontSize: '26px', fontWeight: 700 }}>见微 Prowl</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
              <span style={{ color: '#7C3AED', fontSize: '18px', letterSpacing: '0.1em' }}>{date}</span>
              <span style={{ color: '#6B7280', fontSize: '11px', letterSpacing: '0.3em' }}>PROWL · DAILY</span>
            </div>
          </div>

          {/* Count */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '28px' }}>
            <span style={{ color: '#7C3AED', fontSize: '80px', fontWeight: 700, lineHeight: '1' }}>{count}</span>
            <span style={{ color: '#1E1B4B', fontSize: '28px', fontWeight: 700 }}>个副业机会</span>
          </div>

          {/* Opportunity titles */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: '1 1 0' }}>
            {titles.map((title, i) => {
              const colors = ['#5B9CF6', '#34D399', '#A78BFA']
              const c = colors[i] ?? '#9CA3AF'
              const truncated = title.length > 22 ? title.slice(0, 22) + '…' : title
              return (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '14px 20px',
                    background: '#FFFFFF',
                    borderRadius: '12px',
                    border: '1px solid #E5E3F5',
                    borderLeft: `3px solid ${c}`,
                  }}
                >
                  <span style={{ color: '#6B7280', fontSize: '13px', minWidth: '22px' }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span style={{ color: '#1E1B4B', fontSize: '21px', fontWeight: 700 }}>{truncated}</span>
                </div>
              )
            })}
          </div>

          {/* Footer */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: '1px solid #E5E3F5',
              paddingTop: '20px',
              marginTop: '24px',
            }}
          >
            <span style={{ color: '#6B7280', fontSize: '13px', letterSpacing: '0.08em' }}>
              opportunity-radar-ruby.vercel.app
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#7C3AED' }} />
              <span style={{ color: '#6B7280', fontSize: '11px', letterSpacing: '0.2em' }}>SOURCE BACKED</span>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        fonts: [{ name: 'Noto Sans SC', data: font, weight: 700, style: 'normal' }],
      },
    )
  } catch (err) {
    console.error('OG image error:', err)
    return new Response(`OG Error: ${err instanceof Error ? err.message : String(err)}`, { status: 500 })
  }
}
