document.addEventListener('DOMContentLoaded', () => {
    const loadingOverlay = document.getElementById('loading-overlay');
    const loadingProgress = loadingOverlay.querySelector('.loading-progress');

    // Начало анимации загрузки
    function showLoading() {
        document.body.classList.add('loading');
        loadingProgress.style.width = '30%';
        setTimeout(() => {
            loadingProgress.style.width = '60%';
        }, 200);
    }

    // Скрытие оверлея загрузки и включение анимаций
    function hideLoading() {
        loadingProgress.style.width = '100%';
        setTimeout(() => {
            loadingOverlay.style.display = 'none';
            loadingProgress.style.width = '0';
            document.body.classList.remove('loading');
            // Применить анимации
            applyTextAnimation();
            applyImageAnimation();
        }, 300);
    }

    // Применение анимации к текстовым элементам
    function applyTextAnimation() {
        const elementsToAnimate = [
            document.getElementById('hero-description'),
            document.getElementById('hero-logo-text'),
            ...document.querySelectorAll('.category h2'),
            document.getElementById('modal-overview'),
            document.getElementById('modal-logo-text'),
            document.getElementById('modal-cast'),
            document.getElementById('modal-genres'),
            document.getElementById('modal-original-title'),
            ...document.querySelectorAll('.footer h2'),
        ].filter(el => el && el.textContent.trim());

        elementsToAnimate.forEach(element => {
            const words = element.textContent.split(' ');
            element.innerHTML = words.map(word => `<span>${word}</span>`).join(' ');
            element.classList.add('animated-text');

            // Динамическое добавление стилей для длинных текстов
            if (words.length > 20) {
                const style = document.createElement('style');
                for (let i = 21; i <= words.length; i++) {
                    style.textContent += `
                        .animated-text span:nth-child(${i}) {
                            animation: fade-in 0.8s ${0.1 * i}s forwards cubic-bezier(0.11, 0, 0.5, 0);
                        }
                    `;
                }
                document.head.appendChild(style);
            }
        });
    }

    // Применение анимации к логотипам и постерам
    function applyImageAnimation() {
        // Логотипы на главной странице
        const heroLogo = document.getElementById('hero-logo');
        if (heroLogo && heroLogo.src && heroLogo.style.display !== 'none') {
            heroLogo.classList.add('animated-logo');
        }

        // Постеры в карточках фильмов/сериалов
        const moviePosters = document.querySelectorAll('.movie-card img');
        moviePosters.forEach(poster => {
            if (poster.src) {
                poster.classList.add('animated-poster');
            }
        });
    }

    // Запуск анимации при загрузке страницы
    showLoading();
    window.addEventListener('load', hideLoading);

    // Обновление полосы прокрутки
    function updateScrollProgress() {
        const scrollProgress = document.getElementById('scroll-progress');
        if (scrollProgress) {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const windowHeight = window.innerHeight;
            const documentHeight = document.documentElement.scrollHeight;
            const scrollPercentage = ((scrollTop + windowHeight) / documentHeight) * 100;
            scrollProgress.style.width = `${Math.min(scrollPercentage, 100)}%`;
        }
    }

    // Инициализация полосы прокрутки
    updateScrollProgress();
    window.addEventListener('scroll', updateScrollProgress);
    window.addEventListener('resize', updateScrollProgress);

    // Логика для search-bar
    const searchBar = document.querySelector('.search-bar');
    const searchInput = searchBar.querySelector('input');

    // Обработчик отправки формы
    searchBar.addEventListener('submit', (e) => {
        e.preventDefault();
        const query = searchInput.value.trim();
        if (query) {
            performSearch(query);
            searchInput.value = '';
            searchBar.classList.remove('expanded');
        } else {
            searchInput.placeholder = 'Введите запрос для поиска';
            searchInput.classList.add('error');
            setTimeout(() => {
                searchInput.placeholder = '';
                searchInput.classList.remove('error');
            }, 2000);
        }
    });

    // Разворачивание при наведении на сам search-bar
    searchBar.addEventListener('mouseover', () => {
        searchBar.classList.add('expanded');
        searchInput.focus();
    });

    // Сворачивание при уходе мыши и пустом вводе
    searchBar.addEventListener('mouseout', () => {
        if (!searchInput.value.trim()) {
            searchBar.classList.remove('expanded');
        }
    });

    // Сворачивание при клике вне формы
    document.addEventListener('click', (e) => {
        if (!searchBar.contains(e.target) && !searchInput.value.trim()) {
            searchBar.classList.remove('expanded');
        }
    });

    const API_KEY = '06936145fe8e20be28b02e26b55d3ce6';
    const BASE_URL = 'https://api.themoviedb.org/3';
    const IMG_URL = 'https://image.tmdb.org/t/p/original';
    const NO_PICTURE_URL = 'ico/No picture.svg';

    const hero = document.getElementById('hero');
    const heroLogo = document.getElementById('hero-logo');
    const heroLogoText = document.getElementById('hero-logo-text');
    const heroDescription = document.getElementById('hero-description');
    const heroWatchBtn = document.getElementById('hero-watch-btn');
    const heroInfoBtn = document.getElementById('hero-info-btn');
    const newMoviesRow = document.getElementById('new-movies');
    const newSeriesRow = document.getElementById('new-series');
    const newAnimationsRow = document.getElementById('new-animations');
    const trendingMoviesRow = document.getElementById('trending-movies');
    const legendaryMoviesRow = document.getElementById('legendary-movies');
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
    const searchModal = document.getElementById('search-modal');
    const searchMoviesRow = document.getElementById('search-movies');
    const searchSeriesRow = document.getElementById('search-series');
    const searchCloseBtn = document.querySelector('#search-modal .close-btn');
    const modalWatchBtn = document.getElementById('modal-watch-btn');
    const playerModal = document.getElementById('player-modal');
    const playerCloseBtn = document.querySelector('.player-close-btn');
    const trailersGrid = document.getElementById('trailers-grid');
    const modalTrailers = document.getElementById('modal-trailers');

    // Загрузка YouTube IFrame API
    let youtubeScriptLoaded = false;
    function loadYouTubeAPI() {
        if (!youtubeScriptLoaded) {
            const tag = document.createElement('script');
            tag.src = "https://www.youtube.com/iframe_api";
            const firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
            youtubeScriptLoaded = true;
        }
    }
    loadYouTubeAPI();

    // Функция для получения логотипа (только русский) с таймаутом
    async function getLogo(id, type) {
        const timeoutPromise = new Promise((resolve) => {
            setTimeout(() => resolve(null), 2000);
        });

        const fetchPromise = fetch(`${BASE_URL}/${type}/${id}/images?api_key=${API_KEY}`)
            .then(response => response.json())
            .then(data => {
                const logos = data.logos || [];
                const ruLogo = logos.find(logo => logo.iso_639_1 === 'ru');
                return ruLogo ? `${IMG_URL}${ruLogo.file_path}` : null;
            })
            .catch(() => null);

        return Promise.race([fetchPromise, timeoutPromise]);
    }

    // Получить постер и задний фон для плеера
    async function getImages(id, type) {
        const response = await fetch(`${BASE_URL}/${type}/${id}?api_key=${API_KEY}&language=ru-RU`);
        const data = await response.json();
        return {
            poster: data.poster_path ? `${IMG_URL}${data.poster_path}` : NO_PICTURE_URL,
            backdrop: data.backdrop_path ? `${IMG_URL}${data.backdrop_path}` : NO_PICTURE_URL
        };
    }

    // Получить случайный трендовый фильм или сериал для hero
    async function fetchHeroContent() {
        const movieResponse = await fetch(`${BASE_URL}/trending/movie/week?api_key=${API_KEY}&language=ru-RU`);
        const movieData = await movieResponse.json();
        const movies = movieData.results
            .filter(item => item.vote_average >= 7 && item.overview && item.backdrop_path)
            .map(item => ({ ...item, type: 'movie' }));

        const seriesResponse = await fetch(`${BASE_URL}/trending/tv/week?api_key=${API_KEY}&language=ru-RU`);
        const seriesData = await seriesResponse.json();
        const series = seriesData.results
            .filter(item => item.vote_average >= 7 && item.overview && item.backdrop_path)
            .map(item => ({ ...item, type: 'tv' }));

        const allContent = [...movies, ...series];
        if (allContent.length === 0) return;
        const content = allContent[Math.floor(Math.random() * allContent.length)];

        hero.style.backgroundImage = `url(${IMG_URL}${content.backdrop_path})`;
        const logoUrl = await getLogo(content.id, content.type);
        if (logoUrl) {
            heroLogo.src = logoUrl;
            heroLogo.style.display = 'block';
            heroLogo.classList.add('animated-logo'); // Применяем анимацию
            heroLogoText.style.display = 'none';
        } else {
            heroLogo.style.display = 'none';
            heroLogoText.textContent = content.title || content.name;
            heroLogoText.style.display = 'block';
        }
        heroDescription.textContent = content.overview || 'Описание отсутствует';
        heroWatchBtn.dataset.id = content.id;
        heroWatchBtn.dataset.type = content.type;
        heroInfoBtn.dataset.id = content.id;
        heroInfoBtn.dataset.type = content.type;
    }

    // Получить новые фильмы
    async function fetchNewMovies() {
        const response = await fetch(
            `${BASE_URL}/movie/now_playing?api_key=${API_KEY}&language=ru-RU`
        );
        const data = await response.json();
        displayMovies(data.results, newMoviesRow, 'movie');
    }

    // Получить новые сериалы
    async function fetchNewSeries() {
        const response = await fetch(
            `${BASE_URL}/discover/tv?api_key=${API_KEY}&language=ru-RU&sort_by=first_air_date.desc&first_air_date.lte=2025-04-18&vote_count.gte=100`
        );
        const data = await response.json();
        displayMovies(data.results, newSeriesRow, 'tv');
    }

    // Получить новые мультфильмы
    async function fetchNewAnimations() {
        const response = await fetch(
            `${BASE_URL}/discover/movie?api_key=${API_KEY}&language=ru-RU&with_genres=16&sort_by=release_date.desc&release_date.lte=2025-04-18&vote_count.gte=100`
        );
        const data = await response.json();
        displayMovies(data.results, newAnimationsRow, 'movie');
    }

    // Получить трендовые фильмы
    async function fetchTrendingMovies() {
        const response = await fetch(`${BASE_URL}/trending/movie/week?api_key=${API_KEY}&language=ru-RU`);
        const data = await response.json();
        displayMovies(data.results, trendingMoviesRow, 'movie');
    }

    // Получить легендарные фильмы
    async function fetchLegendaryMovies() {
        const response = await fetch(
            `${BASE_URL}/discover/movie?api_key=${API_KEY}&language=ru-RU&sort_by=vote_average.desc&vote_count.gte=1000&release_date.lte=2015-01-01`
        );
        const data = await response.json();
        displayMovies(data.results, legendaryMoviesRow, 'movie');
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
        if (!container) return;
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
            // Оборачиваем слова заголовка в span
            const titleWords = (movie.title || movie.name).split(' ');
            const titleHTML = titleWords.map(word => `<span>${word}</span>`).join(' ');
            movieCard.innerHTML = `
                <img src="${posterUrl}" alt="${movie.title || movie.name}" class="animated-poster">
                <div class="gradient-overlay"></div>
                <p class="animated-text">${titleHTML}</p>
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
        if (trailers.length === 0) {
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

    // Получить первый трейлер с YouTube
    async function getFirstTrailer(id, type) {
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
        const trailerKey = await getFirstTrailer(id, type);
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

    // Переменная для хранения экземпляра YouTube-плеера
    let playerInstance = null;

    // Открыть модальное окно с деталями фильма
    async function openModal(id, type) {
        const response = await fetch(`${BASE_URL}/${type}/${id}?api_key=${API_KEY}&append_to_response=credits&language=ru-RU`);
        const data = await response.json();
        
        const backdropUrl = data.backdrop_path ? `${IMG_URL}${data.backdrop_path}` : NO_PICTURE_URL;
        
        // Очистка и восстановление начальной структуры modalBackdrop с логотипом
        const logoUrl = await getLogo(id, type);
        modalBackdrop.innerHTML = `
            <div class="modal-logo-container">
                <img id="modal-logo" src="${logoUrl || ''}" alt="Логотип фильма" class="modal-logo animated-logo" style="display: ${logoUrl ? 'block' : 'none'};">
                <div id="modal-logo-text" class="modal-logo-text animated-text" style="display: ${logoUrl ? 'none' : 'block'};">${data.title || data.name}</div>
                <div class="modal-buttons">
                    <button class="modal-watch-btn" id="modal-watch-btn">Смотреть</button>
                    <div class="modal-controls">
                        <button class="modal-trailer-btn" data-muted="true" style="display: none;">
                            <img src="ico/Звуквыключен.png" alt="Звук выключен">
                        </button>
                        <button class="modal-fullscreen-toggle" style="display: none;">
                            <img src="ico/Fullscreen.png" alt="Полноэкранный режим">
                        </button>
                    </div>
                </div>
            </div>
        `;
        modalBackdrop.style.backgroundImage = `url(${backdropUrl})`;
        modalBackdrop.classList.add('animated-poster'); // Применяем анимацию к фону
        
        // Привязываем обработчик для кнопки "Смотреть" сразу после создания
        const initialModalWatchBtn = document.getElementById('modal-watch-btn');
        initialModalWatchBtn.addEventListener('click', () => {
            window.launchPlayer();
        });

        if (logoUrl) {
            modalLogo.src = logoUrl;
            modalLogo.style.display = 'block';
            modalLogo.classList.add('animated-logo'); // Применяем анимацию
            modalLogoText.style.display = 'none';
        } else {
            modalLogo.style.display = 'none';
            modalLogoText.textContent = data.title || data.name;
            modalLogoText.style.display = 'block';
            // Применяем текстовую анимацию к modal-logo-text
            const words = modalLogoText.textContent.split(' ');
            modalLogoText.innerHTML = words.map(word => `<span>${word}</span>`).join(' ');
            modalLogoText.classList.add('animated-text');
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

        // Применяем анимацию к текстовым элементам модального окна
        applyTextAnimation();

        const trailerKey = await getFirstTrailer(id, type);
        if (!trailerKey) {
            trailerBtn.classList.add('disabled');
            trailerBtn.onclick = null;
        }

        const trailers = await getTrailers(id, type);
        displayTrailers(trailers, id, type);

        modalWatchBtn.dataset.id = id;
        modalWatchBtn.dataset.type = type;

        modal.style.display = 'block';
        document.body.classList.add('no-scroll');

        // Автозапуск трейлера через 5 секунд
        let trailerTimeout;
        function startTrailer() {
            trailerTimeout = setTimeout(async () => {
                const trailerKey = await getFirstTrailer(id, type);
                if (trailerKey) {
                    modalBackdrop.style.backgroundImage = 'none';
                    modalBackdrop.classList.remove('animated-poster'); // Убираем анимацию фона
                    modalBackdrop.innerHTML = `
                        <div style="position: relative; width: 100%; height: 100%; overflow: hidden;">
                            <iframe id="trailer-iframe" style="position: absolute; top: -80px; left: 0; width: 100%; height: calc(100% + 80px); transform: scale(1.2); transform-origin: center center;" 
                            src="https://www.youtube.com/embed/${trailerKey}?enablejsapi=1&autoplay=1&mute=1&controls=0&rel=0&showinfo=0&modestbranding=1" 
                            frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>
                        </div>
                        <div class="modal-logo-container">
                            <img id="modal-logo" src="${logoUrl || ''}" alt="Логотип фильма" class="modal-logo animated-logo" style="display: ${logoUrl ? 'block' : 'none'};">
                            <div id="modal-logo-text" class="modal-logo-text animated-text" style="display: ${logoUrl ? 'none' : 'block'};">${data.title || data.name}</div>
                            <div class="modal-buttons">
                                <button class="modal-watch-btn" id="modal-watch-btn" data-id="${id}" data-type="${type}">Смотреть</button>
                                <div class="modal-controls">
                                    <button class="modal-trailer-btn" data-muted="true" style="display: block;">
                                        <img src="ico/Звуквыключен.png" alt="Звук выключен">
                                    </button>
                                    <button class="modal-fullscreen-toggle" style="display: block;">
                                        <img src="ico/Fullscreen.png" alt="Полноэкранный режим">
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;
                    const iframe = modalBackdrop.querySelector('#trailer-iframe');
                    playerInstance = new YT.Player(iframe, {
                        events: {
                            'onReady': (event) => {
                                event.target.playVideo();
                            },
                            'onStateChange': (event) => {
                                if (event.data === YT.PlayerState.ENDED) {
                                    modalBackdrop.innerHTML = `
                                        <div class="modal-logo-container">
                                            <img id="modal-logo" src="${logoUrl || ''}" alt="Логотип фильма" class="modal-logo animated-logo" style="display: ${logoUrl ? 'block' : 'none'};">
                                            <div id="modal-logo-text" class="modal-logo-text animated-text" style="display: ${logoUrl ? 'none' : 'block'};">${data.title || data.name}</div>
                                            <div class="modal-buttons">
                                                <button class="modal-watch-btn" id="modal-watch-btn" data-id="${id}" data-type="${type}">Смотреть</button>
                                                <div class="modal-controls">
                                                    <button class="modal-trailer-btn" data-muted="true" style="display: none;">
                                                        <img src="ico/Звуквыключен.png" alt="Звук выключен">
                                                    </button>
                                                    <button class="modal-fullscreen-toggle" style="display: none;">
                                                        <img src="ico/Fullscreen.png" alt="Полноэкранный режим">
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    `;
                                    modalBackdrop.style.backgroundImage = `url(${backdropUrl})`;
                                    modalBackdrop.classList.add('animated-poster'); // Возвращаем анимацию
                                    const newModalWatchBtn = document.getElementById('modal-watch-btn');
                                    newModalWatchBtn.addEventListener('click', () => {
                                        window.launchPlayer();
                                    });
                                    playerInstance = null;
                                }
                            }
                        }
                    });

                    const newModalWatchBtn = document.getElementById('modal-watch-btn');
                    newModalWatchBtn.addEventListener('click', () => {
                        window.launchPlayer();
                    });

                    const newTrailerBtn = document.querySelector('.modal-trailer-btn');
                    if (trailerKey) {
                        newTrailerBtn.onclick = () => toggleMute(newTrailerBtn);
                    }

                    const fullscreenBtn = document.querySelector('.modal-fullscreen-toggle');
                    fullscreenBtn.addEventListener('click', () => {
                        const iframe = document.querySelector('#trailer-iframe');
                        if (!document.fullscreenElement) {
                            iframe.requestFullscreen().catch(err => {
                                console.error(`Ошибка при попытке включить полноэкранный режим: ${err.message}`);
                            });
                        } else {
                            document.exitFullscreen();
                        }
                    });

                    // Применяем текстовую анимацию к modal-logo-text, если он виден
                    const newModalLogoText = document.getElementById('modal-logo-text');
                    if (newModalLogoText.style.display !== 'none') {
                        const words = newModalLogoText.textContent.split(' ');
                        newModalLogoText.innerHTML = words.map(word => `<span>${word}</span>`).join(' ');
                        newModalLogoText.classList.add('animated-text');
                    }
                }
            }, 5000);
        }

        function toggleMute(button) {
            if (!playerInstance) return;
            const isMuted = button.dataset.muted === 'true';
            if (isMuted) {
                playerInstance.unMute();
                button.dataset.muted = 'false';
                button.innerHTML = '<img src="ico/Звуквключен.png" alt="Звук включен">';
            } else {
                playerInstance.mute();
                button.dataset.muted = 'true';
                button.innerHTML = '<img src="ico/Звуквыключен.png" alt="Звук выключен">';
            }
        }

        if (trailerKey) {
            trailerBtn.onclick = () => toggleMute(trailerBtn);
        }

        if (window.YT && window.YT.Player) {
            startTrailer();
        } else {
            window.onYouTubeIframeAPIReady = startTrailer;
        }

        closeBtn.addEventListener('click', () => {
            clearTimeout(trailerTimeout);
            if (playerInstance) {
                playerInstance.destroy();
                playerInstance = null;
            }
        }, { once: true });
    }

    closeBtn.addEventListener('click', () => {
        const modalContent = modal.querySelector('.modal-content');
        modalContent.classList.add('closing');
        setTimeout(() => {
            modal.style.display = 'none';
            modalContent.classList.remove('closing');
            document.body.classList.remove('no-scroll');
            modalBackdrop.innerHTML = `
                <div class="modal-logo-container">
                    <img id="modal-logo" src="" alt="Логотип фильма" class="modal-logo">
                    <div id="modal-logo-text" class="modal-logo-text"></div>
                    <div class="modal-buttons">
                        <button class="modal-watch-btn" id="modal-watch-btn">Смотреть</button>
                        <div class="modal-controls">
                            <button class="modal-trailer-btn" data-muted="true" style="display: none;">
                                <img src="ico/Звуквыключен.png" alt="Звук выключен">
                            </button>
                            <button class="modal-fullscreen-toggle" style="display: none;">
                                <img src="ico/Fullscreen.png" alt="Полноэкранный режим">
                            </button>
                        </div>
                    </div>
                </div>
            `;
            modalBackdrop.style.backgroundImage = '';
            modalBackdrop.classList.remove('animated-poster'); // Убираем анимацию
        }, 500);
    });

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

    searchCloseBtn.addEventListener('click', () => {
        const searchModalContent = searchModal.querySelector('.modal-content');
        searchModalContent.classList.add('closing');
        setTimeout(() => {
            searchModal.style.display = 'none';
            searchModalContent.classList.remove('closing');
            document.body.classList.remove('no-scroll');
        }, 500);
    });

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

    window.launchPlayer = async function() {
        if (playerInstance && playerInstance.getPlayerState && playerInstance.getPlayerState() === YT.PlayerState.PLAYING) {
            playerInstance.pauseVideo();
        }

        const id = modalWatchBtn.dataset.id || (heroWatchBtn && heroWatchBtn.dataset.id);
        const type = modalWatchBtn.dataset.type || (heroWatchBtn && heroWatchBtn.dataset.type);
        const images = await getImages(id, type);
        initKinoboxPlayer(id, type, images.backdrop);
        playerModal.style.display = 'block';
        document.body.classList.add('no-scroll');
    };

    modalWatchBtn.addEventListener('click', () => {
        window.launchPlayer();
    });

    if (heroWatchBtn) {
        heroWatchBtn.addEventListener('click', () => {
            window.launchPlayer();
        });
    }

    if (heroInfoBtn) {
        heroInfoBtn.addEventListener('click', () => {
            const id = heroInfoBtn.dataset.id;
            const type = heroInfoBtn.dataset.type;
            openModal(id, type);
        });
    }

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
    }

    const currentPage = window.location.pathname;
    if (currentPage.includes('index.html') || currentPage === '/') {
        fetchHeroContent();
        fetchNewMovies();
        fetchNewSeries();
        fetchNewAnimations();
    } else if (currentPage.includes('movies.html')) {
        fetchNewMovies();
        fetchTrendingMovies();
        fetchLegendaryMovies();
    } else if (currentPage.includes('series.html')) {
        fetchNewSeries();
        fetchTrendingSeries();
        fetchLegendarySeries();
    }
});