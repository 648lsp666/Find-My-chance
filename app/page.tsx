import { getLatestDate } from '@/lib/opportunities'
import LandingPage from '@/components/LandingPage'

export default function Home() {
  const latest = getLatestDate()
  return <LandingPage latestDate={latest} />
}
