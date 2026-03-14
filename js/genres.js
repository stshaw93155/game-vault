// js/genres.js
import { getGenres } from './api.js';
import { injectNavbar, injectFooter, buildSkeletonCard } from './components.js';

document.addEventListener('DOMContentLoaded', async () => {
    injectNavbar();

    const grid = document.getElementById('genre-grid');
    grid.innerHTML = Array(9).fill(buildSkeletonCard()).join('');

    try {
        const res = await getGenres();

        if (res.results && res.results.length > 0) {
            grid.innerHTML = res.results.map(g => `
         <a href="browse.html?genres=${g.id}" class="genre-card">
           <div class="genre-card-bg" style="background-image:url('${g.image_background ? g.image_background.replace('media/games/', 'media/crop/600/400/games/') : 'assets/placeholder.jpg'}')"></div>
           <div class="genre-card-content">
             <div class="genre-card-title">${g.name}</div>
             <div class="genre-card-meta">${g.games_count.toLocaleString()} Games</div>
           </div>
         </a>
      `).join('');
        } else {
            grid.innerHTML = `<div class="text-center text-danger" style="grid-column:1/-1">No genres returned</div>`;
        }

    } catch (e) {
        grid.innerHTML = `<div class="text-center text-danger" style="grid-column:1/-1">Failed to fetch genres</div>`;
    }

    injectFooter();
});
