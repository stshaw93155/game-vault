// js/wishlist.js
import { getGameById } from './api.js';
import { getWishlist, getCustomGames, getSettings } from './storage.js';
import { injectNavbar, injectFooter, buildPlatformIcons, buildRatingBadge } from './components.js';

let loadedGames = [];
let statuses = {};
let pendingUndo = null;
let undoTimeout = null;

document.addEventListener('DOMContentLoaded', async () => {
    injectNavbar();

    if (!getSettings().features.wishlist) {
        window.location.href = 'index.html';
        return;
    }

    statuses = JSON.parse(localStorage.getItem('gv_wishlist_status') || '{}');
    const wishlistIds = getWishlist();

    if (wishlistIds.length === 0) {
        document.getElementById('wl-grid').innerHTML = `
      <div style="grid-column:1/-1; text-align:center; padding:100px 0; background:var(--color-surface); border-radius:var(--radius-lg); border:1px solid var(--color-border)">
        <h2 style="margin-bottom:16px">Your library is empty.</h2>
        <p class="text-muted" style="margin-bottom:24px">Start discovering games to add them to your collection.</p>
        <button class="btn-primary" onclick="window.location.href='browse.html'">BROWSE GAMES</button>
      </div>
    `;
        updateStats();
        injectFooter();
        return;
    }

    const customList = getCustomGames(true);

    // Batch fetches
    try {
        const promises = wishlistIds.map((id, index) => {
            // index is used for generic "date added" sort fallback
            const isCustom = String(id).startsWith('game_');
            let p;
            if (isCustom) {
                const c = customList.find(g => g.id === id);
                p = Promise.resolve(c ? { ...c, background_image: c.cover_image } : null);
            } else {
                const fakeNumeric = customList.find(g => String(g.id) == String(id));
                if (fakeNumeric) p = Promise.resolve({ ...fakeNumeric, background_image: fakeNumeric.cover_image });
                else p = getGameById(id).catch(() => null);
            }
            return p.then(data => {
                if (data) data._addedIndex = index; // retain order
                return data;
            });
        });

        const results = await Promise.all(promises);
        loadedGames = results.filter(g => g !== null);

        applyFiltersAndSort();

        // Bind controls
        document.getElementById('wl-filter').addEventListener('change', applyFiltersAndSort);
        document.getElementById('wl-sort').addEventListener('change', applyFiltersAndSort);
        document.getElementById('undo-btn').addEventListener('click', executeUndo);

    } catch (e) {
        document.getElementById('wl-grid').innerHTML = `<div class="text-danger">Error loading wishlist data.</div>`;
    }

    updateStats();
    injectFooter();
});

function applyFiltersAndSort() {
    const filterVal = document.getElementById('wl-filter').value;
    const sortVal = document.getElementById('wl-sort').value;

    let view = [...loadedGames];

    // Filter
    if (filterVal !== 'all') {
        view = view.filter(g => {
            const state = statuses[g.id] || 'want';
            return state === filterVal;
        });
    }

    // Sort
    if (sortVal === 'date-desc') {
        view.sort((a, b) => b._addedIndex - a._addedIndex); // inverse array order
    } else if (sortVal === 'rating-desc') {
        view.sort((a, b) => {
            const rA = a.metacritic || (a.rating ? a.rating * 20 : 0);
            const rB = b.metacritic || (b.rating ? b.rating * 20 : 0);
            return rB - rA;
        });
    } else if (sortVal === 'released-desc') {
        view.sort((a, b) => new Date(b.released || 0) - new Date(a.released || 0));
    } else if (sortVal === 'title-asc') {
        view.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    }

    renderGrid(view);
}

