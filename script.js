// Константы для API
const API_KEY = '06936145fe8e20be28b02e26b55d3ce6';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/w500';

// Элементы DOM
const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const newReleasesGrid = document.getElementById('new-releases-grid');
const popularTvGrid = document.getElementById('popular-tv-grid');
const popularMoviesGrid = document.getElementById('popular-movies-grid');
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

// Функция для получения фильмов, сериалов и мультфильмов
function fetchMovies(query) {
    Promise.all([
        fetch(`${BASE_URL}/search/movie?api_key=${API_KEY}&language=ru-RU&query=${query}`),
        fetch(`${BASE_URL}/search/tv?api_key=${API_KEY}&language=ru-RU&query=${query}`)
    ])
    .then(responses => Promise.all(responses.map(response => response.json())))
    .then(([movieData, tvData]) => {
        const movies = movieData.results.map(item => ({...item, media_type: 'movie'}));
        const tvShows = tvData.results.map(item => ({...item, media_type: 'tv', title: item.name}));
        const allResults = [...movies, ...tvShows].sort((a, b) => b.popularity - a.popularity);
        displayMovies(allResults, newReleasesGrid);
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

// Функция для получения популярных сериалов
function fetchPopularTVShows() {
    fetch(`${BASE_URL}/tv/popular?api_key=${API_KEY}&language=ru-RU`)
        .then(response => response.json())
        .then(data => {
            displayMovies(data.results.map(show => ({...show, media_type: 'tv', title: show.name})), popularTvGrid);
        });
}

// Функция для получения популярных фильмов
function fetchPopularMovies() {
    fetch(`${BASE_URL}/movie/popular?api_key=${API_KEY}&language=ru-RU`)
        .then(response => response.json())
        .then(data => {
            displayMovies(data.results.map(movie => ({...movie, media_type: 'movie'})), popularMoviesGrid);
        });
}

// Функция для отображения фильмов
function displayMovies(movies, container) {
    container.innerHTML = '';
    movies.forEach(movie => {
        const movieTile = createMovieTile(movie);
        container.appendChild(movieTile);
    });
    initializeSlider(container.parentElement);
}

// Вспомогательная функция для получения правильного заголовка
function getTitle(item) {
    return item.title || item.name;
}

// Функция для создания плитки фильма
function createMovieTile(movie) {
    const movieTile = document.createElement('div');
    movieTile.className = 'movie-tile';

    const movieImage = document.createElement('img');
    movieImage.src = movie.poster_path ? `${IMG_URL}${movie.poster_path}` : 'placeholder.jpg';
    movieImage.alt = getTitle(movie);

    const movieTitleElem = document.createElement('h3');
    movieTitleElem.innerText = getTitle(movie);

    const movieRating = document.createElement('div');
    movieRating.className = 'rating';
    movieRating.innerText = movie.vote_average.toFixed(1);
    if (movie.vote_average >= 7) {
        movieRating.classList.add('green');
    } else if (movie.vote_average >= 5) {
        movieRating.classList.add('orange');
    } else {
        movieRating.classList.add('red');
    }

    movieTile.appendChild(movieImage);
    movieTile.appendChild(movieTitleElem);
    movieTile.appendChild(movieRating);

    movieTile.onclick = () => showMovieDetailsFromTile(movie);
    return movieTile;
}

// Функция для инициализации слайдера
function initializeSlider(sliderContainer) {
    const container = sliderContainer.querySelector('.slider-container');
    const prevButton = sliderContainer.querySelector('.slider-button.prev');
    const nextButton = sliderContainer.querySelector('.slider-button.next');
    let currentIndex = 0;

    function updateSlider() {
        const movieWidth = 210; // Ширина фильма + отступ
        container.style.transform = `translateX(${-currentIndex * movieWidth}px)`;
    }

    prevButton.addEventListener('click', () => {
        if (currentIndex > 0) {
            currentIndex--;
            updateSlider();
        }
    });

    nextButton.addEventListener('click', () => {
        if (currentIndex < container.children.length - 5) { // Показываем по 5 фильмов
            currentIndex++;
            updateSlider();
        }
    });

    updateSlider();
}

// Функция для получения трейлеров фильма
function fetchMovieTrailer(movieId, mediaType = 'movie') {
    return fetch(`${BASE_URL}/${mediaType}/${movieId}/videos?api_key=${API_KEY}&language=ru-RU`)
        .then(response => response.json())
        .then(data => {
            const trailer = data.results.find(video => video.type === 'Trailer');
            return trailer ? trailer.key : '';
        });
}

// Функция для отображения деталей фильма с плеером Kinobox
function showMovieDetails(movie) {
    moviePoster.src = movie.poster_path ? `${IMG_URL}${movie.poster_path}` : 'placeholder.jpg';
    movieTitle.innerText = getTitle(movie);
    movieDescription.innerText = movie.overview || 'Описание отсутствует';

    // Получение трейлера
    fetchMovieTrailer(movie.id, movie.media_type).then(trailerKey => {
        movieTrailer.src = trailerKey ? `https://www.youtube.com/embed/${trailerKey}` : '';
    });

    // Удаление предыдущего плеера Kinobox (если есть)
    const existingPlayer = document.querySelector('.kinobox_player');
    if (existingPlayer) {
        existingPlayer.innerHTML = '';
    }

    // Инициализация плеера Kinobox.tv для данного фильма по TMDB ID
    const script = document.createElement('script');
    script.src = 'https://kinobox.tv/kinobox.min.js';
    script.onload = () => {
        kbox('.kinobox_player', { search: { tmdb: movie.id } });
    };
    document.body.appendChild(script);

    // Установка текста и обработчика для кнопки "Добавить в избранное"
    addToFavoritesButton.innerText = favoriteMovies.some(fav => fav.id === movie.id) ? 'В избранном' : 'Добавить в избранное';
    addToFavoritesButton.onclick = () => toggleFavorite(movie);

    movieDetailModal.style.display = 'block';
}

// Функция для получения подробностей о фильме
function fetchMovieDetails(movieId, mediaType = 'movie') {
    fetch(`${BASE_URL}/${mediaType}/${movieId}?api_key=${API_KEY}&language=ru-RU`)
        .then(response => response.json())
        .then(data => {
            showMovieDetails({...data, media_type: mediaType});
        });
}

// Функция для показа деталей фильма из плитки
function showMovieDetailsFromTile(movie) {
    fetchMovieDetails(movie.id, movie.media_type);
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
    document.querySelectorAll('section:not(.hidden)').forEach(section => section.classList.add('hidden'));
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

// Загрузка данных при загрузке страницы
fetchNewReleases();
fetchPopularTVShows();
fetchPopularMovies();

// Загрузка избранных фильмов из localStorage
const savedFavorites = JSON.parse(localStorage.getItem('favoriteMovies')) || [];
favoriteMovies = savedFavorites;
updateFavorites();