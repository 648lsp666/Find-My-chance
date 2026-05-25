export interface TrendingRepo {
  owner: string
  repo: string
  description: string
  url: string
  starsToday: number
  language: string
}

export async function fetchGithubTrending(): Promise<TrendingRepo[]> {
  try {
    // Use GitHub Search API: repos pushed in last 2 days with ≥500 stars, not forks
    const since = new Date(Date.now() - 2 * 86_400_000).toISOString().slice(0, 10)
    const res = await fetch(
      `https://api.github.com/search/repositories?q=pushed:>${since}+stars:500..50000+fork:false&sort=stars&order=desc&per_page=6`,
      {
        next: { revalidate: 3600 },
        headers: { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' },
      },
    )
    if (!res.ok) return []
    const data = await res.json()
    return (data.items ?? []).map((item: any) => ({
      owner:       item.owner?.login ?? '',
      repo:        item.name         ?? '',
      description: item.description  ?? '',
      url:         item.html_url     ?? `https://github.com/${item.owner?.login}/${item.name}`,
      starsToday:  item.stargazers_count ?? 0,
      language:    item.language     ?? '',
    }))
  } catch {
    return []
  }
}