function renderGrid(games) {
    const grid = document.getElementById('wl-grid');

    if (games.length === 0) {
        grid.innerHTML = `<div class="text-muted text-center" style="grid-column:1/-1; padding:40px">No games match this filter.</div>`;
        return;
    }

    grid.innerHTML = games.map(g => {
        const status = statuses[g.id] || 'want';
        const imgStr = g.background_image ? g.background_image.replace('media/games/', 'media/crop/600/400/games/') : 'assets/placeholder.jpg';
        const title = g.name || "Unknown";

        return `
      <article class="game-card" id="wl-card-${g.id}" style="cursor:default">
        <div class="game-card-img-wrap" onclick="window.location.href='game.html?id=${g.id}'" style="cursor:pointer">
          <img src="${imgStr}" onerror="this.src='assets/placeholder.jpg'" />
        </div>
        <div class="game-card-content">
          <h3 class="game-card-title" style="cursor:pointer" onclick="window.location.href='game.html?id=${g.id}'">${title}</h3>
          
          <div class="wl-card-actions">
            <select class="wl-select" style="flex:1" onchange="window.gvUpdateStatus('${g.id}', this.value)">
              <option value="want" ${status === 'want' ? 'selected' : ''}>Want to Play</option>
              <option value="playing" ${status === 'playing' ? 'selected' : ''}>Playing</option>
              <option value="completed" ${status === 'completed' ? 'selected' : ''}>Completed</option>
              <option value="dropped" ${status === 'dropped' ? 'selected' : ''}>Dropped</option>
            </select>
            <button class="wl-card-remove" title="Remove" onclick="window.gvRemoveGame('${g.id}')">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
          </div>
        </div>
      </article>
    `;
    }).join('');
}

window.gvUpdateStatus = function (gameId, newStatus) {
    statuses[gameId] = newStatus;
    localStorage.setItem('gv_wishlist_status', JSON.stringify(statuses));
    updateStats();

    // If actively filtering, maybe immediately hide the card 
    const filterVal = document.getElementById('wl-filter').value;
    if (filterVal !== 'all' && filterVal !== newStatus) {
        const card = document.getElementById(`wl-card-${gameId}`);
        if (card) {
            card.style.opacity = '0';
            setTimeout(() => applyFiltersAndSort(), 300);
        }
    }
};

window.gvRemoveGame = function (gameId) {
    // Save for undo
    const gameObj = loadedGames.find(g => String(g.id) === String(gameId));
    const previousStatus = statuses[gameId];

    pendingUndo = {
        gameId, gameObj, previousStatus
    };

    // Remove from localStorage array
    let wList = getWishlist();
    wList = wList.filter(id => id !== String(gameId));
    localStorage.setItem('gv_wishlist', JSON.stringify(wList));

    // Remove object from loaded memory
    loadedGames = loadedGames.filter(g => String(g.id) !== String(gameId));

    // Remove from UI
    const card = document.getElementById(`wl-card-${gameId}`);
    if (card) {
        card.style.transition = 'opacity 0.3s, transform 0.3s';
        card.style.opacity = '0';
        card.style.transform = 'scale(0.9)';
        setTimeout(() => { applyFiltersAndSort(); updateStats(); }, 300);
    }

    // Show Toast
    const toast = document.getElementById('undo-toast');
    toast.classList.add('show');

    clearTimeout(undoTimeout);
    undoTimeout = setTimeout(() => {
        toast.classList.remove('show');
        pendingUndo = null;
    }, 5000);
};

function executeUndo() {
    if (!pendingUndo) return;

    // Restore memory
    loadedGames.push(pendingUndo.gameObj);

    // Restore local storage
    let wList = getWishlist();
    wList.push(String(pendingUndo.gameId));
    localStorage.setItem('gv_wishlist', JSON.stringify(wList));

    if (pendingUndo.previousStatus) {
        statuses[pendingUndo.gameId] = pendingUndo.previousStatus;
    }
    localStorage.setItem('gv_wishlist_status', JSON.stringify(statuses));

    // Clear timeout & hide toast
    clearTimeout(undoTimeout);
    document.getElementById('undo-toast').classList.remove('show');
    pendingUndo = null;

    applyFiltersAndSort();
    updateStats();
}

function updateStats() {
    document.getElementById('stat-total').innerText = loadedGames.length;

    let playing = 0, completed = 0;
    loadedGames.forEach(g => {
        const s = statuses[g.id] || 'want';
        if (s === 'playing') playing++;
        if (s === 'completed') completed++;
    });

    document.getElementById('stat-playing').innerText = playing;
    document.getElementById('stat-completed').innerText = completed;
}
