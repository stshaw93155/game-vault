// js/article.js
import { getCustomGames, getSettings } from './storage.js';
import { getGameById, getIgnNewsFeed } from './api.js';
import { injectNavbar, injectFooter, buildGameCard, buildArticleCard } from './components.js';
import { showToast, estimateReadTime, formatDate } from './utils.js';

document.addEventListener('DOMContentLoaded', async () => {
    injectNavbar();

    if (!getSettings().features.articles) {
        window.location.href = 'index.html';
        return;
    }

    const params = new URLSearchParams(window.location.search);
    const slug = params.get('slug');
    const isPreview = params.get('preview') === 'true'; // allows reading drafts from admin

    if (!slug) {
        window.location.href = 'articles.html';
        return;
    }

    // Find article from RSS list
    const [ignArts] = await Promise.all([
        getIgnNewsFeed()
    ]);
    const allArts = [...ignArts];
    const article = allArts.find(a => a.slug === slug);

    if (!article) {
        document.getElementById('art-main').innerHTML = `<div class="text-center" style="padding:100px 0"><h2 class="text-danger">Article Not Found</h2><a href="articles.html" class="btn-ghost" style="margin-top:20px">Back to News</a></div>`;
        injectFooter();
        return;
    }

    document.title = `${article.title} - GameVault`;

    // SEO tags mock mapping
    if (article.meta_description) {
        const meta = document.createElement('meta');
        meta.name = "description"; meta.content = article.meta_description;
        document.head.appendChild(meta);
    }

    // Populate primary content
    document.getElementById('art-cat').innerText = (article.category || 'News').toUpperCase();
    document.getElementById('art-title').innerText = article.title;
    document.getElementById('art-author').innerText = article.author || 'Admin';
    document.getElementById('art-date').innerText = formatDate(article.created_at);
    document.getElementById('art-read').innerText = estimateReadTime(article.body);

    const heroImg = document.getElementById('art-hero');
    if (article.featured_image) {
        heroImg.src = article.featured_image;
    } else {
        heroImg.style.display = 'none';
    }

    document.getElementById('art-body').innerHTML = article.body || "";

    if (article.tags && Array.isArray(article.tags)) {
        document.getElementById('art-tags').innerHTML = article.tags.map(t => `<span class="tag-pill">#${t}</span>`).join('');
    }

    document.getElementById('btn-share').onclick = () => {
        let url = window.location.href;
        if (isPreview) url = url.replace('&preview=true', '');
        navigator.clipboard.writeText(url);
        showToast("URL copied to clipboard", "success");
    };

    // Handle Bookmarking
    const bookmarkBtn = document.getElementById('btn-bookmark-header');

    // Check initial state
    const sessionStr = sessionStorage.getItem('gv_user_session') || localStorage.getItem('gv_user_session_persist');
    let isSaved = false;
    if (sessionStr) {
        const sid = JSON.parse(sessionStr).id;
        const users = JSON.parse(localStorage.getItem('gv_users') || '[]');
        const u = users.find(x => x.id === sid);
        if (u && u.saved_articles) isSaved = u.saved_articles.includes(String(article.id));
    }
    bookmarkBtn.style.color = isSaved ? 'var(--color-accent)' : 'var(--color-text-3)';

    bookmarkBtn.onclick = () => {
        if (window.gvToggleArticle) {
            window.gvToggleArticle(article.id, bookmarkBtn);
        }
    };

    // Handle Related Game
    if (article.related_game_id) {
        document.getElementById('sidebar-game').style.display = 'block';
        const sContainer = document.getElementById('sidebar-game-card');
        sContainer.innerHTML = '<div class="text-muted text-center" style="padding:20px">Loading game...</div>';

        try {
            let gameObj = null;
            const isCustom = String(article.related_game_id).startsWith('game_');
            if (isCustom) {
                gameObj = getCustomGames(true).find(g => g.id === article.related_game_id);
            } else {
                gameObj = await getGameById(article.related_game_id);
            }
            if (gameObj) {
                // Hack to map custom to build card safely
                if (isCustom) {
                    gameObj.background_image = gameObj.cover_image;
                    gameObj.rating = gameObj.metacritic ? gameObj.metacritic / 20 : 0;
                }
                sContainer.innerHTML = buildGameCard(gameObj);
            } else {
                document.getElementById('sidebar-game').style.display = 'none';
            }
        } catch (e) {
            document.getElementById('sidebar-game').style.display = 'none';
        }
    }

    // Handle More Articles
    const catArticles = getArticles(true).filter(a => a.category === article.category && a.id !== article.id).sort((a, b) => b.created_at - a.created_at).slice(0, 3);

    if (catArticles.length > 0) {
        document.getElementById('sidebar-more').style.display = 'block';
        document.getElementById('sidebar-more-list').innerHTML = catArticles.map(a => `
       <a href="article.html?slug=${a.slug}" style="display:flex; gap:12px; background:var(--color-surface); padding:8px; border-radius:var(--radius-sm)">
         <img src="${a.featured_image || 'assets/placeholder.jpg'}" style="width:80px; height:60px; object-fit:cover; border-radius:4px" />
         <div style="font-weight:600; font-size:0.9rem">${a.title}</div>
       </a>
    `).join('');
    }

    injectFooter();
});
