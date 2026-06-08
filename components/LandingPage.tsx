import Link from 'next/link'

interface Props {
  latestDate: string | null
}

const STEPS = [
  {
    time: '00:00–04:00 UTC',
    icon: '📡',
    title: '信号采集',
    desc: '自动抓取 GitHub Trending、Product Hunt 热榜，聚合多源科技信号',
    tags: ['GitHub API', 'Product Hunt', 'HN Hot'],
  },
  {
    time: '04:00 UTC',
    icon: '🤖',
    title: '结构化研判',
    desc: '研究模型评估每个信号的机会价值，标注类型（就业/产品/学习/趋势）和国内适配度',
    tags: ['信号研判', '机会分类', '国内适配'],
  },
  {
    time: '12:00 CST',
    icon: '📋',
    title: '简报上线',
    desc: '结构化简报准时发布，订阅者收到邮件通知，所有历史记录永久可查',
    tags: ['每日更新', '邮件推送', '历史存档'],
  },
]

const FEATURES = [
  {
    key: 'brief',
    label: '今日简报',
    color: 'from-violet-600 to-purple-900',
    textAccent: '#C4B5FD',
    desc: '每日一段结构化市场综述，提炼最重要的机会信号，附主题线索与可筛选标签',
    preview: (
      <div className="rounded-lg p-3 text-left" style={{ background: 'rgba(0,0,0,0.35)' }}>
        <div className="font-mono text-[9px] tracking-widest uppercase mb-2" style={{ color: 'rgba(196,181,253,0.6)' }}>
          见微 · 今日简报 · 2026-05-27
        </div>
        <div className="font-sans text-[11px] leading-relaxed mb-3" style={{ color: 'rgba(255,255,255,0.85)' }}>
          今日智能应用基础设施迎来密集更新，多个向量数据库项目在 GitHub 冲上热门…
        </div>
        <div className="flex flex-wrap gap-1">
          {['向量数据库', 'AI基建', '独立开发', 'LLM工具'].map(t => (
            <span key={t} className="font-mono text-[9px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(124,58,237,0.4)', color: '#DDD6FE' }}>{t}</span>
          ))}
        </div>
      </div>
    ),
  },
  {
    key: 'signals',
    label: '技术风口',
    color: 'from-slate-800 to-slate-900',
    textAccent: '#6EE7B7',
    desc: 'GitHub 热门仓库 + 机会解读，每个仓库都有就业/产品/学习标注和国内适配评级',
    preview: (
      <div className="rounded-lg p-3 text-left space-y-2" style={{ background: 'rgba(0,0,0,0.35)' }}>
        {[
          { repo: 'mem0ai/mem0', tag: '产品', fit: '🇨🇳 国内优先', insight: '记忆层缺失是当前 AI 产品痛点' },
          { repo: 'microsoft/RD-Agent', tag: '就业', fit: '🇨🇳 可行', insight: '微软开源 AI 研究助手，参与可提升简历含金量' },
        ].map(r => (
          <div key={r.repo} className="rounded p-2" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div className="flex items-center justify-between mb-1">
              <span className="font-mono text-[10px] text-white font-semibold">{r.repo}</span>
              <span className="font-mono text-[8px] px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(6,95,70,0.3)', color: '#6EE7B7' }}>{r.tag}</span>
            </div>
            <div className="font-sans text-[9px]" style={{ color: '#C4B5FD' }}>{r.insight}</div>
          </div>
        ))}
      </div>
    ),
  },
  {
    key: 'opps',
    label: '机会卡片',
    color: 'from-amber-900 to-orange-950',
    textAccent: '#FCD34D',
    desc: '结构化机会列表，支持标签筛选、投票评分，快速找到和你最相关的机会',
    preview: (
      <div className="rounded-lg p-3 text-left space-y-2" style={{ background: 'rgba(0,0,0,0.35)' }}>
        <div className="flex gap-1 flex-wrap mb-2">
          {['全部', 'TypeScript', 'AI工具', '副业'].map((t, i) => (
            <span key={t} className="font-mono text-[9px] px-2 py-0.5 rounded-full" style={{ background: i === 0 ? 'rgba(245,158,11,0.3)' : 'rgba(255,255,255,0.07)', color: i === 0 ? '#FCD34D' : '#9CA3AF' }}>{t}</span>
          ))}
        </div>
        {[
          { title: '基于 Cursor 规则工厂化生产 SaaS 模板', domain: '产品', time: '12h' },
          { title: '向量检索中间件需求激增，Go 开发者有缺口', domain: '就业', time: '3h' },
        ].map(o => (
          <div key={o.title} className="rounded p-2 flex items-start justify-between gap-2" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <span className="font-sans text-[10px] leading-relaxed text-white/80">{o.title}</span>
            <span className="font-mono text-[8px] flex-shrink-0 mt-0.5" style={{ color: '#FCD34D' }}>{o.domain}</span>
          </div>
        ))}
      </div>
    ),
  },
]

