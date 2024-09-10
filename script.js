// Константы для API
const API_KEY = '06936145fe8e20be28b02e26b55d3ce6';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/w500';

// Элементы DOM
const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const newReleasesGrid = document.getElementById('new-releases-grid');
const favoritesGrid = document.getElementById('favorites-grid');
const favoritesSection = document.getElementById('favorites');
const movieDetailModal = document.getElementById('movie-detail-modal');
const moviePoster = document.getElementById('movie-poster');
const movieTitle = document.getElementById('movie-title');
const movieDescription = document.getElementById('movie-description');
const movieTrailer = document.getElementById('movie-trailer');
const closeDetailButton = document.getElementById('close-detail-button');
const addToFavoritesButton = document.getElementById('add-to-favorites');
const openFavoritesButton = document.getElementById('open-favorites');

// Массив избранных фильмов
let favoriteMovies = [];

// Функция для получения фильмов
function fetchMovies(query) {
    fetch(`${BASE_URL}/search/movie?api_key=${API_KEY}&language=ru-RU&query=${query}`)
        .then(response => response.json())
        .then(data => {
            displayMovies(data.results, newReleasesGrid);
        });
}

// Функция для получения новинок
function fetchNewReleases() {
    fetch(`${BASE_URL}/movie/now_playing?api_key=${API_KEY}&language=ru-RU`)
        .then(response => response.json())
        .then(data => {
            displayMovies(data.results, newReleasesGrid);
        });
}

// Функция для отображения фильмов
function displayMovies(movies, container) {
    container.innerHTML = '';
    movies.forEach(movie => {
        const movieTile = createMovieTile(movie);
        container.appendChild(movieTile);
    });
}

// Функция для создания плитки фильма
function createMovieTile(movie) {
    const movieTile = document.createElement('div');
    movieTile.className = 'movie-tile';

    const movieImage = document.createElement('img');
    movieImage.src = `${IMG_URL}${movie.poster_path}`;
    movieImage.alt = movie.title;

    const movieTitleElem = document.createElement('h3');
    movieTitleElem.innerText = movie.title;

    const movieRating = document.createElement('div');
    movieRating.className = 'rating';
    movieRating.innerText = movie.vote_average;
    if (movie.vote_average >= 6) {
        movieRating.classList.add('green');
    }

    movieTile.appendChild(movieImage);
    movieTile.appendChild(movieTitleElem);
    movieTile.appendChild(movieRating);

    movieTile.onclick = () => showMovieDetailsFromTile(movie); // Отображение деталей фильма при клике на плитку
    return movieTile;
}

// Функция для получения трейлеров фильма
function fetchMovieTrailer(movieId) {
    return fetch(`${BASE_URL}/movie/${movieId}/videos?api_key=${API_KEY}&language=ru-RU`)
        .then(response => response.json())
        .then(data => {
            const trailer = data.results.find(video => video.type === 'Trailer');
            return trailer ? trailer.key : '';
        });
}

// Функция для отображения деталей фильма с плеером Kinobox
function showMovieDetails(movie) {
    moviePoster.src = `${IMG_URL}${movie.poster_path}`;
    movieTitle.innerText = movie.title;
    movieDescription.innerText = movie.overview;

    // Получение трейлера
    fetchMovieTrailer(movie.id).then(trailerKey => {
        movieTrailer.src = trailerKey ? `https://www.youtube.com/embed/${trailerKey}` : '';
    });

    // Удаление предыдущего плеера Kinobox (если есть)
    const existingPlayer = document.querySelector('.kinobox_player');
    if (existingPlayer) {
        existingPlayer.remove();
    }

    // Создание контейнера для Kinobox плеера
    const kinoboxPlayer = document.createElement('div');
    kinoboxPlayer.className = 'kinobox_player';

    // Вставка Kinobox плеера ниже трейлера
    movieTrailer.parentNode.insertBefore(kinoboxPlayer, movieTrailer.nextSibling);

    // Инициализация плеера Kinobox.tv для данного фильма по TMDB ID
    const script = document.createElement('script');
    script.src = 'https://kinobox.tv/kinobox.min.js';
    script.onload = () => {
        kbox('.kinobox_player', { search: { tmdb: movie.id } });
    };
    document.body.appendChild(script);

    // Установка текста и обработчика для кнопки "Добавить в избранное"
    addToFavoritesButton.innerText = favoriteMovies.some(fav => fav.id === movie.id) ? 'В избранном' : 'Добавить в избранное';
    addToFavoritesButton.onclick = () => toggleFavorite(movie); // Установка обработчика для кнопки избранного

    movieDetailModal.style.display = 'block';
}

// Функция для получения подробностей о фильме
function fetchMovieDetails(movieId) {
    fetch(`${BASE_URL}/movie/${movieId}?api_key=${API_KEY}&language=ru-RU`)
        .then(response => response.json())
        .then(data => {
            showMovieDetails(data);
        });
}

// Функция для показа деталей фильма из плитки
function showMovieDetailsFromTile(movie) {
    fetchMovieDetails(movie.id);
}

// Функция для переключения избранного
function toggleFavorite(movie) {
    const index = favoriteMovies.findIndex(fav => fav.id === movie.id);
    if (index !== -1) {
        favoriteMovies.splice(index, 1); // Удалить из избранного
    } else {
        favoriteMovies.push(movie); // Добавить в избранное
    }
    updateFavorites();
}

// Функция для обновления отображения избранных фильмов
function updateFavorites() {
    favoritesGrid.innerHTML = '';
    favoriteMovies.forEach(movie => {
        const movieTile = createMovieTile(movie);
        favoritesGrid.appendChild(movieTile);
    });
    localStorage.setItem('favoriteMovies', JSON.stringify(favoriteMovies));
}

// Закрытие модального окна
closeDetailButton.onclick = () => {
    movieDetailModal.style.display = 'none';
}

// Открытие и закрытие вкладки избранных фильмов
openFavoritesButton.onclick = () => {
    document.querySelector('section:not(.hidden)').classList.add('hidden');
    favoritesSection.classList.remove('hidden');
};

// Обработчик поиска
searchForm.onsubmit = (e) => {
    e.preventDefault();
    const query = searchInput.value.trim();
    if (query) {
        fetchMovies(query);
    }
};

// Загрузка новинок при загрузке страницы
fetchNewReleases();

// Загрузка избранных фильмов из localStorage
const savedFavorites = JSON.parse(localStorage.getItem('favoriteMovies')) || [];
favoriteMovies = savedFavorites;
updateFavorites();
