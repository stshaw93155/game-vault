// js/config.js

// ═══════════════════════════════════════════════
// API CONFIGURATION
// ═══════════════════════════════════════════════
export const RAWG_KEY = "8de19ee83c2e4097baac60857d62b95a"; // User's RAWG API key
export const RAWG_BASE = "https://api.rawg.io/api";

// ═══════════════════════════════════════════════
// ═══════════════════════════════════════════════
// CONSTANTS & MAPPINGS

// ═══════════════════════════════════════════════
// CONSTANTS & MAPPINGS
// ═══════════════════════════════════════════════
export const PLATFORM_IDS = {
    pc: 4,
    ps5: 187,
    xbox: 186,
    switch: 7
};

export const GENRE_IDS = {
    action: 4,
    rpg: 5
};

// Currently supported internal role mappings
export const ADMIN_ROLES = {
    SUPERADMIN: "superadmin",
    EDITOR: "editor",
    MODERATOR: "moderator"
};

// Hardcoded Admin Credential
export const ADMIN_CREDENTIAL = {
    email: "stshaw112@gmail.com",
    password: "Gamervault@2026",
    name: "Sumit Shaw",
    role: "superadmin",
    avatar: "SS"
};

// ═══════════════════════════════════════════════
// LOCALSTORAGE KEYS REGISTRY
// ═══════════════════════════════════════════════
export const LS_KEYS = {
    // Admin Data
    ARTICLES: "gv_articles",
    CUSTOM_GAMES: "gv_custom_games",
    BANNERS: "gv_banners",
    REVIEWS: "gv_reviews",
    MEDIA: "gv_media",
    GOTY_CONFIG: "gv_goty_config",
    GOTY_VOTES: "gv_goty_votes",
    SETTINGS: "gv_settings",
    NAVIGATION: "gv_navigation",
    ACTIVITY_LOG: "gv_activity_log",

    // User Data
    WISHLIST: "gv_wishlist",
    WISHLIST_STATUS: "gv_wishlist_status",
    WATCHLIST: "gv_watchlist",
    USER_VOTES: "gv_user_votes",
    THEME: "gv_theme",
    BROWSE_VIEW: "gv_browse_view", // Grid or List view preference

    // Session Data
    ADMIN_SESSION: "gv_admin_session"
};
