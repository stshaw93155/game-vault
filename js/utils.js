// js/utils.js

/**
 * Converts string to url-safe slug.
 * "Best RPGs 2025!" -> "best-rpgs-2025"
 */
export function slugify(text) {
    return text.toString().toLowerCase()
        .trim()
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
        .replace(/\-\-+/g, '-');        // Replace multiple - with single -
}

/**
 * Formats timestamp or ISO date to "Apr 14, 2025"
 */
export function formatDate(timestamp) {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

/**
 * Converts timestamp to "3 hours ago" notation
 */
export function relativeTime(timestamp) {
    const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
    const daysDifference = Math.round((timestamp - Date.now()) / (1000 * 60 * 60 * 24));

    if (Math.abs(daysDifference) > 30) {
        return formatDate(timestamp);
    }
    if (daysDifference === 0) {
        const hoursDifference = Math.round((timestamp - Date.now()) / (1000 * 60 * 60));
        if (hoursDifference === 0) {
            const minDiff = Math.round((timestamp - Date.now()) / (1000 * 60));
            return rtf.format(minDiff, 'minute');
        }
        return rtf.format(hoursDifference, 'hour');
    }
    return rtf.format(daysDifference, 'day');
}

/**
 * Debounce function wrapper
 */
export function debounce(func, delay) {
    let timeoutId;
    return function (...args) {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(() => {
            func.apply(this, args);
        }, delay);
    };
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text, len = 100) {
    if (!text) return "";
    if (text.length <= len) return text;
    return text.substring(0, len).trim() + "...";
}

/**
 * Estimates reading time of HTML content
 */
export function estimateReadTime(htmlStr) {
    const temp = document.createElement("div");
    temp.innerHTML = htmlStr;
    const text = temp.textContent || temp.innerText || "";
    const wordCount = text.trim().split(/\s+/).length;
    const mins = Math.ceil(wordCount / 200); // 200 wpm
    return `${mins} min read`;
}

/**
 * Injects and animates a toast notification
 * @param {string} message 
 * @param {string} type 'success', 'error', 'info'
 */
export function showToast(message, type = 'info') {
    const existing = document.getElementById('gv-toast-container');
    const container = existing || document.createElement('div');

    if (!existing) {
        container.id = 'gv-toast-container';
        container.style.position = 'fixed';
        container.style.bottom = '20px';
        container.style.right = '20px';
        container.style.zIndex = '9999';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.gap = '10px';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `gv-toast gv-toast-${type}`;
    toast.style.background = 'var(--color-surface)';
    toast.style.border = '1px solid ' + (type === 'success' ? 'var(--color-success)' : type === 'error' ? 'var(--color-danger)' : 'var(--color-border)');
    toast.style.color = 'var(--color-text-1)';
    toast.style.padding = '12px 16px';
    toast.style.borderRadius = 'var(--radius-md)';
    toast.style.boxShadow = '0 8px 24px rgba(0,0,0,0.5)';
    toast.style.transform = 'translateX(120%)';
    toast.style.transition = 'transform var(--transition-slow)';
    toast.textContent = message;

    container.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            toast.style.transform = 'translateX(0)';
        });
    });

    // Auto remove
    setTimeout(() => {
        toast.style.transform = 'translateX(120%)';
        setTimeout(() => toast.remove(), 400); // Wait for transition
    }, 3000);
}
