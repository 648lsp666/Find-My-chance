'use client'

import { useEffect, useState } from 'react'
import type { TrendingRepo } from '@/lib/trending'

const LANG_COLORS: Record<string, string> = {
  TypeScript: '#3178C6', JavaScript: '#F7DF1E', Python: '#3572A5',
  Go: '#00ADD8', Rust: '#DEA584', Java: '#B07219', Swift: '#FA7343',
  Kotlin: '#A97BFF', 'C++': '#F34B7D', C: '#555555', Ruby: '#701516',
}

export default function TechSignals() {
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
    <div className="mb-6 print:hidden">
      <div className="flex items-center gap-3 mb-3">
        <svg className="w-3.5 h-3.5 flex-shrink-0 text-r-muted" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
        </svg>
        <span className="font-mono text-[10px] text-r-muted tracking-[0.2em] uppercase">
          今日技术风口
        </span>
        <span className="font-sans text-[11px] text-r-faint">· 驱动今日机会的技术信号</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-7 w-28 rounded-full bg-r-border animate-pulse" />
            ))
          : repos.map(repo => {
              const dotColor = LANG_COLORS[repo.language] ?? '#8B5CF6'
              return (
                <a
                  key={`${repo.owner}/${repo.repo}`}
                  href={repo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-full px-3 py-1.5 border border-r-border bg-r-card hover:border-r-dim hover:bg-r-bg transition-all group"
                >
                  {repo.language && (
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: dotColor }}
                    />
                  )}
                  <span className="font-mono text-[11px] text-r-text font-medium group-hover:text-r-accent transition-colors">
                    {repo.repo}
                  </span>
                  <span className="font-mono text-[10px] text-r-faint">
                    ⭐{repo.starsToday.toLocaleString()}
                  </span>
                </a>
              )
            })
        }
      </div>
    </div>
  )
}
