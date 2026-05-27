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
        className="w-full mt-3 font-mono text-[13px] font-semibold tracking-wide py-2.5 rounded-xl text-white transition-all hover:opacity-90 active:scale-[0.98]"
        style={{ background: '#7C3AED', boxShadow: '0 2px 10px rgba(124,58,237,0.25)' }}
      >
        {isSignedIn ? '📄 生成 PRD' : '📄 生成 PRD'}
      </button>
      {open && <PrdModal opportunity={opportunity} onClose={() => setOpen(false)} />}
    </>
  )
}
