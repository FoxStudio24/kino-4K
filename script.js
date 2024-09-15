// Constants for API
const API_KEY = '06936145fe8e20be28b02e26b55d3ce6';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/w500';
const BACKDROP_URL = 'https://image.tmdb.org/t/p/original';

// DOM Elements
const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const newReleasesGrid = document.getElementById('new-releases-grid');
const popularMoviesGrid = document.getElementById('popular-movies-grid');
const topRatedTvGrid = document.getElementById('top-rated-tv-grid');
const animatedMoviesGrid = document.getElementById('animated-movies-grid');
const favoritesGrid = document.getElementById('favorites-grid');
const favoritesModal = document.getElementById('favorites');
const openFavoritesButton = document.getElementById('open-favorites');
const closeFavoritesButton = document.querySelector('#favorites .close-modal');
const searchResultsModal = document.getElementById('search-results');
const searchResultsGrid = document.getElementById('search-results-grid');
const closeSearchButton = document.querySelector('#search-results .close-modal');
const movieInfoModal = document.getElementById('movie-info-modal');
const closeMovieInfoButton = document.querySelector('#movie-info-modal .close-modal');

// Global variables
let currentNewReleases = [];
let currentNewReleaseIndex = 0;
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
let popularMoviesOffset = 0;
let topRatedTvOffset = 0;
let animatedMoviesOffset = 0;

// Function to fetch movies with retry and timeout
function fetchMoviesWithRetry(endpoint, container, isFullscreen = false, retries = 3, timeout = 10000) {
    return new Promise((resolve, reject) => {
        const fetchWithTimeout = () => {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);

            fetch(`${BASE_URL}${endpoint}`, { signal: controller.signal })
                .then(response => {
                    clearTimeout(timeoutId);
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.json();
                })
                .then(data => {
                    if (isFullscreen) {
                        currentNewReleases = data.results;
                        displayFullscreenMovies(currentNewReleases, container);
                    } else {
                        displayMovies(data.results, container);
                    }
                    resolve();
                })
                .catch(error => {
                    console.error('Error fetching movies:', error);
                    if (retries > 0) {
                        setTimeout(() => fetchWithTimeout(), 1000);
                    } else {
                        container.innerHTML = '<p>Произошла ошибка при загрузке фильмов. Пожалуйста, попробуйте позже.</p>';
                        reject(error);
                    }
                });
        };

        fetchWithTimeout();
    });
}

// Function to display fullscreen movie cards
function displayFullscreenMovies(movies, container) {
    container.innerHTML = '';
    movies.forEach((movie, index) => {
        const movieTile = createFullscreenMovieTile(movie, index);
        container.appendChild(movieTile);
    });
    showFullscreenMovie(0);
}

// Function to create a fullscreen movie tile
function createFullscreenMovieTile(movie, index) {
    const movieTile = document.createElement('div');
    movieTile.className = 'fullscreen-tile';
    movieTile.style.backgroundImage = movie.backdrop_path 
        ? `url(${BACKDROP_URL}${movie.backdrop_path})`
        : 'url(icons/poster.png)';

    const content = document.createElement('div');
    content.className = 'fullscreen-content';

    const title = document.createElement('h3');
    title.className = 'fullscreen-title';
    title.textContent = movie.title || movie.name;

    const watchButton = document.createElement('button');
    watchButton.className = 'watch-button';
    watchButton.textContent = 'Смотреть';
    watchButton.onclick = () => showMovieInfo(movie);

    content.appendChild(title);
    content.appendChild(watchButton);
    movieTile.appendChild(content);

    return movieTile;
}

// Function to show fullscreen movie
function showFullscreenMovie(index) {
    currentNewReleaseIndex = index;
    const offset = index * 100;
    newReleasesGrid.style.transform = `translateX(-${offset}%)`;
}

// Function to display regular movie cards
function displayMovies(movies, container) {
    container.innerHTML = '';
    movies.forEach(movie => {
        const movieTile = createMovieTile(movie);
        container.appendChild(movieTile);
    });
}

// Function to create a regular movie tile
function createMovieTile(movie) {
    const movieTile = document.createElement('div');
    movieTile.className = 'movie-tile';

    const movieImage = document.createElement('img');
    movieImage.src = movie.poster_path 
        ? `${IMG_URL}${movie.poster_path}` 
        : 'icons/poster.png';
    movieImage.alt = movie.title || movie.name;
    movieImage.onerror = () => {
        movieImage.src = 'icons/poster.png';
    };

    const movieTitle = document.createElement('h3');
    movieTitle.textContent = movie.title || movie.name;

    movieTile.appendChild(movieImage);
    movieTile.appendChild(movieTitle);

    movieTile.onclick = () => showMovieInfo(movie);

    return movieTile;
}

