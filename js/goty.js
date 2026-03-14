// js/goty.js
import { getGameById } from './api.js';
import { getCustomGames } from './storage.js';
import { injectNavbar, injectFooter } from './components.js';
import { showToast } from './utils.js';

let config = {};
let votes = {};
let userVotes = {};
let nomineesData = [];
let activeCategory = '';

document.addEventListener('DOMContentLoaded', async () => {
    injectNavbar();

    loadConfig();

    // If GOTY disabled in global settings, redirect
    const settings = JSON.parse(localStorage.getItem('gv_settings') || '{}');
    if (settings.features && settings.features.goty === false) {
        window.location.href = 'index.html';
        return;
    }

    document.getElementById('goty-year').innerText = config.year;

    if (config.winner_announced && config.winner_game_id) {
        showWinner();
    }

    renderTabs();

    await fetchNominees();
    renderGrid();
    renderChart();

    injectFooter();
});

function loadConfig() {
    const storedConfig = JSON.parse(localStorage.getItem('gv_goty_config') || 'null');
    config = storedConfig || {
        year: new Date().getFullYear(),
        voting_open: true,
        winner_announced: false,
        winner_game_id: null,
        nominees: [3498, 452638, 3328, 5679], // Default fallback RAWG IDs (GTAV, Witcher, etc)
        categories: ["goty", "best_story", "best_visuals", "best_multiplayer"],
        voting_close_date: new Date(new Date().getFullYear(), 11, 31).toISOString().split('T')[0]
    };

    activeCategory = config.categories[0];

    votes = JSON.parse(localStorage.getItem('gv_goty_votes') || '{}');
    config.categories.forEach(c => {
        if (!votes[c]) votes[c] = {};
    });

    userVotes = JSON.parse(localStorage.getItem('gv_user_votes') || '{}');
}

async function showWinner() {
    const winnerId = config.winner_game_id;
    let winnerData = null;
    if (String(winnerId).startsWith('game_')) {
        winnerData = getCustomGames().find(g => g.id === winnerId);
    } else {
        try { winnerData = await getGameById(winnerId); } catch (e) { }
    }

    if (winnerData) {
        document.getElementById('winner-name').innerText = winnerData.name;
        document.getElementById('winner-banner').style.display = 'block';

        // Confetti
        if (window.confetti) {
            var duration = 3 * 1000;
            var end = Date.now() + duration;
            (function frame() {
                confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#bf1313', '#ffffff'] });
                confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#bf1313', '#ffffff'] });
                if (Date.now() < end) requestAnimationFrame(frame);
            }());
        }
    }
}

async function fetchNominees() {
    const customGames = getCustomGames(true);

    const promises = config.nominees.map(id => {
        const isCustom = String(id).startsWith('game_');
        if (isCustom) {
            const c = customGames.find(g => g.id === id);
            return Promise.resolve(c ? {
                id: c.id, name: c.name, background_image: c.cover_image, developers: c.developer ? [{ name: c.developer }] : []
            } : { id, name: "Unknown", error: true });
        } else {
            return getGameById(id).catch(err => ({ id, name: "Error loading", error: true }));
        }
    });

    nomineesData = await Promise.all(promises);
}

function renderTabs() {
    const mapTitles = { goty: "Game of the Year", best_story: "Best Story", best_visuals: "Best Visuals", best_multiplayer: "Best Multiplayer" };

    const html = config.categories.map(c => `
    <button class="category-tab ${c === activeCategory ? 'active' : ''}" data-cat="${c}">
      ${mapTitles[c] || c.replace('_', ' ')}
    </button>
  `).join('');

    const tabsContainer = document.getElementById('category-tabs');
    tabsContainer.innerHTML = html;

    tabsContainer.querySelectorAll('button').forEach(btn => {
        btn.onclick = (e) => {
            tabsContainer.querySelectorAll('button').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            activeCategory = e.target.dataset.cat;
            renderGrid();
            renderChart();
        };
    });
}

