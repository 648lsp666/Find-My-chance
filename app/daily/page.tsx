import { redirect } from 'next/navigation'
import { getLatestDate } from '@/lib/opportunities'

export default function DailyRedirect() {
  const latest = getLatestDate()
  if (latest) redirect(`/${latest}`)
  redirect('/')
}
