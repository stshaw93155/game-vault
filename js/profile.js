// js/profile.js
import { getFullCurrentUser, redirectToLogin, clearUserData, deleteUserAccount, updateUserProfile, changeUserPassword, AVATAR_COLORS, deleteUserReview, submitUserReview } from './user.js';
import { getArticles, getCustomGames } from './storage.js';
import { RAWG_BASE, RAWG_KEY } from './config.js';
import { injectNavbar, injectFooter, buildRatingBadge, buildPlatformIcons, buildCountdown } from './components.js';

let currentUser = null;

document.addEventListener('DOMContentLoaded', async () => {
    injectNavbar();
    injectFooter();

    currentUser = getFullCurrentUser();
    if (!currentUser) {
        redirectToLogin();
        return;
    }

    initSidebar();
    initSettingsForm();
    initTabs();

    // Initial Render
    await renderWishlist();
    renderArticles();
    renderReviews();
    await renderWatchlist();
});

// ── SIDEBAR & TABS ────────────────────────────────────────

function initSidebar() {
    document.getElementById('sidebar-username').innerText = currentUser.username;
    document.getElementById('sidebar-joined').innerText = `Joined ${new Date(currentUser.joined_at).toLocaleDateString()}`;

    const avatarEl = document.getElementById('sidebar-avatar');
    avatarEl.innerText = currentUser.avatar_initials;
    avatarEl.style.backgroundColor = currentUser.avatar_color;

    // Badges
    document.getElementById('badge-wishlist').innerText = currentUser.wishlist.length;
    document.getElementById('badge-articles').innerText = currentUser.saved_articles.length;
    document.getElementById('badge-reviews').innerText = currentUser.reviews.length;
    document.getElementById('badge-watchlist').innerText = currentUser.watchlist.length;
}

function initTabs() {
    const hash = window.location.hash.replace('#', '') || 'wishlist';
    switchTab(hash);

    document.querySelectorAll('.profile-nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.getAttribute('data-tab');
            switchTab(tab);
            window.location.hash = tab;
        });
    });
}

function switchTab(tabId) {
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.profile-nav-btn').forEach(b => b.classList.remove('active'));

    const panel = document.getElementById('tab-' + tabId);
    if (panel) panel.classList.add('active');

    const btn = document.querySelector(`.profile-nav-btn[data-tab="${tabId}"]`);
    if (btn) btn.classList.add('active');
}

// ── RENDERING HELPERS ─────────────────────────────────────

async function fetchGameData(gameId) {
    // Check custom games first
    const customMatch = getCustomGames().find(g => g.id.toString() === gameId.toString());
    if (customMatch) return customMatch;

    // Fetch from RAWG
    try {
        const res = await fetch(`${RAWG_BASE}/games/${gameId}?key=${RAWG_KEY}`);
        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    }
}

// ── WISHLIST ──────────────────────────────────────────────

