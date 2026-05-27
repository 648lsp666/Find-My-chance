'use client'

import { useState } from 'react'
import { useUser, useClerk } from '@clerk/nextjs'
import dynamic from 'next/dynamic'
import type { Opportunity } from '@/lib/opportunities'

const PrdModal = dynamic(() => import('./PrdModal'), { ssr: false })

interface Props {
  opportunity: Opportunity
}

export default function GeneratePrdButton({ opportunity }: Props) {
  const [open, setOpen] = useState(false)
  const { isSignedIn } = useUser()
  const { openSignIn } = useClerk()

  function handleClick() {
    if (!isSignedIn) {
      openSignIn()
      return
    }
    setOpen(true)
  }

  return (
    <>
      <button
        onClick={handleClick}
        className="w-full mt-3 font-mono text-[13px] font-semibold tracking-wide py-2.5 rounded-xl border transition-all hover:border-r-accent hover:text-r-accent active:scale-[0.98]"
        style={{ borderColor: '#E5E3F5', color: '#6B7280' }}
      >
        {isSignedIn ? '📄 生成 PRD' : '📄 登录后生成 PRD'}
      </button>
      {open && <PrdModal opportunity={opportunity} onClose={() => setOpen(false)} />}
    </>
  )
}
