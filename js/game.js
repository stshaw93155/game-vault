// js/game.js
import { getGameById, getScreenshots, getAdditions, getSeries } from './api.js';
import { getCustomGames, getReviews, saveReview, getWishlist, toggleWishlist, getSettings } from './storage.js';
import { injectNavbar, injectFooter, buildRatingBadge, buildPlatformIcons } from './components.js';
import { formatDate, relativeTime, showToast } from './utils.js';

let currentGameId = null;
let currentScreenshots = [];
let lbIndex = 0;

document.addEventListener('DOMContentLoaded', async () => {
    injectNavbar();

    const params = new URLSearchParams(window.location.search);
    const idStr = params.get('id');
    if (!idStr) {
        window.location.href = 'index.html';
        return;
    }

    currentGameId = idStr;

    try {
        let gameData = null;

        // Check Custom Games first
        if (currentGameId.startsWith('game_')) {
            const custom = getCustomGames(true).find(g => g.id === currentGameId);
            if (custom) {
                gameData = formatCustomGameToRAWG(custom);
            }
        } else {
            // Check if custom override exists by parsed ID (some admins might use numeric IDs)
            const customNumId = getCustomGames(true).find(g => String(g.id) === String(currentGameId));
            if (customNumId) {
                gameData = formatCustomGameToRAWG(customNumId);
            } else {
                gameData = await getGameById(currentGameId);
            }
        }

        if (!gameData) throw new Error("Game not found");

        renderGameRoot(gameData);
        document.getElementById('game-detail-container').style.display = 'block';

        // Load lazy sections after main render
        renderReviews(currentGameId);

        // Lazy API fetches
        if (!currentGameId.startsWith('game_')) {
            Promise.all([
                getScreenshots(currentGameId).then(res => renderGallery(res.results)).catch(e => { console.log("No screens"); }),
                getAdditions(currentGameId).then(res => renderSidebarList('dlc-list', 'dlc-section', res.results)).catch(e => { }),
                getSeries(currentGameId).then(res => renderSidebarList('series-list', 'series-section', res.results)).catch(e => { })
            ]);
        } else {
            // Mock screenshots for custom games
            if (gameData.screenshots && gameData.screenshots.length > 0) {
                renderGallery(gameData.screenshots.map(url => ({ image: url })));
            }
        }

    } catch (e) {
        console.error(e);
        showToast("Game not found", "error");
        setTimeout(() => { window.location.href = 'browse.html'; }, 2000);
    }

    injectFooter();
});

function formatCustomGameToRAWG(c) {
    // Map custom admin fields to RAWG structure so our rendering logic is unified
    return {
        id: c.id,
        name: c.name,
        background_image: c.background_image || c.cover_image,
        description_raw: c.description || c.short_description || "",
        released: c.released,
        metacritic: c.metacritic,
        rating: 0,
        ratings_count: 0,
        website: c.website,
        platforms: (c.platforms || []).map(slug => ({ platform: { slug, name: slug.toUpperCase() } })),
        genres: (c.genres || []).map(slug => ({ slug, name: slug.toUpperCase() })),
        tags: (c.tags || []).map(t => ({ name: t })),
        developers: c.developer ? [{ name: c.developer }] : [],
        publishers: c.publisher ? [{ name: c.publisher }] : [],
        stores: (c.stores || []).map(s => ({ store: { name: s.name }, url: s.url })),
        requirements: (c.requirements_min || c.requirements_rec) ? {
            minimum: _formatSysReq(c.requirements_min),
            recommended: _formatSysReq(c.requirements_rec)
        } : null,
        screenshots: c.screenshots || [],
        clip: c.trailer_url ? { clip: c.trailer_url } : null
    };
}

function _formatSysReq(reqData) {
    if (!reqData) return "";
    let str = "";
    for (let [k, v] of Object.entries(reqData)) {
        if (v) str += `${k.toUpperCase()}: ${v}\n`;
    }
    return str;
}

