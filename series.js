const API_KEY = '06936145fe8e20be28b02e26b55d3ce6';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/original';
const NO_PICTURE_URL = 'ico/No picture.svg';

const newSeriesRow = document.getElementById('new-series');
const trendingSeriesRow = document.getElementById('trending-series');
const legendarySeriesRow = document.getElementById('legendary-series');
const modal = document.getElementById('movie-modal');
const modalBackdrop = document.getElementById('modal-backdrop');
const modalLogo = document.getElementById('modal-logo');
const modalLogoText = document.getElementById('modal-logo-text');
const modalYear = document.getElementById('modal-year');
const modalSeasons = document.getElementById('modal-seasons');
const modalAgeRating = document.getElementById('modal-age-rating');
const modalRating = document.getElementById('modal-rating');
const modalOverview = document.getElementById('modal-overview');
const modalCast = document.getElementById('modal-cast');
const modalGenres = document.getElementById('modal-genres');
const modalOriginalTitle = document.getElementById('modal-original-title');
const closeBtn = document.querySelector('.close-btn');
const trailerModal = document.getElementById('trailer-modal');
const trailerVideo = document.getElementById('trailer-video');
const trailerCloseBtn = document.querySelector('.trailer-close-btn');
const trailerBtn = document.querySelector('.modal-trailer-btn');
const searchInput = document.getElementById('search-input');
const searchIcon = document.getElementById('search-icon');
const searchModal = document.getElementById('search-modal');
const searchMoviesRow = document.getElementById('search-movies');
const searchSeriesRow = document.getElementById('search-series');
const searchCloseBtn = document.querySelector('#search-modal .close-btn');
const modalWatchBtn = document.getElementById('modal-watch-btn');
const playerModal = document.getElementById('player-modal');
const playerCloseBtn = document.querySelector('.player-close-btn');
const trailersGrid = document.getElementById('trailers-grid');
const modalTrailers = document.getElementById('modal-trailers');

// Функция для получения логотипа (только русский)
async function getLogo(id, type) {
    const response = await fetch(`${BASE_URL}/${type}/${id}/images?api_key=${API_KEY}`);
    const data = await response.json();
    const logos = data.logos || [];
    const ruLogo = logos.find(logo => logo.iso_639_1 === 'ru');
    return ruLogo ? `${IMG_URL}${ruLogo.file_path}` : null;
}

// Получить постер для плеера
async function getPoster(id, type) {
    const response = await fetch(`${BASE_URL}/${type}/${id}?api_key=${API_KEY}&language=ru-RU`);
    const data = await response.json();
    return data.poster_path ? `${IMG_URL}${data.poster_path}` : NO_PICTURE_URL;
}

// Получить новые сериалы
async function fetchNewSeries() {
    const response = await fetch(
        `${BASE_URL}/discover/tv?api_key=${API_KEY}&language=ru-RU&sort_by=first_air_date.desc&first_air_date.lte=2025-04-18&vote_count.gte=100`
    );
    const data = await response.json();
    displayMovies(data.results, newSeriesRow, 'tv');
}

// Получить трендовые сериалы
async function fetchTrendingSeries() {
    const response = await fetch(`${BASE_URL}/trending/tv/week?api_key=${API_KEY}&language=ru-RU`);
    const data = await response.json();
    displayMovies(data.results, trendingSeriesRow, 'tv');
}

// Получить легендарные сериалы
async function fetchLegendarySeries() {
    const response = await fetch(
        `${BASE_URL}/discover/tv?api_key=${API_KEY}&language=ru-RU&sort_by=vote_average.desc&vote_count.gte=1000&first_air_date.lte=2015-01-01`
    );
    const data = await response.json();
    displayMovies(data.results, legendarySeriesRow, 'tv');
}