export default function LandingPage({ latestDate }: Props) {
  const ctaHref = latestDate ? `/${latestDate}` : '#'

  return (
    <div className="overflow-x-hidden">

      {/* ── HERO (dark) ────────────────────────────────── */}
      <section
        className="relative flex flex-col items-center justify-center min-h-[92vh] px-6 text-center overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #07050F 0%, #0D0821 60%, #100B2E 100%)' }}
      >
        {/* Subtle grid background */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(rgba(124,58,237,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,0.04) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />

        {/* Radar rings */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {[1, 2, 3, 4].map(i => (
            <div
              key={i}
              className="radar-ring absolute rounded-full border"
              style={{
                width: '220px',
                height: '220px',
                borderColor: 'rgba(124,58,237,0.35)',
              }}
            />
          ))}
          {/* Static faint rings */}
          {[280, 420, 560].map(size => (
            <div
              key={size}
              className="absolute rounded-full border"
              style={{
                width: size,
                height: size,
                borderColor: 'rgba(124,58,237,0.06)',
              }}
            />
          ))}
        </div>

        {/* Center brand mark */}
        <div
          className="relative mb-8 w-20 h-20 flex items-center justify-center rounded-2xl hero-slide-1"
          style={{
            background: 'linear-gradient(135deg, rgba(124,58,237,0.3) 0%, rgba(76,29,149,0.5) 100%)',
            boxShadow: '0 0 40px rgba(124,58,237,0.4), 0 0 80px rgba(124,58,237,0.15)',
            border: '1px solid rgba(124,58,237,0.4)',
          }}
        >
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none" style={{ color: '#C4B5FD' }}>
            <circle cx="18" cy="18" r="14" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.6" />
            <circle cx="18" cy="18" r="7" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="18" cy="18" r="2" fill="currentColor" />
            <line x1="18" y1="2" x2="18" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="18" y1="28" x2="18" y2="34" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="2" y1="18" x2="8" y2="18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="28" y1="18" x2="34" y2="18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span
            className="signal-dot absolute -top-1 -right-1 w-3 h-3 rounded-full"
            style={{ background: '#10B981', boxShadow: '0 0 8px #10B981' }}
          />
        </div>

        <div className="relative z-10 max-w-3xl">
          {/* Eyebrow */}
          <div className="hero-slide-1 flex items-center justify-center gap-2 mb-5">
            <span
              className="font-mono font-bold tracking-wide px-4 py-1.5 rounded-full"
              style={{ background: 'rgba(124,58,237,0.25)', color: '#C4B5FD', border: '1px solid rgba(124,58,237,0.4)', fontSize: '15px' }}
            >
              每日机会雷达
            </span>
          </div>

          {/* Main headline */}
          <h1
            className="hero-slide-2 font-display font-extrabold leading-tight mb-4 text-white"
            style={{ fontSize: 'clamp(36px, 6vw, 72px)', letterSpacing: '-0.02em' }}
          >
            见微知著
            <br />
            <span style={{ color: '#A78BFA' }}>捕捉今日机会</span>
          </h1>

          <p
            className="hero-slide-3 font-sans leading-relaxed mx-auto mb-8"
            style={{ fontSize: 'clamp(15px, 2vw, 18px)', color: 'rgba(255,255,255,0.55)', maxWidth: '520px' }}
          >
            持续追踪 GitHub Trending 和市场热点，
            <br className="hidden sm:block" />
            每天整理一份为独立开发者定制的机会简报
          </p>

          {/* CTAs */}
          <div className="hero-slide-4 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={ctaHref}
              className="font-mono font-bold tracking-wide px-6 py-3 rounded-full text-white transition-all hover:scale-105 active:scale-95"
              style={{
                background: 'linear-gradient(135deg, #7C3AED, #5B21B6)',
                boxShadow: '0 4px 24px rgba(124,58,237,0.5)',
                fontSize: '15px',
              }}
            >
              查看今日机会 →
            </Link>
            <a
              href="#how"
              className="font-mono text-[14px] tracking-wide px-6 py-3 rounded-full transition-all hover:scale-105"
              style={{
                border: '1px solid rgba(124,58,237,0.4)',
                color: '#A78BFA',
              }}
            >
              了解产品 ↓
            </a>
          </div>

          {/* Stats strip */}
          <div
            className="hero-slide-4 flex items-center justify-center gap-6 mt-12 pt-6 flex-wrap"
            style={{ borderTop: '1px solid rgba(124,58,237,0.12)' }}
          >
            {[
              { v: '每日 12:00', l: 'CST 更新' },
              { v: '多源信号', l: '结构研判' },
              { v: '多源', l: '信号采集' },
              { v: '完全', l: '免费' },
            ].map(s => (
              <div key={s.l} className="text-center">
                <div className="font-mono text-[15px] font-bold text-white">{s.v}</div>
                <div className="font-mono text-[10px] tracking-widest uppercase mt-0.5" style={{ color: 'rgba(167,139,250,0.6)' }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom gradient fade */}
        <div
          className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, transparent, #F5F4FF)' }}
        />
      </section>

      {/* ── HOW IT WORKS ───────────────────────────────── */}
      <section id="how" className="py-20 px-6 bg-r-bg">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-display font-extrabold text-r-text mb-3" style={{ fontSize: 'clamp(40px, 6vw, 64px)', letterSpacing: '-0.02em' }}>
              工作流程
            </h2>
            <p className="font-sans text-r-muted text-[16px]">无需任何操作，凌晨采集，中午准时上线</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 relative">
            {/* Connecting line on desktop */}
            <div
              className="hidden md:block absolute top-8 left-[calc(16.67%+24px)] right-[calc(16.67%+24px)] h-px"
              style={{ background: 'linear-gradient(90deg, transparent, #C4B5FD 20%, #C4B5FD 80%, transparent)' }}
            />

            {STEPS.map((step, i) => (
              <div
                key={step.title}
                className="relative rounded-2xl p-6"
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E5E3F5',
                  boxShadow: '0 2px 16px rgba(124,58,237,0.06)',
                }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center font-mono text-[11px] font-bold mb-4"
                  style={{ background: 'rgba(124,58,237,0.1)', color: '#7C3AED' }}
                >
                  {String(i + 1).padStart(2, '0')}
                </div>
                <div className="text-2xl mb-3">{step.icon}</div>
                <h3 className="font-display font-bold text-r-text text-[18px] mb-1">{step.title}</h3>
                <p className="font-mono text-[10px] text-r-accent mb-3 tracking-wide">{step.time}</p>
                <p className="font-sans text-[13px] text-r-muted leading-relaxed mb-4">{step.desc}</p>
                <div className="flex flex-wrap gap-1.5">
                  {step.tags.map(t => (
                    <span
                      key={t}
                      className="font-mono text-[10px] px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(124,58,237,0.08)', color: '#6B7280' }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ───────────────────────────────────── */}
      <section className="py-20 px-6" style={{ background: '#FAFAFE' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-display font-extrabold text-r-text mb-3" style={{ fontSize: 'clamp(40px, 6vw, 64px)', letterSpacing: '-0.02em' }}>
              每天你会看到什么
            </h2>
            <p className="font-sans text-r-muted text-[16px]">三个核心模块，覆盖机会发现的全链路</p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {FEATURES.map(f => (
              <div
                key={f.key}
                className="rounded-2xl overflow-hidden flex flex-col"
                style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.12)' }}
              >
                {/* Card header - dark gradient */}
                <div className={`bg-gradient-to-br ${f.color} p-5 flex-1`}>
                  <div
                    className="font-mono text-[11px] font-bold tracking-[0.2em] uppercase mb-3 px-2 py-1 rounded-full inline-block"
                    style={{ background: 'rgba(255,255,255,0.1)', color: f.textAccent }}
                  >
                    {f.label}
                  </div>
                  {f.preview}
                </div>
                {/* Card footer - light */}
                <div className="bg-white px-5 py-4 border-t border-r-border">
                  <p className="font-sans text-[13px] text-r-muted leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BOTTOM CTA ─────────────────────────────────── */}
      <section
        className="py-24 px-6 text-center relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #07050F 0%, #130A2E 100%)' }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(124,58,237,0.15) 0%, transparent 70%)',
          }}
        />
        <div className="relative max-w-2xl mx-auto">
          <p className="font-mono text-[11px] tracking-[0.3em] uppercase mb-4" style={{ color: 'rgba(167,139,250,0.6)' }}>
            {latestDate ? `最新简报 · ${latestDate}` : '每日更新'}
          </p>
          <h2
            className="font-display font-extrabold text-white mb-4"
            style={{ fontSize: 'clamp(40px, 6vw, 64px)', letterSpacing: '-0.02em' }}
          >
            今天有哪些机会？
          </h2>
          <p className="font-sans mb-10" style={{ fontSize: '16px', color: 'rgba(255,255,255,0.5)' }}>
            今日信号已整理完毕，结果正在等你
          </p>
          <Link
            href={ctaHref}
            className="inline-block font-mono font-bold tracking-wide px-8 py-4 rounded-full text-white transition-all hover:scale-105 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #7C3AED, #5B21B6)',
              boxShadow: '0 4px 32px rgba(124,58,237,0.6)',
              fontSize: '16px',
            }}
          >
            进入今日简报 →
          </Link>
          <p className="font-mono text-[11px] mt-6" style={{ color: 'rgba(255,255,255,0.2)' }}>
            见微 Prowl · 多源信号研判 · 来源可追溯
          </p>
        </div>
      </section>

    </div>
  )
}
