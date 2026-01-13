// ================================
// BLOG MODULE
// Display feed from renditedigitali.blogspot.com
// ================================

const blogContainer = document.getElementById('blogContainer');
let blogLoaded = false;

// ================================
// INITIALIZATION
// ================================

async function loadBlogFeed() {
    if (blogLoaded) return;

    console.log('📰 Loading blog feed...');

    try {
        blogContainer.innerHTML = '<div class="loading">Caricamento feed del blog...</div>';

        const response = await fetch(`${window.app.API_BASE}/api/blog/feed`);

        if (!response.ok) {
            throw new Error('Errore nel caricamento del feed');
        }

        const data = await response.json();

        if (data.feed && data.feed.entry) {
            renderBlogPosts(data.feed.entry);
            blogLoaded = true;
        } else {
            throw new Error('Formato feed non valido');
        }

    } catch (error) {
        console.error('Blog feed error:', error);
        blogContainer.innerHTML = `
            <div class="error-message show">
                ⚠️ Errore nel caricamento del feed del blog.
                <br>
                Visita direttamente: <a href="https://renditedigitali.blogspot.com" target="_blank">renditedigitali.blogspot.com</a>
            </div>
        `;
    }
}

// ================================
// RENDERING
// ================================

function renderBlogPosts(entries) {
    blogContainer.innerHTML = '';

    // Limit to 12 most recent posts
    const recentPosts = entries.slice(0, 12);

    recentPosts.forEach(entry => {
        const postDiv = document.createElement('div');
        postDiv.className = 'blog-post';

        // Extract data
        const title = entry.title?.$t || 'Senza titolo';
        const content = extractContent(entry.content?.$t || entry.summary?.$t || '');
        const link = entry.link?.find(l => l.rel === 'alternate')?.href || '#';
        const published = new Date(entry.published?.$t).toLocaleDateString('it-IT');

        postDiv.innerHTML = `
            <h3>${escapeHtml(title)}</h3>
            <div class="post-date">📅 ${published}</div>
            <div class="post-content">${content}</div>
            <a href="${link}" target="_blank" rel="noopener noreferrer">Leggi di più →</a>
        `;

        blogContainer.appendChild(postDiv);
    });

    console.log('✅ Blog posts rendered:', recentPosts.length);
}

// ================================
// UTILITIES
// ================================

function extractContent(html) {
    // Remove HTML tags and limit to 200 characters
    const div = document.createElement('div');
    div.innerHTML = html;
    const text = div.textContent || div.innerText || '';
    const truncated = text.substring(0, 200);

    return truncated.length < text.length ? truncated + '...' : truncated;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ================================
// EXPORTS
// ================================

window.loadBlogFeed = loadBlogFeed;
