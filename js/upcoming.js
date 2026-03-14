// js/upcoming.js
import { getGames } from './api.js';
import { getCustomGames } from './storage.js';
import { injectNavbar, injectFooter, buildCountdown, buildPlatformIcons } from './components.js';
import { showToast } from './utils.js';

let allUpcomingGames = [];
let currentFilter = 'all';

document.addEventListener('DOMContentLoaded', async () => {
    injectNavbar();

    bindTabs();

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const sixMonths = new Date(today.getTime() + 180 * 24 * 60 * 60 * 1000);
    const sixMonthsStr = sixMonths.toISOString().split('T')[0];

    try {
        const rawgReq = await getGames({ dates: `${todayStr},${sixMonthsStr}`, ordering: 'released', page_size: 40 });
        let games = rawgReq.results || [];

        // Merge custom games using string localized dates
        const customGames = getCustomGames(true).filter(g => {
            if (!g.released) return false;
            const d = new Date(g.released);
            return d >= today && d <= sixMonths;
        });

        // format custom games for UI 
        const formattedCustom = customGames.map(c => ({
            id: c.id,
            name: c.name,
            background_image: c.cover_image,
            released: c.released,
            platforms: (c.platforms || []).map(slug => ({ platform: { slug } })),
            added: 0 // local mock hype
        }));

        allUpcomingGames = [...formattedCustom, ...games].sort((a, b) => new Date(a.released) - new Date(b.released));

        renderCalendar();

    } catch (e) {
        document.getElementById('calendar-container').innerHTML = `<div class="text-danger">Failed to load upcoming calendar</div>`;
    }

    injectFooter();
});

function bindTabs() {
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(t => {
        t.addEventListener('click', (e) => {
            tabs.forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            currentFilter = e.target.dataset.filter;
            renderCalendar();
        });
    });
}

function renderCalendar() {
    const container = document.getElementById('calendar-container');
    if (allUpcomingGames.length === 0) {
        container.innerHTML = `<p class="text-muted text-center">No upcoming releases found within 6 months.</p>`;
        return;
    }

    // Apply platform filters
    let filtered = allUpcomingGames;
    if (currentFilter !== 'all') {
        filtered = allUpcomingGames.filter(g => {
            if (!g.platforms) return false;
            const slugs = g.platforms.map(p => (p.platform && p.platform.slug) || (p.slug));
            if (currentFilter === 'pc') return slugs.some(s => s.includes('pc'));
            if (currentFilter === 'console') return slugs.some(s => s.includes('playstation') || s.includes('xbox') || s.includes('nintendo') || s.includes('switch'));
            if (currentFilter === 'mobile') return slugs.some(s => s.includes('android') || s.includes('ios'));
            return true;
        });
    }

    if (filtered.length === 0) {
        container.innerHTML = `<p class="text-muted text-center">No games match this platform filter.</p>`;
        return;
    }

    // Calculate max hype for bar scaling (top 1 = 100%)
    const maxAdded = Math.max(...filtered.map(g => g.added || 1));

    // Group by "Month YYYY"
    const grouped = {};
    filtered.forEach(g => {
        if (!g.released) return;
        const d = new Date(g.released);
        // Note: depending on local tz, month could shift, using crude UTC approach
        const monthStr = d.toLocaleDateString('default', { month: 'long', year: 'numeric', timeZone: 'UTC' });
        if (!grouped[monthStr]) grouped[monthStr] = [];
        grouped[monthStr].push(g);
    });

    let html = '';

    for (let [month, games] of Object.entries(grouped)) {
        html += `<section class="month-section">
      <h2 class="month-heading">${month}</h2>
      <div class="upcoming-grid">
         ${games.map(g => buildUpcomingCard(g, maxAdded)).join('')}
      </div>
    </section>`;
    }

    container.innerHTML = html;
}

function buildUpcomingCard(game, maxAdded) {
    const sessionStr = sessionStorage.getItem('gv_user_session') || localStorage.getItem('gv_user_session_persist');
    let isWatchlisted = false;
    if (sessionStr) {
        const sid = JSON.parse(sessionStr).id;
        const users = JSON.parse(localStorage.getItem('gv_users') || '[]');
        const u = users.find(x => x.id === sid);
        if (u && u.watchlist) isWatchlisted = u.watchlist.includes(String(game.id));
    }

    const dateStr = new Date(game.released).toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' });
    const hypePercent = Math.min(((game.added || 1) / maxAdded) * 100, 100);

    const imgStr = game.background_image ? game.background_image.replace('media/games/', 'media/crop/600/400/games/') : 'assets/placeholder.jpg';

    // Create unique id for countdown injection
    return `
    <article class="upcoming-card">
       <div class="uc-img-wrap" onclick="window.location.href='game.html?id=${game.id}'" style="cursor:pointer">
         <img src="${imgStr}" onerror="this.src='assets/placeholder.jpg'" />
         <div class="uc-date-badge">${dateStr}</div>
       </div>
       <div class="uc-content">
         <h3 class="uc-title" onclick="window.location.href='game.html?id=${game.id}'" style="cursor:pointer">${game.name}</h3>
         <div style="margin-bottom:8px">
           ${buildPlatformIcons(game.platforms)}
         </div>
         
         <div class="hype-container">
           <div class="hype-label"><span>Hype</span> <span>${game.added ? game.added.toLocaleString() : 0}</span></div>
           <div class="hype-track"><div class="hype-fill" style="width:${hypePercent}%"></div></div>
         </div>
         
         <div style="margin-top:auto">
           <div style="font-size:0.8rem; color:var(--color-text-2);text-transform:uppercase">Time until launch</div>
           ${buildCountdown(game.released)}
           <button class="btn-ghost" style="width:100%; margin-top:16px; border-color:${isWatchlisted ? 'var(--color-success)' : 'var(--color-border)'}" onclick="window.gvToggleWatchlist('${game.id}', this)">
             ${isWatchlisted ? '✓ NOTIFYING YOU' : 'NOTIFY ME'}
           </button>
         </div>
       </div>
    </article>
  `;
}

// Global hook for watchlist
window.gvToggleWatchlist = async function (id, btn) {
    const { getLoggedInUser, toggleWatchlist } = await import('./user.js');
    const session = getLoggedInUser();

    if (!session) {
        window.location.href = 'login.html?return=' + encodeURIComponent(window.location.pathname + window.location.search);
        return;
    }

    const isNowWatchlisted = toggleWatchlist(id);

    if (isNowWatchlisted) {
        showToast("We'll notify you on release!", "success");
        if (btn) {
            btn.innerText = "✓ NOTIFYING YOU";
            btn.style.borderColor = "var(--color-success)";
        }
    } else {
        showToast("Removed from upcoming notifications", "info");
        if (btn) {
            btn.innerText = "NOTIFY ME";
            btn.style.borderColor = "var(--color-border)";
        }
    }
};
