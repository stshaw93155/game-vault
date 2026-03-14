// js/components.js
import { getSettings, getWishlist, toggleWishlist } from './storage.js';
import { slugify } from './utils.js';
import { getLoggedInUser, logoutUser } from './user.js';

/**
 * Normalizes an image URL, fallback to placeholder
 */
function getImage(url) {
  if (!url) return 'assets/placeholder.jpg';
  // Attempt to use RAWG image crop to save bandwidth
  return url.replace('media/games/', 'media/crop/600/400/games/');
}

export function buildRatingBadge(score) {
  if (!score && score !== 0) return '';
  let colorClass = 'rating-success';
  if (score < 80) colorClass = 'rating-warning';
  if (score < 60) colorClass = 'rating-danger';
  return `<span class="rating-badge ${colorClass}">${score}</span>`;
}

export function buildPlatformIcons(platformsArray) {
  if (!platformsArray || !platformsArray.length) return '';

  const iconMap = {
    pc: '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M0 2v20h24v-20h-24zm22 18h-20v-16h20v16z"/></svg>',
    playstation: '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M21.1 11.2c...playstation-path..."></svg>', // simplified
    xbox: '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c...xbox-path..."></svg>',
    nintendo: '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M...nintendo-path..."></svg>'
  };

  const str = platformsArray.map(p => {
    const slug = (p.platform && p.platform.slug) || (p.slug);
    if (!slug) return '';
    if (slug.includes('playstation')) return `<span title="PlayStation" style="margin-right:2px">PS</span>`;
    if (slug.includes('xbox')) return `<span title="Xbox" style="margin-right:2px">XB</span>`;
    if (slug.includes('pc')) return `<span title="PC" style="margin-right:2px">PC</span>`;
    if (slug.includes('nintendo') || slug.includes('switch')) return `<span title="Nintendo" style="margin-right:2px">SW</span>`;
    return '';
  }).filter((v, i, a) => a.indexOf(v) === i).join(''); // deduplicate mostly

  return `<div class="platform-icons" style="color:var(--color-text-2); font-size:12px; font-weight:bold">${str}</div>`;
}

export function buildGameCard(game) {
  const settings = getSettings();
  const title = game.name || "Unknown Game";
  const img = getImage(game.background_image || game.cover_image);

  // Custom games might have top-level platforms string array, RAWG has nested objects
  const plats = game.platforms || [];

  // Custom games have Metacritic straight, RAWG has it inside metacritic
  const rating = game.metacritic || (game.rating ? Math.round(game.rating * 20) : null);
  const badgeHtml = buildRatingBadge(rating);
  const platHtml = buildPlatformIcons(plats);

  const genres = (game.genres || []).slice(0, 2).map(g => `<span class="tag-pill">${g.name || g}</span>`).join('');

  // Check wishlist state
  // We do conditional logic: if session, fetch from user data array, else local
  const sessionStr = sessionStorage.getItem('gv_user_session') || localStorage.getItem('gv_user_session_persist');
  let isWishlisted = false;
  if (sessionStr) {
    const sid = JSON.parse(sessionStr).id;
    const users = JSON.parse(localStorage.getItem('gv_users') || '[]');
    const u = users.find(x => x.id === sid);
    if (u) isWishlisted = u.wishlist.includes(String(game.id));
  } else {
    isWishlisted = getWishlist().includes(String(game.id));
  }

  const heartFill = isWishlisted ? 'red' : 'none';
  const heartStroke = isWishlisted ? 'red' : 'currentColor';

  return `
    <article class="game-card" onclick="window.location.href='game.html?id=${game.id}'">
      <div class="game-card-img-wrap">
        <img src="${img}" alt="${title}" class="game-card-img" loading="lazy" onerror="this.onerror=null; this.src='assets/placeholder.jpg';" />
        <div style="position:absolute; top:8px; right:8px; z-index:2">
          ${badgeHtml}
        </div>
      </div>
      <div class="game-card-content">
        <h3 class="game-card-title">${title}</h3>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          ${platHtml}
        </div>
        <div style="display:flex; gap:4px; flex-wrap:wrap; margin-bottom:12px">
          ${genres}
        </div>
        <div style="margin-top:auto">
          <button class="btn-ghost" style="width:100%; justify-content:center" onclick="event.stopPropagation(); window.gvToggleWishlist('${game.id}', this)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="${heartFill}" stroke="${heartStroke}" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
            <span class="btn-text" style="font-size:12px">${isWishlisted ? 'WISHLISTED' : 'ADD TO WISHLIST'}</span>
          </button>
        </div>
      </div>
    </article>
  `;
}

