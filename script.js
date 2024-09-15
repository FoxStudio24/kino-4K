// Constants for API
const API_KEY = '06936145fe8e20be28b02e26b55d3ce6';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/w500';
const BACKDROP_URL = 'https://image.tmdb.org/t/p/original';

// DOM Elements
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

// Variables for slider offsets
let popularMoviesOffset = 0;
let topRatedTvOffset = 0;
let animatedMoviesOffset = 0;

// Load favorites from localStorage
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];

// Function to fetch movies with retry
function fetchMoviesWithRetry(endpoint, container, isFullscreen = false, retries = 3) {
    return fetch(BASE_URL + endpoint)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            container.innerHTML = '';
            data.results.forEach(movie => {
                const movieTile = createMovieTile(movie, isFullscreen);
                container.appendChild(movieTile);
            });
        })
        .catch(error => {
            console.error('Error:', error);
            if (retries > 0) {
                console.log(`Retrying... (${retries} attempts left)`);
                return fetchMoviesWithRetry(endpoint, container, isFullscreen, retries - 1);
            } else {
                container.innerHTML = '<p>Не удалось загрузить фильмы. Пожалуйста, попробуйте позже.</p>';
            }
        });
}

// Function to fetch movie info with retry
function fetchMovieInfoWithRetry(url, movie, retries = 3) {
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            getKinopoiskId(data).then(kinopoiskId => {
                displayMovieInfo(data, movie, kinopoiskId);
            });
        })
        .catch(error => {
            console.error('Error:', error);
            if (retries > 0) {
                console.log(`Retrying... (${retries} attempts left)`);
                fetchMovieInfoWithRetry(url, movie, retries - 1);
            } else {
                displayMovieInfoError();
            }
        });
}

// Function to get Kinopoisk ID
function getKinopoiskId(movieData) {
    const mediaType = movieData.media_type || (movieData.first_air_date ? 'tv' : 'movie');
    const externalIdsUrl = `${BASE_URL}/${mediaType}/${movieData.id}/external_ids?api_key=${API_KEY}`;

    return fetch(externalIdsUrl)
        .then(response => response.json())
        .then(data => data.kinopoisk_id || null)
        .catch(error => {
            console.error('Error fetching Kinopoisk ID:', error);
            return null;
        });
}

// Function to create a movie tile
function createMovieTile(movie, isFullscreen = false) {
    const tile = document.createElement('div');
    tile.className = isFullscreen ? 'fullscreen-tile' : 'movie-tile';

    if (isFullscreen) {
        tile.style.backgroundImage = `url(${BACKDROP_URL}${movie.backdrop_path})`;
        const content = document.createElement('div');
        content.className = 'fullscreen-content';
        content.innerHTML = `
            <h2 class="fullscreen-title">${movie.title || movie.name}</h2>
            <button class="watch-button">Смотреть</button>
        `;
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

// Function to display movie information
function showMovieInfo(movie) {
    const modalContent = movieInfoModal.querySelector('.modal-content');
    modalContent.innerHTML = '<p>Загрузка информации...</p>';
    movieInfoModal.style.display = 'flex';

    const mediaType = movie.media_type || (movie.first_air_date ? 'tv' : 'movie');
    const fetchUrl = `${BASE_URL}/${mediaType}/${movie.id}?api_key=${API_KEY}&language=ru-RU`;

    fetchMovieInfoWithRetry(fetchUrl, movie);
}

// Функция для отображения информации о фильме
function displayMovieInfo(data, movie, kinopoiskId) {
    const modalContent = movieInfoModal.querySelector('.modal-content');
    
    modalContent.style.backgroundImage = data.backdrop_path 
        ? `url(${BACKDROP_URL}${data.backdrop_path})`
        : 'url(icons/poster.png)';
    
    const title = data.title || data.name;
    const releaseDate = data.release_date || data.first_air_date || 'Нет данных';
    const overview = data.overview || 'Описание отсутствует.';
    const voteAverage = data.vote_average ? data.vote_average.toFixed(1) : 'Нет данных';

    modalContent.innerHTML = `
        <img src="${data.poster_path ? IMG_URL + data.poster_path : 'icons/poster.png'}" alt="${title}" class="movie-poster">
        <h2>${title}</h2>
        <p>${overview}</p>
        <p>Рейтинг: ${voteAverage}</p>
        <p>Дата выхода: ${releaseDate}</p>
        <div id="kinobox-player"></div>
        <button id="add-to-favorites">${isFavorite(data) ? 'Удалить из избранного' : 'Добавить в избранное'}</button>
        <button id="close-modal">Закрыть</button>
    `;
    
    // Обновленная инициализация Kinobox player с правильно добавленным Vibix
    const mediaType = data.media_type || (data.first_air_date ? 'tv' : 'movie');

    new Kinobox('#kinobox-player', {
        search: {
            kinopoisk: kinopoiskId,
            title: title,
            type: mediaType === 'tv' ? 'serial' : 'movie'
        },
        players: {
            'alloha': true,
            'hdvb': true,
			'videocdn': true,
            'collaps': true,
            'videoapi': true,
            'vibix':true, 
        },
        params: {
            season: data.season_number || 1,
            episode: data.episode_number || 1
        },
        ui: {
            mobile: true
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