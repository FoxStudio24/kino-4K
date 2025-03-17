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

// Динамические стили с Montserrat
const style = document.createElement('style');
style.textContent = `
    .movie-logo { max-width: 300px; max-height: 200px; margin-bottom: 20px; filter: drop-shadow(2px 4px 6px rgba(0, 0, 0, 0.5)); }
    .movie-title-logo { max-width: 300px; max-height: 120px; margin-bottom: 15px; filter: drop-shadow(2px 4px 6px rgba(0, 0, 0, 0.5)); }
    .button-container { display: flex; justify-content: flex-end; margin-top: 10px; }
    .player-button { padding: 7px 25px; background-color: rgba(255 255 255 / 17%); color: white; border: none; border-radius: 25px; cursor: pointer; transition: background-color 0.3s; margin-left: 10px; backdrop-filter: blur(5px); }
    .player-button:hover { background-color: rgba(120, 120, 120, 0.7); }
    .player-button.active { background-color: #272727; backdrop-filter: none; }
    .player-button.hidden { display: none; }
    .video-player { width: 100%; height: 500px; max-width: 800px; margin: 0 auto; border-radius: 10px; overflow: hidden; }
    .video-player iframe { width: 100%; height: 100%; border: none; border-radius: 10px; }
    .rating-span { display: inline-block; padding: 5px 10px; border-radius: 15px; color: white; font-weight: bold; font-family: 'Montserrat', sans-serif; }
    .tile-rating-span { display: inline-block; padding: 2px 6px; border-radius: 10px; color: white; font-size: 12px; font-weight: bold; font-family: 'Montserrat', sans-serif; }
    .rating-green { background-color: #28a745; }
    .rating-yellow { background-color: #d39e00; }
    .rating-red { background-color: #dc3545; }
    .overview-text { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis; }
    .movie-tile { position: relative; }
    .age-rating { font-size: 12px; color: #fff; background-color: #555; padding: 2px 6px; border-radius: 10px; margin-right: 5px; }
    .ratings-container { display: flex; align-items: center; margin-top: 5px; }
    .modal-age-rating { font-size: 12px; color: #fff; background-color: #555; padding: 2px 6px; border-radius: 10px; margin-top: 5px; margin-bottom: 10px; display: inline-block; }
`;
document.head.appendChild(style);