// Отобразить фильмы/сериалы в рядах
function displayMovies(movies, container, type) {
    container.innerHTML = '';
    movies.slice(0, 10).forEach(movie => {
        const movieCard = document.createElement('div');
        movieCard.classList.add('movie-card');
        const posterUrl = movie.poster_path ? `${IMG_URL}${movie.poster_path}` : NO_PICTURE_URL;
        const rating = movie.vote_average ? parseFloat(movie.vote_average.toFixed(1)) : null;
        let ratingClass = 'movie-card-rating';
        if (!rating) {
            ratingClass += ' dark-red';
        } else if (rating >= 6.5) {
            ratingClass += ' high';
        } else if (rating < 6.5 && rating >= 5) {
            ratingClass += ' low';
        } else if (rating < 5 && rating >= 4) {
            ratingClass += ' very-low';
        } else {
            ratingClass += ' dark-red';
        }
        movieCard.innerHTML = `
            <img src="${posterUrl}" alt="${movie.title || movie.name}">
            <div class="gradient-overlay"></div>
            <p>${movie.title || movie.name}</p>
            <span class="${ratingClass}">${rating ? rating.toFixed(1) : 'N/A'}</span>
        `;
        movieCard.dataset.id = movie.id;
        movieCard.dataset.type = type;
        movieCard.addEventListener('click', () => {
            openModal(movie.id, type);
            searchModal.style.display = 'none';
            document.body.classList.add('no-scroll');
        });
        container.appendChild(movieCard);
    });
}

// Определение возрастного рейтинга
function getAgeRating(rating) {
    const ratings = ['G', 'PG', 'PG-13', 'R', 'NC-17'];
    const ageMap = {
        'G': '0+',
        'PG': '6+',
        'PG-13': '12+',
        'R': '16+',
        'NC-17': '18+'
    };
    return ageMap[rating] || '16+';
}

// Получить трейлеры (до 4 штук)
async function getTrailers(id, type) {
    const response = await fetch(`${BASE_URL}/${type}/${id}/videos?api_key=${API_KEY}&language=ru-RU`);
    const data = await response.json();
    let trailers = data.results.filter(video => video.type === 'Trailer' && video.site === 'YouTube');
    if (trailers.length < 4) {
        const enResponse = await fetch(`${BASE_URL}/${type}/${id}/videos?api_key=${API_KEY}`);
        const enData = await enResponse.json();
        const enTrailers = enData.results.filter(video => video.type === 'Trailer' && video.site === 'YouTube');
        trailers = [...trailers, ...enTrailers].slice(0, 4);
    }
    return trailers.slice(0, 4);
}

// Отобразить трейлеры
function displayTrailers(trailers, id, type) {
    trailersGrid.innerHTML = '';
    if (trailers.length == 0) {
        modalTrailers.classList.remove('visible');
        return;
    }
    modalTrailers.classList.add('visible');
    trailers.forEach(trailer => {
        const trailerCard = document.createElement('div');
        trailerCard.classList.add('trailer-card');
        const thumbnailUrl = trailer.key ? `https://img.youtube.com/vi/${trailer.key}/hqdefault.jpg` : NO_PICTURE_URL;
        trailerCard.innerHTML = `
            <img src="${thumbnailUrl}" alt="${trailer.name}">
            <div class="play-overlay">
                <img src="https://www.svgrepo.com/show/514197/play.svg" alt="Play Icon">
            </div>
        `;
        trailerCard.addEventListener('click', () => {
            trailerVideo.innerHTML = `
                <iframe width="100%" height="100%" src="https://www.youtube.com/embed/${trailer.key}?autoplay=1&controls=1&rel=0&showinfo=0&modestbranding=1" 
                frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>
            `;
            trailerModal.style.display = 'block';
            document.body.classList.add('no-scroll');
        });
        trailersGrid.appendChild(trailerCard);
    });
}

// Получить трейлер с YouTube
async function getTrailer(id, type) {
    const response = await fetch(`${BASE_URL}/${type}/${id}/videos?api_key=${API_KEY}&language=ru-RU`);
    const data = await response.json();
    let trailer = data.results.find(video => video.type === 'Trailer' && video.site === 'YouTube' && video.iso_639_1 === 'ru');
    if (!trailer) {
        trailer = data.results.find(video => video.type === 'Trailer' && video.site === 'YouTube');
    }
    return trailer ? trailer.key : null;
}

