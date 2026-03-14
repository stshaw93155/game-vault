// js/home.js
import { getGames, getIgnNewsFeed } from './api.js';
import { getCustomGames, getSettings } from './storage.js';
import { injectNavbar, injectFooter, buildGameCard, buildSkeletonCard, buildRatingBadge, buildPlatformIcons, buildArticleCard } from './components.js';

document.addEventListener('DOMContentLoaded', async () => {
    injectNavbar();

    const settings = getSettings();
    if (settings.site_name) {
        document.title = `${settings.site_name} - ${settings.site_tagline || 'Home'}`;
    }

    // 1. Load Hero Grid (IGN Style)
    await initHeroGrid();

    // 2. Load Content Feeds
    const container = document.getElementById('game-rows-container');

    // Setup configurations for fetches
    const fetchLatest = () => {
        const today = new Date().toISOString().split('T')[0];
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        return getGames({ dates: `${thirtyDaysAgo},${today}`, ordering: '-released', page_size: 12 });
    };

    const fetchUpcoming = () => {
        const today = new Date().toISOString().split('T')[0];
        const sixMonths = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        return getGames({ dates: `${today},${sixMonths}`, ordering: 'released', page_size: 12 });
    };

    // Remaining Horizontal Rows
    const rowConfig = [
        { title: "COMING SOON", link: "upcoming.html", fetchCall: fetchUpcoming },
        { title: "TOP RATED ALL TIME", link: "browse.html?metacritic=90,100", fetchCall: () => getGames({ metacritic: '90,100', ordering: '-metacritic', page_size: 12 }) },
        { title: "ACTION GAMES", link: "browse.html?genres=action", fetchCall: () => getGames({ genres: 4, ordering: '-rating', page_size: 12 }) },
        { title: "RPG GAMES", link: "browse.html?genres=role-playing-games-rpg", fetchCall: () => getGames({ genres: 5, ordering: '-rating', page_size: 12 }) }
    ];

    // Inject Custom Games Row
    const customGames = getCustomGames(true).filter(g => g.feature_flags && !g.feature_flags.hero);
    if (customGames.length > 0) {
        injectRow(container, { title: "EDITOR'S PICKS", link: "browse.html?custom=true", data: customGames }, true);
    }

    // Inject horizontal row skeletons
    const rawgRowsData = rowConfig.map((cfg, i) => {
        const rowId = `rawg-row-${i}`;
        injectRowSkeleton(container, cfg.title, cfg.link, rowId);
        return { ...cfg, rowId };
    });

    // Sidebar: Trending Now
    const sidebarContainer = document.getElementById('sidebar-trending');

    // Grid: Top Rated / Latest Releases (in main feed)
    const latestGrid = document.getElementById('grid-latest-releases');

    // Execute fetches
    getGames({ ordering: '-rating', page_size: 8 }).then(res => {
        populateSidebar(sidebarContainer, res.results || []);
    }).catch(err => console.error(err));

    fetchLatest().then(res => {
        if (latestGrid) latestGrid.innerHTML = (res.results || []).map(g => buildGameCard(g)).join('');
    }).catch(err => {
        if (latestGrid) latestGrid.innerHTML = `<p class="text-danger">Failed to load releases.</p>`;
    });

    Promise.all(
        rawgRowsData.map(async row => {
            try {
                const response = await row.fetchCall();
                populateRow(row.rowId, response.results);
            } catch (err) {
                populateRowError(row.rowId);
            }
        })
    );

    // 3. Inject Articles Content Feed
    initArticlesVerticalFeed();

    injectFooter();
});

async function initHeroGrid() {
    const primaryContainer = document.getElementById('hero-primary');
    const secondaryContainer = document.getElementById('hero-secondary');
    if (!primaryContainer || !secondaryContainer) return;

    try {
        const res = await getGames({ ordering: '-added', page_size: 5 });
        const topGames = res.results || [];

        // Prepend any custom games flagged for hero
        const customHeros = getCustomGames(true).filter(g => g.feature_flags && g.feature_flags.hero);
        const heroGames = [...customHeros, ...topGames].slice(0, 5);

        if (heroGames.length === 0) return;

        const mainGame = heroGames[0];
        const sideGames = heroGames.slice(1);

        const buildItemHtml = (game, isPrimary) => {
            const img = (game.background_image || game.cover_image) ? (game.background_image || game.cover_image).replace('media/games/', 'media/crop/600/400/games/') : 'assets/placeholder.jpg';
            const desc = game.description_raw ? (game.description_raw.substring(0, 150) + "...") : "Experience the critically acclaimed title taking the gaming world by storm.";

            return `
                <a href="game.html?id=${game.id}" class="hero-item">
                    <img src="${img}" alt="${game.name}">
                    <div class="hero-item-overlay"></div>
                    <div class="hero-item-content">
                        <div class="hero-tag">FEATURED GAME</div>
                        <h2 class="hero-title">${game.name}</h2>
                        ${isPrimary ? `<p class="hero-desc">${desc}</p>` : ''}
                    </div>
                </a>
            `;
        };

        primaryContainer.innerHTML = buildItemHtml(mainGame, true);
        secondaryContainer.innerHTML = sideGames.map(g => buildItemHtml(g, false)).join('');

    } catch (error) {
        primaryContainer.innerHTML = `<div style="padding:100px; text-align:center; color:var(--color-danger)">Failed to load hero games. Check API.</div>`;
        console.error(error);
    }
}

