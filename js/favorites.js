const TMDB_API_KEY = '06936145fe8e20be28b02e26b55d3ce6';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

let tmdbFavoritesCache = [];

async function loadTMDBFavoritesCache() {
    const sessionId = localStorage.getItem('tmdb_session_id');
    const accountId = localStorage.getItem('tmdb_account_id');
    if (!sessionId || !accountId) return;

    try {
        const moviesRes = await fetch(`${TMDB_BASE_URL}/account/${accountId}/favorite/movies?api_key=${TMDB_API_KEY}&session_id=${sessionId}`);
        const tvRes = await fetch(`${TMDB_BASE_URL}/account/${accountId}/favorite/tv?api_key=${TMDB_API_KEY}&session_id=${sessionId}`);

        const mData = await moviesRes.json();
        const tData = await tvRes.json();

        const mFavs = (mData.results || []).map(m => ({ id: m.id, type: 'movie' }));
        const tFavs = (tData.results || []).map(t => ({ id: t.id, type: 'tv' }));

        tmdbFavoritesCache = [...mFavs, ...tFavs];
        localStorage.setItem('tmdb_favorites_cache', JSON.stringify(tmdbFavoritesCache));

        // Обновляем UI всех кнопок на странице (если они есть)
        document.querySelectorAll('.favorite-btn').forEach(btn => {
            const card = btn.closest('.movie-card, .top10-card');
            if (!card) return;
            const id = card.dataset.id;
            let type = 'movie';
            if (window.location.pathname.includes('series.html')) type = 'tv';
            if (card.dataset.type) type = card.dataset.type;

            const icon = btn.querySelector('i');
            if (window.isFavorite(id, type)) {
                btn.classList.add('active');
                btn.title = 'В вашем аккаунте';
                if (icon) {
                    icon.classList.remove('fa-heart');
                    icon.classList.add('fa-user-circle');
                }
            } else {
                btn.classList.remove('active');
                btn.title = 'Добавить в избранное';
                if (icon) {
                    icon.classList.remove('fa-user-circle');
                    icon.classList.add('fa-heart');
                }
            }
        });

        // Обновляем hero-fav-btn
        const heroFavBtn = document.getElementById('hero-fav-btn');
        if (heroFavBtn && heroFavBtn.dataset.id) {
            const hId = heroFavBtn.dataset.id;
            const hType = heroFavBtn.dataset.type || 'movie';
            const icon = heroFavBtn.querySelector('i');
            if (window.isFavorite(hId, hType)) {
                heroFavBtn.classList.add('active');
                if (icon) icon.className = 'fa-solid fa-heart';
            } else {
                heroFavBtn.classList.remove('active');
                if (icon) icon.className = 'fa-regular fa-heart';
            }
        }
    } catch (e) {
        console.error('Ошибка загрузки кэша избранного', e);
    }
}

// Запускаем загрузку кэша если авторизованы
if (localStorage.getItem('tmdb_session_id')) {
    try {
        const cached = localStorage.getItem('tmdb_favorites_cache');
        if (cached) tmdbFavoritesCache = JSON.parse(cached);
    } catch (e) { }
    loadTMDBFavoritesCache();
}

window.isFavorite = function (id, type) {
    if (localStorage.getItem('tmdb_session_id')) {
        return tmdbFavoritesCache.some(item => item.id == id && item.type === type);
    } else {
        const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
        return favorites.some(item => item.id == id && item.type === type);
    }
};

window.toggleFavorite = async function (id, type) {
    const sessionId = localStorage.getItem('tmdb_session_id');
    const accountId = localStorage.getItem('tmdb_account_id');

    if (sessionId && accountId) {
        const isFavNow = window.isFavorite(id, type);
        const newState = !isFavNow;

        if (newState) {
            tmdbFavoritesCache.push({ id: parseInt(id), type });
        } else {
            const idx = tmdbFavoritesCache.findIndex(item => item.id == id && item.type === type);
            if (idx > -1) tmdbFavoritesCache.splice(idx, 1);
        }
        localStorage.setItem('tmdb_favorites_cache', JSON.stringify(tmdbFavoritesCache));

        try {
            const res = await fetch(`${TMDB_BASE_URL}/account/${accountId}/favorite?api_key=${TMDB_API_KEY}&session_id=${sessionId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json;charset=utf-8' },
                body: JSON.stringify({
                    media_type: type,
                    media_id: parseInt(id),
                    favorite: newState
                })
            });
            const data = await res.json();
            if (!data.success && data.status_code !== 1 && data.status_code !== 12 && data.status_code !== 13) {
                console.error('Ошибка при добавлении в избранное TMDB', data);
                if (!newState) {
                    tmdbFavoritesCache.push({ id: parseInt(id), type });
                } else {
                    const idx = tmdbFavoritesCache.findIndex(item => item.id == id && item.type === type);
                    if (idx > -1) tmdbFavoritesCache.splice(idx, 1);
                }
                localStorage.setItem('tmdb_favorites_cache', JSON.stringify(tmdbFavoritesCache));
                return isFavNow;
            }
        } catch (e) {
            console.error('Network error toggleFavorite', e);
        }
        return newState;
    } else {
        const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
        const index = favorites.findIndex(item => item.id == id && item.type === type);
        let isAdded = false;

        if (index > -1) {
            favorites.splice(index, 1);
        } else {
            favorites.push({ id, type });
            isAdded = true;
        }

        localStorage.setItem('favorites', JSON.stringify(favorites));
        return isAdded;
    }
};