function renderGrid() {
    const container = document.getElementById('nominees-grid');

    const html = nomineesData.map(g => {
        if (g.error) return `<div class="nominee-card"><div style="padding:20px">Error loading nominee ${g.id}</div></div>`;

        const isVoted = userVotes[activeCategory] == g.id;
        const dev = g.developers && g.developers[0] ? g.developers[0].name : '';
        const imgStr = g.background_image ? g.background_image.replace('media/games/', 'media/crop/600/400/games/') : 'assets/placeholder.jpg';

        return `
      <article class="nominee-card ${isVoted ? 'voted' : ''}" id="nom-${g.id}">
        <div class="nom-img-wrap">
          <img src="${imgStr}" alt="${g.name}" />
          ${isVoted ? `<div style="position:absolute; top:12px; right:12px; background:var(--color-accent); color:white; padding:4px 12px; border-radius:12px; font-weight:bold; font-size:0.8rem">YOUR VOTE ✓</div>` : ''}
        </div>
        <div style="padding:var(--space-md); display:flex; flex-direction:column; flex-grow:1">
          <h3 style="font-family:var(--font-display); font-size:1.6rem; margin-bottom:4px">${g.name}</h3>
          <div style="color:var(--color-text-2); font-size:0.9rem; margin-bottom:16px">${dev}</div>
          <div style="margin-top:auto">
            <button class="${isVoted ? 'btn-ghost' : 'btn-primary'}" style="width:100%" onclick="window.gvVote('${g.id}')" ${!config.voting_open ? 'disabled' : ''}>
              ${!config.voting_open ? 'VOTING CLOSED' : (isVoted ? 'VOTED' : 'VOTE')}
            </button>
          </div>
        </div>
      </article>
    `;
    }).join('');

    container.innerHTML = html;
}

function renderChart() {
    const container = document.getElementById('leaderboard-chart');

    const catVotes = votes[activeCategory] || {};

    // Create an array mapping games to vote count, sort decending
    let chartData = nomineesData.filter(g => !g.error).map(g => ({
        id: g.id,
        name: g.name,
        count: catVotes[g.id] || 0
    })).sort((a, b) => b.count - a.count);

    const totalVotes = chartData.reduce((sum, item) => sum + item.count, 0);
    document.getElementById('total-votes').innerText = `${totalVotes.toLocaleString()} Votes Filtered`;

    container.innerHTML = chartData.map(d => {
        let percent = totalVotes === 0 ? 0 : (d.count / totalVotes) * 100;
        return `
      <div class="chart-row">
        <div class="chart-label" title="${d.name}">${d.name}</div>
        <div class="chart-bar-wrap">
          <div class="chart-bar-fill" style="width:0%" data-target="${percent}"></div>
        </div>
        <div class="chart-value">${d.count.toLocaleString()}</div>
      </div>
    `;
    }).join('');

    // Trigger animation next frame
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            container.querySelectorAll('.chart-bar-fill').forEach(bar => {
                bar.style.width = `${bar.dataset.target}%`;
            });
        });
    });
}

window.gvVote = async function (gameId) {
    if (!config.voting_open) {
        showToast("Voting is currently closed", "error");
        return;
    }

    const { getLoggedInUser } = await import('./user.js');
    if (!getLoggedInUser()) {
        window.location.href = 'login.html?return=' + encodeURIComponent(window.location.pathname + window.location.search);
        return;
    }

    if (userVotes[activeCategory]) {
        showToast("You have already voted in this category", "error");
        return;
    }

    // Set User vote
    userVotes[activeCategory] = gameId;
    localStorage.setItem('gv_user_votes', JSON.stringify(userVotes));

    // Increment aggregate
    if (!votes[activeCategory][gameId]) votes[activeCategory][gameId] = 0;
    votes[activeCategory][gameId]++;
    localStorage.setItem('gv_goty_votes', JSON.stringify(votes));

    // UI Updates
    const card = document.getElementById(`nom-${gameId}`);
    if (card) {
        card.classList.add('voted', 'pulsing');
        showToast("Vote recorded successfully!", "success");

        setTimeout(() => {
            card.classList.remove('pulsing');
            renderGrid(); // fully re-render to update btn text & badge
        }, 600);
    }

    renderChart();
};