function injectRowSkeleton(container, title, link, rowId) {
    const SKELETON_COUNT = 12;
    const skeletons = Array(SKELETON_COUNT).fill(buildSkeletonCard()).join('');

    const section = document.createElement('section');
    section.className = 'game-row-section';
    section.style.marginBottom = 'var(--space-2xl)';
    section.innerHTML = `
    <div class="section-heading">
      <h2>${title}</h2>
      <a href="${link}" class="game-row-link">See All &rarr;</a>
    </div>
    <div class="game-row-scroll-wrap">
      <button class="row-nav-btn row-nav-prev" onclick="document.getElementById('grid-${rowId}').scrollBy({left:-600,behavior:'smooth'})">&lang;</button>
      <div class="game-row-grid" id="grid-${rowId}">
        ${skeletons}
      </div>
      <button class="row-nav-btn row-nav-next" onclick="document.getElementById('grid-${rowId}').scrollBy({left:600,behavior:'smooth'})">&rang;</button>
    </div>
  `;
    container.appendChild(section);
}

function populateRow(rowId, gamesSource) {
    const grid = document.getElementById(`grid-${rowId}`);
    if (!grid || !gamesSource) return;

    if (gamesSource.length === 0) {
        grid.innerHTML = `<p class="text-muted">No games found.</p>`;
        return;
    }
    grid.innerHTML = gamesSource.map(g => buildGameCard(g)).join('');
}

function populateRowError(rowId) {
    const grid = document.getElementById(`grid-${rowId}`);
    if (grid) {
        grid.innerHTML = `<p class="text-danger">Error loading category.</p>`;
    }
}

function injectRow(container, config, isPreLoadedData = false) {
    const idStr = "row-" + Math.floor(Math.random() * 100000);
    injectRowSkeleton(container, config.title, config.link, idStr);
    if (isPreLoadedData) {
        populateRow(idStr, config.data);
    }
}

async function initArticlesVerticalFeed() {
    const settings = getSettings();
    if (!settings.features.articles) {
        const parent = document.getElementById('articles-heading');
        if (parent) parent.style.display = 'none';
        document.getElementById('articles-row').style.display = 'none';
        return;
    }

    const articlesContainer = document.getElementById('articles-row');
    if (!articlesContainer) return;

    // Fetch RSS feeds
    const [ignArticles] = await Promise.all([
        getIgnNewsFeed()
    ]);

    const mergedArticles = [...ignArticles]
        .sort((a, b) => b.created_at - a.created_at)
        .slice(0, 5);

    if (mergedArticles.length === 0) {
        articlesContainer.innerHTML = `<p class="text-muted">No featured articles available.</p>`;
        return;
    }

    // Using buildArticleCard from components, CSS overrides it to horizontal layout
    articlesContainer.innerHTML = mergedArticles.map(a => buildArticleCard(a)).join('');
}

function populateSidebar(container, gamesArray) {
    if (!container || gamesArray.length === 0) return;

    container.innerHTML = gamesArray.map((g, idx) => {
        const img = (g.background_image || g.cover_image) ? (g.background_image || g.cover_image).replace('media/games/', 'media/crop/600/400/games/') : 'assets/placeholder.jpg';
        const rating = g.metacritic || (g.rating ? Math.round(g.rating * 20) : '-');

        return `
        <a href="game.html?id=${g.id}" class="sidebar-game-item">
            <span style="font-family:var(--font-display); font-size:1.5rem; font-weight:700; color:var(--color-accent); width:20px; text-align:center">${idx + 1}</span>
            <img src="${img}" alt="${g.name}">
            <div class="sidebar-game-item-content">
                <div class="sidebar-game-title">${g.name}</div>
                <div class="sidebar-game-meta">
                    <span style="color:var(--color-warning)">★ ${rating}</span>
                </div>
            </div>
        </a>
        `;
    }).join('');
}
