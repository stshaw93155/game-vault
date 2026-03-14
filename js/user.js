// js/user.js

/**
 * Returns the session object if the user is currently logged in, or null.
 */
export function getLoggedInUser() {
    let session = sessionStorage.getItem('gv_user_session');

    if (!session) {
        const persisted = localStorage.getItem('gv_user_session_persist');
        if (persisted) {
            const data = JSON.parse(persisted);
            if (data.expires_at && Date.now() < data.expires_at) {
                sessionStorage.setItem('gv_user_session', persisted);
                session = persisted;
            } else {
                localStorage.removeItem('gv_user_session_persist');
                return null;
            }
        }
    }

    return session ? JSON.parse(session) : null;
}

/**
 * Gets the full user object from gv_users array for the current session.
 */
export function getFullCurrentUser() {
    const session = getLoggedInUser();
    if (!session) return null;
    return getUserData(session.id);
}

/**
 * Gets a user object by ID from gv_users.
 */
export function getUserData(userId) {
    const users = JSON.parse(localStorage.getItem('gv_users') || '[]');
    return users.find(u => u.id === userId) || null;
}

/**
 * Saves updated user data back into the gv_users array.
 */
export function saveUserData(updatedUser) {
    const users = JSON.parse(localStorage.getItem('gv_users') || '[]');
    const index = users.findIndex(u => u.id === updatedUser.id);
    if (index > -1) {
        users[index] = updatedUser;
        localStorage.setItem('gv_users', JSON.stringify(users));
    }
}

/**
 * Registers a new user.
 */
export function registerUser(username, email, password, avatarColor) {
    const users = JSON.parse(localStorage.getItem('gv_users') || '[]');

    if (users.find(u => u.email === email)) {
        return { error: 'email', message: 'This email is already registered.' };
    }
    if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
        return { error: 'username', message: 'This username is taken.' };
    }

    const newUser = {
        id: 'user_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
        username: username,
        email: email,
        password: password, // client-side only constraint
        avatar_color: avatarColor,
        avatar_initials: username.slice(0, 2).toUpperCase(),
        joined_at: Date.now(),
        wishlist: [],
        wishlist_status: {},
        saved_articles: [],
        watchlist: [],
        reviews: [],
        goty_votes: {}
    };

    users.push(newUser);
    localStorage.setItem('gv_users', JSON.stringify(users));

    loginUser(email, password, false);
    return { success: true };
}

/**
 * Logs a user in, setting sessionStorage.
 */
export function loginUser(email, password, remember) {
    const users = JSON.parse(localStorage.getItem('gv_users') || '[]');
    const user = users.find(u => u.email === email && u.password === password);

    if (!user) {
        return { error: 'Invalid email or password.' };
    }

    const session = {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar_color: user.avatar_color,
        avatar_initials: user.avatar_initials,
        logged_in_at: Date.now(),
        expires_at: remember ? Date.now() + (30 * 24 * 60 * 60 * 1000) : null
    };

    sessionStorage.setItem('gv_user_session', JSON.stringify(session));
    if (remember) localStorage.setItem('gv_user_session_persist', JSON.stringify(session));

    const returnUrl = new URLSearchParams(window.location.search).get('return') || '/profile.html';
    window.location.href = returnUrl;
    return { success: true };
}

/**
 * Logs the current user out.
 */
export function logoutUser() {
    sessionStorage.removeItem('gv_user_session');
    localStorage.removeItem('gv_user_session_persist');
    window.location.reload();
}

/**
 * Helper: redirect non-authed users to login, keeping return path.
 */
export function redirectToLogin() {
    window.location.href = '/login.html?return=' + encodeURIComponent(window.location.pathname + window.location.search);
}

// ── WISHLIST ───────────────────────────────────────────

export function toggleUserWishlist(gameId) {
    const user = getFullCurrentUser();
    if (!user) { redirectToLogin(); return; }

    // cast ID slightly safely for string/int mismatches
    gameId = gameId.toString();

    const idx = user.wishlist.indexOf(gameId);
    if (idx > -1) {
        user.wishlist.splice(idx, 1);
        delete user.wishlist_status[gameId];
    } else {
        user.wishlist.push(gameId);
        user.wishlist_status[gameId] = 'want';
    }
    saveUserData(user);
    return idx === -1;
}

export function setWishlistStatus(gameId, status) {
    const user = getFullCurrentUser();
    if (!user) return;
    user.wishlist_status[gameId.toString()] = status;
    saveUserData(user);
}

export function isInWishlist(gameId) {
    const user = getFullCurrentUser();
    if (!user) return false;
    return user.wishlist.includes(gameId.toString());
}

// ── SAVED ARTICLES ─────────────────────────────────────

export function toggleSavedArticle(articleId) {
    const user = getFullCurrentUser();
    if (!user) { redirectToLogin(); return; }

    articleId = articleId.toString();
    const idx = user.saved_articles.indexOf(articleId);
    if (idx > -1) user.saved_articles.splice(idx, 1);
    else user.saved_articles.push(articleId);

    saveUserData(user);
    return idx === -1;
}

export function isArticleSaved(articleId) {
    const user = getFullCurrentUser();
    if (!user) return false;
    return user.saved_articles.includes(articleId.toString());
}