export function buildArticleCard(article) {
  const imgStr = article.featured_image ? article.featured_image : 'assets/placeholder.jpg';
  const dateStr = new Date(article.created_at).toLocaleDateString();

  const sessionStr = sessionStorage.getItem('gv_user_session') || localStorage.getItem('gv_user_session_persist');
  let isSaved = false;
  if (sessionStr) {
    const sid = JSON.parse(sessionStr).id;
    const users = JSON.parse(localStorage.getItem('gv_users') || '[]');
    const u = users.find(x => x.id === sid);
    if (u && u.saved_articles) isSaved = u.saved_articles.includes(String(article.id));
  }

  const bookmarkColor = isSaved ? 'var(--color-accent)' : 'var(--color-text-3)';

  const linkAction = `window.location.href='article.html?slug=${article.slug}'`;

  // Use the new bright IGN tag pill for external news, standard pill for local CMS categories
  const tagClass = article.external_link ? 'tag-pill-ign' : 'tag-pill';
  const tagStyle = article.external_link ? '' : 'background:var(--color-accent); color:#fff;';

  return `
    <article class="game-card" style="position:relative;">
      <div class="game-card-img-wrap" onclick="${linkAction}" style="cursor:pointer">
        <img src="${imgStr}" alt="${article.title}" class="game-card-img" loading="lazy" onerror="this.onerror=null; this.src='assets/placeholder.jpg';"/>
        <div style="position:absolute; top:8px; left:8px; z-index:2">
          <span class="${tagClass}" style="${tagStyle}">${article.category}</span>
        </div>
      </div>
      <div class="game-card-content">
        <h3 class="game-card-title" style="cursor:pointer" onclick="${linkAction}">${article.title}</h3>
        <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-top:auto;">
            <p class="text-muted" style="font-size:0.85rem;">${article.author} &bull; ${dateStr}</p>
        </div>
      </div>
      <button style="position:absolute; bottom:20px; right:16px; background:none; border:none; color:${bookmarkColor}; cursor:pointer; font-size:22px; z-index:3; transition:transform 0.2s" onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'" onclick="event.stopPropagation(); window.gvToggleArticle('${article.id}', this)" title="Bookmark Article">
          <i class='bx bxs-bookmark'></i>
      </button>
    </article>
  `;
}

window.gvToggleArticle = async function (articleId, btnElement) {
  const { getLoggedInUser, toggleSavedArticle } = await import('./user.js');
  const session = getLoggedInUser();

  if (!session) {
    window.location.href = '/login.html?return=' + encodeURIComponent(window.location.pathname + window.location.search);
    return;
  }

  const isNowSaved = toggleSavedArticle(articleId);

  if (btnElement) {
    btnElement.style.color = isNowSaved ? 'var(--color-accent)' : 'var(--color-text-3)';
  }
};

export function buildSkeletonCard() {
  return `<div class="skeleton skeleton-card"></div>`;
}

export function buildCountdown(dateStr) {
  const target = new Date(dateStr).getTime();
  const id = "countdown-" + Math.floor(Math.random() * 1000000);

  setTimeout(() => {
    const el = document.getElementById(id);
    if (!el) return;

    // Timer updates
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = target - now;

      if (distance < 0) {
        clearInterval(interval);
        el.innerHTML = "RELEASED";
        el.style.color = "var(--color-success)";
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      el.innerHTML = `${days}D ${hours}H ${minutes}M ${seconds}S`;
    }, 1000);
  }, 100);

  return `<div id="${id}" style="font-family:var(--font-mono); font-weight:bold; color:var(--color-accent); margin-top:8px">Calculating...</div>`;
}

