import { redirect } from 'next/navigation'
import { notFound } from 'next/navigation'
import { getLatestDate } from '@/lib/opportunities'

export default function TrendsRedirectPage() {
  const latest = getLatestDate()
  if (!latest) notFound()
  redirect(`/trends/${latest}`)
}
