// js/api.js
import { RAWG_KEY, RAWG_BASE } from './config.js';
import { getSettings } from './storage.js';

/**
 * Helper to get the active RAWG Key. Prioritizes settings, then fallback to config.js
 */
function getActiveKey() {
    const settings = getSettings();
    if (settings.rawg_api_key) return settings.rawg_api_key;
    return RAWG_KEY;
}

/**
 * Generate a unique 10-minute cache key based on URL using btoa base64 encoding.
 */
export function cachedFetch(url) {
    const keyMatch = getActiveKey();
    if (!keyMatch || keyMatch === "REPLACE_WITH_YOUR_RAWG_KEY") {
        console.warn("RAWG API KEY is missing or default. Fetch will likely fail.");
    }

    const fetchUrl = new URL(url);
    fetchUrl.searchParams.append('key', keyMatch);
    const finalUrlString = fetchUrl.toString();

    // Cache RAWG responses in sessionStorage for 10 minutes.
    // Use full base64 string to ensure absolute uniqueness across all parameters.
    const key = "rawg_cache_" + btoa(finalUrlString);
    const cached = sessionStorage.getItem(key);

    if (cached) {
        const { data, ts } = JSON.parse(cached);
        if (Date.now() - ts < 600000) { // 10 minutes
            return Promise.resolve(data);
        }
    }

    return fetch(finalUrlString)
        .then(r => {
            if (!r.ok) throw new Error(`RAWG API error: ${r.status}`);
            return r.json();
        })
        .then(data => {
            try {
                sessionStorage.setItem(key, JSON.stringify({ data, ts: Date.now() }));
            } catch (e) {
                console.warn("Session storage full, skipping cache for this req.");
            }
            return data;
        });
}

// ═══════════════════════════════════════════════
// RAWG ENDPOINTS
// ═══════════════════════════════════════════════

export function getGames(params = {}) {
    const url = new URL(`${RAWG_BASE}/games`);
    Object.entries(params).forEach(([k, v]) => {
        if (v) url.searchParams.append(k, v);
    });
    return cachedFetch(url.toString());
}

export function getGameById(id) {
    return cachedFetch(`${RAWG_BASE}/games/${id}`);
}

export function getScreenshots(id) {
    return cachedFetch(`${RAWG_BASE}/games/${id}/screenshots`);
}

export function getAdditions(id) {
    return cachedFetch(`${RAWG_BASE}/games/${id}/additions`);
}

export function getSeries(id) {
    return cachedFetch(`${RAWG_BASE}/games/${id}/game-series`);
}

export function getGenres() {
    return cachedFetch(`${RAWG_BASE}/genres`);
}

export function searchGames(query) {
    const url = new URL(`${RAWG_BASE}/games`);
    url.searchParams.append('search', query);
    url.searchParams.append('page_size', 5);
    return cachedFetch(url.toString());
}

// ═══════════════════════════════════════════════
// IGN EXTERNAL RSS
// ═══════════════════════════════════════════════

export async function getIgnNewsFeed() {
    // We use rss2json as a free CORS proxy to parse the feedburner XML feed into JSON
    const url = 'https://api.rss2json.com/v1/api.json?rss_url=http://feeds.feedburner.com/ign/news';

    // Check session cache for rate limits
    const cacheKey = 'ign_rss_cache';
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
        const { data, ts } = JSON.parse(cached);
        if (Date.now() - ts < 600000) { // 10 mins cache
            return data;
        }
    }

    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to fetch RSS feed");
        const json = await res.json();

        if (json.status !== 'ok') throw new Error("RSS Proxy returned error");

        const mappedArticles = json.items.map(item => {
            // Create a deterministic unique ID based on the URL so bookmarks don't break across reloads
            const idHash = btoa(encodeURIComponent(item.link)).replace(/[^a-zA-Z0-9]/g, '').slice(-25);
            return {
                id: `ign_${idHash}`,
                title: item.title,
                slug: `ign_${idHash}`, // Use ID as slug for internal routing
                category: 'ign news',
                author: item.author || 'IGN Editorial',
                featured_image: item.thumbnail || 'assets/placeholder.jpg',
                external_link: item.link,
                body: item.content || item.description || '',
                created_at: new Date(item.pubDate).getTime(),
                status: 'published'
            };
        });

        sessionStorage.setItem(cacheKey, JSON.stringify({ data: mappedArticles, ts: Date.now() }));
        return mappedArticles;

    } catch (err) {
        console.error("Failed to fetch IGN News Feed:", err);
        return [];
    }
}

