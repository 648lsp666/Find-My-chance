'use client'

import { useEffect, useState } from 'react'
import type { TrendingRepo } from '@/lib/trending'

interface Props {
  date: string
  summary: string
  count: number
}

const LANG_COLORS: Record<string, string> = {
  TypeScript: '#3178C6',
  JavaScript: '#F7DF1E',
  Python:     '#3572A5',
  Go:         '#00ADD8',
  Rust:       '#DEA584',
  Java:       '#B07219',
  Swift:      '#FA7343',
  Kotlin:     '#A97BFF',
  'C++':      '#F34B7D',
  C:          '#555555',
  Ruby:       '#701516',
  PHP:        '#4F5D95',
  Dart:       '#00B4AB',
}

function LangDot({ lang }: { lang: string }) {
  const color = LANG_COLORS[lang] ?? '#8B5CF6'
  return (
    <span
      className="inline-block w-2 h-2 rounded-full flex-shrink-0"
      style={{ background: color }}
    />
  )
}

export default function DailyBrief({ date, summary, count }: Props) {
  const [repos, setRepos] = useState<TrendingRepo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/trending')
      .then(r => r.json())
      .then((data: TrendingRepo[]) => setRepos(data))
      .catch(() => setRepos([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="mb-8 print:hidden">
      {/* Header banner */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #4C1D95 100%)' }}
      >
        {/* Top bar: title + meta */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4">
          <div>
            <p className="font-mono text-[9px] text-white/60 tracking-[0.3em] uppercase mb-1.5">
              今日市场简报 · {date}
            </p>
            <h2
              className="font-display font-bold text-white leading-tight"
              style={{ fontSize: '22px', letterSpacing: '-0.01em' }}
            >
              每日机会简报
            </h2>
          </div>
          <div className="text-right">
            <div
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5"
              style={{ background: 'rgba(255,255,255,0.12)' }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono text-[10px] text-white/80 tracking-[0.15em]">
                {count} 个机会
              </span>
            </div>
          </div>
        </div>

        {/* Summary text */}
        {summary && (
          <div className="px-6 pb-5">
            <p
              className="font-sans leading-relaxed"
              style={{ fontSize: '13.5px', color: 'rgba(255,255,255,0.85)' }}
            >
              {summary}
            </p>
          </div>
        )}

        {/* GitHub Trending strip */}
        <div
          className="px-6 py-4 border-t"
          style={{ borderColor: 'rgba(255,255,255,0.12)', background: 'rgba(0,0,0,0.15)' }}
        >
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor" style={{ color: 'rgba(255,255,255,0.5)' }}>
              <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
            </svg>
            <span className="font-mono text-[9px] tracking-[0.25em] uppercase" style={{ color: 'rgba(255,255,255,0.5)' }}>
              GitHub Trending · Today
            </span>
          </div>

          {loading ? (
            <div className="flex gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-8 rounded-lg flex-1 animate-pulse"
                  style={{ background: 'rgba(255,255,255,0.08)' }}
                />
              ))}
            </div>
          ) : repos.length === 0 ? (
            <p className="font-mono text-[11px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
              暂无数据
            </p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {repos.map(repo => (
                <a
                  key={`${repo.owner}/${repo.repo}`}
                  href={repo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-start gap-2.5 rounded-xl p-3 transition-all"
                  style={{ background: 'rgba(255,255,255,0.07)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.13)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}
                >
                  <div className="flex-1 min-w-0">
                    <p
                      className="font-mono font-semibold truncate group-hover:text-white transition-colors"
                      style={{ fontSize: '11px', color: 'rgba(255,255,255,0.9)' }}
                    >
                      {repo.repo}
                    </p>
                    {repo.description && (
                      <p
                        className="font-sans leading-snug mt-0.5 line-clamp-1"
                        style={{ fontSize: '10px', color: 'rgba(255,255,255,0.45)' }}
                      >
                        {repo.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1.5">
                      {repo.language && (
                        <span className="flex items-center gap-1">
                          <LangDot lang={repo.language} />
                          <span className="font-mono" style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)' }}>
                            {repo.language}
                          </span>
                        </span>
                      )}
                      <span className="flex items-center gap-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                        <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                        <span className="font-mono" style={{ fontSize: '9px' }}>{repo.starsToday}</span>
                      </span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
