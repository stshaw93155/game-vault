// js/storage.js
import { LS_KEYS } from './config.js';

// Helper to safely read from localStorage
function readJSON(key, defaultVal) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : defaultVal;
    } catch (e) {
        console.error(`Error reading ${key} from localStorage`, e);
        return defaultVal;
    }
}

// Helper to safely write to localStorage
function writeJSON(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (e) {
        console.error(`Error writing ${key} to localStorage`, e);
        if (e.name === 'QuotaExceededError') {
            alert("Storage full. Clear media to continue.");
        }
        return false;
    }
}

// ═══════════════════════════════════════════════
// ARTICLES
// ═══════════════════════════════════════════════
export function getArticles(publicOnly = false) {
    const articles = readJSON(LS_KEYS.ARTICLES, []);
    if (publicOnly) {
        return articles.filter(a => a.status === 'published');
    }
    return articles;
}

export function saveArticle(article) {
    const articles = getArticles();
    const index = articles.findIndex(a => a.id === article.id);
    if (index > -1) {
        articles[index] = { ...articles[index], ...article, updated_at: Date.now() };
    } else {
        articles.push({ ...article, created_at: Date.now(), updated_at: Date.now() });
    }
    return writeJSON(LS_KEYS.ARTICLES, articles);
}

export function deleteArticle(id) {
    const articles = getArticles().filter(a => a.id !== id);
    return writeJSON(LS_KEYS.ARTICLES, articles);
}

// ═══════════════════════════════════════════════
// CUSTOM GAMES
// ═══════════════════════════════════════════════
export function getCustomGames(publicOnly = false) {
    const games = readJSON(LS_KEYS.CUSTOM_GAMES, []);
    if (publicOnly) {
        return games.filter(g => g.status === 'live');
    }
    return games;
}

export function saveCustomGame(game) {
    const games = getCustomGames();
    const index = games.findIndex(g => g.id === game.id);
    if (index > -1) {
        games[index] = { ...games[index], ...game };
    } else {
        games.push({ ...game, created_at: Date.now() });
    }
    return writeJSON(LS_KEYS.CUSTOM_GAMES, games);
}

// ═══════════════════════════════════════════════
// BANNERS
// ═══════════════════════════════════════════════
export function getBanners(slot = null) {
    let banners = readJSON(LS_KEYS.BANNERS, []);

    // Clean up dates for active checking
    const today = new Date().toISOString().split('T')[0];

    banners = banners.filter(b => {
        if (!b.is_active) return false;
        if (b.start_date && b.start_date > today) return false;
        if (b.end_date && b.end_date < today) return false;
        if (slot !== null && b.slot !== slot) return false;
        return true;
    });
    return banners;
}

// ═══════════════════════════════════════════════
// REVIEWS
// ═══════════════════════════════════════════════
export function getReviews(gameId, publicOnly = true) {
    const allReviews = readJSON(LS_KEYS.REVIEWS, {});
    const gameReviews = allReviews[gameId] || [];
    if (publicOnly) {
        return gameReviews.filter(r => r.status === 'approved');
    }
    return gameReviews;
}

export function saveReview(gameId, review) {
    const allReviews = readJSON(LS_KEYS.REVIEWS, {});
    if (!allReviews[gameId]) allReviews[gameId] = [];

    const targetArray = allReviews[gameId];
    if (review.id) {
        const idx = targetArray.findIndex(r => r.id === review.id);
        if (idx > -1) targetArray[idx] = review;
        else targetArray.push(review);
    } else {
        targetArray.push({
            ...review,
            id: `rev_${Date.now()}`,
            created_at: Date.now()
        });
    }
    return writeJSON(LS_KEYS.REVIEWS, allReviews);
}

// ═══════════════════════════════════════════════
// WISHLIST
// ═══════════════════════════════════════════════
export function getWishlist() {
    return readJSON(LS_KEYS.WISHLIST, []);
}

export function toggleWishlist(gameId) {
    let wishlist = getWishlist();
    const idStr = String(gameId);
    const exists = wishlist.includes(idStr);

    if (exists) {
        wishlist = wishlist.filter(id => id !== idStr);
    } else {
        wishlist.push(idStr);
    }
    writeJSON(LS_KEYS.WISHLIST, wishlist);
    return !exists; // returns new true/false state
}

// ═══════════════════════════════════════════════
// SETTINGS & LOGGING
// ═══════════════════════════════════════════════
export function getSettings() {
    return readJSON(LS_KEYS.SETTINGS, {
        site_name: "GameVault",
        site_tagline: "Discover Your Next Game",
        rawg_api_key: "",
        items_per_page: 20,
        default_theme: "dark",
        features: {
            reviews: true,
            goty: true,
            wishlist: true,
            articles: true,
            maintenance_mode: false
        },
        announcement: {
            active: false,
            text: "",
            bg_color: "#BF1313"
        }
    });
}

export function logAction(action, contentType, contentTitle, adminRole) {
    const log = readJSON(LS_KEYS.ACTIVITY_LOG, []);
    log.unshift({
        action,
        content_type: contentType,
        content_title: contentTitle,
        admin_role: adminRole,
        timestamp: Date.now()
    });
    // Keep only last 100 entries max to prevent quota issues
    if (log.length > 100) log.length = 100;
    writeJSON(LS_KEYS.ACTIVITY_LOG, log);
}