function renderGameRoot(game) {
    document.title = `${game.name} - GameVault`;

    const bgImg = game.background_image || 'assets/placeholder.jpg';
    document.getElementById('hero-bg').style.backgroundImage = `url('${bgImg}')`;
    document.getElementById('hero-title').innerText = game.name;

    const badgesHtml = `
    ${buildRatingBadge(game.metacritic)}
    ${game.esrb_rating ? `<span style="border:1px solid #fff; padding:2px 6px; font-weight:bold; font-size:12px; border-radius:4px">${game.esrb_rating.name}</span>` : ''}
    ${buildPlatformIcons(game.platforms)}
  `;
    document.getElementById('hero-badges').innerHTML = badgesHtml;

    const metaStr = [
        (game.genres || []).map(g => g.name).join(', '),
        game.released ? formatDate(game.released) : 'TBA'
    ].filter(Boolean).join(' • ');
    document.getElementById('hero-meta').innerText = metaStr;

    const descEl = document.getElementById('hero-desc');
    descEl.innerText = game.description_raw || "No description available.";

    if (descEl.innerText.length > 250) {
        const btn = document.getElementById('desc-expand-btn');
        btn.style.display = 'inline-block';
        btn.onclick = () => {
            descEl.classList.toggle('expanded');
            btn.innerText = descEl.classList.contains('expanded') ? 'Read Less' : 'Read More';
        };
    }

    // Scoring
    document.getElementById('meta-score').innerText = game.metacritic || '-';
    document.getElementById('rawg-rating').innerText = game.rating ? game.rating.toFixed(1) : '-';
    document.getElementById('rawg-count').innerText = `${game.ratings_count || 0} RATINGS`;
    if (game.metacritic) {
        let color = 'var(--color-success)';
        if (game.metacritic < 80) color = 'var(--color-warning)';
        if (game.metacritic < 60) color = 'var(--color-danger)';
        document.getElementById('meta-score').style.color = color;
    }

    // Actions
    document.getElementById('btn-share').onclick = () => {
        navigator.clipboard.writeText(window.location.href);
        showToast("Link copied to clipboard", "success");
    };

    if (game.website) {
        const webBtn = document.getElementById('btn-website');
        webBtn.style.display = 'inline-flex';
        webBtn.href = game.website;
    }

    const wBtn = document.getElementById('btn-wishlist');
    const wIcon = document.getElementById('wishlist-icon');
    const wText = document.getElementById('wishlist-text');

    const updateWState = (isW) => {
        if (isW) {
            wIcon.setAttribute('fill', 'var(--color-text-1)');
            wIcon.setAttribute('stroke', 'var(--color-text-1)');
            wText.innerText = "WISHLISTED";
            wBtn.style.backgroundColor = "transparent";
            wBtn.style.border = "1px solid var(--color-border)";
        } else {
            wIcon.setAttribute('fill', 'none');
            wIcon.setAttribute('stroke', 'currentColor');
            wText.innerText = "ADD TO WISHLIST";
            wBtn.style.background = "var(--color-accent)";
            wBtn.style.border = "none";
        }
    };

    updateWState(getWishlist().includes(String(game.id)));
    wBtn.onclick = () => {
        const newState = toggleWishlist(game.id);
        updateWState(newState);
        const countEl = document.getElementById('gv-wishlist-count');
        if (countEl) countEl.innerText = getWishlist().length;
    };

    // Systems Req (PC only logic)
    let sys = null;
    if (game.platforms) {
        const pcPlat = game.platforms.find(p => p.platform && p.platform.slug === 'pc');
        if (pcPlat && pcPlat.requirements_en) {
            sys = pcPlat.requirements_en;
        } else if (game.requirements) {
            sys = game.requirements; // Custom games mapping
        }
    }

    if (sys && (sys.minimum || sys.recommended)) {
        document.getElementById('requirements-section').style.display = 'block';

        const formatReq = (html) => html ? html.replace(/Minimum:|Recommended:/g, '').trim() : 'N/A';

        document.getElementById('req-min').innerHTML = formatReq(sys.minimum);
        document.getElementById('req-rec').innerHTML = formatReq(sys.recommended);
    }

    // Sidebar
    document.getElementById('meta-dev').innerText = (game.developers || []).map(d => d.name).join(', ') || 'Unknown';
    document.getElementById('meta-pub').innerText = (game.publishers || []).map(d => d.name).join(', ') || 'Unknown';

    if (game.stores && game.stores.length) {
        document.getElementById('meta-stores').innerHTML = game.stores.map(s =>
            `<a href="${s.url}" target="_blank" class="btn-ghost" style="width:100%; justify-content:space-between; font-size:12px; padding:6px 10px">${s.store.name} <span>&nearr;</span></a>`
        ).join('');
    } else {
        document.getElementById('meta-stores').innerHTML = '<span class="text-muted">Not available digitally</span>';
    }

    if (game.tags && game.tags.length) {
        document.getElementById('meta-tags').innerHTML = game.tags.slice(0, 10).map(t => `<span class="tag-pill">${t.name}</span>`).join('');
    }

    // Trailer
    if (game.clip && game.clip.clip) {
        document.getElementById('trailer-section').style.display = 'block';
        const iframe = document.createElement('iframe');
        iframe.src = game.clip.clip; // Works for RAWG mp4 direct or youtube embed from custom
        iframe.style.position = 'absolute';
        iframe.style.top = 0; iframe.style.left = 0; iframe.style.width = '100%'; iframe.style.height = '100%';
        if (iframe.src.includes('youtube')) iframe.frameBorder = 0;
        else { iframe.autoplay = true; iframe.muted = true; iframe.controls = true; }
        document.getElementById('video-wrapper').appendChild(iframe);
    }

    // Rating breakdown
    if (game.ratings && game.ratings.length > 0) {
        document.getElementById('rating-breakdown').style.display = 'block';
        const chart = document.getElementById('breakdown-chart');
        const labels = document.getElementById('breakdown-labels');

        const colors = { exceptional: 'var(--color-success)', recommended: 'var(--color-blue)', meh: 'var(--color-warning)', skip: 'var(--color-danger)' };

        let chartHtml = '';
        let labelHtml = '';

        game.ratings.forEach(r => {
            chartHtml += `<div style="width:${r.percent}%; background:${colors[r.title] || '#ccc'}" title="${r.title}: ${r.count}"></div>`;
            labelHtml += `<span><span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:${colors[r.title] || '#ccc'}; margin-right:4px"></span>${r.title.toUpperCase()} (${r.percent}%)</span>`;
        });

        chart.innerHTML = chartHtml;
        labels.innerHTML = labelHtml;
    }

    // Disable review section if turned off in settings
    if (!getSettings().features.reviews) {
        document.getElementById('reviews-section').style.display = 'none';
    }
}