// Функция для получения Kinopoisk ID по названию
async function getKinopoiskIdByTitle(title, year) {
    try {
        const response = await fetch(`${KINOPOISK_BASE_URL}/films?type=ALL&keyword=${encodeURIComponent(title)}`, {
            headers: {
                'X-API-KEY': KINOPOISK_API_KEY,
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) {
            throw new Error(`Ошибка HTTP: ${response.status}`);
        }
        const data = await response.json();
        console.log('Kinopoisk поиск:', data);

        const result = data.items.find(item => {
            const matchesTitle = item.nameRu.toLowerCase().includes(title.toLowerCase()) || 
                                item.nameEn?.toLowerCase().includes(title.toLowerCase());
            const matchesYear = year ? item.year === year : true;
            return matchesTitle && matchesYear;
        });

        return result ? result.kinopoiskId : null;
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

// Получение возрастного рейтинга с fallback на US
async function getAgeRating(movie) {
    const mediaType = movie.first_air_date ? 'tv' : 'movie';
    const url = `${TMDB_BASE_URL}/${mediaType}/${movie.id}/${mediaType === 'movie' ? 'release_dates' : 'content_ratings'}?api_key=${TMDB_API_KEY}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        let rating = 'N/A';

        if (mediaType === 'movie') {
            const ruRating = data.results?.find(r => r.iso_3166_1 === 'RU');
            const usRating = data.results?.find(r => r.iso_3166_1 === 'US');
            rating = ruRating?.release_dates?.[0]?.certification || usRating?.release_dates?.[0]?.certification || 'N/A';
        } else {
            const ruRating = data.results?.find(r => r.iso_3166_1 === 'RU');
            const usRating = data.results?.find(r => r.iso_3166_1 === 'US');
            rating = ruRating?.rating || usRating?.rating || 'N/A';
        }

        console.log(`Фильм: ${movie.title || movie.name}, Возрастной рейтинг: ${rating}`);
        return rating;
    } catch (error) {
        console.error('Ошибка при получении возрастного рейтинга:', error);
        return 'N/A';
    }
}

// Создание плиток фильмов
async function createMovieTile(movie, isFullscreen = false) {
    const tile = document.createElement('div');
    tile.className = isFullscreen ? 'fullscreen-tile' : 'movie-tile';

    if (isFullscreen) {
        tile.style.backgroundImage = `url(${BACKDROP_URL}${movie.backdrop_path})`;
        const content = document.createElement('div');
        content.className = 'fullscreen-content';

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

// Загрузка фильмов
function fetchMoviesWithRetry(endpoint, container, isFullscreen = false, retries = 3) {
    return fetch(TMDB_BASE_URL + endpoint)
        .then(response => {
            if (!response.ok) throw new Error('Сеть ответила ошибкой');
            return response.json();
        })
        .then(async data => {
            container.innerHTML = '';
            for (const movie of data.results) {
                const movieTile = await createMovieTile(movie, isFullscreen);
                container.appendChild(movieTile);
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

// Отображение информации о фильме
async function showMovieInfo(movie) {
    const modalContent = movieInfoModal.querySelector('.modal-content');
    modalContent.innerHTML = '<p>📤 Загрузка</p>';
    movieInfoModal.style.display = 'flex';

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

    const titleHTML = logo 
        ? `<img src="${IMG_URL}${logo.file_path}" alt="${title}" class="movie-title-logo">` 
        : `<h2 class="movie-title">${title}</h2>`;

    const mediaType = data.media_type || (data.first_air_date ? 'tv' : 'movie');
    const ageRating = await getAgeRating(movie);
    const releaseYear = data.release_date ? parseInt(data.release_date.split('-')[0]) : data.first_air_date ? parseInt(data.first_air_date.split('-')[0]) : null;

    // Получение Kinopoisk ID
    let kpId = null;
    let vibixAvailable = false;
    try {
        const externalIdsUrl = `${TMDB_BASE_URL}/${mediaType}/${data.id}/external_ids?api_key=${TMDB_API_KEY}`;
        const externalIdsResponse = await fetch(externalIdsUrl);
        const externalIdsData = await externalIdsResponse.json();
        kpId = externalIdsData.kinopoisk_id || null;
        console.log(`TMDB ID: ${data.id}, Kinopoisk ID из TMDB: ${kpId}`, externalIdsData);

        if (!kpId) {
            kpId = await getKinopoiskIdByTitle(title, releaseYear);
            console.log(`Kinopoisk ID из поиска по названию: ${kpId}`);
        }

        if (kpId) {
            const vibixResponse = await fetch(`https://vibix.org/api/v1/publisher/videos/kp/${kpId}`, {
                headers: {
                    'Authorization': `Bearer ${VIBIX_API_TOKEN}`
                }
            });
            const vibixData = await vibixResponse.json();
            vibixAvailable = vibixResponse.ok && vibixData.iframe_url;
            console.log('Vibix данные:', vibixData);
        }
    } catch (error) {
        console.error('Ошибка при получении Kinopoisk ID или данных Vibix:', error);
    }

    modalContent.innerHTML = `
        <img src="${data.poster_path ? IMG_URL + data.poster_path : 'icons/poster.png'}" alt="${title}" class="movie-poster">
        ${titleHTML}
        <p class="overview-text">${overview}</p>
        ${ageRating !== 'N/A' ? `<span class="modal-age-rating">${ageRating}</span>` : ''}
        <div class="info-block">
            <div class="rating-container">
                <span class="rating-span tmdb-rating ${tmdbRatingClass}">${tmdbRating}</span>
                <img src="https://www.themoviedb.org/assets/2/v4/logos/v2/blue_short-8e7b30f73a4020692ccca9c88bafe5dcb6f8a62a4c6bc55cd9ba82bb2cd95f6c.svg" 
                     alt="TMDB Logo" 
                     class="tmdb-logo rating-logo">
            </div>
        </div>
        <div id="video-player-container">
            <div id="kinobox-player" class="video-player"></div>
            <div id="vibix-player" class="video-player" style="display: none;"></div>
        </div>
        <div class="button-container">
            <button class="player-button active" id="kinobox-button">Плеер 1</button>
            <button class="player-button ${!vibixAvailable ? 'hidden' : ''}" id="vibix-button">Плеер 2</button>
        </div>
        <button id="add-to-favorites">
            <img src="${isFavorite(data) ? 'icons/delete.png' : 'icons/add.png'}" alt="${isFavorite(data) ? 'Удалить из избранного' : 'Добавить в избранное'}" class="favorites-icon"/>
        </button>
        <button id="close-modal" class="close-button">
            <img src="icons/close24.png" alt="Закрыть" class="close-icon"/>
        </button>
    `;

    // Инициализация Kinobox плеера
    const kinobox = new Kinobox('#kinobox-player', {
        search: { tmdb: data.id, type: mediaType === 'tv' ? 'serial' : 'movie' },
        players: { 
            'alloha': true, 
            'turbo': true, 
            'videocdn': true, 
            'collaps': true, 
            'videoapi': true, 
            'hddb': true 
        },
        params: { season: 1, episode: 1 },
        ui: { mobile: true }
    });

    try {
        await kinobox.init();
    } catch (error) {
        console.error('Ошибка инициализации Kinobox:', error);
        document.getElementById('kinobox-player').innerHTML = '<p>Не удалось загрузить плеер. Попробуйте позже.</p>';
    }

    // Интеграция Vibix плеера
    const kinoboxPlayer = document.getElementById('kinobox-player');
    const vibixPlayer = document.getElementById('vibix-player');
    const kinoboxButton = document.getElementById('kinobox-button');
    const vibixButton = document.getElementById('vibix-button');

    async function loadVibixPlayer() {
        if (!kpId) {
            vibixPlayer.innerHTML = '<p>Kinopoisk ID не найден</p>';
            return;
        }

        try {
            const response = await fetch(`https://vibix.org/api/v1/publisher/videos/kp/${kpId}`, {
                headers: {
                    'Authorization': `Bearer ${VIBIX_API_TOKEN}`
                }
            });
            const vibixData = await response.json();
            if (response.ok && vibixData.iframe_url) {
                vibixPlayer.innerHTML = `
                    <iframe src="${vibixData.iframe_url}" 
                            width="100%" 
                            height="100%" 
                            frameborder="0" 
                            allowfullscreen 
                            allow="autoplay *; fullscreen *"></iframe>
                `;
            } else {
                vibixPlayer.innerHTML = '<p>Видео не найдено на Vibix</p>';
            }
        } catch (error) {
            console.error('Ошибка загрузки плеера Vibix:', error);
            vibixPlayer.innerHTML = '<p>Ошибка загрузки плеера Vibix</p>';
        }
    }

    // Логика переключения плееров
    kinoboxButton.onclick = () => {
        kinoboxPlayer.style.display = 'block';
        vibixPlayer.style.display = 'none';
        kinoboxButton.classList.add('active');
        vibixButton.classList.remove('active');
    };

    if (vibixButton) {
        vibixButton.onclick = () => {
            kinoboxPlayer.style.display = 'none';
            vibixPlayer.style.display = 'block';
            vibixButton.classList.add('active');
            kinoboxButton.classList.remove('active');
            if (!vibixPlayer.children.length) {
                loadVibixPlayer();
            }
        };
    }

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
        const movieTile = await createMovieTile(movie);
        favoritesGrid.appendChild(movieTile);
    });
}