// Function to display movie information
function showMovieInfo(movie) {
    const modalContent = movieInfoModal.querySelector('.modal-content');
    modalContent.innerHTML = '<p>Загрузка информации...</p>';
    movieInfoModal.style.display = 'flex';

    const mediaType = movie.media_type || (movie.first_air_date ? 'tv' : 'movie');
    const fetchUrl = `${BASE_URL}/${mediaType}/${movie.id}?api_key=${API_KEY}&language=ru-RU`;

    fetchMovieInfoWithRetry(fetchUrl, movie);
}

// Function to fetch movie info with retry and timeout
function fetchMovieInfoWithRetry(url, movie, retries = 3, timeout = 10000) {
    return new Promise((resolve, reject) => {
        const fetchWithTimeout = () => {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);

            fetch(url, { signal: controller.signal })
                .then(response => {
                    clearTimeout(timeoutId);
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.json();
                })
                .then(data => {
                    displayMovieInfo(data, movie);
                    resolve();
                })
                .catch(error => {
                    console.error('Error fetching movie info:', error);
                    if (retries > 0) {
                        setTimeout(() => fetchWithTimeout(), 1000);
                    } else {
                        displayMovieInfoError();
                        reject(error);
                    }
                });
        };

        fetchWithTimeout();
    });
}

// Function to display movie info
function displayMovieInfo(data, movie) {
    const modalContent = movieInfoModal.querySelector('.modal-content');
    
    modalContent.style.backgroundImage = data.backdrop_path 
        ? `url(${BACKDROP_URL}${data.backdrop_path})`
        : 'url(icons/poster.png)';
    
    modalContent.innerHTML = `
        <img src="${data.poster_path ? IMG_URL + data.poster_path : 'icons/poster.png'}" alt="${data.title || data.name}" class="movie-poster">
        <h2>${data.title || data.name}</h2>
        <p>${data.overview || 'Описание отсутствует.'}</p>
        <p>Рейтинг: ${data.vote_average ? data.vote_average.toFixed(1) : 'Нет данных'}</p>
        <p>Дата выхода: ${data.release_date || data.first_air_date || 'Нет данных'}</p>
        <div id="kinobox-player"></div>
        <button id="add-to-favorites">${isFavorite(data) ? 'Удалить из избранного' : 'Добавить в избранное'}</button>
        <button id="close-modal">Закрыть</button>
    `;
    
    // Initialize Kinobox player
    new Kinobox('#kinobox-player', {
        search: {
            query: `${data.title || data.name} ${data.release_date || data.first_air_date || ''}`.trim(),
            imdb: data.imdb_id,
            kinopoisk: data.kinopoisk_id
        },
        players: {
            bazon: true,
            alloha: true,
            kodik: true,
            videocdn: true
        }
    }).init();
    
    document.getElementById('add-to-favorites').onclick = () => toggleFavorite(data);
    document.getElementById('close-modal').onclick = closeMovieInfo;
}

// Function to display movie info error
function displayMovieInfoError() {
    const modalContent = movieInfoModal.querySelector('.modal-content');
    modalContent.innerHTML = `
        <p>Произошла ошибка при загрузке информации о фильме.</p>
        <p>Пожалуйста, попробуйте позже или выберите другой фильм.</p>
        <button id="close-modal">Закрыть</button>
    `;
    document.getElementById('close-modal').onclick = closeMovieInfo;
}

// Function to close the movie info modal
function closeMovieInfo() {
    movieInfoModal.style.display = 'none';
}

// Function to check if a movie is in favorites
function isFavorite(movie) {
    return favorites.some(fav => fav.id === movie.id);
}

// Function to add/remove a movie from favorites
function toggleFavorite(movie) {
    const index = favorites.findIndex(fav => fav.id === movie.id);
    if (index === -1) {
        const favoriteMovie = {
            id: movie.id,
            title: movie.title || movie.name,
            poster_path: movie.poster_path,
            media_type: movie.media_type || (movie.first_air_date ? 'tv' : 'movie')
        };
        favorites.push(favoriteMovie);
        alert('Фильм добавлен в избранное');
    } else {
        favorites.splice(index, 1);
        alert('Фильм удален из избранного');
    }
    localStorage.setItem('favorites', JSON.stringify(favorites));
    updateFavorites();
    document.getElementById('add-to-favorites').textContent = isFavorite(movie) ? 'Удалить из избранного' : 'Добавить в избранное';
}

