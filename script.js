// Константы
const API_KEY = '06936145fe8e20be28b02e26b55d3ce6';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/w500';
const BACKDROP_URL = 'https://image.tmdb.org/t/p/original';

// Переменные состояния
let initialLoadComplete = false;
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
let currentSlidePositions = {
    'popular-movies': 0,
    'top-rated-tv': 0,
    'animated-movies': 0
};

// DOM элементы
const loadingScreen = document.querySelector('.loading-screen');
const newReleasesGrid = document.getElementById('new-releases-grid');
const popularMoviesGrid = document.getElementById('popular-movies-grid');
const topRatedTvGrid = document.getElementById('top-rated-tv-grid');
const animatedMoviesGrid = document.getElementById('animated-movies-grid');
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

// Динамические стили
const style = document.createElement('style');
style.textContent = `
    .movie-logo { max-width: 300px; max-height: 200px; margin-bottom: 20px; filter: drop-shadow(2px 4px 6px rgba(0, 0, 0, 0.5)); }
    .movie-title-logo { max-width: 300px; max-height: 120px; margin-bottom: 15px; filter: drop-shadow(2px 4px 6px rgba(0, 0, 0, 0.5)); }
    .button-container { display: flex; justify-content: flex-end; }
    .player-button { float: right; padding: 7px 25px; background-color: #333; color: white; border: none; border-radius: 25px; cursor: pointer; transition: background-color 0.3s; margin-top: 7px; }
    .player-button:hover { background-color: #444; }
    .video-player { width: 100%; height: 500px; max-width: 800px; margin: 0 auto; border-radius: 10px; overflow: hidden; }
    .video-player iframe { width: 100%; height: 100%; border: none; border-radius: 10px; }
    .rating-span { display: inline-block; padding: 5px 10px; border-radius: 15px; color: white; font-weight: bold; }
    .rating-green { background-color: #28a745; }
    .rating-yellow { background-color: #d39e00; }
    .rating-red { background-color: #dc3545; }
    .overview-text { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis; }
`;
document.head.appendChild(style);

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
        animatedMoviesGrid.children.length > 0) {
        initialLoadComplete = true;
        hideLoadingScreen();
        initializeSliderControls('popular-movies', popularMoviesGrid);
        initializeSliderControls('top-rated-tv', topRatedTvGrid);
        initializeSliderControls('animated-movies', animatedMoviesGrid);
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
            const response = await fetch(`${BASE_URL}/movie/${movie.id}/images?api_key=${API_KEY}`);
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
            console.error('Error fetching movie logos:', error);
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
        tile.innerHTML = `
            <img src="${movie.poster_path ? IMG_URL + movie.poster_path : 'icons/poster.png'}" alt="${movie.title || movie.name}">
            <h3>${movie.title || movie.name}</h3>
        `;
    }

    tile.onclick = () => showMovieInfo(movie);
    return tile;
}

// Загрузка фильмов
function fetchMoviesWithRetry(endpoint, container, isFullscreen = false, retries = 3) {
    return fetch(BASE_URL + endpoint)
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
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
            console.error('Error:', error);
            if (retries > 0) {
                console.log(`Retrying... (${retries} attempts left)`);
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
    const fetchUrl = `${BASE_URL}/${mediaType}/${movie.id}?api_key=${API_KEY}&language=ru-RU`;
    const logoUrl = `${BASE_URL}/${mediaType}/${movie.id}/images?api_key=${API_KEY}`;

    try {
        const [movieData, logoData] = await Promise.all([
            fetch(fetchUrl).then(res => res.json()),
            fetch(logoUrl).then(res => res.json())
        ]);
        displayMovieInfo(movieData, movie, logoData);
    } catch (error) {
        console.error('Error fetching movie data:', error);
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
    const voteAverage = data.vote_average ? data.vote_average.toFixed(1) : 'Нет данных';
    const ratingClass = voteAverage >= 7 ? 'rating-green' : voteAverage >= 5 ? 'rating-yellow' : 'rating-red';
    const ruLogo = logoData.logos?.find(logo => logo.iso_639_1 === 'ru');
    const enLogo = logoData.logos?.find(logo => logo.iso_639_1 === 'en');
    const logo = ruLogo || enLogo;

    const titleHTML = logo 
        ? `<img src="${IMG_URL}${logo.file_path}" alt="${title}" class="movie-title-logo">` 
        : `<h2 class="movie-title">${title}</h2>`;

    const mediaType = data.media_type || (data.first_air_date ? 'tv' : 'movie');

    // Дополнительный запрос для сериалов
    let season = 1;
    let episode = 1;
    if (mediaType === 'tv') {
        try {
            const seasonData = await fetch(`${BASE_URL}/tv/${data.id}/season/1?api_key=${API_KEY}&language=ru-RU`);
            const seasonJson = await seasonData.json();
            if (seasonJson.episodes && seasonJson.episodes.length > 0) {
                season = seasonJson.season_number || 1;
                episode = seasonJson.episodes[0].episode_number || 1;
            }
        } catch (error) {
            console.error('Ошибка при загрузке данных о сезоне:', error);
        }
    }

    modalContent.innerHTML = `
        <img src="${data.poster_path ? IMG_URL + data.poster_path : 'icons/poster.png'}" alt="${title}" class="movie-poster">
        ${titleHTML}
        <p class="overview-text">${overview}</p>
        <p>Рейтинг: <span class="rating-span ${ratingClass}">${voteAverage}</span></p>
        <div id="kinobox-player" class="video-player"></div>
        <button class="player-button">Плеер 1</button>
        <button id="add-to-favorites">
            <img src="${isFavorite(data) ? 'icons/delete.png' : 'icons/add.png'}" alt="${isFavorite(data) ? 'Удалить из избранного' : 'Добавить в избранное'}" class="favorites-icon"/>
        </button>
        <button id="close-modal" class="close-button">
            <img src="icons/close24.png" alt="Закрыть" class="close-icon"/>
        </button>
    `;

    // Инициализация Kinobox
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
        params: { season: season, episode: episode },
        ui: { mobile: true }
    });

    try {
        await kinobox.init();
    } catch (error) {
        console.error('Ошибка инициализации Kinobox:', error);
        document.getElementById('kinobox-player').innerHTML = '<p>Не удалось загрузить плеер. Попробуйте позже.</p>';
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
    const searchUrl = `${BASE_URL}/search/multi?api_key=${API_KEY}&language=ru-RU&query=${encodeURIComponent(query)}`;
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
            console.error('Error:', error);
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
    fetchMoviesWithRetry(`/movie/now_playing?api_key=${API_KEY}&language=ru-RU`, newReleasesGrid, true),
    fetchMoviesWithRetry(`/movie/popular?api_key=${API_KEY}&language=ru-RU`, popularMoviesGrid),
    fetchMoviesWithRetry(`/tv/top_rated?api_key=${API_KEY}&language=ru-RU`, topRatedTvGrid),
    fetchMoviesWithRetry(`/discover/movie?api_key=${API_KEY}&with_genres=16&language=ru-RU`, animatedMoviesGrid)
]).then(() => {
    initialLoadComplete = true;
    hideLoadingScreen();
}).catch(error => {
    console.error('Error in initial load:', error);
    hideLoadingScreen();
});