function renderGallery(screenshots) {
    if (!screenshots || screenshots.length === 0) {
        document.getElementById('gallery-section').style.display = 'none';
        return;
    }

    currentScreenshots = screenshots;
    const strip = document.getElementById('gallery-strip');

    strip.innerHTML = screenshots.map((s, idx) => `
    <div class="gallery-img-wrap" onclick="window.gvOpenLightbox(${idx})">
      <img src="${s.image}" alt="Screenshot ${idx + 1}" />
    </div>
  `).join('');

    bindLightbox();
}

function bindLightbox() {
    const lb = document.getElementById('lightbox');
    const lbImg = document.getElementById('lightbox-img');
    const lbCount = document.getElementById('lightbox-counter');

    const close = () => { lb.classList.remove('active'); };
    const show = (idx) => {
        lbIndex = (idx + currentScreenshots.length) % currentScreenshots.length;
        lbImg.src = currentScreenshots[lbIndex].image;
        lbCount.textContent = `${lbIndex + 1} / ${currentScreenshots.length}`;
    };

    window.gvOpenLightbox = (idx) => { show(idx); lb.classList.add('active'); };

    document.querySelector('.lightbox-close').onclick = close;
    document.querySelector('.lightbox-prev').onclick = () => show(lbIndex - 1);
    document.querySelector('.lightbox-next').onclick = () => show(lbIndex + 1);

    lb.onclick = (e) => { if (e.target === lb) close(); }

    document.addEventListener('keydown', (e) => {
        if (!lb.classList.contains('active')) return;
        if (e.key === 'Escape') close();
        if (e.key === 'ArrowRight') show(lbIndex + 1);
        if (e.key === 'ArrowLeft') show(lbIndex - 1);
    });
}

