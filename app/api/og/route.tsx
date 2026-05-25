import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

// Cache font per Edge worker instance
let fontData: ArrayBuffer | null = null

async function getFont(): Promise<ArrayBuffer | null> {
  if (fontData) return fontData
  try {
    const css = await fetch(
      'https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;700',
      { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; OGImageBot/1.0)' } },
    ).then(r => r.text())
    const match = css.match(/src: url\((.+?)\) format\('woff2'\)/)
    if (!match) return null
    fontData = await fetch(match[1]).then(r => r.arrayBuffer())
    return fontData
  } catch {
    return null
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const date    = searchParams.get('date') ?? ''
  const count   = searchParams.get('count') ?? '0'
  const t0      = searchParams.get('t0') ?? ''
  const t1      = searchParams.get('t1') ?? ''
  const t2      = searchParams.get('t2') ?? ''
  const titles  = [t0, t1, t2].filter(Boolean).slice(0, 3)

  const font = await getFont()

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#0B0B12',
          display: 'flex',
          flexDirection: 'column',
          padding: '52px 60px',
          fontFamily: font ? '"Noto Sans SC"' : 'sans-serif',
          position: 'relative',
        }}
      >
        {/* Header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ color: '#E8A020', fontSize: '26px' }}>⌖</span>
            <span style={{ color: '#E8E6F0', fontSize: '26px', fontWeight: 700, letterSpacing: '-0.02em' }}>
              每日机会雷达
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
            <span style={{ color: '#E8A020', fontSize: '18px', letterSpacing: '0.1em', fontWeight: 400 }}>
              {date}
            </span>
            <span style={{ color: '#5A5A78', fontSize: '11px', letterSpacing: '0.3em' }}>
              DAILY · RADAR
            </span>
          </div>
        </div>

        {/* Count */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '28px' }}>
          <span style={{ color: '#E8A020', fontSize: '80px', fontWeight: 800, lineHeight: 1 }}>
            {count}
          </span>
          <span style={{ color: '#E8E6F0', fontSize: '28px', fontWeight: 600 }}>
            个副业机会
          </span>
        </div>

        {/* Opportunity titles */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
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
                  background: '#111120',
                  borderRadius: '12px',
                  border: `1px solid #1C1C30`,
                  borderLeft: `3px solid ${c}`,
                }}
              >
                <span style={{ color: '#5A5A78', fontSize: '13px', fontWeight: 400, minWidth: '22px' }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span style={{ color: '#E8E6F0', fontSize: '21px', fontWeight: 500 }}>
                  {truncated}
                </span>
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
            borderTop: '1px solid #1C1C30',
            paddingTop: '20px',
            marginTop: '24px',
          }}
        >
          <span style={{ color: '#5A5A78', fontSize: '13px', letterSpacing: '0.08em' }}>
            opportunity-radar-ruby.vercel.app
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#E8A020' }} />
            <span style={{ color: '#5A5A78', fontSize: '11px', letterSpacing: '0.2em' }}>
              AI GENERATED
            </span>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: font
        ? [{ name: 'Noto Sans SC', data: font, weight: 700, style: 'normal' }]
        : [],
    },
  )
}