// Открыть модальное окно с трейлером
async function openTrailerModal(id, type) {
    const trailerKey = await getTrailer(id, type);
    if (trailerKey) {
        trailerVideo.innerHTML = `
            <iframe width="100%" height="100%" src="https://www.youtube.com/embed/${trailerKey}?autoplay=1&controls=1&rel=0&showinfo=0&modestbranding=1" 
            frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>
        `;
        trailerModal.style.display = 'block';
        document.body.classList.add('no-scroll');
    } else {
        trailerVideo.innerHTML = '<p>Трейлер не найден.</p>';
        trailerModal.style.display = 'block';
        document.body.classList.add('no-scroll');
    }
}

// Открыть модальное окно с деталями фильма
async function openModal(id, type) {
    const response = await fetch(`${BASE_URL}/${type}/${id}?api_key=${API_KEY}&append_to_response=credits&language=ru-RU`);
    const data = await response.json();
    
    modalBackdrop.style.backgroundImage = `url(${IMG_URL}${data.backdrop_path || NO_PICTURE_URL})`;
    const logoUrl = await getLogo(id, type);
    if (logoUrl) {
        modalLogo.src = logoUrl;
        modalLogo.style.display = 'block';
        modalLogoText.style.display = 'none';
    } else {
        modalLogo.style.display = 'none';
        modalLogoText.textContent = data.title || data.name;
        modalLogoText.style.display = 'block';
    }

    modalYear.textContent = type === 'movie' ? (data.release_date ? data.release_date.split('-')[0] : '') : (data.first_air_date ? data.first_air_date.split('-')[0] : '');
    modalSeasons.textContent = type === 'tv' ? `${data.number_of_seasons} сезон${data.number_of_seasons > 1 ? 'а' : ''}, ${data.number_of_episodes} серий` : '';

    const certificationResponse = await fetch(`${BASE_URL}/${type}/${id}/release_dates?api_key=${API_KEY}`);
    const certData = await certificationResponse.json();
    const certification = certData.results?.find(r => r.iso_3166_1 === 'US')?.release_dates?.[0]?.certification || '';
    modalAgeRating.textContent = getAgeRating(certification);

    const rating = data.vote_average ? parseFloat(data.vote_average.toFixed(1)) : null;
    modalRating.textContent = rating ? rating.toFixed(1) : 'N/A';
    modalRating.className = 'rating';
    if (!rating) {
        modalRating.classList.add('dark-red');
    } else if (rating >= 6.5) {
        modalRating.classList.add('high');
    } else if (rating < 6.5 && rating >= 5) {
        modalRating.classList.add('low');
    } else if (rating < 5 && rating >= 4) {
        modalRating.classList.add('very-low');
    } else {
        modalRating.classList.add('dark-red');
    }

    modalOverview.textContent = data.overview || 'Описание отсутствует';
    modalCast.textContent = data.credits.cast.slice(0, 5).map(actor => actor.name).join(', ') || 'Информация об актёрах отсутствует';
    modalGenres.textContent = data.genres.map(genre => genre.name).join(', ') || 'Жанры отсутствуют';
    modalOriginalTitle.textContent = data.original_title || data.original_name || '';

    const trailerKey = await getTrailer(id, type);
    if (trailerKey) {
        trailerBtn.classList.remove('disabled');
        trailerBtn.onclick = () => openTrailerModal(id, type);
    } else {
        trailerBtn.classList.add('disabled');
        trailerBtn.onclick = null;
    }

    const trailers = await getTrailers(id, type);
    displayTrailers(trailers, id, type);

    modalWatchBtn.dataset.id = id;
    modalWatchBtn.dataset.type = type;

    modal.style.display = 'block';
    document.body.classList.add('no-scroll');
}

// Закрыть модальное окно фильма
closeBtn.addEventListener('click', () => {
    const modalContent = modal.querySelector('.modal-content');
    modalContent.classList.add('closing');
    setTimeout(() => {
        modal.style.display = 'none';
        modalContent.classList.remove('closing');
        document.body.classList.remove('no-scroll');
    }, 500);
});