async function renderWishlist() {
    const grid = document.getElementById('wishlist-grid');
    if (!currentUser.wishlist.length) {
        grid.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:48px 0; color:var(--color-text-2)">
            <div style="font-size:48px; margin-bottom:16px">🛒</div>
            <p>Your wishlist is empty.</p>
            <a href="browse.html" class="btn-primary" style="display:inline-block; margin-top:16px; text-decoration:none;">Browse Games</a>
        </div>`;
        return;
    }

    grid.innerHTML = '<div class="skeleton-card"></div><div class="skeleton-card"></div><div class="skeleton-card"></div>';

    const jobs = currentUser.wishlist.map(id => fetchGameData(id));
    const games = (await Promise.all(jobs)).filter(g => g !== null);

    grid.innerHTML = '';
    games.forEach(game => {
        const title = game.name;
        const img = game.background_image || game.cover_image || 'assets/placeholder.jpg';
        const status = currentUser.wishlist_status[game.id] || 'want';

        let platHtml = "";
        if (game.platforms && Array.isArray(game.platforms)) {
            platHtml = buildPlatformIcons(game.platforms);
        }

        const card = document.createElement('div');
        card.className = 'game-card';
        card.innerHTML = `
          <div class="game-card-img-wrap" onclick="window.location.href='game.html?id=${game.id}'" style="cursor:pointer">
            <img src="${img}" alt="${title}" class="game-card-img" />
            <button class="remove-btn" title="Remove" style="position:absolute; top:8px; right:8px; z-index:10; background:rgba(0,0,0,0.7); color:white; border:none; border-radius:50%; width:28px; height:28px; cursor:pointer;" onclick="event.stopPropagation(); window.removeWishlist('${game.id}')">×</button>
          </div>
          <div class="game-card-content">
            <h3 class="game-card-title">${title}</h3>
            <div style="margin-bottom:12px;">${platHtml}</div>
            
            <select class="status-select" onchange="window.updateStatus('${game.id}', this.value)" style="width:100%; padding:8px; background:var(--color-bg); border:1px solid var(--color-border); color:white; border-radius:4px; font-size:13px; margin-top:auto">
                <option value="want" ${status === 'want' ? 'selected' : ''}>Want to Play</option>
                <option value="playing" ${status === 'playing' ? 'selected' : ''}>Currently Playing</option>
                <option value="completed" ${status === 'completed' ? 'selected' : ''}>Completed</option>
                <option value="dropped" ${status === 'dropped' ? 'selected' : ''}>Dropped</option>
            </select>
          </div>
        `;
        grid.appendChild(card);
    });
}

window.removeWishlist = function (id) {
    if (!confirm("Remove from wishlist?")) return;
    import('./user.js').then(m => {
        m.toggleUserWishlist(id);
        window.location.reload();
    });
};

window.updateStatus = function (id, val) {
    import('./user.js').then(m => {
        m.setWishlistStatus(id, val);
    });
};

// ── SAVED ARTICLES ────────────────────────────────────────

function renderArticles() {
    const grid = document.getElementById('articles-grid');
    if (!currentUser.saved_articles.length) {
        grid.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:48px 0; color:var(--color-text-2)">
            <p>You haven't saved any articles.</p>
        </div>`;
        return;
    }

    const allArticles = getArticles();
    const saved = allArticles.filter(a => currentUser.saved_articles.includes(a.id));

    grid.innerHTML = '';
    saved.forEach(article => {
        const card = document.createElement('div');
        card.className = 'game-card';
        card.innerHTML = `
          <div class="game-card-img-wrap" onclick="window.location.href='article.html?slug=${article.slug}'" style="cursor:pointer">
            <img src="${article.featured_image || 'assets/placeholder.jpg'}" alt="${article.title}" class="game-card-img" />
            <button class="remove-btn" title="Remove" style="position:absolute; top:8px; right:8px; z-index:10; background:rgba(0,0,0,0.7); color:white; border:none; border-radius:50%; width:28px; height:28px; cursor:pointer;" onclick="event.stopPropagation(); window.removeArticle('${article.id}')">×</button>
          </div>
          <div class="game-card-content">
            <span class="tag-pill" style="margin-bottom:8px; background:var(--color-accent); color:white">${article.category}</span>
            <h3 class="game-card-title">${article.title}</h3>
            <p style="font-size:12px; color:var(--color-text-2); margin-top:8px">${new Date(article.created_at).toLocaleDateString()}</p>
          </div>
        `;
        grid.appendChild(card);
    });
}

window.removeArticle = function (id) {
    import('./user.js').then(m => {
        m.toggleSavedArticle(id);
        window.location.reload();
    });
};

// ── REVIEWS ───────────────────────────────────────────────

function renderReviews() {
    const list = document.getElementById('reviews-list');
    if (!currentUser.reviews.length) {
        list.innerHTML = `<div style="text-align:center; padding:48px 0; color:var(--color-text-2)">
            <p>You haven't written any reviews yet.</p>
        </div>`;
        return;
    }

    list.innerHTML = '';
    // Reverse sort to show newest first
    const reviews = [...currentUser.reviews].sort((a, b) => b.submitted_at - a.submitted_at);

    reviews.forEach(async (rev) => {
        const game = await fetchGameData(rev.game_id);
        const title = game ? game.name : 'Unknown Game';
        const img = game ? (game.background_image || game.cover_image) : 'assets/placeholder.jpg';

        let statusObj = { text: 'Pending', color: 'orange' };
        if (rev.status === 'approved') statusObj = { text: 'Published', color: 'var(--color-success)' };
        if (rev.status === 'rejected') statusObj = { text: 'Rejected', color: 'var(--color-danger)' };

        const card = document.createElement('div');
        card.className = 'user-review-card';
        card.innerHTML = `
            <img src="${img}" class="user-review-img" alt="${title}">
            <div class="user-review-content">
                <div class="user-review-header">
                    <div>
                        <a href="game.html?id=${rev.game_id}" class="user-review-title">${title}</a>
                        <div style="color:var(--color-accent); font-size:14px; margin-top:4px;">
                            ${'★'.repeat(rev.rating)}${'☆'.repeat(5 - rev.rating)}
                        </div>
                    </div>
                    <span style="font-size:12px; font-weight:600; padding:2px 8px; border-radius:12px; background-color:rgba(255,255,255,0.05); color:${statusObj.color}">
                        ${statusObj.text}
                    </span>
                </div>
                <p class="user-review-text">${rev.text}</p>
                <div class="user-review-actions">
                    <button class="btn-ghost" style="padding:4px 8px; font-size:12px;" onclick="window.delReview('${rev.id}', '${rev.game_id}')">Delete</button>
                    <span style="font-size:12px; color:var(--color-text-2); margin-left:auto; line-height:24px;">${new Date(rev.submitted_at).toLocaleDateString()}</span>
                </div>
            </div>
        `;
        list.appendChild(card);
    });
}

window.delReview = function (id, gameId) {
    if (!confirm("Delete this review permanently?")) return;
    deleteUserReview(id, gameId);
    window.location.reload();
};

