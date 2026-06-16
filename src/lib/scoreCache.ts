// Client-side score cache. Same (domain + product + tags) → same cached score
// for 24h, so re-running the same campaign yields stable rankings instead of
// shuffling between runs. Bypass with the "Re-score" button per row.

import type { CompanyResult } from './types'

const CACHE_KEY_PREFIX = 'oie:scoreCache:v1:'
const TTL_MS = 24 * 60 * 60 * 1000

type CacheEntry = {
  cachedAt: number
  result: CompanyResult
}

async function hashKey(domain: string, product: string, tags: string[]): Promise<string> {
  const normalized = `${domain.trim().toLowerCase()}|${product.trim()}|${[...tags].sort().join(',')}`
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(normalized))
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 24)
  }
  // Fallback: simple non-crypto hash for SSR (cache is client-only so this rarely runs)
  let h = 0
  for (let i = 0; i < normalized.length; i++) h = ((h << 5) - h + normalized.charCodeAt(i)) | 0
  return Math.abs(h).toString(36)
}

export async function getCached(
  domain: string,
  product: string,
  tags: string[],
): Promise<CompanyResult | null> {
  if (typeof window === 'undefined') return null
  try {
    const key = CACHE_KEY_PREFIX + (await hashKey(domain, product, tags))
    const raw = window.localStorage.getItem(key)
    if (!raw) return null
    const entry = JSON.parse(raw) as CacheEntry
    if (Date.now() - entry.cachedAt > TTL_MS) {
      window.localStorage.removeItem(key)
      return null
    }
    return entry.result
  } catch {
    return null
  }
}

export async function setCached(
  domain: string,
  product: string,
  tags: string[],
  result: CompanyResult,
): Promise<void> {
  if (typeof window === 'undefined') return
  try {
    const key = CACHE_KEY_PREFIX + (await hashKey(domain, product, tags))
    const entry: CacheEntry = { cachedAt: Date.now(), result }
    window.localStorage.setItem(key, JSON.stringify(entry))
  } catch {
    // localStorage quota or disabled — silently skip caching
  }
}

export async function clearCachedFor(
  domain: string,
  product: string,
  tags: string[],
): Promise<void> {
  if (typeof window === 'undefined') return
  try {
    const key = CACHE_KEY_PREFIX + (await hashKey(domain, product, tags))
    window.localStorage.removeItem(key)
  } catch {}
}
