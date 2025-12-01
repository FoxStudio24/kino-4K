document.addEventListener('DOMContentLoaded', () => {
    const loadingOverlay = document.getElementById('loading-overlay');

    // Начало анимации загрузки
    function showLoading() {
        document.body.classList.add('loading');
    }

    // Блокировка прокрутки — сохраняем позицию и фиксируем тело
    function lockScroll() {
        const scrollY = window.scrollY || window.pageYOffset || 0;
        document.body.dataset.scrollY = String(scrollY);
        document.body.style.position = 'fixed';
        document.body.style.top = `-${scrollY}px`;
        document.body.style.left = '0';
        document.body.style.width = '100%';
        document.body.classList.add('no-scroll');
    }

    // Снятие блокировки прокрутки — восстанавливаем позицию
    function unlockScroll() {
        const scrollY = parseInt(document.body.dataset.scrollY || '0', 10);
        document.body.classList.remove('no-scroll');
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.width = '';
        window.scrollTo(0, scrollY);
        try { delete document.body.dataset.scrollY; } catch (e) { document.body.removeAttribute('data-scroll-y'); }
    }

    // Делегированный обработчик кликов для Top10 карточек (открывает общий модал)
    document.addEventListener('click', (e) => {
        const topCard = e.target.closest && e.target.closest('.top10-card');
        if (!topCard) return;
        e.preventDefault();
        const id = topCard.dataset.id;
        const type = topCard.dataset.type || 'movie';
        if (id) {
            // Сначала блокируем прокрутку, затем открываем модал и прячем другие оверлеи
            lockScroll();
            openModal(id, type);
            if (searchModal) searchModal.style.display = 'none';
            if (mobileSearchModal) mobileSearchModal.style.display = 'none';
        }
    });

    // Скрытие оверлея загрузки
    function hideLoading() {
        setTimeout(() => {
            loadingOverlay.style.display = 'none';
            document.body.classList.remove('loading');
        }, 300);
    }

    // Запуск анимации при загрузке страницы
    showLoading();
    window.addEventListener('load', hideLoading);

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
                searchInput.placeholder = 'Поиск фильмов и сериалов...';
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

    // Мобильный поиск
    const mobileSearchModal = document.getElementById('mobile-search-modal');
    const mobileSearchTrigger = document.querySelector('.mobile-search-trigger');
    const mobileSearchClose = document.querySelector('.mobile-search-close');
    const mobileSearchForm = document.querySelector('.mobile-search-form');
    const mobileSearchInput = document.querySelector('.mobile-search-input');
    const mobileSearchMovies = document.getElementById('mobile-search-movies');
    const mobileSearchSeries = document.getElementById('mobile-search-series');

    // Открытие мобильного поиска
    if (mobileSearchTrigger) {
        mobileSearchTrigger.addEventListener('click', (e) => {
            e.preventDefault();
            mobileSearchModal.style.display = 'block';
            lockScroll();
            mobileSearchTrigger.classList.add('search-active');
            setTimeout(() => {
                mobileSearchInput.focus();
            }, 300);
        });
    }

    // Закрытие мобильного поиска
    function closeMobileSearch() {
        mobileSearchModal.style.display = 'none';
        unlockScroll();
        mobileSearchTrigger.classList.remove('search-active');
        mobileSearchInput.value = '';
        mobileSearchMovies.innerHTML = '';
        mobileSearchSeries.innerHTML = '';
    }

    if (mobileSearchClose) {
        mobileSearchClose.addEventListener('click', closeMobileSearch);
    }

    // Закрытие по клику вне модального окна
    if (mobileSearchModal) {
        mobileSearchModal.addEventListener('click', (e) => {
            if (e.target === mobileSearchModal) {
                closeMobileSearch();
            }
        });
    }

    // Обработка формы мобильного поиска
    if (mobileSearchForm) {
        mobileSearchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const query = mobileSearchInput.value.trim();
            if (query) {
                performMobileSearch(query);
            } else {
                mobileSearchInput.placeholder = 'Введите запрос для поиска';
                mobileSearchInput.style.borderColor = '#ff4d4d';
                setTimeout(() => {
                    mobileSearchInput.placeholder = 'Поиск фильмов и сериалов...';
                    mobileSearchInput.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                }, 2000);
            }
        });
    }

    // Функция мобильного поиска
    async function performMobileSearch(query) {
        try {
            const movieResponse = await fetch(
                `${BASE_URL}/search/movie?api_key=${API_KEY}&language=ru-RU&query=${encodeURIComponent(query)}`
            );
            const movieData = await movieResponse.json();

            const seriesResponse = await fetch(
                `${BASE_URL}/search/tv?api_key=${API_KEY}&language=ru-RU&query=${encodeURIComponent(query)}`
            );
            const seriesData = await seriesResponse.json();

            displayMovies(movieData.results || [], mobileSearchMovies, 'movie');
            displayMovies(seriesData.results || [], mobileSearchSeries, 'tv');

            if ((!movieData.results || movieData.results.length === 0) && 
                (!seriesData.results || seriesData.results.length === 0)) {
                mobileSearchMovies.innerHTML = '<p>Результаты не найдены</p>';
                mobileSearchSeries.innerHTML = '';
            }
        } catch (error) {
            console.error('Ошибка поиска:', error);
            mobileSearchMovies.innerHTML = '<p>Ошибка при выполнении поиска</p>';
            mobileSearchSeries.innerHTML = '';
        }
    }

    // Закрытие мобильного поиска при нажатии Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && mobileSearchModal && mobileSearchModal.style.display === 'block') {
            closeMobileSearch();
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
    const searchModal = document.getElementById('search-modal');
    const searchMoviesRow = document.getElementById('search-movies');
    const searchSeriesRow = document.getElementById('search-series');
    const searchCloseBtn = document.querySelector('#search-modal .close-btn');
    const modalWatchBtn = document.getElementById('modal-watch-btn');
    const playerModal = document.getElementById('player-modal');
    const playerCloseBtn = document.querySelector('.player-close-btn');
    const trailersGrid = document.getElementById('trailers-grid');
    const modalTrailers = document.getElementById('modal-trailers');

    // Состояние слайдера в модальном окне (для очистки при закрытии)
    let modalSliderState = null;

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