// Function to update the list of favorite movies
function updateFavorites() {
    favoritesGrid.innerHTML = '';
    favorites.forEach(movie => {
        const movieTile = createMovieTile(movie);
        favoritesGrid.appendChild(movieTile);
    });
}

// Search handler
searchForm.onsubmit = (e) => {
    e.preventDefault();
    const query = searchInput.value.trim();
    if (query) {
        fetchMoviesWithRetry(`/search/multi?api_key=${API_KEY}&language=ru-RU&query=${query}`, searchResultsGrid);
        searchResultsModal.style.display = 'flex';
    }
};

// Closing modal windows
closeSearchButton.onclick = () => {
    searchResultsModal.style.display = 'none';
};

closeMovieInfoButton.onclick = closeMovieInfo;

// Opening/closing favorites
openFavoritesButton.onclick = () => {
    favoritesModal.style.display = 'flex';
    updateFavorites();
};
closeFavoritesButton.onclick = () => {
    favoritesModal.style.display = 'none';
};

// Function to handle slider movement
function moveSlider(sectionId, direction) {
    const container = document.querySelector(`#${sectionId} .slider-container`);
    const movieWidth = 220; // 200px width + 20px margin
    const visibleWidth = container.offsetWidth;
    const maxOffset = container.scrollWidth - visibleWidth;
    
    let currentOffset;
    switch(sectionId) {
        case 'popular-movies':
            currentOffset = popularMoviesOffset;
            break;
        case 'top-rated-tv':
            currentOffset = topRatedTvOffset;
            break;
        case 'animated-movies':
            currentOffset = animatedMoviesOffset;
            break;
    }
    
    let newOffset = currentOffset + (direction * visibleWidth);
    newOffset = Math.max(0, Math.min(newOffset, maxOffset));
    
    container.style.transform = `translateX(-${newOffset}px)`;
    
    switch(sectionId) {
        case 'popular-movies':
            popularMoviesOffset = newOffset;
            break;
        case 'top-rated-tv':
            topRatedTvOffset = newOffset;
            break;
        case 'animated-movies':
            animatedMoviesOffset = newOffset;
            break;
    }
}

// Slider button event listeners
document.querySelector('#popular-movies .slider-button.prev').onclick = () => moveSlider('popular-movies', -1);
document.querySelector('#popular-movies .slider-button.next').onclick = () => moveSlider('popular-movies', 1);
document.querySelector('#top-rated-tv .slider-button.prev').onclick = () => moveSlider('top-rated-tv', -1);
document.querySelector('#top-rated-tv .slider-button.next').onclick = () => moveSlider('top-rated-tv', 1);
document.querySelector('#animated-movies .slider-button.prev').onclick = () => moveSlider('animated-movies', -1);
document.querySelector('#animated-movies .slider-button.next').onclick = () => moveSlider('animated-movies', 1);


// Loading data when the page loads
window.addEventListener('load', () => {
    Promise.all([
        fetchMoviesWithRetry(`/movie/now_playing?api_key=${API_KEY}&language=ru-RU`, newReleasesGrid, true),
        fetchMoviesWithRetry(`/movie/popular?api_key=${API_KEY}&language=ru-RU`, popularMoviesGrid),
        fetchMoviesWithRetry(`/tv/top_rated?api_key=${API_KEY}&language=ru-RU`, topRatedTvGrid),
        fetchMoviesWithRetry(`/discover/movie?api_key=${API_KEY}&language=ru-RU&with_genres=16`, animatedMoviesGrid)
    ]).catch(error => {
        console.error('Error loading initial data:', error);
        alert('Произошла ошибка при загрузке данных. Пожалуйста, обновите страницу или попробуйте позже.');
    });
});

// Function to retry failed requests
function retryFailedRequests() {
    const failedSections = document.querySelectorAll('.section:empty');
    failedSections.forEach(section => {
        const sectionId = section.id;
        switch(sectionId) {
            case 'new-releases-grid':
                fetchMoviesWithRetry(`/movie/now_playing?api_key=${API_KEY}&language=ru-RU`, section, true);
                break;
            case 'popular-movies-grid':
                fetchMoviesWithRetry(`/movie/popular?api_key=${API_KEY}&language=ru-RU`, section);
                break;
            case 'top-rated-tv-grid':
                fetchMoviesWithRetry(`/tv/top_rated?api_key=${API_KEY}&language=ru-RU`, section);
                break;
            case 'animated-movies-grid':
                fetchMoviesWithRetry(`/discover/movie?api_key=${API_KEY}&language=ru-RU&with_genres=16`, section);
                break;
        }
    });
}

// Retry failed requests every 5 minutes
setInterval(retryFailedRequests, 5 * 60 * 1000);