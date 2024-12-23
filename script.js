const API_KEY = '06936145fe8e20be28b02e26b55d3ce6';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/w500';
const BACKDROP_URL = 'https://image.tmdb.org/t/p/original';

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

let popularMoviesOffset = 0;
let topRatedTvOffset = 0;
let animatedMoviesOffset = 0;

let favorites = JSON.parse(localStorage.getItem('favorites')) || [];

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

function fetchMovieInfoWithRetry(url, movie, retries = 3) {
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            displayMovieInfo(data, movie);
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

function showMovieInfo(movie) {
    const modalContent = movieInfoModal.querySelector('.modal-content');
    modalContent.innerHTML = '<p>Загрузка информации...</p>';
    movieInfoModal.style.display = 'flex';

    const mediaType = movie.media_type || (movie.first_air_date ? 'tv' : 'movie');
    const fetchUrl = `${BASE_URL}/${mediaType}/${movie.id}?api_key=${API_KEY}&language=ru-RU`;

    fetchMovieInfoWithRetry(fetchUrl, movie);
}

function displayMovieInfo(data, movie) {
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
        <button id="add-to-favorites">
            <img src="${isFavorite(data) ? 'icons/delete.png' : 'icons/add.png'}" alt="${isFavorite(data) ? 'Удалить из избранного' : 'Добавить в избранное'}" class="favorites-icon"/>
        </button>
        <button id="close-modal" class="close-button">
            <img src="icons/close24.png" alt="Закрыть" class="close-icon"/>
        </button>
    `;

    const mediaType = data.media_type || (data.first_air_date ? 'tv' : 'movie');

    new Kinobox('#kinobox-player', {
        search: {
            tmdb: data.id,
            type: mediaType === 'tv' ? 'serial' : 'movie'
        },
        players: {
            'alloha': true,
            'hdvb': true,
            'videocdn': true,
            'collaps': true,
            'videoapi': true,
            'vibix': true
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

function isFavorite(movie) {
    return favorites.some(fav => fav.id === movie.id);
}

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
    updateFavoritesGrid();
}

function updateFavoritesGrid() {
    favoritesGrid.innerHTML = '';
    favorites.forEach(movie => {
        const movieTile = createMovieTile(movie);
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

function searchMovies(query) {
    const searchUrl = `${BASE_URL}/search/multi?api_key=${API_KEY}&language=ru-RU&query=${encodeURIComponent(query)}`;
    
    fetch(searchUrl)
        .then(response => response.json())
        .then(data => {
            searchResultsGrid.innerHTML = '';
            data.results.forEach(result => {
                const movieTile = createMovieTile(result);
                searchResultsGrid.appendChild(movieTile);
            });
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

openFavoritesButton.onclick = openFavorites;
closeFavoritesButton.onclick = closeFavorites;
closeMovieInfoButton.onclick = closeMovieInfo;
closeSearchButton.onclick = closeSearchResults;
searchForm.onsubmit = function(event) {
    event.preventDefault();
    const query = searchInput.value.trim();
    if (query) {
        searchMovies(query);
    }
};

fetchMoviesWithRetry('/movie/now_playing?api_key=' + API_KEY + '&language=ru-RU', newReleasesGrid, true);
fetchMoviesWithRetry('/movie/popular?api_key=' + API_KEY + '&language=ru-RU', popularMoviesGrid);
fetchMoviesWithRetry('/tv/top_rated?api_key=' + API_KEY + '&language=ru-RU', topRatedTvGrid);
fetchMoviesWithRetry('/genre/16/movies?api_key=' + API_KEY + '&language=ru-RU', animatedMoviesGrid);