// Получить и отобразить 1 слайд с YouTube трейлером
async function fetchHeroContent() {
    const response = await fetch(`${BASE_URL}/trending/all/week?api_key=${API_KEY}&language=ru-RU`);
    const data = await response.json();
    const content = data.results
        .filter(item => item.vote_average >= 6 && item.overview && item.backdrop_path)
        .map(item => ({ ...item, type: item.media_type }));

    const selectedContent = content[0];
    if (!selectedContent) return;

    let player;
    let isTrailerPlaying = false;
    let allTrailers = [];
    let trailerSuccessfullyPlayed = false;
    let progressInterval;
    let searchStartTime = null;

    const style = document.createElement('style');
    style.textContent = `
        .hero {
            position: relative;
            overflow: visible;
        }
        
        .hero-ambient {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-size: cover;
            background-position: center;
            transform: scale(1.02);
            filter: blur(50px);
            opacity: 1;
            pointer-events: none;
            z-index: 0;
        }
        
        .hero-background {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-size: cover;
            background-position: center;
            border-radius: 20px;
            z-index: 1;
            transition: opacity 1s ease;
        }
        
        .hero-trailer {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 2;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.5s ease;
            border-radius: 20px;
            overflow: hidden;
        }
            .hero-trailer::after {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(to top right, rgba(0, 0, 0, 0.8), transparent);
    border-radius: inherit;
    z-index: 3;
    pointer-events: none;
}
        
        .hero-trailer.active {
            opacity: 1;
            pointer-events: all;
        }
        
        .hero-trailer iframe {
            position: absolute;
            top: 50%;
            left: 50%;
            width: 100%;
            height: 100%;
            transform: translate(-50%, -50%);
            border: none;
            pointer-events: none;
        }
        
        @media (min-aspect-ratio: 16/9) {
            .hero-trailer iframe {
                height: 56.25vw;
            }
        }
        
        @media (max-aspect-ratio: 16/9) {
            .hero-trailer iframe {
                width: 177.78vh;
            }
        }
        
        .hero-content {
            position: relative;
            z-index: 3;
            transform: translateY(0);
            opacity: 1;
        }
        
        .hero-content.active {
            transform: translateY(0);
            opacity: 1;
        }
        
        .hero-logo {
            transition: transform 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            transform: translateY(0);
        }
        
        .hero-logo.move-down {
            transform: translateY(70px);
        }
        
        .hero-logo.move-up {
            transform: translateY(0);
        }
        
        .hero-logo-text {
            transition: opacity 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            opacity: 1;
        }
        
        .hero-logo-text.hidden {
            opacity: 0;
            pointer-events: none;
        }
        
        .hero-content p {
            transition: opacity 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            opacity: 1;
        }
        
        .hero-content p.hidden {
            opacity: 0;
            pointer-events: none;
        }
        
        @media (min-width: 769px) {
            .trailer-controls {
                bottom: 30px !important;
                right: 30px !important;
                top: auto !important;
            }
        }
        
        @media (max-width: 768px) {
            .hero {
                border-radius: 15px;
            }
            
            .hero-background,
            .hero-trailer {
                border-radius: 15px;
            }
            
            .hero-content {
                padding: 20px;
            }
            
            .hero-logo.move-down {
                transform: translateY(60px);
            }
            
            .trailer-controls {
                top: 20px !important;
                right: 20px !important;
                bottom: auto !important;
            }
        }
        
        @media (max-width: 480px) {
            .hero {
                border-radius: 10px;
            }
            
            .hero-background,
            .hero-trailer {
                border-radius: 10px;
            }
            
            .hero-logo.move-down {
                transform: translateY(50px);
            }
            
            .trailer-controls {
                top: 15px !important;
                right: 15px !important;
                bottom: auto !important;
            }
        }
    `;
    document.head.appendChild(style);

    const ambient = document.createElement('div');
    ambient.className = 'hero-ambient';
    ambient.style.backgroundImage = `url(${IMG_URL}${selectedContent.backdrop_path})`;
    hero.insertBefore(ambient, hero.firstChild);

    const bg = document.createElement('div');
    bg.className = 'hero-background';
    bg.style.backgroundImage = `url(${IMG_URL}${selectedContent.backdrop_path})`;
    hero.insertBefore(bg, hero.firstChild);

    const trailerContainer = document.createElement('div');
    trailerContainer.className = 'hero-trailer';
    hero.insertBefore(trailerContainer, hero.firstChild);

    const controlsContainer = document.createElement('div');
    controlsContainer.className = 'trailer-controls';
    controlsContainer.style.position = 'absolute';
    controlsContainer.style.bottom = '30px';
    controlsContainer.style.right = '30px';
    controlsContainer.style.zIndex = '10';
    controlsContainer.style.display = 'none';
    controlsContainer.style.gap = '10px';
    controlsContainer.style.pointerEvents = 'all';

    controlsContainer.innerHTML = `
        <button id="trailer-sound-btn" style="
            background: rgba(32, 32, 32, 0.35);
            border: none;
            border-radius: 50%;
            width: 45px;
            height: 45px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            backdrop-filter: blur(5px);
            padding: 0;
            margin: 0;
            flex-shrink: 0;
            border : 1px solid #ffffff21;
        ">
            <img src="ico/Звук_выкл.png" style="width: 20px; height: 20px; filter: brightness(0) invert(1);">
        </button>
        <button id="trailer-exit-btn" style="
            background: rgba(32, 32, 32, 0.35);
            border: none;
            border-radius: 50%;
            width: 45px;
            height: 45px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            backdrop-filter: blur(5px);
            padding: 0;
            margin: 0;
            flex-shrink: 0;
            border : 1px solid #ffffff21;
        ">
            <img src="ico/закрыть.svg" style="width: 20px; height: 20px; filter: brightness(0) invert(1);">
        </button>
    `;

    controlsContainer.style.display = 'none';
    controlsContainer.style.flexDirection = 'row';
    controlsContainer.style.alignItems = 'center';
    controlsContainer.style.justifyContent = 'center';

    hero.appendChild(controlsContainer);

    const soundBtn = document.getElementById('trailer-sound-btn');
    const exitBtn = document.getElementById('trailer-exit-btn');

    let isSoundMuted = true;
    const soundIcon = soundBtn.querySelector('img');

    soundBtn.addEventListener('click', () => {
        if (!player) return;
        try {
            if (isSoundMuted) {
                player.unMute();
                player.setVolume(100);
                soundIcon.src = 'ico/Звук_вкл.png';
            } else {
                player.mute();
                soundIcon.src = 'ico/Звук_выкл.png';
            }
            isSoundMuted = !isSoundMuted;
        } catch (error) {}
    });

    exitBtn.addEventListener('click', () => {
        trailerSuccessfullyPlayed = true;
        stopTrailer();
    });

    async function getAllTrailers(contentId, contentType) {
        try {
            const response = await fetch(
                `${BASE_URL}/${contentType}/${contentId}/videos?api_key=${API_KEY}`
            );
            const data = await response.json();
            
            const trailers = data.results.filter(
                video => video.type === 'Trailer' && video.site === 'YouTube'
            );

            trailers.sort((a, b) => {
                const langPriority = { 'ru': 0, 'en': 1 };
                const priorityA = langPriority[a.iso_639_1] ?? 2;
                const priorityB = langPriority[b.iso_639_1] ?? 2;
                return priorityA - priorityB;
            });

            return trailers;
        } catch (error) {
            return [];
        }
    }

    if (!window.YT) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }

    function testTrailerQuick(trailer) {
        return new Promise((resolve) => {
            const testDiv = document.createElement('div');
            testDiv.style.display = 'none';
            document.body.appendChild(testDiv);
            
            let resolved = false;
            const timeout = setTimeout(() => {
                if (!resolved) {
                    resolved = true;
                    try { testPlayer?.destroy(); } catch (e) {}
                    if (document.body.contains(testDiv)) document.body.removeChild(testDiv);
                    resolve(false);
                }
            }, 2500);
            
            try {
                const testPlayer = new YT.Player(testDiv, {
                    videoId: trailer.key,
                    playerVars: { autoplay: 1, mute: 1, controls: 0, fs: 0 },
                    events: {
                        'onReady': (e) => {
                            setTimeout(() => {
                                try {
                                    const time = e.target.getCurrentTime();
                                    if (time > 0 && !resolved) {
                                        resolved = true;
                                        clearTimeout(timeout);
                                        e.target.destroy();
                                        if (document.body.contains(testDiv)) document.body.removeChild(testDiv);
                                        resolve(true);
                                    }
                                } catch (err) {}
                            }, 800);
                        },
                        'onError': (e) => {
                            if (!resolved) {
                                resolved = true;
                                clearTimeout(timeout);
                                testPlayer.destroy();
                                if (document.body.contains(testDiv)) document.body.removeChild(testDiv);
                                resolve(false);
                            }
                        }
                    }
                });
            } catch (err) {
                if (!resolved) {
                    resolved = true;
                    clearTimeout(timeout);
                    if (document.body.contains(testDiv)) document.body.removeChild(testDiv);
                    resolve(false);
                }
            }
        });
    }

    async function findAndPlayTrailer() {
        searchStartTime = Date.now();
        
        for (const trailer of allTrailers) {
            if (trailerSuccessfullyPlayed) break;
            
            const isWorking = await testTrailerQuick(trailer);
            if (isWorking) {
                const timeToWait = 10000 - (Date.now() - searchStartTime);
                if (timeToWait > 0) {
                    await new Promise(resolve => setTimeout(resolve, timeToWait));
                }
                
                playTrailer(trailer);
                return;
            }
        }
        
        restoreBackground();
    }

    function playTrailer(trailer) {
        const heroDescription = document.querySelector('.hero-content p');
        const heroLogo = document.querySelector('.hero-logo');
        const heroLogoText = document.querySelector('.hero-logo-text');

        if (heroDescription) heroDescription.classList.add('hidden');
        if (heroLogo) heroLogo.classList.add('move-down');
        if (heroLogoText) heroLogoText.classList.add('hidden');

        const playerDiv = document.createElement('div');
        playerDiv.id = 'youtube-player-main';
        trailerContainer.innerHTML = '';
        trailerContainer.appendChild(playerDiv);

        const waitForAPI = setInterval(() => {
            if (window.YT && window.YT.Player) {
                clearInterval(waitForAPI);
                initPlayer(playerDiv.id, trailer.key);
            }
        }, 100);
    }

    function initPlayer(elementId, videoKey) {
        try {
            player = new YT.Player(elementId, {
                videoId: videoKey,
                playerVars: {
                    autoplay: 1,
                    mute: 1,
                    controls: 0,
                    disablekb: 1,
                    fs: 0,
                    modestbranding: 1,
                    rel: 0,
                    showinfo: 0,
                    iv_load_policy: 3,
                    playsinline: 1,
                    enablejsapi: 1,
                    origin: window.location.origin
                },
                events: {
                    'onReady': onPlayerReady,
                    'onStateChange': onPlayerStateChange,
                    'onError': onPlayerError
                }
            });
        } catch (error) {}
    }

    function onPlayerReady(event) {
        try {
            event.target.playVideo();
            event.target.mute();
        } catch (e) {}
        
        setTimeout(() => {
            trailerContainer.classList.add('active');
            controlsContainer.style.display = 'flex';
            isTrailerPlaying = true;
            trailerSuccessfullyPlayed = true;
            startProgressMonitoring(event.target);
        }, 300);
    }

    function startProgressMonitoring(playerInstance) {
        if (progressInterval) clearInterval(progressInterval);

        progressInterval = setInterval(() => {
            if (playerInstance?.getDuration && playerInstance?.getCurrentTime) {
                try {
                    const duration = playerInstance.getDuration();
                    const currentTime = playerInstance.getCurrentTime();
                    const timeLeft = duration - currentTime;
                    
                    if (timeLeft <= 10.5 && timeLeft >= 9.5) {
                        clearInterval(progressInterval);
                        stopTrailer();
                    }
                } catch (e) {}
            }
        }, 100);
    }

    function onPlayerStateChange(event) {
        if (event.data === 0) {
            stopTrailer();
        }
    }

    function onPlayerError(event) {
        stopTrailer();
    }

    function stopTrailer() {
        if (progressInterval) clearInterval(progressInterval);

        trailerContainer.classList.remove('active');
        controlsContainer.style.display = 'none';
        isTrailerPlaying = false;
        restoreBackground();

        if (player) {
            setTimeout(() => {
                try { player.destroy(); } catch (error) {}
                trailerContainer.innerHTML = '';
                player = null;
            }, 500);
        }
    }

    function restoreBackground() {
        const heroDescription = document.querySelector('.hero-content p');
        const heroLogo = document.querySelector('.hero-logo');
        const heroLogoText = document.querySelector('.hero-logo-text');

        setTimeout(() => {
            if (heroDescription) heroDescription.classList.remove('hidden');
            if (heroLogo) {
                heroLogo.classList.remove('move-down');
                heroLogo.classList.add('move-up');
                setTimeout(() => heroLogo.classList.remove('move-up'), 1200);
            }
            if (heroLogoText) heroLogoText.classList.remove('hidden');
        }, 500);
    }

    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.attributeName === 'class') {
                const isModalOpen = document.querySelector('.modal.active') || 
                                   document.querySelector('.player-modal.active');
                
                if (isModalOpen && isTrailerPlaying && player) {
                    try { player.pauseVideo(); } catch (e) {}
                }
            }
        });
    });

    observer.observe(document.body, {
        attributes: true,
        subtree: true,
        attributeFilter: ['class']
    });

    const logoUrl = await getLogo(selectedContent.id, selectedContent.type);

    if (logoUrl) {
        heroLogo.src = logoUrl;
        heroLogo.style.display = 'block';
        heroLogoText.style.display = 'none';
    } else {
        heroLogo.style.display = 'none';
        heroLogoText.textContent = selectedContent.title || selectedContent.name;
        heroLogoText.style.display = 'block';
    }

    heroDescription.textContent = selectedContent.overview || 'Описание отсутствует';
    heroWatchBtn.dataset.id = selectedContent.id;
    heroWatchBtn.dataset.type = selectedContent.type;
    heroInfoBtn.dataset.id = selectedContent.id;
    heroInfoBtn.dataset.type = selectedContent.type;

    const heroContent = document.querySelector('.hero-content');
    if (heroContent) heroContent.classList.add('active');

    const waitForYT = setInterval(async () => {
        if (window.YT && window.YT.Player) {
            clearInterval(waitForYT);
            allTrailers = await getAllTrailers(selectedContent.id, selectedContent.type);
            if (allTrailers.length > 0) {
                findAndPlayTrailer();
            }
        }
    }, 100);
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
            `${BASE_URL}/discover/tv?api_key=${API_KEY}&language=ru-RU&sort_by=first_air_date.desc&first_air_date.lte=2025-06-22&vote_count.gte=100`
        );
        const data = await response.json();
        displayMovies(data.results, newSeriesRow, 'tv');
    }

    // Получить новые мультфильмы
    async function fetchNewAnimations() {
        const response = await fetch(
            `${BASE_URL}/discover/movie?api_key=${API_KEY}&language=ru-RU&with_genres=16&sort_by=release_date.desc&release_date.lte=2025-06-22&vote_count.gte=100`
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

            movieCard.innerHTML = `
                <img src="${posterUrl}" alt="${movie.title || movie.name}">
                <div class="gradient-overlay"></div>
                <p>${movie.title || movie.name}</p>
                ${rating ? `<div class="${ratingClass}">${rating}</div>` : ''}
            `;

            movieCard.dataset.id = movie.id;
            movieCard.dataset.type = type;
            movieCard.addEventListener('click', (e) => {
                e.preventDefault();
                lockScroll();
                openModal(movie.id, type);
                    if (searchModal) searchModal.style.display = 'none';
                    if (mobileSearchModal) mobileSearchModal.style.display = 'none';
            });

            container.appendChild(movieCard);
        });
    }

    // Определение возрастного рейтинга
    async function getAgeRating(id, type) {
        try {
            let rating;
            if (type === 'movie') {
                const response = await fetch(`${BASE_URL}/movie/${id}/release_dates?api_key=${API_KEY}`);
                const data = await response.json();
                const usRelease = data.results.find(item => item.iso_3166_1 === 'US');
                rating = usRelease?.release_dates?.find(date => date.certification)?.certification;
            } else if (type === 'tv') {
                const response = await fetch(`${BASE_URL}/tv/${id}/content_ratings?api_key=${API_KEY}`);
                const data = await response.json();
                rating = data.results.find(item => item.iso_3166_1 === 'US')?.rating;
            }

            // Сопоставление рейтингов с возрастными ограничениями
            const ageMap = {
                'G': '0+',
                'TV-Y': '0+',
                'TV-G': '0+',
                'PG': '6+',
                'TV-PG': '6+',
                'PG-13': '12+',
                'TV-14': '12+',
                'R': '16+',
                'NC-17': '18+',
                'TV-MA': '18+'
            };

            return ageMap[rating] || '12+'; // По умолчанию 12+, если рейтинг не найден
        } catch (error) {
            console.error('Ошибка получения возрастного рейтинга:', error);
            return '12+'; // По умолчанию при ошибке
        }
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
        if (!trailersGrid) return;
        trailersGrid.innerHTML = '';

        if (trailers.length === 0) {
            if (modalTrailers) modalTrailers.classList.remove('visible');
            return;
        }

        if (modalTrailers) modalTrailers.classList.add('visible');

        trailers.forEach(trailer => {
            const trailerCard = document.createElement('div');
            trailerCard.classList.add('trailer-card');
            const thumbnailUrl = trailer.key ? `https://img.youtube.com/vi/${trailer.key}/hqdefault.jpg` : NO_PICTURE_URL;

            trailerCard.innerHTML = `
                <img src="${thumbnailUrl}" alt="${trailer.name}">
                <div class="play-overlay">
                    <img src="ico/play.svg" alt="Play">
                </div>
            `;

            trailerCard.addEventListener('click', () => {
                if (trailerVideo) {
                    trailerVideo.innerHTML = `
                        <iframe width="100%" height="100%" 
                                src="https://www.youtube.com/embed/${trailer.key}?autoplay=1" 
                                frameborder="0" allowfullscreen></iframe>
                    `;
                }
                if (trailerModal) {
                    trailerModal.style.display = 'block';
                    lockScroll();
                }
            });

            trailersGrid.appendChild(trailerCard);
        });
    }

    // Открыть модальное окно с деталями фильма
    async function openModal(id, type) {
        // Защитно: если ещё не заблокирована прокрутка, сохраняем позицию
        try {
            if (!document.body.dataset.scrollY) lockScroll();
        } catch (e) {}

        const response = await fetch(`${BASE_URL}/${type}/${id}?api_key=${API_KEY}&append_to_response=credits&language=ru-RU`);
        const data = await response.json();
        const backdropUrl = data.backdrop_path ? `${IMG_URL}${data.backdrop_path}` : NO_PICTURE_URL;

        // Очистка предыдущего слайдера в модалке
        if (modalSliderState?.interval) {
            clearInterval(modalSliderState.interval);
            modalSliderState = null;
        }

        // Очистка и восстановление начальной структуры modalBackdrop с логотипом
        const logoUrl = await getLogo(id, type);
        if (modalBackdrop) {
            modalBackdrop.innerHTML = `
                <div class="modal-logo-container">
                    ${logoUrl ? 
                        `<img id="modal-logo" class="modal-logo" src="${logoUrl}" alt="Logo">` : 
                        `<h1 id="modal-logo-text" class="modal-logo-text">${data.title || data.name}</h1>`
                    }
                    <div class="modal-buttons">
                        <button id="modal-watch-btn" class="modal-watch-btn" data-id="${id}" data-type="${type}">
                           <img src="ico/Плей.svg" alt="watch icon"
     style="width:20px;height:20px;object-fit:contain;margin-right:8px;filter:brightness(0);">


                             Смотреть
                        </button>
                    </div>
                </div>
            `;
            // Убираем статичный фон — будем управлять через слои
            modalBackdrop.style.backgroundImage = '';

            // 1) Получаем до 4 подходящих бэкдропов без текста (backdrops с высоким соотношением сторон)
            const imagesRes = await fetch(`${BASE_URL}/${type}/${id}/images?api_key=${API_KEY}`);
            const imagesData = await imagesRes.json();
            const backdrops = (imagesData.backdrops || [])
                .filter(img => img.iso_639_1 === null || img.iso_639_1 === 'xx')
                .slice(0, 4);

            // Фолбэк: если мало бэкдропов, добавим основной
            if (backdrops.length === 0 && data.backdrop_path) {
                backdrops.push({ file_path: data.backdrop_path });
            }

            // 2) Создаем стили для контролов в модалке (правый-низ)
            const modalStyle = document.createElement('style');
            modalStyle.textContent = `
                .modal-hero-controls {
                    position: absolute;
                    right: 16px;
                    bottom: 16px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    z-index: 5;
                    border-radius: 25px;
                    padding: 2px 2px;
                }
                .modal-hero-dots {
                    display: flex;
                    gap: 8px;
                    background: rgba(0, 0, 0, 0.637);
                    border-radius: 25px;
                    padding: 8px 10px;
                }
                .modal-hero-dot {
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                    background: rgb(255 255 255 / 18%);
                    cursor: pointer;
                    transition: all 0.3s ease;
                }
                .modal-hero-dot.active { background: #ffffff; transform: scale(1.2); }
                .modal-hero-play-pause {
                    background: rgba(0, 0, 0, 0.637);
                    border-radius: 50%;
                    padding: 6px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .modal-hero-play-pause img { width: 16px; height: 16px; }
                .modal-hero-play-pause:hover { background: rgba(0, 0, 0, 0.8); }

                /* Слои бэкдропа */
                .modal-backdrop-layer {
                    position: absolute;
                    inset: 0;
                    background-size: cover;
                    background-position: center;
                    opacity: 0;
                    transition: opacity 1s ease;
                    z-index: 0;
                }
                .modal-backdrop-layer.active { opacity: 1; }

                /* Мобилки: скрыть контролы в модалке */
                @media (max-width: 768px) {
                    .modal-hero-controls { display: none !important; }
                }
            `;
            document.head.appendChild(modalStyle);

            // 3) Создаем два слоя для плавного фейда
            const layer1 = document.createElement('div');
            const layer2 = document.createElement('div');
            layer1.className = 'modal-backdrop-layer active';
            layer2.className = 'modal-backdrop-layer';
            modalBackdrop.appendChild(layer2);
            modalBackdrop.appendChild(layer1);

            // 4) Контролы: точки и пауза/плей (справа-снизу)
            const controls = document.createElement('div');
            controls.className = 'modal-hero-controls';
            const dots = document.createElement('div');
            dots.className = 'modal-hero-dots';
            const playPause = document.createElement('div');
            playPause.className = 'modal-hero-play-pause';
            const playPauseIcon = document.createElement('img');
            playPauseIcon.src = 'ico/Пауза.png';
            playPause.appendChild(playPauseIcon);
            controls.appendChild(dots);
            controls.appendChild(playPause);
            modalBackdrop.appendChild(controls);

            // 5) Состояние и функции слайдера
            let current = 0;
            let isPlayingModal = true;
            const slides = backdrops.slice(0, 4);

            function setSlide(idx) {
                const currentLayer = layer1.classList.contains('active') ? layer1 : layer2;
                const nextLayer = layer1.classList.contains('active') ? layer2 : layer1;
                nextLayer.style.backgroundImage = `url(${IMG_URL}${slides[idx].file_path})`;
                currentLayer.classList.remove('active');
                nextLayer.classList.add('active');
                // Обновить точки
                dots.querySelectorAll('.modal-hero-dot').forEach((dot, i) => {
                    dot.classList.toggle('active', i === idx);
                });
                current = idx;
            }

            // Точки
            slides.forEach((_, i) => {
                const d = document.createElement('div');
                d.className = 'modal-hero-dot';
                if (i === 0) d.classList.add('active');
                d.addEventListener('click', () => {
                    if (modalSliderState?.interval) clearInterval(modalSliderState.interval);
                    isPlayingModal = false;
                    playPauseIcon.src = 'ico/Плей.png';
                    setSlide(i);
                });
                dots.appendChild(d);
            });

            function startModalAutoSlide() {
                if (modalSliderState?.interval) clearInterval(modalSliderState.interval);
                modalSliderState = {
                    interval: setInterval(() => {
                        const next = (current + 1) % slides.length;
                        setSlide(next);
                    }, 10000)
                };
            }

            // Пауза/плей
            playPause.addEventListener('click', () => {
                isPlayingModal = !isPlayingModal;
                playPauseIcon.src = isPlayingModal ? 'ico/Пауза.png' : 'ico/Плей.png';
                if (isPlayingModal) startModalAutoSlide(); else if (modalSliderState?.interval) clearInterval(modalSliderState.interval);
            });

            // Инициализация
            if (slides.length > 0) {
                layer1.style.backgroundImage = `url(${IMG_URL}${slides[0].file_path})`;
                startModalAutoSlide();
            }
        }

        // Заполнение информации о фильме/сериале
        if (modalYear) modalYear.textContent = new Date(data.release_date || data.first_air_date).getFullYear() || 'Неизвестно';
        if (modalSeasons && type === 'tv') {
            modalSeasons.textContent = data.number_of_seasons ? `${data.number_of_seasons} сезон(ов)` : '';
            modalSeasons.style.display = 'block';
        } else if (modalSeasons) {
            modalSeasons.style.display = 'none';
        }

        if (modalAgeRating) {
            modalAgeRating.textContent = await getAgeRating(id, type);
        }

        const rating = data.vote_average ? parseFloat(data.vote_average.toFixed(1)) : null;
        if (modalRating && rating) {
            modalRating.textContent = rating;
            modalRating.className = 'rating';
            if (rating >= 6.5) {
                modalRating.classList.add('high');
            } else if (rating < 6.5 && rating >= 5) {
                modalRating.classList.add('low');
            } else if (rating < 5 && rating >= 4) {
                modalRating.classList.add('very-low');
            } else {
                modalRating.classList.add('dark-red');
            }
        } else if (modalRating) {
            modalRating.textContent = '';
        }

        if (modalOverview) modalOverview.textContent = data.overview || 'Описание отсутствует';

        // Актерский состав
        const cast = data.credits?.cast?.slice(0, 5).map(actor => actor.name).join(', ') || 'Информация недоступна';
        if (modalCast) modalCast.textContent = cast;

        // Жанры
        const genres = data.genres?.map(genre => genre.name).join(', ') || 'Информация недоступна';
        if (modalGenres) modalGenres.textContent = genres;

        // Оригинальное название
        if (modalOriginalTitle) modalOriginalTitle.textContent = data.original_title || data.original_name || 'Информация недоступна';

        // Получение и отображение трейлеров
        const trailers = await getTrailers(id, type);
        displayTrailers(trailers, id, type);

        // Показать модальное окно
        if (modal) {
            modal.style.display = 'block';
            // после показа модалки — ещё раз зафиксируем позицию и предотвратим скролл браузера
            try {
                const sy = parseInt(document.body.dataset.scrollY || '0', 10);
                window.scrollTo(0, sy);
            } catch (e) {}
            // Программная фокусировка убрана по запросу — не вызываем `.focus()` чтобы не показывать outline
        }

        // Обновить обработчик кнопки "Смотреть" в модальном окне
        const newModalWatchBtn = document.getElementById('modal-watch-btn');
        if (newModalWatchBtn) {
            newModalWatchBtn.addEventListener('click', () => {
                const btnId = parseInt(newModalWatchBtn.dataset.id);
                const btnType = newModalWatchBtn.dataset.type;
                if (btnId && btnType) {
                    // Закрываем модальное окно
                    if (modal) {
                        modal.style.display = 'none';
                        unlockScroll();
                    }
                    // Открываем плеер Vibix
                    if (btnType === 'movie') {
                        window.vibixPlayer.playMovie(btnId);
                    } else {
                        window.vibixPlayer.playTVShow(btnId, 1, 1);
                    }
                }
            });
        }
    }

    // Функция поиска
    async function performSearch(query) {
        try {
            const movieResponse = await fetch(
                `${BASE_URL}/search/movie?api_key=${API_KEY}&language=ru-RU&query=${encodeURIComponent(query)}`
            );
            const movieData = await movieResponse.json();

            const seriesResponse = await fetch(
                `${BASE_URL}/search/tv?api_key=${API_KEY}&language=ru-RU&query=${encodeURIComponent(query)}`
            );
            const seriesData = await seriesResponse.json();

            displayMovies(movieData.results || [], searchMoviesRow, 'movie');
            displayMovies(seriesData.results || [], searchSeriesRow, 'tv');

            if (searchModal) {
                searchModal.style.display = 'block';
                lockScroll();
            }

            if ((!movieData.results || movieData.results.length === 0) && 
                (!seriesData.results || seriesData.results.length === 0)) {
                if (searchMoviesRow) {
                    searchMoviesRow.innerHTML = '<p>Результаты не найдены</p>';
                }
                if (searchSeriesRow) {
                    searchSeriesRow.innerHTML = '';
                }
            }
        } catch (error) {
            console.error('Ошибка поиска:', error);
            if (searchMoviesRow) {
                searchMoviesRow.innerHTML = '<p>Ошибка при выполнении поиска</p>';
            }
            if (searchSeriesRow) {
                searchSeriesRow.innerHTML = '';
            }
        }
    }

    // Обработчики событий для закрытия модальных окон
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            if (modal) {
                modal.style.display = 'none';
                unlockScroll();
            }
            if (modalSliderState?.interval) {
                clearInterval(modalSliderState.interval);
                modalSliderState = null;
            }
        });
    }

    if (trailerCloseBtn) {
        trailerCloseBtn.addEventListener('click', () => {
            if (trailerModal) {
                trailerModal.style.display = 'none';
                unlockScroll();
            }
            if (trailerVideo) trailerVideo.innerHTML = '';
        });
    }

    if (searchCloseBtn) {
        searchCloseBtn.addEventListener('click', () => {
            if (searchModal) {
                searchModal.style.display = 'none';
                unlockScroll();
            }
        });
    }

    if (playerCloseBtn) {
        playerCloseBtn.addEventListener('click', () => {
            if (playerModal) {
                playerModal.style.display = 'none';
                unlockScroll();
            }
            // Закрытие плеера Vibix
            const vibixModal = document.getElementById('vibix-player-modal');
            if (vibixModal) {
                vibixModal.remove();
            }
        });
    }

    // Закрытие модальных окон при клике вне них
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
            unlockScroll();
            if (modalSliderState?.interval) {
                clearInterval(modalSliderState.interval);
                modalSliderState = null;
            }
        }
        if (e.target === trailerModal) {
            trailerModal.style.display = 'none';
            unlockScroll();
            if (trailerVideo) trailerVideo.innerHTML = '';
        }
        if (e.target === searchModal) {
            searchModal.style.display = 'none';
            unlockScroll();
        }
        if (e.target === playerModal) {
            playerModal.style.display = 'none';
            unlockScroll();
            // Закрытие плеера Vibix
            const vibixModal = document.getElementById('vibix-player-modal');
            if (vibixModal) {
                vibixModal.remove();
            }
        }
    });

    // Экспортируем глобально для других скриптов (например, плеера)
    try {
        window.lockScroll = lockScroll;
        window.unlockScroll = unlockScroll;
    } catch (e) {
        // ignore
    }

    // Обработчики для кнопок hero
    if (heroWatchBtn) {
        heroWatchBtn.addEventListener('click', () => {
            const id = parseInt(heroWatchBtn.dataset.id);
            const type = heroWatchBtn.dataset.type;
            if (id && type) {
                if (type === 'movie') {
                    window.vibixPlayer.playMovie(id);
                } else {
                    window.vibixPlayer.playTVShow(id, 1, 1);
                }
            }
        });
    }

    if (heroInfoBtn) {
        heroInfoBtn.addEventListener('click', () => {
            const id = heroInfoBtn.dataset.id;
            const type = heroInfoBtn.dataset.type;
            if (id && type) {
                    lockScroll();
                    openModal(id, type);
                }
        });
    }

    // Обработчик для modal-watch-btn (делегирование событий)
    document.addEventListener('click', (e) => {
        if (e.target && e.target.id === 'modal-watch-btn') {
            const id = parseInt(e.target.dataset.id);
            const type = e.target.dataset.type;
            if (id && type) {
                // Закрываем модальное окно
                if (modal) {
                    modal.style.display = 'none';
                    try { unlockScroll(); } catch (e) { document.body.classList.remove('no-scroll'); }
                }
                
                // Открываем плеер Vibix
                if (type === 'movie') {
                    window.vibixPlayer.playMovie(id);
                } else {
                    window.vibixPlayer.playTVShow(id, 1, 1);
                }
            }
        }
    });

    // Инициализация контента
    if (hero) fetchHeroContent();
    if (newMoviesRow) fetchNewMovies();
    if (newSeriesRow) fetchNewSeries();
    if (newAnimationsRow) fetchNewAnimations();
    if (trendingMoviesRow) fetchTrendingMovies();
    if (legendaryMoviesRow) fetchLegendaryMovies();
    if (trendingSeriesRow) fetchTrendingSeries();
    if (legendarySeriesRow) fetchLegendarySeries();
});