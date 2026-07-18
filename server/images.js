const UA = 'CadenceWeddingApp/1.0 (wedding planner)'

async function fetchWithTimeout(url, opts = {}, ms = 15000) {
  const controller = new AbortController()
  const t = setTimeout(() => controller.abort(), ms)
  try {
    return await fetch(url, { ...opts, signal: controller.signal })
  } finally {
    clearTimeout(t)
  }
}

export async function searchImages(query, page = 1) {
  const url = `https://api.openverse.org/v1/images/?q=${encodeURIComponent(query)}&page=${page}&page_size=20&mature=false`
  const res = await fetchWithTimeout(url, { headers: { 'User-Agent': UA } }, 15000)
  if (!res.ok) throw new Error(`Image search ${res.status}`)
  const json = await res.json()
  const results = (json.results || [])
    .filter((r) => r.url)
    .map((r) => ({
      id: r.id,
      title: r.title || 'Untitled',
      url: r.url,
      thumb: r.thumbnail || r.url,
      width: r.width,
      height: r.height,
      creator: r.creator || '',
      source: r.provider || r.source || '',
      landingUrl: r.foreign_landing_url || r.url,
    }))
  return { results, count: json.result_count || results.length }
}