function renderSidebarList(containerId, sectionId, list) {
    if (!list || list.length === 0) return;
    document.getElementById(sectionId).style.display = 'block';

    const html = list.slice(0, 5).map(g => `
    <div class="mini-card" onclick="window.location.href='game.html?id=${g.id}'">
      <img src="${g.background_image || 'assets/placeholder.jpg'}" alt="${g.name}" />
      <div style="display:flex; flex-direction:column; justify-content:center">
        <div style="font-weight:600; font-size:0.95rem; line-height:1.2; margin-bottom:4px">${g.name}</div>
        <div style="color:var(--color-text-2); font-size:0.8rem">${g.released ? g.released.substring(0, 4) : ''}</div>
      </div>
    </div>
  `).join('');

    document.getElementById(containerId).innerHTML = html;
}

// ---------------------------------------------------------
// Review Form Logic
// ---------------------------------------------------------
async function renderReviews(gameId) {
    const reviews = getReviews(gameId, true); // true = public/approved only
    const listEl = document.getElementById('reviews-list');

    if (reviews.length > 0) {
        listEl.innerHTML = reviews.sort((a, b) => {
            if (a.is_featured && !b.is_featured) return -1;
            if (!a.is_featured && b.is_featured) return 1;
            return b.created_at - a.created_at;
        }).map(r => {
            // New format with user avatars if available
            const avatarHtml = r.username ? `
                <div style="display:flex; align-items:center; gap:12px; margin-bottom:12px;">
                    <div style="width:36px; height:36px; border-radius:50%; background-color:${r.avatar_color || '#333'}; color:white; display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:14px;">
                        ${r.avatar_initials || '??'}
                    </div>
                    <div style="font-weight:600; color:white; font-size:14px;">${r.username}</div>
                    <div style="color:var(--color-text-3); font-size:12px; margin-left:auto">${relativeTime(r.submitted_at || r.created_at)}</div>
                </div>
            ` : `<div style="color:var(--color-text-3); font-size:0.85rem; margin-bottom:8px">${relativeTime(r.created_at)}</div>`;

            return `
               <div class="review-card" style="position:relative">
                 ${r.is_featured ? `<div style="position:absolute; top:var(--space-md); right:var(--space-md); color:var(--color-warning); font-size:20px" title="Pinned">★</div>` : ''}
                 ${avatarHtml}
                 <div style="color:var(--color-warning); font-size:1rem; letter-spacing:2px; margin-bottom:8px">
                   ${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}
                 </div>
                 <p style="line-height:1.5; color:var(--color-text-1)">${r.text}</p>
               </div>
            `;
        }).join('');
    }

    // Form handling
    const formSection = document.getElementById('review-form-section');
    if (!formSection) return; // fail-safe if hidden

    const { getLoggedInUser, submitUserReview } = await import('./user.js');
    const user = getLoggedInUser();

    if (!user) {
        formSection.innerHTML = `
            <div style="background:var(--color-surface); border:1px solid var(--color-border); border-radius:8px; padding:24px; text-align:center;">
                <p style="color:var(--color-text-2); margin-bottom:16px;">You must be signed in to leave a review.</p>
                <a href="login.html?return=${encodeURIComponent(window.location.pathname + window.location.search)}" class="btn-primary" style="display:inline-block; text-decoration:none;">Sign In</a>
            </div>
        `;
        return;
    }

    let selectedRating = 0;
    const stars = document.querySelectorAll('#star-picker span');

    stars.forEach(star => {
        star.addEventListener('click', (e) => {
            selectedRating = parseInt(e.target.dataset.val);
            stars.forEach(s => {
                s.style.color = parseInt(s.dataset.val) <= selectedRating ? 'var(--color-warning)' : 'var(--color-text-3)';
            });
        });
    });

    const submitBtn = document.getElementById('btn-submit-review');
    const txtArea = document.getElementById('review-text');

    submitBtn.onclick = () => {
        const text = txtArea.value.trim();
        if (selectedRating === 0 || text === '') {
            showToast("Please provide a rating and review text", "error");
            return;
        }

        submitUserReview(gameId, selectedRating, text);

        showToast("Review submitted for moderation", "success");
        txtArea.value = '';
        selectedRating = 0;
        stars.forEach(s => s.style.color = 'var(--color-text-3)');
    };
}