// ── REVIEWS ────────────────────────────────────────────

export function submitUserReview(gameId, rating, text) {
    const user = getFullCurrentUser();
    if (!user) { redirectToLogin(); return; }

    const review = {
        id: 'rev_' + Date.now(),
        game_id: gameId.toString(),
        rating: rating,
        text: text,
        status: 'pending',
        submitted_at: Date.now()
    };

    user.reviews.push(review);
    saveUserData(user);

    const allReviews = JSON.parse(localStorage.getItem('gv_reviews') || '{}');
    if (!allReviews[gameId]) allReviews[gameId] = [];
    allReviews[gameId].push({
        ...review,
        username: user.username,
        avatar_color: user.avatar_color,
        avatar_initials: user.avatar_initials,
        user_id: user.id
    });
    localStorage.setItem('gv_reviews', JSON.stringify(allReviews));

    return review;
}

export function deleteUserReview(reviewId, gameId) {
    const user = getFullCurrentUser();
    if (!user) return;

    user.reviews = user.reviews.filter(r => r.id !== reviewId);
    saveUserData(user);

    const allReviews = JSON.parse(localStorage.getItem('gv_reviews') || '{}');
    if (allReviews[gameId]) {
        allReviews[gameId] = allReviews[gameId].filter(r => r.id !== reviewId);
        localStorage.setItem('gv_reviews', JSON.stringify(allReviews));
    }
}

// ── WATCHLIST ──────────────────────────────────────────

export function toggleWatchlist(gameId) {
    const user = getFullCurrentUser();
    if (!user) { redirectToLogin(); return; }

    gameId = gameId.toString();
    const idx = user.watchlist.indexOf(gameId);
    if (idx > -1) user.watchlist.splice(idx, 1);
    else user.watchlist.push(gameId);
    saveUserData(user);
    return idx === -1;
}

export function isInWatchlist(gameId) {
    const user = getFullCurrentUser();
    if (!user) return false;
    return user.watchlist.includes(gameId.toString());
}

// ── ACCOUNT ────────────────────────────────────────────

export function updateUserProfile(userId, updates) {
    const users = JSON.parse(localStorage.getItem('gv_users') || '[]');
    const user = users.find(u => u.id === userId);
    if (!user) return { error: 'global', message: 'User not found' };

    if (updates.username && updates.username !== user.username) {
        if (users.find(u => u.id !== userId && u.username.toLowerCase() === updates.username.toLowerCase())) {
            return { error: 'username', message: 'Username already taken.' };
        }
    }

    Object.assign(user, updates);
    if (updates.username) {
        user.avatar_initials = user.username.slice(0, 2).toUpperCase();
    }
    saveUserData(user);

    const session = JSON.parse(sessionStorage.getItem('gv_user_session') || '{}');
    Object.assign(session, { username: user.username, avatar_color: user.avatar_color, avatar_initials: user.avatar_initials });
    sessionStorage.setItem('gv_user_session', JSON.stringify(session));

    return { success: true };
}

export function changeUserPassword(userId, currentPassword, newPassword) {
    const user = getUserData(userId);
    if (!user) return { error: 'User not found' };
    if (user.password !== currentPassword) return { error: 'Current password is incorrect.' };
    user.password = newPassword;
    saveUserData(user);
    return { success: true };
}

export function clearUserData(userId) {
    const user = getUserData(userId);
    if (!user) return;

    user.wishlist = [];
    user.wishlist_status = {};
    user.saved_articles = [];
    user.watchlist = [];

    saveUserData(user);

    // Removing reviews takes a bit more effort:
    const allReviews = JSON.parse(localStorage.getItem('gv_reviews') || '{}');
    user.reviews.forEach(rev => {
        if (allReviews[rev.game_id]) {
            allReviews[rev.game_id] = allReviews[rev.game_id].filter(r => r.id !== rev.id);
        }
    });
    localStorage.setItem('gv_reviews', JSON.stringify(allReviews));
    user.reviews = [];
    saveUserData(user);
}

export function deleteUserAccount(userId) {
    const users = JSON.parse(localStorage.getItem('gv_users') || '[]');
    const filtered = users.filter(u => u.id !== userId);
    localStorage.setItem('gv_users', JSON.stringify(filtered));

    const allReviews = JSON.parse(localStorage.getItem('gv_reviews') || '{}');
    for (const gameId in allReviews) {
        allReviews[gameId] = allReviews[gameId].filter(r => r.user_id !== userId);
    }
    localStorage.setItem('gv_reviews', JSON.stringify(allReviews));

    sessionStorage.removeItem('gv_user_session');
    localStorage.removeItem('gv_user_session_persist');

    window.location.href = '/index.html';
}

export const AVATAR_COLORS = [
    { name: "Red", hex: "#EF4444" },
    { name: "Blue", hex: "#3B82F6" },
    { name: "Green", hex: "#22C55E" },
    { name: "Purple", hex: "#8B5CF6" },
    { name: "Orange", hex: "#F97316" },
    { name: "Pink", hex: "#EC4899" },
    { name: "Teal", hex: "#14B8A6" },
    { name: "Yellow", hex: "#EAB308" }
];
