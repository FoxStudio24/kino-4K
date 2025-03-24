// Константы
const TMDB_API_KEY = '06936145fe8e20be28b02e26b55d3ce6'; // Ваш ключ TMDB
const KINOPOISK_API_KEY = 'db70ce2d-cc98-4f5e-a5d5-bfcb03b25f9c'; // Ваш ключ Kinopoisk API
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const KINOPOISK_BASE_URL = 'https://kinopoiskapiunofficial.tech/api/v2.2';
const IMG_URL = 'https://image.tmdb.org/t/p/w500';
const BACKDROP_URL = 'https://image.tmdb.org/t/p/original';
const VIBIX_API_TOKEN = '8506|eOybyt3t9bUnwdwexHVh6wLNFOyFiq8AQuMEDvfde091d426'; // Ваш токен Vibix

// Переменные состояния
let initialLoadComplete = false;
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
let currentSlidePositions = {
    'popular-movies': 0,
    'top-rated-tv': 0,
    'animated-movies': 0,
    'russian-releases': 0
};
let currentFilter = 'all';

// DOM элементы
const loadingScreen = document.querySelector('.loading-screen');
const newReleasesGrid = document.getElementById('new-releases-grid');
const popularMoviesGrid = document.getElementById('popular-movies-grid');
const topRatedTvGrid = document.getElementById('top-rated-tv-grid');
const animatedMoviesGrid = document.getElementById('animated-movies-grid');
const russianReleasesGrid = document.getElementById('russian-releases-grid');
const searchForm = document.querySelector('header form');
const searchInput = document.querySelector('header input[type="text"]');
const movieInfoModal = document.getElementById('movie-info-modal');
const closeMovieInfoButton = document.querySelector('#movie-info-modal .close-modal');
const favoritesModal = document.getElementById('favorites');
const closeFavoritesButton = document.querySelector('#favorites .close-modal');
const favoritesGrid = document.getElementById('favorites-grid');
const openFavoritesButton = document.getElementById('open-favorites');
const searchResultsModal = document.getElementById('search-results');
const closeSearchButton = document.querySelector('#search-results .close-modal');
const searchResultsGrid = document.getElementById('search-results-grid');

// Маппинг кодов стран на русские названия
const countryMap = {
    'US': 'США',
    'RU': 'Россия',
    'GB': 'Великобритания',
    'FR': 'Франция',
    'DE': 'Германия',
    'JP': 'Япония',
    'CN': 'Китай',
    'CA': 'Канада',
    'AU': 'Австралия',
    'IT': 'Италия',
    'ES': 'Испания',
    'KR': 'Южная Корея',
    'BR': 'Бразилия',
    'MX': 'Мексика'
};

// Динамические стили с Montserrat
const style = document.createElement('style');
style.textContent = `
    .movie-logo { max-width: 300px; max-height: 200px; margin-bottom: 20px; filter: drop-shadow(2px 4px 6px rgba(0, 0, 0, 0.5)); }
    .movie-title-logo { max-width: 300px; max-height: 120px; margin-bottom: 15px; filter: drop-shadow(2px 4px 6px rgba(0, 0, 0, 0.5)); }
    .button-container { display: flex; justify-content: flex-end; margin-top: 10px; }
    .player-button { padding: 7px 25px; background-color: rgba(255, 255, 255, 0.17); color: white; border: none; border-radius: 25px; cursor: pointer; transition: background-color 0.3s; margin-left: 10px; backdrop-filter: blur(5px); }
    .player-button:hover { background-color: rgba(120, 120, 120, 0.7); }
    .player-button.active { background-color: #8b75cb; backdrop-filter: none; }
    .player-button.hidden { display: none; }
    .video-player { width: 100%; height: 500px; max-width: 800px; margin: 0 auto; border-radius: 10px; overflow: hidden; }
    .video-player iframe { width: 100%; height: 100%; border: none; border-radius: 10px; }
    .rating-span { display: inline-block; padding: 5px 10px; border-radius: 99px; color: white; font-weight: bold; font-family: 'Montserrat', sans-serif; display: flex; align-items: center; gap: 4px; }
    .tile-rating-span { display: inline-block; padding: 2px 6px; border-radius: 10px; color: white; font-size: 12px; font-weight: bold; font-family: 'Montserrat', sans-serif; }
    .rating-green { background-color: #28a745; }
    .rating-yellow { background-color: #d39e00; }
    .rating-red { background-color: #dc3545; }
    .rating-logo { width: 30px; height: 30px; vertical-align: middle; }
    .overview-text { 
        display: -webkit-box; 
        -webkit-line-clamp: 3; 
        -webkit-box-orient: vertical; 
        overflow: hidden; 
        text-overflow: ellipsis; 
        max-height: 4.5em; 
        font-family: 'Montserrat', sans-serif; 
        font-size: 14px; 
        line-height: 1.5; 
    }
    .tagline {
        font-family: 'Montserrat', sans-serif;
        font-size: 14px;
        color: #ccc;
        margin: 5px 0 10px 0;
        font-style: italic;
    }
    .country-year {
        font-family: 'Montserrat', sans-serif;
        font-size: 14px;
        color: #ccc;
        margin: 5px 0 10px 0;
    }
    .movie-tile { position: relative; }
    .age-rating { font-size: 12px; color: #fff; background-color: #555; padding: 2px 6px; border-radius: 10px; margin-right: 5px; }
    .ratings-container { display: flex; align-items: center; margin-top: 5px; gap: 10px; }
    .modal-age-rating { font-size: 12px; color: #fff; background-color: #555; padding: 2px 9px; border-radius: 10px; }
    .actors-button-container { text-align: right; margin-top: 10px; }
    .actors-button, .trailer-button { padding: 7px 25px; background-color: rgba(255, 255, 255, 0.17); color: white; border: none; border-radius: 25px; cursor: pointer; transition: background-color 0.3s; backdrop-filter: blur(5px); margin-left: 10px; }
    .actors-button:hover, .trailer-button:hover { background-color: rgba(120, 120, 120, 0.7); }
    .actors-list, .trailer-container { display: none; margin-top: 20px; overflow-x: auto; padding-bottom: 10px; transition: all 0.3s ease-in-out; max-height: 0; }
    .actors-list.active, .trailer-container.active { display: block; max-height: 248px; }
    .actors-list::-webkit-scrollbar, .trailer-container::-webkit-scrollbar { height: 8px; }
    .actors-list::-webkit-scrollbar-thumb, .trailer-container::-webkit-scrollbar-thumb { background-color: rgba(255, 255, 255, 0.3); border-radius: 4px; }
    .actors-list::-webkit-scrollbar-track, .trailer-container::-webkit-scrollbar-track { background-color: transparent; }
    .actor-item { display: inline-block; text-align: center; width: 120px; margin-right: 15px; vertical-align: top; }
    .actor-item img { width: 80px; height: 80px; object-fit: cover; border-radius: 99px; border: 1px solid #ffffff52; }
    .actor-item p { color: white; margin: 5px 0 0; font-family: 'Montserrat', sans-serif; font-size: 14px; white-space: normal; word-break: break-word; }
    .trailer-container iframe { width: 100%; height: 248px; border: none; border-radius: 10px; }
    .loading-indicator { display: flex; justify-content: center; align-items: center; height: 100%; }
    .loading-indicator img { width: 50px; height: 50px; }
    .search-meta { font-size: 12px; color: #ccc; margin: 5px 0; font-family: 'Montserrat', sans-serif; }
    .search-filters { margin-bottom: 15px; display: flex; gap: 10px; justify-content: flex-start; }
    .filter-button { padding: 5px 15px; background-color: rgba(255, 255, 255, 0.1); color: white; border: none; border-radius: 20px; cursor: pointer; transition: background-color 0.3s; }
    .filter-button:hover { background-color: rgba(255, 255, 255, 0.3); }
    .filter-button.active { background-color: #8b75cb; }
`;
document.head.appendChild(style);

