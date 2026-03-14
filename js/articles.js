// js/articles.js
import { getSettings } from './storage.js';
import { getIgnNewsFeed } from './api.js';
import { injectNavbar, injectFooter, buildArticleCard } from './components.js';

let allArticles = [];
let filteredArticles = [];
let currentCategory = 'all';
let currentSearch = '';

const PAGE_SIZE = 9;
let currentPage = 1;

document.addEventListener('DOMContentLoaded', async () => {
    injectNavbar();

    if (!getSettings().features.articles) {
        window.location.href = 'index.html';
        return;
    }

    // Fetch external feeds, sort them newest first
    const [ignArticles] = await Promise.all([
        getIgnNewsFeed()
    ]);

    allArticles = [...ignArticles].sort((a, b) => b.created_at - a.created_at);

    bindEvents();
    applyFilters();

    injectFooter();
});

function bindEvents() {
    const tabs = document.querySelectorAll('.art-tab');
    tabs.forEach(t => {
        t.addEventListener('click', (e) => {
            tabs.forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            currentCategory = e.target.dataset.cat;
            currentPage = 1;
            applyFilters();
        });
    });

    const searchInput = document.getElementById('art-search');
    searchInput.addEventListener('input', (e) => {
        currentSearch = e.target.value.toLowerCase();
        currentPage = 1;
        applyFilters();
    });

    document.getElementById('page-prev').onclick = () => { if (currentPage > 1) { currentPage--; applyFilters(); } };
    document.getElementById('page-next').onclick = () => { if (currentPage < Math.ceil(filteredArticles.length / PAGE_SIZE)) { currentPage++; applyFilters(); } };
}

function applyFilters() {
    filteredArticles = allArticles.filter(a => {
        if (currentCategory !== 'all' && a.category !== currentCategory) return false;
        if (currentSearch && !a.title.toLowerCase().includes(currentSearch)) return false;
        return true;
    });

    renderGrid();
}

function renderGrid() {
    const grid = document.getElementById('art-grid');
    const paginRow = document.getElementById('art-pagination');

    if (filteredArticles.length === 0) {
        grid.innerHTML = `<div class="text-muted text-center" style="grid-column:1/-1; padding:60px">No articles match your criteria.</div>`;
        paginRow.style.display = 'none';
        return;
    }

    const totalPages = Math.ceil(filteredArticles.length / PAGE_SIZE);
    const startIdx = (currentPage - 1) * PAGE_SIZE;
    const viewSlice = filteredArticles.slice(startIdx, startIdx + PAGE_SIZE);

    grid.innerHTML = viewSlice.map(a => buildArticleCard(a)).join('');

    if (totalPages > 1) {
        paginRow.style.display = 'flex';
        document.getElementById('page-info').innerText = `Page ${currentPage} of ${totalPages}`;
        document.getElementById('page-prev').disabled = currentPage === 1;
        document.getElementById('page-next').disabled = currentPage === totalPages;
        document.getElementById('page-prev').style.opacity = currentPage === 1 ? '0.5' : '1';
        document.getElementById('page-next').style.opacity = currentPage === totalPages ? '0.5' : '1';
    } else {
        paginRow.style.display = 'none';
    }
}