// ── WATCHLIST ─────────────────────────────────────────────

async function renderWatchlist() {
    const grid = document.getElementById('watchlist-grid');
    if (!currentUser.watchlist.length) {
        grid.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:48px 0; color:var(--color-text-2)">
            <p>You aren't tracking any upcoming releases.</p>
        </div>`;
        return;
    }

    grid.innerHTML = '<div class="skeleton-card"></div><div class="skeleton-card"></div>';

    const jobs = currentUser.watchlist.map(id => fetchGameData(id));
    let games = (await Promise.all(jobs)).filter(g => g !== null);

    // Attempt sort by release date
    games = games.sort((a, b) => new Date(a.released || '2099') - new Date(b.released || '2099'));

    grid.innerHTML = '';
    games.forEach(game => {
        const title = game.name;
        const img = game.background_image || game.cover_image || 'assets/placeholder.jpg';
        const released = game.released ? new Date(game.released).toLocaleDateString() : 'TBA';
        const countdownHtml = game.released ? buildCountdown(game.released) : '<span style="color:var(--color-text-2)">TBA</span>';

        const card = document.createElement('div');
        card.className = 'game-card';
        card.innerHTML = `
          <div class="game-card-img-wrap" onclick="window.location.href='game.html?id=${game.id}'" style="cursor:pointer">
            <img src="${img}" alt="${title}" class="game-card-img" />
            <button class="remove-btn" title="Remove" style="position:absolute; top:8px; right:8px; z-index:10; background:rgba(0,0,0,0.7); color:white; border:none; border-radius:50%; width:28px; height:28px; cursor:pointer;" onclick="event.stopPropagation(); window.removeWatchlist('${game.id}')">×</button>
          </div>
          <div class="game-card-content">
            <h3 class="game-card-title">${title}</h3>
            <p style="font-size:13px; color:var(--color-text-2)">Release: <strong style="color:white">${released}</strong></p>
            ${countdownHtml}
          </div>
        `;
        grid.appendChild(card);
    });
}

window.removeWatchlist = function (id) {
    import('./user.js').then(m => {
        m.toggleWatchlist(id);
        window.location.reload();
    });
};

// ── SETTINGS ──────────────────────────────────────────────

function initSettingsForm() {
    const uName = document.getElementById('set-username');
    const uEmail = document.getElementById('set-email');
    uName.value = currentUser.username;
    uEmail.value = currentUser.email;

    const swatchContainer = document.getElementById('settings-swatches');
    let selectedColor = currentUser.avatar_color;

    AVATAR_COLORS.forEach((color) => {
        const div = document.createElement('div');
        div.className = `avatar-swatch ${color.hex === selectedColor ? 'selected' : ''}`;
        div.style.backgroundColor = color.hex;
        div.title = color.name;
        div.onclick = () => {
            document.querySelectorAll('#settings-swatches .avatar-swatch').forEach(el => el.classList.remove('selected'));
            div.classList.add('selected');
            selectedColor = color.hex;
            document.getElementById('sidebar-avatar').style.backgroundColor = color.hex;
        };
        swatchContainer.appendChild(div);
    });

    document.getElementById('form-profile-info').addEventListener('submit', (e) => {
        e.preventDefault();
        document.getElementById('err-set-username').style.display = 'none';

        const res = updateUserProfile(currentUser.id, {
            username: uName.value.trim(),
            email: uEmail.value.trim(),
            avatar_color: selectedColor
        });

        if (res.error) {
            document.getElementById('err-set-username').innerText = res.message;
            document.getElementById('err-set-username').style.display = 'block';
        } else {
            const msg = document.getElementById('msg-profile-info');
            msg.style.display = 'inline-block';
            setTimeout(() => { msg.style.display = 'none'; window.location.reload(); }, 1500);
        }
    });

    document.getElementById('form-change-pwd').addEventListener('submit', (e) => {
        e.preventDefault();
        const curr = document.getElementById('pwd-current').value;
        const fresh = document.getElementById('pwd-new').value;
        const err = document.getElementById('err-pwd-current');
        err.style.display = 'none';

        const res = changeUserPassword(currentUser.id, curr, fresh);
        if (res.error) {
            err.innerText = res.error;
            err.style.display = 'block';
        } else {
            const msg = document.getElementById('msg-change-pwd');
            msg.style.display = 'inline-block';
            e.target.reset();
            setTimeout(() => { msg.style.display = 'none'; }, 2000);
        }
    });
}

window.gvConfirmClearData = function () {
    const input = document.getElementById('clear-input').value;
    if (input === 'CLEAR') {
        clearUserData(currentUser.id);
        window.location.reload();
    } else {
        alert('Please type CLEAR exactly as shown.');
    }
};

window.gvConfirmDeleteAccount = function () {
    const input = document.getElementById('delete-input').value;
    if (input === 'DELETE') {
        deleteUserAccount(currentUser.id);
    } else {
        alert('Please type DELETE exactly as shown.');
    }
};