// Закрыть модальное окно трейлера
trailerCloseBtn.addEventListener('click', () => {
    const trailerModalContent = trailerModal.querySelector('.trailer-modal-content');
    trailerModalContent.classList.add('closing');
    setTimeout(() => {
        trailerModal.style.display = 'none';
        trailerModalContent.classList.remove('closing');
        trailerVideo.innerHTML = '';
        document.body.classList.remove('no-scroll');
    }, 500);
});

// Закрыть модальное окно поиска
searchCloseBtn.addEventListener('click', () => {
    const searchModalContent = searchModal.querySelector('.modal-content');
    searchModalContent.classList.add('closing');
    setTimeout(() => {
        searchModal.style.display = 'none';
        searchModalContent.classList.remove('closing');
        document.body.classList.remove('no-scroll');
    }, 500);
});

// Закрыть модальное окно плеера
playerCloseBtn.addEventListener('click', () => {
    const playerModalContent = playerModal.querySelector('.player-modal-content');
    playerModalContent.classList.add('closing');
    setTimeout(() => {
        playerModal.style.display = 'none';
        playerModalContent.classList.remove('closing');
        document.body.classList.remove('no-scroll');
        const playerContainer = document.getElementById('kinobox-player');
        playerContainer.innerHTML = '';
    }, 500);
});

// Кнопка "Смотреть" в модальном окне
modalWatchBtn.addEventListener('click', async () => {
    const id = modalWatchBtn.dataset.id;
    const type = modalWatchBtn.dataset.type;
    const posterUrl = await getPoster(id, type);
    initKinoboxPlayer(id, type, posterUrl);
    playerModal.style.display = 'block';
    document.body.classList.add('no-scroll');
});

// Поиск
async function performSearch(query) {
    if (!query) {
        searchModal.style.display = 'none';
        return;
    }

    const movieResponse = await fetch(`${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}&language=ru-RU`);
    const movieData = await movieResponse.json();
    const seriesResponse = await fetch(`${BASE_URL}/search/tv?api_key=${API_KEY}&query=${encodeURIComponent(query)}&language=ru-RU`);
    const seriesData = await seriesResponse.json();

    searchMoviesRow.innerHTML = '';
    searchSeriesRow.innerHTML = '';

    displayMovies(movieData.results, searchMoviesRow, 'movie');
    displayMovies(seriesData.results, searchSeriesRow, 'tv');

    searchModal.style.display = 'block';
    document.body.classList.add('no-scroll');
    searchInput.value = '';
}

// Отобразить фильмы/сериалы в рядах
function displayMovies(movies, container, type) {
    container.innerHTML = '';
    movies.slice(0, 10).forEach(movie => {
        const movieCard = document.createElement('div');
        movieCard.classList.add('movie-card');
        const posterUrl = movie.poster_path ? `${IMG_URL}${movie.poster_path}` : NO_PICTURE_URL;
        const rating = movie.vote_average ? parseFloat(movie.vote_average.toFixed(1)) : null;
        let ratingClass = 'movie-card-rating';
        if (!rating) {
            ratingClass += ' dark-red';
        } else if (rating >= 6.5) {
            ratingClass += ' high';
        } else if (rating < 6.5 && rating >= 5) {
            ratingClass += ' low';
        } else if (rating < 5 && rating >= 4) {
            ratingClass += ' very-low';
        } else {
            ratingClass += ' dark-red';
        }
        movieCard.innerHTML = `
            <img src="${posterUrl}" alt="${movie.title || movie.name}">
            <div class="gradient-overlay"></div>
            <p>${movie.title || movie.name}</p>
            <span class="${ratingClass}">${rating ? rating.toFixed(1) : 'N/A'}</span>
        `;
        movieCard.dataset.id = movie.id;
        movieCard.dataset.type = type;
        movieCard.addEventListener('click', () => {
            openModal(movie.id, type);
            searchModal.style.display = 'none';
            document.body.classList.add('no-scroll');
        });
        container.appendChild(movieCard);
    });
}

searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        performSearch(e.target.value.trim());
    }
});

searchIcon.addEventListener('click', () => {
    performSearch(searchInput.value.trim());
});

// Инициализация
fetchNewSeries();
fetchTrendingSeries();
fetchLegendarySeries();