// Улучшенная функция для получения Kinopoisk ID по названию
async function getKinopoiskIdByTitle(title, year, originalTitle = null, mediaType = 'movie') {
    try {
        const searchType = mediaType === 'tv' ? 'TV_SERIES' : 'FILM';
        let page = 1;
        let found = false;
        let bestMatch = null;

        function getSimilarity(str1, str2) {
            if (!str1 || !str2) return 0;
            str1 = str1.toLowerCase();
            str2 = str2.toLowerCase();
            const len1 = str1.length, len2 = str2.length;
            const matrix = Array(len2 + 1).fill(null).map(() => Array(len1 + 1).fill(null));

            for (let i = 0; i <= len1; i++) matrix[0][i] = i;
            for (let j = 0; j <= len2; j++) matrix[j][0] = j;

            for (let j = 1; j <= len2; j++) {
                for (let i = 1; i <= len1; i++) {
                    const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
                    matrix[j][i] = Math.min(
                        matrix[j - 1][i] + 1,
                        matrix[j][i - 1] + 1,
                        matrix[j - 1][i - 1] + indicator
                    );
                }
            }
            return 1 - matrix[len2][len1] / Math.max(len1, len2);
        }

        while (page <= 3 && !found) {
            const url = `${KINOPOISK_BASE_URL}/films?type=${searchType}&keyword=${encodeURIComponent(title)}&page=${page}`;
            const response = await fetch(url, {
                headers: {
                    'X-API-KEY': KINOPOISK_API_KEY,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Ошибка HTTP: ${response.status}`);
            }

            const data = await response.json();
            console.log(`Kinopoisk поиск (страница ${page}):`, data);

            if (!data.items || data.items.length === 0) break;

            const candidates = data.items
                .map(item => {
                    const titleRuMatch = item.nameRu ? getSimilarity(item.nameRu, title) : 0;
                    const titleEnMatch = item.nameEn ? getSimilarity(item.nameEn, title) : 0;
                    const originalTitleMatch = originalTitle && item.nameOriginal ? getSimilarity(item.nameOriginal, originalTitle) : 0;
                    const yearMatch = year && item.year ? Math.abs(parseInt(item.year) - parseInt(year)) <= 1 : true;

                    const score = Math.max(titleRuMatch * 0.8, titleEnMatch * 0.8, originalTitleMatch * 1.0) * (yearMatch ? 1 : 0.5);
                    return { item, score };
                })
                .filter(candidate => candidate.score > 0.4)
                .sort((a, b) => b.score - a.score);

            if (candidates.length > 0) {
                bestMatch = candidates[0].item;
                console.log(`Найден кандидат (страница ${page}): Kinopoisk ID: ${bestMatch.kinopoiskId}, Название: ${bestMatch.nameRu || bestMatch.nameEn}, Год: ${bestMatch.year}, Score: ${candidates[0].score}`);
                found = true;
                break;
            }

            page++;
        }

        if (!found && originalTitle && originalTitle !== title) {
            console.log(`Повторный поиск по оригинальному названию: "${originalTitle}"`);
            const url = `${KINOPOISK_BASE_URL}/films?type=${searchType}&keyword=${encodeURIComponent(originalTitle)}&page=1`;
            const response = await fetch(url, {
                headers: {
                    'X-API-KEY': KINOPOISK_API_KEY,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                console.log('Kinopoisk поиск по оригинальному названию:', data);

                const candidates = data.items
                    .map(item => {
                        const originalTitleMatch = item.nameOriginal ? getSimilarity(item.nameOriginal, originalTitle) : 0;
                        const titleRuMatch = item.nameRu ? getSimilarity(item.nameRu, originalTitle) : 0;
                        const titleEnMatch = item.nameEn ? getSimilarity(item.nameEn, originalTitle) : 0;
                        const yearMatch = year && item.year ? Math.abs(parseInt(item.year) - parseInt(year)) <= 1 : true;

                        const score = Math.max(originalTitleMatch * 1.0, titleRuMatch * 0.8, titleEnMatch * 0.8) * (yearMatch ? 1 : 0.5);
                        return { item, score };
                    })
                    .filter(candidate => candidate.score > 0.4)
                    .sort((a, b) => b.score - a.score);

                if (candidates.length > 0) {
                    bestMatch = candidates[0].item;
                    console.log(`Найден по оригинальному названию: Kinopoisk ID: ${bestMatch.kinopoiskId}, Название: ${bestMatch.nameRu || bestMatch.nameEn}, Год: ${bestMatch.year}, Score: ${candidates[0].score}`);
                    found = true;
                }
            }
        }

        if (!found) {
            console.log(`Kinopoisk ID не найден для "${title}" (${year}) даже с оригинальным названием "${originalTitle}"`);
            return null;
        }

        return bestMatch.kinopoiskId;
    } catch (error) {
        console.error('Ошибка при поиске Kinopoisk ID:', error);
        return null;
    }
}

// Функции управления слайдером
function initializeSliderControls(sectionId, grid) {
    const section = document.getElementById(sectionId);
    const prevButton = section.querySelector('.slider-button.prev');
    const nextButton = section.querySelector('.slider-button.next');
    const container = grid;

    function updateSliderVisibility() {
        const visibleWidth = container.parentElement.offsetWidth;
        const totalWidth = container.scrollWidth;
        const position = currentSlidePositions[sectionId];
        prevButton.style.display = position > 0 ? 'block' : 'none';
        nextButton.style.display = position < totalWidth - visibleWidth ? 'block' : 'none';
    }

    function slide(direction) {
        const visibleWidth = container.parentElement.offsetWidth;
        const position = currentSlidePositions[sectionId];
        const moveAmount = direction === 'next' ? 800 : -800;
        const newPosition = Math.max(0, Math.min(position + moveAmount, container.scrollWidth - visibleWidth));
        currentSlidePositions[sectionId] = newPosition;
        container.style.transform = `translateX(-${newPosition}px)`;
        updateSliderVisibility();
    }

    prevButton.onclick = () => slide('prev');
    nextButton.onclick = () => slide('next');
    updateSliderVisibility();
    window.addEventListener('resize', updateSliderVisibility);
}

// Управление экраном загрузки
function hideLoadingScreen() {
    if (initialLoadComplete) {
        loadingScreen.classList.add('hidden');
        setTimeout(() => loadingScreen.style.display = 'none', 500);
    }
}

function checkAllLoaded() {
    if (newReleasesGrid.children.length > 0 && 
        popularMoviesGrid.children.length > 0 && 
        topRatedTvGrid.children.length > 0 && 
        animatedMoviesGrid.children.length > 0 && 
        russianReleasesGrid.children.length > 0) {
        initialLoadComplete = true;
        hideLoadingScreen();
        initializeSliderControls('popular-movies', popularMoviesGrid);
        initializeSliderControls('top-rated-tv', topRatedTvGrid);
        initializeSliderControls('animated-movies', animatedMoviesGrid);
        initializeSliderControls('russian-releases', russianReleasesGrid);
    }
}

// Маппинг рейтингов TMDB в числовые категории
const ratingMap = {
    'G': '0+',
    'PG': '6+',
    'PG-13': '12+',
    'R': '16+',
    'NC-17': '18+',
    'TV-Y': '0+',
    'TV-Y7': '6+',
    'TV-G': '0+',
    'TV-PG': '12+',
    'TV-14': '16+',
    'TV-MA': '18+',
    '0+': '0+',
    '6+': '6+',
    '12+': '12+',
    '16+': '16+',
    '18+': '18+'
};

// Получение возрастного рейтинга с маппингом на числовые категории
async function getAgeRating(movie) {
    const mediaType = movie.first_air_date ? 'tv' : 'movie';
    const url = `${TMDB_BASE_URL}/${mediaType}/${movie.id}/${mediaType === 'movie' ? 'release_dates' : 'content_ratings'}?api_key=${TMDB_API_KEY}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        let rawRating = 'N/A';

        if (mediaType === 'movie') {
            const ruRating = data.results?.find(r => r.iso_3166_1 === 'RU');
            const usRating = data.results?.find(r => r.iso_3166_1 === 'US');
            rawRating = ruRating?.release_dates?.[0]?.certification || usRating?.release_dates?.[0]?.certification || 'N/A';
        } else {
            const ruRating = data.results?.find(r => r.iso_3166_1 === 'RU');
            const usRating = data.results?.find(r => r.iso_3166_1 === 'US');
            rawRating = ruRating?.rating || usRating?.rating || 'N/A';
        }

        const mappedRating = ratingMap[rawRating] || 'N/A';
        console.log(`Фильм: ${movie.title || movie.name}, Исходный рейтинг: ${rawRating}, Преобразованный рейтинг: ${mappedRating}`);
        return mappedRating;
    } catch (error) {
        console.error('Ошибка при получении возрастного рейтинга:', error);
        return 'N/A';
    }
}

// Проверка, произведен ли фильм в Индии
async function isFromIndia(movie) {
    const mediaType = movie.first_air_date ? 'tv' : 'movie';
    const url = `${TMDB_BASE_URL}/${mediaType}/${movie.id}?api_key=${TMDB_API_KEY}&language=ru-RU`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        const productionCountries = data.production_countries || [];
        const originCountry = data.origin_country || [];
        const isIndiaInvolved = productionCountries.some(country => country.iso_3166_1 === 'IN') || 
                               (Array.isArray(originCountry) && originCountry.includes('IN')) || 
                               originCountry === 'IN';
        console.log(`Фильм: ${data.title || data.name}, Произведен в Индии: ${isIndiaInvolved}`);
        return isIndiaInvolved;
    } catch (error) {
        console.error('Ошибка при проверке страны производства:', error);
        return false;
    }
}

// Создание плиток фильмов
async function createMovieTile(movie, isFullscreen = false) {
    const tile = document.createElement('div');
    tile.className = isFullscreen ? 'fullscreen-tile' : 'movie-tile';

    if (isFullscreen) {
        tile.style.backgroundImage = `url(${BACKDROP_URL}${movie.backdrop_path})`;
        tile.style.backgroundPosition = 'center';
        tile.style.backgroundSize = 'cover';
        const content = document.createElement('div');
        content.className = 'fullscreen-content';

        const ageRating = await getAgeRating(movie);
        const tmdbRating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';
        const tmdbRatingClass = tmdbRating >= 7 ? 'rating-green' : tmdbRating >= 5 ? 'rating-yellow' : tmdbRating !== 'N/A' ? 'rating-red' : '';

        const ratingsContainerTop = document.createElement('div');
        ratingsContainerTop.className = 'ratings-container fullscreen-ratings-top';
        ratingsContainerTop.innerHTML = `
            ${ageRating !== 'N/A' ? `<span class="age-rating">${ageRating}</span>` : ''}
            ${tmdbRating !== 'N/A' ? `<span class="tile-rating-span ${tmdbRatingClass}">${tmdbRating}</span>` : ''}
        `;
        content.appendChild(ratingsContainerTop);

        try {
            const response = await fetch(`${TMDB_BASE_URL}/movie/${movie.id}/images?api_key=${TMDB_API_KEY}`);
            const data = await response.json();
            const ruLogo = data.logos.find(logo => logo.iso_639_1 === 'ru');
            const enLogo = data.logos.find(logo => logo.iso_639_1 === 'en');
            const logo = ruLogo || enLogo;

            if (logo) {
                const logoImg = document.createElement('img');
                logoImg.src = `${IMG_URL}${logo.file_path}`;
                logoImg.alt = movie.title || movie.name;
                logoImg.className = 'movie-logo';
                content.appendChild(logoImg);
            } else {
                const title = document.createElement('h2');
                title.className = 'fullscreen-title';
                title.textContent = movie.title || movie.name;
                content.appendChild(title);
            }
        } catch (error) {
            console.error('Ошибка при получении логотипов фильма:', error);
            const title = document.createElement('h2');
            title.className = 'fullscreen-title';
            title.textContent = movie.title || movie.name;
            content.appendChild(title);
        }

        const watchButton = document.createElement('button');
        watchButton.className = 'watch-button';
        watchButton.innerHTML = '▶ Смотреть';
        content.appendChild(watchButton);

        tile.appendChild(content);
    } else {
        const ageRating = await getAgeRating(movie);
        const tmdbRating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';
        const tmdbRatingClass = tmdbRating >= 7 ? 'rating-green' : tmdbRating >= 5 ? 'rating-yellow' : tmdbRating !== 'N/A' ? 'rating-red' : '';
        tile.innerHTML = `
            <img src="${movie.poster_path ? IMG_URL + movie.poster_path : 'icons/poster.png'}" alt="${movie.title || movie.name}">
            <h3>${movie.title || movie.name}</h3>
            <div class="ratings-container">
                ${ageRating !== 'N/A' ? `<span class="age-rating">${ageRating}</span>` : ''}
                ${tmdbRating !== 'N/A' ? `<span class="tile-rating-span ${tmdbRatingClass}">${tmdbRating}</span>` : ''}
            </div>
        `;
    }

    tile.onclick = () => showMovieInfo(movie);
    return tile;
}

// Новая функция для создания плиток результатов поиска
async function createSearchResultTile(result) {
    const tile = document.createElement('div');
    tile.className = 'movie-tile';

    const title = result.title || result.name;
    const year = result.release_date 
        ? result.release_date.split('-')[0] 
        : result.first_air_date 
        ? result.first_air_date.split('-')[0] 
        : 'N/A';
    const mediaType = result.media_type === 'movie' ? 'Фильм' : 'Сериал';
    const tmdbRating = result.vote_average ? result.vote_average.toFixed(1) : 'N/A';
    const tmdbRatingClass = tmdbRating >= 7 ? 'rating-green' : tmdbRating >= 5 ? 'rating-yellow' : tmdbRating !== 'N/A' ? 'rating-red' : '';
    const ageRating = await getAgeRating(result);

    tile.innerHTML = `
        <img src="${result.poster_path ? IMG_URL + result.poster_path : 'icons/poster.png'}" alt="${title}">
        <h3>${title}</h3>
        <p class="search-meta">${mediaType} • ${year}</p>
        <div class="ratings-container">
            ${ageRating !== 'N/A' ? `<span class="age-rating">${ageRating}</span>` : ''}
            ${tmdbRating !== 'N/A' ? `<span class="tile-rating-span ${tmdbRatingClass}">${tmdbRating}</span>` : ''}
        </div>
    `;

    tile.onclick = () => showMovieInfo(result);
    return tile;
}

// Загрузка фильмов с фильтрацией Индии
async function fetchMoviesWithRetry(endpoint, container, isFullscreen = false, retries = 3) {
    return fetch(TMDB_BASE_URL + endpoint)
        .then(response => {
            if (!response.ok) throw new Error('Сеть ответила ошибкой');
            return response.json();
        })
        .then(async data => {
            container.innerHTML = '';
            const filteredMovies = [];

            for (const movie of data.results) {
                const isIndian = await isFromIndia(movie);
                if (!isIndian) {
                    filteredMovies.push(movie);
                } else {
                    console.log(`Фильм "${movie.title || movie.name}" исключен из рекомендаций (страна: Индия)`);
                }
            }

            if (filteredMovies.length === 0) {
                container.innerHTML = '<p>Нет доступных фильмов, удовлетворяющих критериям.</p>';
                checkAllLoaded();
                return;
            }

            if (container.id === 'new-releases-grid' && filteredMovies.length > 0) {
                const movie = filteredMovies[0];
                const movieTile = await createMovieTile(movie, isFullscreen);
                container.appendChild(movieTile);
            } else {
                for (const movie of filteredMovies) {
                    const movieTile = await createMovieTile(movie, isFullscreen);
                    container.appendChild(movieTile);
                }
            }
            checkAllLoaded();
        })
        .catch(error => {
            console.error('Ошибка:', error);
            if (retries > 0) {
                console.log(`Повторная попытка... (осталось ${retries} попыток)`);
                return fetchMoviesWithRetry(endpoint, container, isFullscreen, retries - 1);
            }
            container.innerHTML = '<p>Не удалось загрузить фильмы. Пожалуйста, попробуйте позже.</p>';
        });
}

// Функция для получения рейтинга Кинопоиска
async function getKinopoiskRating(kpId) {
    try {
        const url = `${KINOPOISK_BASE_URL}/films/${kpId}`;
        const response = await fetch(url, {
            headers: {
                'X-API-KEY': KINOPOISK_API_KEY,
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) {
            throw new Error(`Ошибка HTTP: ${response.status}`);
        }
        const data = await response.json();
        const kpRating = data.ratingKinopoisk ? data.ratingKinopoisk.toFixed(1) : 'N/A';
        console.log(`Рейтинг Кинопоиска для ID ${kpId}: ${kpRating}`);
        return kpRating;
    } catch (error) {
        console.error('Ошибка при получении рейтинга Кинопоиска:', error);
        return 'N/A';
    }
}

// Функции для управления прокруткой
function disableBodyScroll() {
    document.body.style.overflow = 'hidden';
    document.body.style.height = '100vh';
}

function enableBodyScroll() {
    document.body.style.overflow = '';
    document.body.style.height = '';
}

// Отображение информации о фильме
async function showMovieInfo(movie) {
    const modalContent = movieInfoModal.querySelector('.modal-content');
    modalContent.innerHTML = `
        <div class="loading-indicator">
            <img src="icons/Загрузка.gif" alt="Загрузка">
        </div>
    `;
    movieInfoModal.style.display = 'flex';
    disableBodyScroll();

    const mediaType = movie.media_type || (movie.first_air_date ? 'tv' : 'movie');
    const fetchUrl = `${TMDB_BASE_URL}/${mediaType}/${movie.id}?api_key=${TMDB_API_KEY}&language=ru-RU`;
    const logoUrl = `${TMDB_BASE_URL}/${mediaType}/${movie.id}/images?api_key=${TMDB_API_KEY}`;

    try {
        const [movieData, logoData] = await Promise.all([
            fetch(fetchUrl).then(res => res.json()),
            fetch(logoUrl).then(res => res.json())
        ]);
        displayMovieInfo(movieData, movie, logoData);
    } catch (error) {
        console.error('Ошибка при получении данных о фильме:', error);
        displayMovieInfoError();
    }
}

async function displayMovieInfo(data, movie, logoData) {
    const modalContent = movieInfoModal.querySelector('.modal-content');
    modalContent.style.backgroundImage = data.backdrop_path 
        ? `url(${BACKDROP_URL}${data.backdrop_path})`
        : 'url(icons/poster.png)';
    
    const title = data.title || data.name;
    const overview = data.overview || 'Описание отсутствует.';
    const tmdbRating = data.vote_average ? data.vote_average.toFixed(1) : 'N/A';
    const tmdbRatingClass = tmdbRating >= 7 ? 'rating-green' : tmdbRating >= 5 ? 'rating-yellow' : tmdbRating !== 'N/A' ? 'rating-red' : '';
    const ruLogo = logoData.logos?.find(logo => logo.iso_639_1 === 'ru');
    const enLogo = logoData.logos?.find(logo => logo.iso_639_1 === 'en');
    const logo = ruLogo || enLogo;
    const tagline = data.tagline ? `<p class="tagline">${data.tagline}</p>` : '';

    const titleHTML = logo 
        ? `<img src="${IMG_URL}${logo.file_path}" alt="${title}" class="movie-title-logo">${tagline}` 
        : `<h2 class="movie-title">${title}</h2>${tagline}`;

    const mediaType = data.media_type || (data.first_air_date ? 'tv' : 'movie');
    const ageRating = await getAgeRating(movie);
    const releaseYear = data.release_date ? parseInt(data.release_date.split('-')[0]) : data.first_air_date ? parseInt(data.first_air_date.split('-')[0]) : 'N/A';
    const countries = data.production_countries?.length > 0 
        ? data.production_countries.map(country => countryMap[country.iso_3166_1] || country.name).join(', ') 
        : 'N/A';

    let kpId = null;
    let vibixAvailable = false;
    let lumexAvailable = false;
    let vidfastAvailable = true; // Предполагаем, что VidFast всегда доступен
    let kpRating = 'N/A';
    let hasActors = false;
    let hasTrailers = false;

    try {
        const externalIdsUrl = `${TMDB_BASE_URL}/${mediaType}/${data.id}/external_ids?api_key=${TMDB_API_KEY}`;
        const externalIdsResponse = await fetch(externalIdsUrl);
        if (!externalIdsResponse.ok) {
            console.error(`Ошибка external_ids: ${externalIdsResponse.status}`);
        }
        const externalIdsData = await externalIdsResponse.json();
        kpId = externalIdsData.kinopoisk_id || null;
        console.log(`TMDB ID: ${data.id}, Kinopoisk ID из TMDB: ${kpId}`);

        if (!kpId) {
            kpId = await getKinopoiskIdByTitle(
                data.title || data.name,
                releaseYear,
                data.original_title || data.original_name,
                mediaType
            );
            console.log(`Kinopoisk ID из поиска по названию: ${kpId}`);
        }

        if (kpId) {
            kpRating = await getKinopoiskRating(kpId);
            try {
                const vibixResponse = await fetch(`https://vibix.org/api/v1/publisher/videos/kp/${kpId}`, {
                    headers: {
                        'Authorization': `Bearer ${VIBIX_API_TOKEN}`
                    }
                });
                console.log(`Vibix статус: ${vibixResponse.status}`);
                const vibixData = await vibixResponse.json();
                vibixAvailable = vibixResponse.ok && vibixData.iframe_url;
                console.log('Vibix данные:', vibixData);
            } catch (error) {
                console.error('Ошибка проверки Vibix:', error);
            }
            lumexAvailable = true;
        } else {
            console.log(`Фильм "${title}" (${releaseYear}) отсутствует в базе Kinopoisk на данный момент.`);
        }

        const creditsUrl = `${TMDB_BASE_URL}/${mediaType}/${data.id}/credits?api_key=${TMDB_API_KEY}&language=ru-RU`;
        const creditsResponse = await fetch(creditsUrl);
        const creditsData = await creditsResponse.json();
        hasActors = creditsData.cast && creditsData.cast.length > 0;
        console.log(`Актеры доступны: ${hasActors}, Количество: ${creditsData.cast?.length || 0}`);

        const videosUrl = `${TMDB_BASE_URL}/${mediaType}/${data.id}/videos?api_key=${TMDB_API_KEY}&language=ru-RU`;
        const videosResponse = await fetch(videosUrl);
        const videosData = await videosResponse.json();
        const trailers = videosData.results.filter(video => video.type === 'Trailer' && video.site === 'YouTube');
        hasTrailers = trailers.length > 0;
        console.log(`Трейлеры доступны: ${hasTrailers}, Количество: ${trailers.length}`);
    } catch (error) {
        console.error('Ошибка при получении дополнительных данных:', error);
    }

    const kpRatingClass = kpRating >= 7 ? 'rating-green' : kpRating >= 5 ? 'rating-yellow' : kpRating !== 'N/A' ? 'rating-red' : '';

    modalContent.innerHTML = `
        <img src="${data.poster_path ? IMG_URL + data.poster_path : 'icons/poster.png'}" alt="${title}" class="movie-poster">
        ${titleHTML}
        <div class="ratings-container">
            ${tmdbRating !== 'N/A' ? `
                <span class="rating-span tmdb-rating ${tmdbRatingClass}">
                    <img src="https://www.themoviedb.org/assets/2/v4/logos/v2/blue_square_1-5bdc75aaebeb75dc7ae79426ddd9be3b2be1e342510f8202baf6bffa71d7f5c4.svg" alt="TMDB" class="rating-logo">
                    ${tmdbRating}
                </span>` : ''}
            ${kpRating !== 'N/A' ? `
                <span class="rating-span kp-rating ${kpRatingClass}">
                    <img src="https://www.kinopoisk.ru/favicon.ico" alt="Kinopoisk" class="rating-logo">
                    ${kpRating}
                </span>` : ''}
            ${ageRating !== 'N/A' ? `<span class="modal-age-rating">${ageRating}</span>` : ''}
        </div>
        <p class="overview-text">${overview}</p>
        <p class="country-year">${countries} · ${releaseYear}</p>
        ${!kpId ? '<p style="color: #ff5555;">Этот фильм пока недоступен на Kinopoisk.</p>' : ''}
        <div class="actors-button-container">
            ${hasActors ? '<button id="toggle-actors-button" class="actors-button">Показать актеров</button>' : ''}
            ${hasTrailers ? '<button id="toggle-trailer-button" class="trailer-button">Показать трейлер</button>' : ''}
        </div>
        <div id="actors-list" class="actors-list"></div>
        <div id="trailer-container" class="trailer-container"></div>
        <div id="video-player-container">
            <div id="kinobox-player" class="video-player"></div>
            <div id="vibix-player" class="video-player" style="display: none;"></div>
            <div id="lumex-player" class="video-player" style="display: none;"></div>
            <div id="vidfast-player" class="video-player" style="display: none;"></div>
        </div>
        <div class="button-container">
            <button class="player-button active" id="kinobox-button">Kinobox</button>
            <button class="player-button ${!vibixAvailable ? 'hidden' : ''}" id="vibix-button">Vibix</button>
            <button class="player-button ${!lumexAvailable ? 'hidden' : ''}" id="lumex-button">Lumex</button>
            <button class="player-button" id="vidfast-button">VidFast(en)</button>
        </div>
        <button id="add-to-favorites">
            <img src="${isFavorite(data) ? 'icons/delete.png' : 'icons/add.png'}" alt="${isFavorite(data) ? 'Удалить из избранного' : 'Добавить в избранное'}" class="favorites-icon"/>
        </button>
        <button id="close-modal" class="close-button">
            <img src="icons/close24.png" alt="Закрыть" class="close-icon"/>
        </button>
    `;

    if (hasActors) {
        const toggleActorsButton = document.getElementById('toggle-actors-button');
        const actorsList = document.getElementById('actors-list');
        let actorsLoaded = false;

        toggleActorsButton.onclick = async () => {
            if (!actorsLoaded) {
                try {
                    const creditsUrl = `${TMDB_BASE_URL}/${mediaType}/${data.id}/credits?api_key=${TMDB_API_KEY}&language=ru-RU`;
                    const response = await fetch(creditsUrl);
                    const creditsData = await response.json();
                    const actors = creditsData.cast.slice(0, 10);

                    actorsList.innerHTML = '';
                    actors.forEach(actor => {
                        const actorItem = document.createElement('div');
                        actorItem.className = 'actor-item';
                        actorItem.innerHTML = `
                            <img src="${actor.profile_path ? `${IMG_URL}${actor.profile_path}` : 'icons/poster.png'}" alt="${actor.name}">
                            <p>${actor.name}</p>
                        `;
                        actorsList.appendChild(actorItem);
                    });
                    actorsLoaded = true;
                } catch (error) {
                    console.error('Ошибка при загрузке актеров:', error);
                    actorsList.innerHTML = '<p>Не удалось загрузить актеров.</p>';
                }
            }

            if (actorsList.classList.contains('active')) {
                actorsList.classList.remove('active');
                toggleActorsButton.textContent = 'Показать актеров';
                setTimeout(() => actorsList.style.display = 'none', 300);
            } else {
                actorsList.style.display = 'block';
                setTimeout(() => actorsList.classList.add('active'), 10);
                toggleActorsButton.textContent = 'Скрыть актеров';
            }
        };
    }

    if (hasTrailers) {
        const toggleTrailerButton = document.getElementById('toggle-trailer-button');
        const trailerContainer = document.getElementById('trailer-container');
        let trailerLoaded = false;

        toggleTrailerButton.onclick = async () => {
            if (!trailerLoaded) {
                try {
                    const videosUrl = `${TMDB_BASE_URL}/${mediaType}/${data.id}/videos?api_key=${TMDB_API_KEY}&language=ru-RU`;
                    const response = await fetch(videosUrl);
                    const videosData = await response.json();
                    const trailers = videosData.results.filter(video => video.type === 'Trailer' && video.site === 'YouTube');

                    let trailer = trailers.find(trailer => trailer.iso_639_1 === 'ru');
                    if (!trailer && trailers.length > 0) trailer = trailers[0];

                    if (trailer) {
                        trailerContainer.innerHTML = `
                            <iframe src="https://www.youtube.com/embed/${trailer.key}" 
                                    frameborder="0" 
                                    allowfullscreen 
                                    allow="autoplay; encrypted-media"></iframe>
                        `;
                        console.log(`Трейлер загружен: ${trailer.name} (${trailer.iso_639_1})`);
                    } else {
                        trailerContainer.innerHTML = '<p>Трейлер не найден.</p>';
                        console.log('Трейлеры отсутствуют для этого фильма/сериала');
                    }
                    trailerLoaded = true;
                } catch (error) {
                    console.error('Ошибка при загрузке трейлера:', error);
                    trailerContainer.innerHTML = '<p>Не удалось загрузить трейлер.</p>';
                }
            }

            if (trailerContainer.classList.contains('active')) {
                trailerContainer.classList.remove('active');
                toggleTrailerButton.textContent = 'Показать трейлер';
                setTimeout(() => trailerContainer.style.display = 'none', 300);
            } else {
                trailerContainer.style.display = 'block';
                setTimeout(() => trailerContainer.classList.add('active'), 10);
                toggleTrailerButton.textContent = 'Скрыть трейлер';
            }
        };
    }

    const kinoboxSearch = kpId 
        ? { kinopoisk: kpId, type: mediaType === 'tv' ? 'serial' : 'movie' }
        : { tmdb: data.id, type: mediaType === 'tv' ? 'serial' : 'movie' };
    console.log(`Kinobox использует: ${kpId ? `Kinopoisk ID: ${kpId}` : `TMDB ID: ${data.id}`}`);

    // Проверка, что Kinobox определен
    if (typeof Kinobox !== 'undefined') {
        const kinobox = new Kinobox('#kinobox-player', {
            search: kinoboxSearch,
            players: { 
                'turbo': true,
                'alloha': true,
                'lumex': true,
                'collaps': true,
                'videoapi': false,
                'hddb': false 
            },
            params: { season: 1, episode: 1 },
            ui: { mobile: true }
        });

        try {
            await kinobox.init();
            console.log('Kinobox инициализирован');
        } catch (error) {
            console.error('Ошибка инициализации Kinobox:', error);
            document.getElementById('kinobox-player').innerHTML = '<p>Не удалось загрузить плеер Kinobox</p>';
        }
    } else {
        console.error('Kinobox не подключен. Убедитесь, что скрипт Kinobox загружен.');
        document.getElementById('kinobox-player').innerHTML = '<p>Плеер Kinobox недоступен</p>';
    }

    const kinoboxPlayer = document.getElementById('kinobox-player');
    const vibixPlayer = document.getElementById('vibix-player');
    const lumexPlayer = document.getElementById('lumex-player');
    const vidfastPlayer = document.getElementById('vidfast-player');
    const kinoboxButton = document.getElementById('kinobox-button');
    const vibixButton = document.getElementById('vibix-button');
    const lumexButton = document.getElementById('lumex-button');
    const vidfastButton = document.getElementById('vidfast-button');

    async function loadVibixPlayer() {
        if (!kpId) {
            vibixPlayer.innerHTML = '<p>Kinopoisk ID не найден</p>';
            console.log('Vibix: Нет kpId');
            return;
        }

        try {
            const response = await fetch(`https://vibix.org/api/v1/publisher/videos/kp/${kpId}`, {
                headers: {
                    'Authorization': `Bearer ${VIBIX_API_TOKEN}`
                }
            });
            console.log(`Vibix запрос для kpId ${kpId}, статус: ${response.status}`);
            if (!response.ok) {
                vibixPlayer.innerHTML = `<p>Ошибка Vibix: ${response.status}</p>`;
                throw new Error(`Vibix API ошибка: ${response.status}`);
            }
            const vibixData = await response.json();
            console.log('Vibix данные:', vibixData);
            if (vibixData.iframe_url) {
                vibixPlayer.innerHTML = `
                    <iframe src="${vibixData.iframe_url}" 
                            width="100%" 
                            height="100%" 
                            frameborder="0" 
                            allowfullscreen 
                            allow="autoplay *; fullscreen *"></iframe>
                `;
                console.log('Vibix iframe загружен:', vibixData.iframe_url);
            } else {
                vibixPlayer.innerHTML = '<p>Видео не найдено на Vibix</p>';
                console.log('Vibix: iframe_url отсутствует');
            }
        } catch (error) {
            console.error('Ошибка загрузки Vibix:', error);
            vibixPlayer.innerHTML = '<p>Ошибка загрузки плеера Vibix</p>';
        }
    }

    async function loadLumexPlayer() {
        if (!kpId) {
            lumexPlayer.innerHTML = '<p>Kinopoisk ID не найден</p>';
            console.log('Lumex: Нет kpId');
            return;
        }

        try {
            const iframeSrc = `//p.lumex.cloud/GbaXAhTWVSqL?kp_id=${kpId}&autoplay=1`;
            console.log(`Lumex iframe URL: ${iframeSrc}`);
            lumexPlayer.innerHTML = `
                <iframe src="${iframeSrc}" 
                        width="100%" 
                        height="100%" 
                        frameborder="0" 
                        allowfullscreen 
                        allow="autoplay *; fullscreen *"></iframe>
            `;
            console.log('Lumex плеер загружен');
        } catch (error) {
            console.error('Ошибка загрузки Lumex:', error);
            lumexPlayer.innerHTML = '<p>Ошибка загрузки плеера Lumex</p>';
        }
    }

    async function loadVidfastPlayer() {
        try {
            const externalIdsUrl = `${TMDB_BASE_URL}/${mediaType}/${data.id}/external_ids?api_key=${TMDB_API_KEY}`;
            const externalIdsResponse = await fetch(externalIdsUrl);
            const externalIdsData = await externalIdsResponse.json();
            const imdbId = externalIdsData.imdb_id || null;
            const tmdbId = data.id;

            let iframeSrc;
            if (mediaType === 'movie') {
                iframeSrc = `https://vidfast.pro/movie/${imdbId || tmdbId}?autoPlay=true&color=16A085`;
            } else {
                iframeSrc = `https://vidfast.pro/tv/${imdbId || tmdbId}/1/1?autoPlay=true&nextButton=true&autoNext=true&color=16A085`;
            }

            console.log(`VidFast iframe URL: ${iframeSrc}`);
            vidfastPlayer.innerHTML = `
                <iframe src="${iframeSrc}" 
                        width="100%" 
                        height="100%" 
                        frameborder="0" 
                        allowfullscreen 
                        allow="autoplay *; fullscreen *"></iframe>
            `;
            console.log('VidFast плеер загружен');
        } catch (error) {
            console.error('Ошибка загрузки VidFast:', error);
            vidfastPlayer.innerHTML = '<p>Ошибка загрузки плеера VidFast</p>';
        }
    }

    kinoboxButton.onclick = () => {
        kinoboxPlayer.style.display = 'block';
        vibixPlayer.style.display = 'none';
        lumexPlayer.style.display = 'none';
        vidfastPlayer.style.display = 'none';
        kinoboxButton.classList.add('active');
        vibixButton.classList.remove('active');
        lumexButton.classList.remove('active');
        vidfastButton.classList.remove('active');
        console.log('Переключено на Kinobox');
    };

    vibixButton.onclick = () => {
        kinoboxPlayer.style.display = 'none';
        vibixPlayer.style.display = 'block';
        lumexPlayer.style.display = 'none';
        vidfastPlayer.style.display = 'none';
        vibixButton.classList.add('active');
        kinoboxButton.classList.remove('active');
        lumexButton.classList.remove('active');
        vidfastButton.classList.remove('active');
        if (!vibixPlayer.children.length) {
            console.log('Загрузка Vibix...');
            loadVibixPlayer();
        }
    };

    lumexButton.onclick = () => {
        kinoboxPlayer.style.display = 'none';
        vibixPlayer.style.display = 'none';
        lumexPlayer.style.display = 'block';
        vidfastPlayer.style.display = 'none';
        lumexButton.classList.add('active');
        kinoboxButton.classList.remove('active');
        vibixButton.classList.remove('active');
        vidfastButton.classList.remove('active');
        if (!lumexPlayer.children.length) {
            console.log('Загрузка Lumex...');
            loadLumexPlayer();
        }
    };

    vidfastButton.onclick = () => {
        kinoboxPlayer.style.display = 'none';
        vibixPlayer.style.display = 'none';
        lumexPlayer.style.display = 'none';
        vidfastPlayer.style.display = 'block';
        vidfastButton.classList.add('active');
        kinoboxButton.classList.remove('active');
        vibixButton.classList.remove('active');
        lumexButton.classList.remove('active');
        if (!vidfastPlayer.children.length) {
            console.log('Загрузка VidFast...');
            loadVidfastPlayer();
        }
    };

    document.getElementById('add-to-favorites').onclick = () => toggleFavorite(data);
    document.getElementById('close-modal').onclick = closeMovieInfo;
}

function displayMovieInfoError() {
    const modalContent = movieInfoModal.querySelector('.modal-content');
    modalContent.innerHTML = `
        <p>Произошла ошибка при загрузке информации о фильме.</p>
        <p>Пожалуйста, попробуйте позже или выберите другой фильм.</p>
        <button id="close-modal">Закрыть</button>
    `;
    document.getElementById('close-modal').onclick = closeMovieInfo;
}

function closeMovieInfo() {
    movieInfoModal.style.display = 'none';
    enableBodyScroll();
}

// Работа с избранным
function isFavorite(movie) {
    return favorites.some(fav => fav.id === movie.id);
}

function toggleFavorite(movie) {
    const index = favorites.findIndex(fav => fav.id === movie.id);
    if (index === -1) {
        favorites.push({
            id: movie.id,
            title: movie.title || movie.name,
            poster_path: movie.poster_path,
            media_type: movie.media_type || (movie.first_air_date ? 'tv' : 'movie')
        });
        alert('Фильм добавлен в избранное');
    } else {
        favorites.splice(index, 1);
        alert('Фильм удален из избранного');
    }
    localStorage.setItem('favorites', JSON.stringify(favorites));
    updateFavoritesGrid();
}

function updateFavoritesGrid() {
    favoritesGrid.innerHTML = '';
    favorites.forEach(async movie => {
        const isIndian = await isFromIndia(movie);
        if (!isIndian) {
            const movieTile = await createMovieTile(movie);
            favoritesGrid.appendChild(movieTile);
        } else {
            console.log(`Фильм "${movie.title}" исключен из избранного (страна: Индия)`);
        }
    });
}

function openFavorites() {
    favoritesModal.style.display = 'flex';
    disableBodyScroll();
    updateFavoritesGrid();
}

function closeFavorites() {
    favoritesModal.style.display = 'none';
    enableBodyScroll();
}

// Поиск фильмов с фильтрацией Индии
async function searchMovies(query) {
    searchResultsGrid.innerHTML = `
        <div class="loading-indicator">
            <img src="icons/Загрузка.gif" alt="Загрузка">
        </div>
    `;
    searchResultsModal.style.display = 'flex';
    disableBodyScroll();
    searchResultsGrid.dataset.lastQuery = query;

    const searchUrl = `${TMDB_BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&language=ru-RU&query=${encodeURIComponent(query)}&include_adult=false`;
    try {
        const response = await fetch(searchUrl);
        if (!response.ok) throw new Error(`TMDB ошибка: ${response.status}`);
        const data = await response.json();

        let filteredResults = data.results.filter(result => 
            result.media_type === 'movie' || result.media_type === 'tv'
        );

        const nonIndianResults = [];
        for (const result of filteredResults) {
            const isIndian = await isFromIndia(result);
            if (!isIndian) {
                nonIndianResults.push(result);
            } else {
                console.log(`Фильм "${result.title || result.name}" исключен из поиска (страна: Индия)`);
            }
        }

        filteredResults = nonIndianResults;

        switch (currentFilter) {
            case 'tv':
                filteredResults = filteredResults.filter(result => result.media_type === 'tv');
                break;
            case 'movies':
                filteredResults = filteredResults.filter(result => 
                    result.media_type === 'movie' && (!result.genre_ids || !result.genre_ids.includes(16))
                );
                break;
            case 'animated':
                filteredResults = filteredResults.filter(result => 
                    result.media_type === 'movie' && result.genre_ids && result.genre_ids.includes(16)
                );
                break;
            case 'all':
            default:
                break;
        }

        filteredResults = filteredResults
            .filter(result => result.vote_count >= 50 && result.vote_average >= 5)
            .sort((a, b) => b.popularity - a.popularity);

        if (filteredResults.length === 0) {
            searchResultsGrid.innerHTML = '<p>Ничего не найдено. Попробуйте изменить запрос или фильтр.</p>';
            return;
        }

        searchResultsGrid.innerHTML = '';
        for (const result of filteredResults) {
            const movieTile = await createSearchResultTile(result);
            searchResultsGrid.appendChild(movieTile);
        }
    } catch (error) {
        console.error('Ошибка поиска:', error);
        searchResultsGrid.innerHTML = '<p>Не удалось выполнить поиск. Пожалуйста, попробуйте позже.</p>';
    }
}

function closeSearchResults() {
    searchResultsModal.style.display = 'none';
    enableBodyScroll();
    currentFilter = 'all';
    document.querySelectorAll('.filter-button').forEach(btn => btn.classList.remove('active'));
    document.getElementById('filter-all').classList.add('active');
}

// Обработчики событий
openFavoritesButton.onclick = openFavorites;
closeFavoritesButton.onclick = closeFavorites;
closeMovieInfoButton.onclick = closeMovieInfo;
closeSearchButton.onclick = closeSearchResults;

searchForm.onsubmit = (event) => {
    event.preventDefault();
    const query = searchInput.value.trim();
    if (query) {
        searchMovies(query);
        searchInput.value = '';
    } else {
        alert('Введите запрос для поиска!');
    }
};

movieInfoModal.addEventListener('click', (event) => {
    if (event.target === movieInfoModal) {
        closeMovieInfo();
    }
});

favoritesModal.addEventListener('click', (event) => {
    if (event.target === favoritesModal) {
        closeFavorites();
    }
});

searchResultsModal.addEventListener('click', (event) => {
    if (event.target === searchResultsModal) {
        closeSearchResults();
    }
});

// Функция для применения фильтров поиска
function applyFilter(filter) {
    currentFilter = filter;
    document.querySelectorAll('.filter-button').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`filter-${filter}`).classList.add('active');
    const lastQuery = searchResultsGrid.dataset.lastQuery;
    if (lastQuery) {
        searchMovies(lastQuery);
    } else {
        console.log('Нет последнего запроса для применения фильтра');
    }
}

// Инициализация фильтров поиска
document.addEventListener('DOMContentLoaded', () => {
    const searchModalContent = searchResultsModal.querySelector('.modal-content');
    const filtersDiv = document.createElement('div');
    filtersDiv.className = 'search-filters';
    filtersDiv.innerHTML = `
        <button id="filter-all" class="filter-button active">Все</button>
        <button id="filter-tv" class="filter-button">Сериалы</button>
        <button id="filter-movies" class="filter-button">Фильмы</button>
        <button id="filter-animated" class="filter-button">Мультфильмы</button>
    `;
    searchModalContent.insertBefore(filtersDiv, searchResultsGrid);

    document.getElementById('filter-all').onclick = () => applyFilter('all');
    document.getElementById('filter-tv').onclick = () => applyFilter('tv');
    document.getElementById('filter-movies').onclick = () => applyFilter('movies');
    document.getElementById('filter-animated').onclick = () => applyFilter('animated');
});

// Инициализация
Promise.all([
    fetchMoviesWithRetry(`/trending/movie/week?api_key=${TMDB_API_KEY}&language=ru-RU`, newReleasesGrid, true),
    fetchMoviesWithRetry(`/discover/movie?api_key=${TMDB_API_KEY}&language=ru-RU&sort_by=popularity.desc&vote_average.gte=7&vote_count.gte=100`, popularMoviesGrid),
    fetchMoviesWithRetry(`/discover/tv?api_key=${TMDB_API_KEY}&language=ru-RU&sort_by=vote_average.desc&vote_average.gte=8&vote_count.gte=100`, topRatedTvGrid),
    fetchMoviesWithRetry(`/discover/movie?api_key=${TMDB_API_KEY}&language=ru-RU&with_genres=16&vote_average.gte=7&vote_count.gte=50`, animatedMoviesGrid),
    fetchMoviesWithRetry(`/discover/movie?api_key=${TMDB_API_KEY}&language=ru-RU&with_origin_country=RU&primary_release_date.gte=2023-01-01&vote_average.gte=6&vote_count.gte=20&sort_by=vote_average.desc`, russianReleasesGrid),
    fetchMoviesWithRetry(`/discover/tv?api_key=${TMDB_API_KEY}&language=ru-RU&with_origin_country=RU&first_air_date.gte=2023-01-01&vote_average.gte=6&vote_count.gte=20&sort_by=vote_average.desc`, russianReleasesGrid)
]).then(() => {
    initialLoadComplete = true;
    hideLoadingScreen();
}).catch(error => {
    console.error('Ошибка при начальной загрузке:', error);
    hideLoadingScreen();
});

// Заполнение рейтинга TMDB в .landing-section
async function updateLandingSectionRatings() {
    const tmdbId = 197; // ID сериала "Silo"
    const tmdbResponse = await fetch(`${TMDB_BASE_URL}/tv/${tmdbId}?api_key=${TMDB_API_KEY}&language=ru-RU`);
    const tmdbData = await tmdbResponse.json();
    const tmdbRating = tmdbData.vote_average ? tmdbData.vote_average.toFixed(1) : 'N/A';
    const tmdbRatingClass = tmdbRating >= 7 ? 'rating-green' : tmdbRating >= 5 ? 'rating-yellow' : tmdbRating !== 'N/A' ? 'rating-red' : '';
    document.querySelector('.landing-section .tmdb-rating').textContent = tmdbRating;
    document.querySelector('.landing-section .tmdb-rating').classList.add(tmdbRatingClass);
}

document.addEventListener('DOMContentLoaded', updateLandingSectionRatings);