export function injectNavbar() {
  const settings = getSettings();
  const navData = JSON.parse(localStorage.getItem('gv_navigation') || 'null') || {
    navbar: [
      { label: "Home", url: "/", visible: true },
      { label: "Browse", url: "browse.html", visible: true },
      { label: "Upcoming", url: "upcoming.html", visible: true },
      { label: "GOTY", url: "goty.html", visible: true },
      { label: "Genres", url: "genres.html", visible: true },
      { label: "Articles", url: "articles.html", visible: true }
    ]
  };

  const linksHtml = navData.navbar
    .filter(n => n.visible)
    .map(n => `<a href="${n.url}">${n.label}</a>`)
    .join('');

  const isLight = localStorage.getItem('gv_theme') === 'light' || (settings.default_theme === 'light' && !localStorage.getItem('gv_theme'));
  if (isLight) document.body.classList.add('light-mode');

  const session = getLoggedInUser();

  // Fallback standard old wishlist length if logged out
  const wishlistCount = session ?
    (JSON.parse(localStorage.getItem('gv_users') || '[]').find(u => u.id === session.id)?.wishlist?.length || 0)
    : getWishlist().length;

  let rightSideHtml = '';

  if (session) {
    rightSideHtml = `
          <button onclick="document.body.classList.toggle('light-mode'); localStorage.setItem('gv_theme', document.body.classList.contains('light-mode') ? 'light' : 'dark')" title="Toggle Theme" style="display:flex; align-items:center; background:none; border:none; color:inherit; cursor:pointer;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42 1.42"/></svg>
          </button>
          <a href="profile.html#wishlist" title="Wishlist" style="display:flex; align-items:center; position:relative; color:inherit; text-decoration:none;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
            <span style="position:absolute; top:-8px; right:-10px; background:var(--color-accent); color:white; font-size:10px; font-weight:bold; border-radius:50%; width:18px; height:18px; display:flex; align-items:center; justify-content:center" id="gv-wishlist-count">${wishlistCount}</span>
          </a>
          <div style="position:relative; margin-left:8px;" id="user-avatar-dropdown-container">
            <button id="user-avatar-btn" style="background:${session.avatar_color}; color:white; border:2px solid transparent; width:36px; height:36px; border-radius:50%; font-weight:600; font-size:14px; display:flex; align-items:center; justify-content:center; cursor:pointer; padding:0; outline:none; transition:transform 0.2s;">
                ${session.avatar_initials}
            </button>
            <div id="user-dropdown-menu" style="display:none; position:absolute; top:48px; right:0; width:220px; background:var(--color-surface); border:1px solid var(--color-border); border-radius:8px; box-shadow:0 8px 24px rgba(0,0,0,0.5); z-index:100; overflow:hidden;">
                <div style="padding:16px; border-bottom:1px solid var(--color-border);">
                    <div style="font-weight:600; color:var(--color-text-1); font-size:14px;">${session.username}</div>
                    <div style="font-size:12px; color:var(--color-text-2); overflow:hidden; text-overflow:ellipsis;">${session.email}</div>
                </div>
                <div style="padding:8px; display:flex; flex-direction:column;">
                    <a href="profile.html" style="padding:8px 12px; color:var(--color-text-1); text-decoration:none; font-size:13px; border-radius:4px;">My Profile</a>
                    <a href="profile.html#wishlist" style="padding:8px 12px; color:var(--color-text-1); text-decoration:none; font-size:13px; border-radius:4px;">Wishlist</a>
                    <a href="profile.html#articles" style="padding:8px 12px; color:var(--color-text-1); text-decoration:none; font-size:13px; border-radius:4px;">Saved Articles</a>
                </div>
                <div style="border-top:1px solid var(--color-border); padding:8px;">
                    <button id="user-logout-btn" style="width:100%; text-align:left; background:none; border:none; color:var(--color-danger); padding:8px 12px; font-size:13px; font-weight:500; cursor:pointer; border-radius:4px;">Sign Out</button>
                </div>
            </div>
          </div>
        `;
  } else {
    rightSideHtml = `
          <button onclick="document.body.classList.toggle('light-mode'); localStorage.setItem('gv_theme', document.body.classList.contains('light-mode') ? 'light' : 'dark')" title="Toggle Theme" style="display:flex; align-items:center; background:none; border:none; color:inherit; cursor:pointer; margin-right:8px;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42 1.42"/></svg>
          </button>
        `;
  }

  const navHtml = `
    ${settings.announcement && settings.announcement.active ? `
      <div style="background:${settings.announcement.bg_color}; color:#fff; text-align:center; padding:8px; font-size:14px; font-weight:bold">
        ${settings.announcement.text}
      </div>
    ` : ''}
    <nav class="gv-navbar">
      <div class="container gv-navbar-container">
        <a href="/" class="gv-nav-logo">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="var(--color-accent)"><path d="M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-10 7H8v3H6v-3H3v-2h3V8h2v3h3v2zm4.5 2c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm3-3c-.83 0-1.5-.67-1.5-1.5S17.67 9 18.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>
          GAME<span>VAULT</span>
        </a>
        <div class="gv-nav-links">
          ${linksHtml}
        </div>
        <div class="gv-nav-actions">
            ${rightSideHtml}
        </div>
      </div>
    </nav>
  `;
  document.body.insertAdjacentHTML('afterbegin', navHtml);

  // Bind dropdown events if user is logged in
  if (session) {
    const btn = document.getElementById('user-avatar-btn');
    const menu = document.getElementById('user-dropdown-menu');
    const logoutBtn = document.getElementById('user-logout-btn');

    if (btn && menu) {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
        btn.style.transform = menu.style.display === 'block' ? 'scale(1.1)' : 'scale(1)';
      });

      document.addEventListener('click', (e) => {
        const container = document.getElementById('user-avatar-dropdown-container');
        if (container && !container.contains(e.target)) {
          menu.style.display = 'none';
          btn.style.transform = 'scale(1)';
        }
      });

      // Allow escape key to close
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          menu.style.display = 'none';
          btn.style.transform = 'scale(1)';
        }
      });
    }

    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        logoutUser();
      });
    }
  }
}