function openFavorites() {
    favoritesModal.style.display = 'flex';
    updateFavoritesGrid();
}

function closeFavorites() {
    favoritesModal.style.display = 'none';
}

// Поиск фильмов
function searchMovies(query) {
    const searchUrl = `${TMDB_BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&language=ru-RU&query=${encodeURIComponent(query)}`;
    fetch(searchUrl)
        .then(response => response.json())
        .then(async data => {
            searchResultsGrid.innerHTML = '';
            for (const result of data.results) {
                const movieTile = await createMovieTile(result);
                searchResultsGrid.appendChild(movieTile);
            }
            searchResultsModal.style.display = 'flex';
        })
        .catch(error => {
            console.error('Ошибка:', error);
            searchResultsGrid.innerHTML = '<p>Не удалось выполнить поиск. Пожалуйста, попробуйте позже.</p>';
            searchResultsModal.style.display = 'flex';
        });
}

function closeSearchResults() {
    searchResultsModal.style.display = 'none';
}

// Обработчики событий
openFavoritesButton.onclick = openFavorites;
closeFavoritesButton.onclick = closeFavorites;
closeMovieInfoButton.onclick = closeMovieInfo;
closeSearchButton.onclick = closeSearchResults;
searchForm.onsubmit = (event) => {
    event.preventDefault();
    const query = searchInput.value.trim();
    if (query) searchMovies(query);
};

// Инициализация
Promise.all([
    fetchMoviesWithRetry(`/movie/now_playing?api_key=${TMDB_API_KEY}&language=ru-RU`, newReleasesGrid, true),
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

// Вызов функции при загрузке страницы
document.addEventListener('DOMContentLoaded', updateLandingSectionRatings);