export function injectFooter() {
  const footerHtml = `
    <footer class="gv-footer">
      <div class="container">
        <div class="gv-footer-grid">
          <div class="gv-footer-column">
            <h4>About GameVault</h4>
            <p class="text-muted" style="font-size:0.9rem; line-height:1.6">The ultimate independent game discovery platform powered by the RAWG API. Discover, review, and track your next favorite game.</p>
          </div>
          <div class="gv-footer-column">
            <h4>Explore</h4>
            <ul>
              <li><a href="browse.html">Browse Games</a></li>
              <li><a href="upcoming.html">Upcoming Releases</a></li>
              <li><a href="goty.html">Game of the Year</a></li>
              <li><a href="articles.html">News & Editorials</a></li>
            </ul>
          </div>
          <div class="gv-footer-column">
            <h4>Top Genres</h4>
            <ul>
              <li><a href="browse.html?genre=action">Action</a></li>
              <li><a href="browse.html?genre=rpg">RPG</a></li>
              <li><a href="browse.html?genre=shooter">Shooter</a></li>
              <li><a href="browse.html?genre=adventure">Adventure</a></li>
            </ul>
          </div>

        </div>
        <div class="gv-footer-bottom">
          <div>&copy; ${new Date().getFullYear()} GameVault Project. All rights reserved.</div>
          <div><a href="https://rawg.io/apidocs" target="_blank" style="text-decoration:underline; font-weight:bold">Powered by RAWG API</a></div>
        </div>
      </div>
    </footer>
  `;
  document.body.insertAdjacentHTML('beforeend', footerHtml);
}

// Attach a global wishlist toggler so inline HTML handlers work
window.gvToggleWishlist = async function (gameId, btnElement) {
  let isNowWishlisted = false;

  // Check auth dynamically rather than static import to avoid circular dependencies
  const { getLoggedInUser, toggleUserWishlist, getFullCurrentUser } = await import('./user.js');
  const session = getLoggedInUser();

  if (session) {
    isNowWishlisted = toggleUserWishlist(gameId);
    // User DB syncs automatically via saveUserData
  } else {
    // Fallback to anonymous localStorage wishlist
    isNowWishlisted = toggleWishlist(gameId);
  }

  const countEl = document.getElementById('gv-wishlist-count');
  if (countEl) {
    if (session) {
      const userObj = getFullCurrentUser();
      if (userObj) countEl.textContent = userObj.wishlist.length;
    } else {
      countEl.textContent = getWishlist().length;
    }
  }

  if (btnElement) {
    const svg = btnElement.querySelector('svg');
    const span = btnElement.querySelector('.btn-text');
    if (isNowWishlisted) {
      svg.setAttribute('fill', 'red');
      svg.setAttribute('stroke', 'red');
      if (span) span.textContent = 'WISHLISTED';
    } else {
      svg.setAttribute('fill', 'none');
      svg.setAttribute('stroke', 'currentColor');
      if (span) span.textContent = 'ADD TO WISHLIST';
    }
  }
};
