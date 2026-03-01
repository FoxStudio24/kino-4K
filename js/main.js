document.addEventListener('DOMContentLoaded', () => {
    const loadingOverlay = document.getElementById('loading-overlay');

    // Установка активного пункта меню на основе текущей страницы
    function setActiveNavItem() {
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';

        // Для навигации в header
        const navLinks = document.querySelectorAll('.nav-tabs a');
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href === currentPage || (currentPage === '' && href === 'index.html')) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });

        // Для мобильной навигации
        const mobileNavItems = document.querySelectorAll('.mobile-nav-item');
        mobileNavItems.forEach(item => {
            const href = item.getAttribute('href');
            if (href === currentPage || (currentPage === '' && href === 'index.html')) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    setActiveNavItem();

    // Функция для сохранения источника открытия (текущей страницы) перед переходом в watch
    function saveWatchSource() {
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        sessionStorage.setItem('watchSource', currentPage);
    }

    // Восстановление скролла при загрузке страницы
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.width = '';
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
    document.body.classList.remove('no-scroll');

    // Если есть сохраненная позиция скролла, восстановим её
    const savedScrollY = parseInt(document.body.dataset.scrollY || '0', 10);
    if (savedScrollY > 0) {
        setTimeout(() => window.scrollTo(0, savedScrollY), 100);
    }

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
        if (e.target.closest && e.target.closest('.poster-card-menu, .poster-card-menu-btn, .poster-card-menu-action')) return;
        const topCard = e.target.closest && e.target.closest('.top10-card');
        if (!topCard) return;
        e.preventDefault();
        const id = topCard.dataset.id;
        const type = topCard.dataset.type || 'movie';
        if (id) {
            // НЕ блокируем скролл перед переходом на watch страницу
            openModal(id, type);
            if (searchModal) searchModal.style.display = 'none';
        }
    });

    // Скрытие оверлея загрузки
    function hideLoading() {
        setTimeout(() => {
            loadingOverlay.style.display = 'none';
            document.body.classList.remove('loading');
        }, 300);
    }

    // Запуск анимации при загрузке страницы (кроме страницы поиска)
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    if (currentPage !== 'search.html') {
        showLoading();
        window.addEventListener('load', hideLoading);
    } else {
        // На странице поиска не блокируем прокрутку загрузкой
        document.body.classList.remove('loading');
    }

    // Логика для кнопки поиска
    const searchTrigger = document.getElementById('search-trigger');
    const searchModal = document.getElementById('search-modal');
    const searchForm = document.getElementById('search-form');
    const searchInput = document.getElementById('search-input');
    const searchClose = document.getElementById('search-close');

    if (searchTrigger) {
        searchTrigger.addEventListener('click', (e) => {
            e.preventDefault();
            // Если модального окна нет — перенаправляем на страницу поиска
            if (!searchModal) {
                window.location.href = 'search.html';
                return;
            }
            searchModal.style.display = 'block';
            lockScroll();
            try {
                const modalContent = document.querySelector('.mobile-search-content');
                if (modalContent) {
                    modalContent.classList.add('modal-opening');
                    // remove the class after animations complete
                    setTimeout(() => {
                        modalContent.classList.remove('modal-opening');
                    }, 700);
                }
            } catch (e) { }
            setTimeout(() => {
                searchInput.focus();
                // if empty input — show empty state (desktop behavior)
                updateSearchEmptyState();
            }, 300);
        });
    }

    // Привязать кнопки мобильной навигации к единому модальному окну поиска
    const mobileSearchTriggers = document.querySelectorAll('.mobile-search-trigger');
    if (mobileSearchTriggers && mobileSearchTriggers.length > 0) {
        mobileSearchTriggers.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                // Если модального окна нет — перенаправляем на страницу поиска
                if (!searchModal) {
                    window.location.href = 'search.html';
                    return;
                }
                if (searchModal) searchModal.style.display = 'block';
                lockScroll();
                try {
                    const modalContent = document.querySelector('.mobile-search-content');
                    if (modalContent) {
                        modalContent.classList.add('modal-opening');
                        setTimeout(() => {
                            modalContent.classList.remove('modal-opening');
                        }, 700);
                    }
                } catch (e) { }
                // Скрываем мобильную навигацию пока открыт поиск
                try {
                    const mobileNav = document.querySelector('.mobile-nav');
                    if (mobileNav) mobileNav.style.display = 'none';
                } catch (err) { }
                setTimeout(() => {
                    if (searchInput) searchInput.focus();
                    updateSearchEmptyState();
                }, 300);
            });
        });
    }

    // Empty state toggle helpers
    function updateSearchEmptyState() {
        try {
            const empty = document.getElementById('search-empty');
            const results = document.querySelectorAll('.mobile-search-results, .mobile-search-results .search-category');
            const q = searchInput ? searchInput.value.trim() : '';
            // Only use empty-state layout on desktop widths
            if (window.innerWidth >= 769) {
                if (empty) empty.style.display = (q === '') ? 'flex' : 'none';
                // hide results container when empty
                const resultsContainer = document.querySelector('.mobile-search-results');
                if (resultsContainer) resultsContainer.style.display = (q === '') ? 'none' : 'block';
                // render recent searches when empty
                if (q === '') renderRecentSearches();
            } else {
                // mobile: keep default behavior
                if (empty) empty.style.display = 'none';
                const resultsContainer = document.querySelector('.mobile-search-results');
                if (resultsContainer) resultsContainer.style.display = 'block';
                // on mobile also render recent if empty
                if (q === '') renderRecentSearches();
            }
        } catch (e) { }
    }

    // Toggle empty state on input
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            updateSearchEmptyState();
        });
    }

    // На странице поиска при загрузке сразу показать пустое состояние и сфокусировать инпут
    if (currentPage === 'search.html') {
        try {
            setTimeout(() => {
                if (searchInput) {
                    searchInput.focus();
                }
                updateSearchEmptyState();
            }, 50);
        } catch (e) { }
    }

    // Recent searches storage and rendering
    const RECENT_KEY = 'nn_recent_searches';

    function loadRecentSearches() {
        try {
            const raw = localStorage.getItem(RECENT_KEY);
            if (!raw) return [];
            const arr = JSON.parse(raw);
            if (Array.isArray(arr)) return arr;
        } catch (e) { }
        return [];
    }

    function saveRecentSearch(query) {
        if (!query) return;
        try {
            let arr = loadRecentSearches();
            // remove duplicates
            arr = arr.filter(item => item.toLowerCase() !== query.toLowerCase());
            arr.unshift(query);
            if (arr.length > 5) arr = arr.slice(0, 5);
            localStorage.setItem(RECENT_KEY, JSON.stringify(arr));
        } catch (e) { }
    }

    function renderRecentSearches() {
        try {
            const container = document.getElementById('search-recent');
            if (!container) return;
            const list = loadRecentSearches();
            container.innerHTML = '';
            if (!list || list.length === 0) {
                container.setAttribute('aria-hidden', 'true');
                return;
            }
            container.setAttribute('aria-hidden', 'false');
            list.forEach(q => {
                const btn = document.createElement('div');
                btn.className = 'pill';
                btn.textContent = q;
                btn.addEventListener('click', (e) => {
                    if (searchInput) searchInput.value = q;
                    // perform search immediately
                    performSearch(q);
                });
                container.appendChild(btn);
            });
        } catch (e) { }
    }

    function closeSearch() {
        if (searchModal) searchModal.style.display = 'none';
        unlockScroll();
        // remove results-open class so form returns to center
        try {
            const modalContent = document.querySelector('.mobile-search-content');
            if (modalContent) modalContent.classList.remove('results-open');
            const empty = document.getElementById('search-empty');
            const resultsContainer = document.querySelector('.mobile-search-results');
            if (window.innerWidth >= 769) {
                if (empty) empty.style.display = 'flex';
                if (resultsContainer) resultsContainer.style.display = 'none';
            }
        } catch (e) { }
        // Вернуть мобильную навигацию, если она была скрыта
        try {
            const mobileNav = document.querySelector('.mobile-nav');
            if (mobileNav && window.innerWidth <= 768) {
                mobileNav.style.display = 'flex';
            }
        } catch (e) { }

        searchInput.value = '';
        document.getElementById('search-movies').innerHTML = '';
        document.getElementById('search-series').innerHTML = '';
        document.getElementById('search-actors').innerHTML = '';
    }

    if (searchClose) {
        if (currentPage === 'search.html') {
            // На странице поиска кнопка закрытия ведет назад/на главную
            searchClose.addEventListener('click', (e) => {
                e.preventDefault();
                if (window.history.length > 1) {
                    window.history.back();
                } else {
                    window.location.href = 'index.html';
                }
            });
        } else {
            searchClose.addEventListener('click', closeSearch);
        }
    }

    if (searchModal) {
        searchModal.addEventListener('click', (e) => {
            if (e.target === searchModal) {
                closeSearch();
            }
        });
    }

    if (searchForm) {
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const query = searchInput.value.trim();
            if (query) {
                performSearch(query);
            } else {
                // If empty and on desktop, show empty state instead of error styling
                if (window.innerWidth >= 769) {
                    updateSearchEmptyState();
                } else {
                    searchInput.placeholder = 'Введите запрос для поиска';
                    searchInput.style.borderColor = '#ff4d4d';
                    setTimeout(() => {
                        searchInput.placeholder = 'Поиск фильмов, сериалов и актеров...';
                        searchInput.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                    }, 2000);
                }
            }
        });
    }

    // Закрытие поиска при нажатии Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && searchModal && searchModal.style.display === 'block') {
            closeSearch();
        }
    });

    // Обновление иконки избранного в навигации в зависимости от текущей страницы
    function updateFavoritesNavIcon() {
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        const isFavoritesPage = currentPage === 'favorites.html';

        // Ищем все ссылки на favorites в навигации
        document.querySelectorAll('a[href="favorites.html"]').forEach(link => {
            const img = link.querySelector('img');
            if (img && img.alt === 'Избранное') {
                if (isFavoritesPage) {
                    img.src = 'ico/Избранное_добавлено.svg';
                } else {
                    img.src = 'ico/Избранное_добавить.svg';
                }
            }
        });
    }

    // Обновляем иконку при загрузке
    updateFavoritesNavIcon();

    const API_KEY = '06936145fe8e20be28b02e26b55d3ce6';
    const BASE_URL = 'https://api.themoviedb.org/3';
    const IMG_URL = 'https://image.tmdb.org/t/p/original';
    const POSTER_URL = 'https://image.tmdb.org/t/p/w500';
    const NO_PICTURE_URL = 'ico/No picture.svg';

    const hero = document.getElementById('hero');
    const heroLogo = document.getElementById('hero-logo');
    const heroLogoText = document.getElementById('hero-logo-text');
    const heroDescription = document.getElementById('hero-description');
    const heroWatchBtn = document.getElementById('hero-watch-btn');
    const heroInfoBtn = document.getElementById('hero-info-btn');
    const heroFavBtn = document.getElementById('hero-fav-btn');
    const newMoviesRow = document.getElementById('new-movies');
    const newSeriesRow = document.getElementById('new-series');
    const newAnimationsRow = document.getElementById('new-animations');
    const trendingMoviesRow = document.getElementById('trending-movies');
    const legendaryMoviesRow = document.getElementById('legendary-movies');
    const trendingSeriesRow = document.getElementById('trending-series');
    const legendarySeriesRow = document.getElementById('legendary-series');
    // Обработчики кнопок hero (глобальные)
    if (heroWatchBtn) {
        heroWatchBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const id = heroWatchBtn.dataset.id;
            const type = heroWatchBtn.dataset.type;
            if (id && type) {
                saveWatchSource();
                const tvUrl = `watch/watch.html?TV_ID=${id}&autoplay=1`;
                const movieUrl = `watch/watch.html?M_ID=${id}&autoplay=1`;
                const url = type === 'tv' ? tvUrl : movieUrl;
                window.location.href = url;
            }
        });
    }

    if (heroInfoBtn) {
        heroInfoBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const id = heroInfoBtn.dataset.id;
            const type = heroInfoBtn.dataset.type;
            if (id && type) {
                saveWatchSource();
                const tvUrl = `watch/watch.html?TV_ID=${id}`;
                const movieUrl = `watch/watch.html?M_ID=${id}`;
                const url = type === 'tv' ? tvUrl : movieUrl;
                window.location.href = url;
            }
        });
    }

    if (heroFavBtn) {
        heroFavBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            const id = heroFavBtn.dataset.id;
            const type = heroFavBtn.dataset.type;
            if (!id || !type) return;
            if (!localStorage.getItem('tmdb_session_id')) {
                window.location.href = 'account.html';
                return;
            }
            if (typeof toggleFavorite === 'function') {
                const isAdded = await toggleFavorite(id, type);
                const icon = heroFavBtn.querySelector('i');
                if (isAdded) {
                    heroFavBtn.classList.add('active');
                    if (icon) icon.className = 'fa-solid fa-heart';
                } else {
                    heroFavBtn.classList.remove('active');
                    if (icon) icon.className = 'fa-regular fa-heart';
                }
            }
        });
    }

    // Элементы поиска
    const searchMoviesRow = document.getElementById('search-movies');
    const searchSeriesRow = document.getElementById('search-series');
    const searchActorsRow = document.getElementById('search-actors');

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
        }

        .hero::after {
            z-index: 1;
        }

        .hero-trailer {
            position: absolute;
            inset: 0;
            z-index: 0;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.5s ease;
            overflow: hidden;
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
        
        .hero-content,
        .hero-content.active {
            position: relative;
            z-index: 3;
            opacity: 1;
        }
        
        .hero-logo {
            transition: transform 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            transform: translateY(0);
        }
        
        .hero-logo.move-down {
            transform: translateY(70px);
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
                bottom: 20px !important;
                right: 20px !important;
                top: auto !important;
            }
        }
        
        @media (max-width: 768px) {
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

        // Устанавливаем фон напрямую на .hero
        hero.style.backgroundImage = `url(${IMG_URL}${selectedContent.backdrop_path})`;
        hero.style.backgroundSize = 'cover';
        hero.style.backgroundPosition = 'center';

        const trailerContainer = document.createElement('div');
        trailerContainer.className = 'hero-trailer';
        hero.insertBefore(trailerContainer, hero.firstChild);

        const controlsContainer = document.createElement('div');
        controlsContainer.className = 'trailer-controls';
        controlsContainer.style.position = 'absolute';
        controlsContainer.style.bottom = '20px';
        controlsContainer.style.right = '20px';
        controlsContainer.style.zIndex = '10';
        controlsContainer.style.display = 'none';
        controlsContainer.style.gap = '10px';
        controlsContainer.style.pointerEvents = 'all';

        controlsContainer.innerHTML = `
        <button id="trailer-sound-btn" style="
            background: rgba(32, 32, 32, 0.45);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 50%;
            width: 44px;
            height: 44px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0;
            margin: 0;
            flex-shrink: 0;
            color: #fff;
            font-size: 20px;
        ">
            <i class="fa-solid fa-volume-xmark" aria-hidden="true"></i>
        </button>
    `;

        controlsContainer.style.display = 'none';
        controlsContainer.style.flexDirection = 'row';
        controlsContainer.style.alignItems = 'center';
        controlsContainer.style.justifyContent = 'center';

        hero.appendChild(controlsContainer);

        const soundBtn = document.getElementById('trailer-sound-btn');
        let isSoundMuted = true;
        const soundIcon = soundBtn.querySelector('i');

        soundBtn.addEventListener('click', () => {
            if (!player) return;
            try {
                if (isSoundMuted) {
                    player.unMute();
                    player.setVolume(100);
                    soundIcon.classList.remove('fa-volume-xmark');
                    soundIcon.classList.add('fa-volume-high');
                } else {
                    player.mute();
                    soundIcon.classList.remove('fa-volume-high');
                    soundIcon.classList.add('fa-volume-xmark');
                }
                isSoundMuted = !isSoundMuted;
            } catch (error) { }
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
                        try { testPlayer?.destroy(); } catch (e) { }
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
                                    } catch (err) { }
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
            console.log('[HERO TRAILER] Начало поиска трейлера. Всего трейлеров:', allTrailers.length);

            if (allTrailers.length === 0) {
                console.log('[HERO TRAILER] Трейлеры не найдены');
                return;
            }

            // Берем первый трейлер (они уже отсортированы по приоритету языка)
            const trailer = allTrailers[0];
            console.log('[HERO TRAILER] Выбран трейлер:', trailer.name, 'язык:', trailer.iso_639_1, 'key:', trailer.key);

            // Ждем 10 секунд перед запуском
            console.log('[HERO TRAILER] Ожидание 10 секунд перед запуском...');
            await new Promise(resolve => setTimeout(resolve, 10000));

            if (!trailerSuccessfullyPlayed) {
                console.log('[HERO TRAILER] Запуск трейлера:', trailer.name);
                playTrailer(trailer);
            }
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
            } catch (error) { }
        }

        function onPlayerReady(event) {
            try {
                event.target.playVideo();
                event.target.mute();
            } catch (e) { }

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
                    } catch (e) { }
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
                    try { player.destroy(); } catch (error) { }
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
                        try { player.pauseVideo(); } catch (e) { }
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
        if (heroFavBtn) {
            heroFavBtn.dataset.id = selectedContent.id;
            heroFavBtn.dataset.type = selectedContent.type;
            // Отобразить текущее состояние через isFavorite (учитывает TMDB-кэш)
            const isFav = typeof window.isFavorite === 'function'
                ? window.isFavorite(selectedContent.id, selectedContent.type)
                : false;
            const icon = heroFavBtn.querySelector('i');
            if (isFav) {
                heroFavBtn.classList.add('active');
                if (icon) icon.className = 'fa-solid fa-heart';
            } else {
                heroFavBtn.classList.remove('active');
                if (icon) icon.className = 'fa-regular fa-heart';
            }
        }

        const heroContent = document.querySelector('.hero-content');
        if (heroContent) heroContent.classList.add('active');

        console.log('[HERO TRAILER] Ожидание загрузки YouTube API...');
        const waitForYT = setInterval(async () => {
            if (window.YT && window.YT.Player) {
                clearInterval(waitForYT);
                console.log('[HERO TRAILER] YouTube API загружен. Получение трейлеров...');
                allTrailers = await getAllTrailers(selectedContent.id, selectedContent.type);
                console.log('[HERO TRAILER] Получено трейлеров:', allTrailers.length);
                if (allTrailers.length > 0) {
                    findAndPlayTrailer();
                } else {
                    console.log('[HERO TRAILER] Трейлеры не найдены');
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

    const TMDB_V4_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIwNjkzNjE0NWZlOGUyMGJlMjhiMDJlMjZiNTVkM2NlNiIsIm5iZiI6MTcyMjQyMTMxNi45MjYsInN1YiI6IjY2YWExMDQ0ZjkyZDAxNDI2NDU5ZGRiNSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.kHML2iaqHKzCchxcY2HzqHbFgC5MCpUXYyugfOLmybs';

    // Извлекаем account_object_id из JWT (sub claim) — нужен для v4 API
    function getV4AccountId() {
        try {
            const payload = TMDB_V4_TOKEN.split('.')[1];
            const decoded = JSON.parse(atob(payload));
            return decoded.sub;
        } catch (e) {
            return null;
        }
    }

    // Персональные рекомендации фильмов (v4)
    async function fetchMovieRecommendations() {
        const v4AccountId = localStorage.getItem('tmdb_v4_account_id');
        const v4AccessToken = localStorage.getItem('tmdb_access_token');

        if (!v4AccountId || !v4AccessToken) return;

        try {
            const container = document.getElementById('rec-movies');
            const section = document.getElementById('rec-movies-section');
            if (!container || !section) return;

            const res = await fetch(`https://api.themoviedb.org/4/account/${v4AccountId}/movie/recommendations?page=1&language=ru-RU`, {
                headers: {
                    'Authorization': `Bearer ${v4AccessToken}`,
                    'Content-Type': 'application/json;charset=utf-8'
                }
            });

            if (!res.ok) throw new Error('Failed to fetch v4 movie recommendations');

            const data = await res.json();
            const items = (data.results || []).filter(m => m.poster_path);
            if (items.length === 0) return;

            const h2 = section.querySelector('h2');
            if (h2) h2.textContent = `Мои рекомендации — Фильмы`;
            displayMovies(items, container, 'movie');
            section.style.display = 'block';

        } catch (e) {
            console.error('Ошибка загрузки рекомендаций фильмов (v4):', e);
        }
    }

    // Персональные рекомендации сериалов (v4)
    async function fetchSeriesRecommendations() {
        const v4AccountId = localStorage.getItem('tmdb_v4_account_id');
        const v4AccessToken = localStorage.getItem('tmdb_access_token');

        if (!v4AccountId || !v4AccessToken) return;

        try {
            const container = document.getElementById('rec-series');
            const section = document.getElementById('rec-series-section');
            if (!container || !section) return;

            const res = await fetch(`https://api.themoviedb.org/4/account/${v4AccountId}/tv/recommendations?page=1&language=ru-RU`, {
                headers: {
                    'Authorization': `Bearer ${v4AccessToken}`,
                    'Content-Type': 'application/json;charset=utf-8'
                }
            });

            if (!res.ok) throw new Error('Failed to fetch v4 tv recommendations');

            const data = await res.json();
            const items = (data.results || []).filter(t => t.poster_path);
            if (items.length === 0) return;

            const h2 = section.querySelector('h2');
            if (h2) h2.textContent = `Мои рекомендации — Сериалы`;
            displayMovies(items, container, 'tv');
            section.style.display = 'block';

        } catch (e) {
            console.error('Ошибка загрузки рекомендаций сериалов (v4):', e);
        }
    }


    function displayActors(actors, container) {
        if (!container) return;
        container.innerHTML = '';
        actors.slice(0, 10).forEach(actor => {
            const actorCard = document.createElement('div');
            actorCard.classList.add('movie-card');
            const profileUrl = actor.profile_path ? `${IMG_URL}${actor.profile_path}` : NO_PICTURE_URL;

            actorCard.innerHTML = `
                <img src="${profileUrl}" alt="${actor.name}">
            `;

            actorCard.dataset.id = actor.id;
            actorCard.addEventListener('click', (e) => {
                e.preventDefault();
                window.location.href = `watch/actor.html?ID=${actor.id}`;
                if (searchModal) searchModal.style.display = 'none';
            });

            container.appendChild(actorCard);
        });
    }

    let tmdbFavoritesCache = [];
    let tmdbWatchlistCache = [];
    let posterMenuScrollLocked = false;
    let posterActionsContext = null;
    let posterActionsMetaReqToken = 0;

    function setPosterMenuScrollLock(locked) {
        posterMenuScrollLocked = !!locked;
        document.documentElement.classList.toggle('poster-menu-scroll-lock', posterMenuScrollLocked);
        document.body.classList.toggle('poster-menu-scroll-lock', posterMenuScrollLocked);
    }

    function closeAllPosterCardMenus() {
        const modal = document.getElementById('poster-actions-modal');
        if (modal) {
            modal.classList.remove('open');
        }
        posterActionsContext = null;

        document.querySelectorAll('.poster-card-menu.open').forEach(menu => {
            menu.classList.remove('open');
            menu.classList.remove('menu-floating');
            menu.style.left = '';
            menu.style.top = '';
        });
        document.querySelectorAll('.movie-card.menu-host-open, .top10-card.menu-host-open').forEach(card => {
            card.classList.remove('menu-host-open');
        });
        setPosterMenuScrollLock(false);
    }

    function ensurePosterActionsModal() {
        let modal = document.getElementById('poster-actions-modal');
        if (modal) return modal;

        modal = document.createElement('div');
        modal.id = 'poster-actions-modal';
        modal.className = 'poster-actions-modal';
        modal.innerHTML = `
            <div class="poster-actions-backdrop" data-close="1"></div>
            <div class="poster-actions-sheet" role="dialog" aria-modal="true" aria-label="Действия с карточкой">
                <div class="poster-actions-handle" data-drag-handle="1" aria-hidden="true"></div>
                <div class="poster-actions-meta">
                    <img class="poster-actions-meta-image" src="" alt="Постер">
                    <div class="poster-actions-meta-text">
                        <div class="poster-actions-meta-title">Загрузка...</div>
                        <div class="poster-actions-meta-sub">—</div>
                    </div>
                </div>
                <button class="poster-actions-btn" data-action="favorite">
                    <i class="fa-regular fa-heart"></i>
                    <span>Добавить в избранное</span>
                </button>
                <button class="poster-actions-btn" data-action="watchlist">
                    <i class="fa-regular fa-bookmark"></i>
                    <span>Добавить в список</span>
                </button>
                <button class="poster-actions-btn" data-action="details">
                    <i class="fa-solid fa-circle-info"></i>
                    <span>Подробнее</span>
                </button>
                <button class="poster-actions-btn" data-action="watch">
                    <i class="fa-solid fa-play"></i>
                    <span>Смотреть</span>
                </button>
            </div>
        `;

        modal.addEventListener('click', (e) => {
            const closeTarget = e.target.closest('[data-close="1"]');
            if (closeTarget) {
                closeAllPosterCardMenus();
                return;
            }

            const actionBtn = e.target.closest('.poster-actions-btn');
            if (!actionBtn || !posterActionsContext) return;

            const action = actionBtn.dataset.action;
            handlePosterModalAction(action);
        });

        const sheet = modal.querySelector('.poster-actions-sheet');
        const handle = modal.querySelector('[data-drag-handle="1"]');
        if (sheet) {
            let dragStartY = null;
            let dragDeltaY = 0;
            let dragging = false;
            let activePointerId = null;

            const onDragMove = (clientY) => {
                if (!dragging || dragStartY === null) return;
                const currentY = (typeof clientY === 'number') ? clientY : dragStartY;
                dragDeltaY = Math.max(0, currentY - dragStartY);
                sheet.style.transform = `translateY(${Math.round(dragDeltaY)}px)`;
            };

            const onDragEnd = () => {
                if (!dragging) return;
                dragging = false;
                const shouldClose = dragDeltaY > 80;
                sheet.style.transform = '';
                dragStartY = null;
                dragDeltaY = 0;

                if (shouldClose) {
                    closeAllPosterCardMenus();
                }

                window.removeEventListener('pointermove', onPointerMove);
                window.removeEventListener('pointerup', onPointerEnd);
                window.removeEventListener('pointercancel', onPointerEnd);
                window.removeEventListener('mousemove', onMouseMove);
                window.removeEventListener('mouseup', onMouseEnd);
                window.removeEventListener('touchmove', onTouchMove);
                window.removeEventListener('touchend', onTouchEnd);
                window.removeEventListener('touchcancel', onTouchEnd);
            };

            const onPointerMove = (e) => onDragMove(e.clientY);
            const onPointerEnd = () => onDragEnd();

            const onMouseMove = (e) => onDragMove(e.clientY);
            const onMouseEnd = () => onDragEnd();

            const onTouchMove = (e) => {
                if (!dragging || !e.touches || e.touches.length === 0) return;
                onDragMove(e.touches[0].clientY);
                e.preventDefault();
            };
            const onTouchEnd = () => onDragEnd();

            const startDrag = (clientY, pointerId = null) => {
                if (window.innerWidth > 768) return;
                dragging = true;
                dragStartY = clientY;
                dragDeltaY = 0;
                activePointerId = pointerId;
            };

            const shouldIgnoreDragTarget = (target) => {
                if (!target) return false;
                return !!target.closest('.poster-actions-btn');
            };

            const onSheetPointerDown = (e) => {
                if (shouldIgnoreDragTarget(e.target)) return;
                startDrag(e.clientY, e.pointerId);
                try { sheet.setPointerCapture(e.pointerId); } catch (err) { }
                window.addEventListener('pointermove', onPointerMove, { passive: true });
                window.addEventListener('pointerup', onPointerEnd, { passive: true });
                window.addEventListener('pointercancel', onPointerEnd, { passive: true });
            };

            const onSheetMouseDown = (e) => {
                if (shouldIgnoreDragTarget(e.target)) return;
                startDrag(e.clientY);
                window.addEventListener('mousemove', onMouseMove);
                window.addEventListener('mouseup', onMouseEnd);
            };

            const onSheetTouchStart = (e) => {
                if (!e.touches || e.touches.length === 0) return;
                if (shouldIgnoreDragTarget(e.target)) return;
                startDrag(e.touches[0].clientY);
                window.addEventListener('touchmove', onTouchMove, { passive: false });
                window.addEventListener('touchend', onTouchEnd);
                window.addEventListener('touchcancel', onTouchEnd);
            };

            sheet.addEventListener('pointerdown', onSheetPointerDown);
            sheet.addEventListener('mousedown', onSheetMouseDown);
            sheet.addEventListener('touchstart', onSheetTouchStart, { passive: true });

            if (handle) {
                handle.addEventListener('pointerdown', onSheetPointerDown);
                handle.addEventListener('mousedown', onSheetMouseDown);
                handle.addEventListener('touchstart', onSheetTouchStart, { passive: true });
            }
        }

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeAllPosterCardMenus();
            }
        });

        document.body.appendChild(modal);
        return modal;
    }

    function refreshPosterActionsModal() {
        const modal = document.getElementById('poster-actions-modal');
        if (!modal || !posterActionsContext) return;

        const { id, type } = posterActionsContext;
        const isFav = isFavorite(id, type);
        const isWl = isWatchlist(id, type);

        const favoriteBtn = modal.querySelector('.poster-actions-btn[data-action="favorite"]');
        const watchlistBtn = modal.querySelector('.poster-actions-btn[data-action="watchlist"]');

        if (favoriteBtn) {
            favoriteBtn.innerHTML = isFav
                ? '<i class="fa-solid fa-heart"></i><span>Удалить из избранного</span>'
                : '<i class="fa-regular fa-heart"></i><span>Добавить в избранное</span>';
        }

        if (watchlistBtn) {
            watchlistBtn.innerHTML = isWl
                ? '<i class="fa-solid fa-bookmark"></i><span>Удалить из списка</span>'
                : '<i class="fa-regular fa-bookmark"></i><span>Добавить в список</span>';
        }
    }

    async function handlePosterModalAction(action) {
        if (!posterActionsContext) return;
        const { id, type, card, onUpdate } = posterActionsContext;

        if (action === 'details' || action === 'watch') {
            closeAllPosterCardMenus();
            try { saveWatchSource(); } catch (e) { }

            const tvUrl = `watch/watch.html?TV_ID=${id}`;
            const movieUrl = `watch/watch.html?M_ID=${id}`;
            const baseUrl = type === 'tv' ? tvUrl : movieUrl;
            const targetUrl = action === 'watch' ? `${baseUrl}&autoplay=1` : baseUrl;
            window.location.href = targetUrl;
            return;
        }

        if (action === 'favorite') {
            await toggleFavorite(id, type);
        } else if (action === 'watchlist') {
            await toggleWatchlist(id, type);
        } else {
            return;
        }

        const favoriteState = isFavorite(id, type);
        const watchlistState = isWatchlist(id, type);

        if (typeof onUpdate === 'function') {
            onUpdate(favoriteState, watchlistState);
        } else if (card) {
            updatePosterCardUI(card, favoriteState, watchlistState);
        }

        closeAllPosterCardMenus();
    }

    async function populatePosterActionsModalMeta() {
        const modal = document.getElementById('poster-actions-modal');
        if (!modal || !posterActionsContext) return;

        const token = ++posterActionsMetaReqToken;
        const { id, type, card } = posterActionsContext;

        const imageEl = modal.querySelector('.poster-actions-meta-image');
        const titleEl = modal.querySelector('.poster-actions-meta-title');
        const subEl = modal.querySelector('.poster-actions-meta-sub');
        if (!imageEl || !titleEl || !subEl) return;

        const cardImg = card?.querySelector('img');
        const fallbackTitle = cardImg?.getAttribute('alt') || 'Без названия';
        const fallbackPoster = cardImg?.getAttribute('src') || NO_PICTURE_URL;

        imageEl.src = fallbackPoster;
        titleEl.textContent = fallbackTitle;
        subEl.textContent = 'Загрузка...';

        try {
            const response = await fetch(`${BASE_URL}/${type}/${id}?api_key=${API_KEY}&language=ru-RU`);
            const data = await response.json();

            if (token !== posterActionsMetaReqToken) return;

            const title = data.title || data.name || fallbackTitle;
            const genres = Array.isArray(data.genres) ? data.genres.map(g => g.name).filter(Boolean) : [];
            const dateRaw = data.release_date || data.first_air_date || '';
            const year = dateRaw ? String(dateRaw).slice(0, 4) : '';
            const genresText = genres.length > 0 ? genres.slice(0, 2).join(', ') : 'Жанр не указан';
            const subText = year ? `${genresText} • ${year}` : genresText;

            titleEl.textContent = title;
            subEl.textContent = subText;

            if (data.poster_path) {
                imageEl.src = `${POSTER_URL}${data.poster_path}`;
            }
        } catch (e) {
            if (token !== posterActionsMetaReqToken) return;
            subEl.textContent = 'Жанр не указан';
        }
    }

    function openPosterActionsModal(context) {
        if (!context || !context.id || !context.type) return;
        closeAllPosterCardMenus();

        posterActionsContext = {
            id: String(context.id),
            type: context.type,
            card: context.card || null,
            onUpdate: typeof context.onUpdate === 'function' ? context.onUpdate : null
        };

        const modal = ensurePosterActionsModal();
        refreshPosterActionsModal();
        modal.classList.add('open');
        setPosterMenuScrollLock(true);
        populatePosterActionsModalMeta();
    }

    function positionPosterCardMenu(card, menu) {
        if (!card || !menu) return;

        const menuBtn = card.querySelector('.poster-card-menu-btn');
        if (!menuBtn) return;

        menu.classList.remove('menu-align-left', 'menu-align-right', 'menu-above', 'menu-below');
        menu.classList.add('menu-floating');

        const previousDisplay = menu.style.display;
        const wasOpen = menu.classList.contains('open');
        if (!wasOpen) {
            menu.style.display = 'flex';
        }

        menu.style.left = '-9999px';
        menu.style.top = '-9999px';

        const menuRect = menu.getBoundingClientRect();
        const btnRect = menuBtn.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const gap = 8;

        let left = btnRect.right - menuRect.width;
        if (left < gap) left = gap;
        if (left + menuRect.width > viewportWidth - gap) {
            left = viewportWidth - menuRect.width - gap;
        }

        let top = btnRect.top - menuRect.height - gap;
        if (top < gap) {
            top = btnRect.bottom + gap;
        }
        if (top + menuRect.height > viewportHeight - gap) {
            top = Math.max(gap, viewportHeight - menuRect.height - gap);
        }

        menu.style.left = `${Math.round(left)}px`;
        menu.style.top = `${Math.round(top)}px`;

        if (!wasOpen) {
            menu.style.display = previousDisplay;
        }
    }

    function updatePosterCardUI(card, favoriteState, watchlistState) {
        if (!card) return;

        const favoriteDot = card.querySelector('.status-favorite');
        const watchlistDot = card.querySelector('.status-watchlist');

        if (favoriteDot) {
            favoriteDot.classList.toggle('is-hidden', !favoriteState);
        }
        if (watchlistDot) {
            watchlistDot.classList.toggle('is-hidden', !watchlistState);
        }

        const favoriteAction = card.querySelector('.poster-card-menu-action[data-action="favorite"]');
        const watchlistAction = card.querySelector('.poster-card-menu-action[data-action="watchlist"]');

        if (favoriteAction) {
            favoriteAction.innerHTML = favoriteState
                ? '<i class="fa-solid fa-heart"></i><span>Удалить из избранного</span>'
                : '<i class="fa-regular fa-heart"></i><span>Добавить в избранное</span>';
        }

        if (watchlistAction) {
            watchlistAction.innerHTML = watchlistState
                ? '<i class="fa-solid fa-bookmark"></i><span>Удалить из списка</span>'
                : '<i class="fa-regular fa-bookmark"></i><span>Добавить в список</span>';
        }
    }

    function refreshAllPosterCardUI() {
        document.querySelectorAll('.movie-card[data-id][data-type], .top10-card[data-id][data-type]').forEach(card => {
            const id = card.dataset.id;
            const type = card.dataset.type;
            if (!id || !type) return;
            updatePosterCardUI(card, isFavorite(id, type), isWatchlist(id, type));
        });
    }

    async function loadTMDBFavoritesCache() {
        const sessionId = localStorage.getItem('tmdb_session_id');
        const accountId = localStorage.getItem('tmdb_account_id');
        if (!sessionId || !accountId) return;

        try {
            const moviesRes = await fetch(`${BASE_URL}/account/${accountId}/favorite/movies?api_key=${API_KEY}&session_id=${sessionId}`);
            const tvRes = await fetch(`${BASE_URL}/account/${accountId}/favorite/tv?api_key=${API_KEY}&session_id=${sessionId}`);

            const mData = await moviesRes.json();
            const tData = await tvRes.json();

            const mFavs = (mData.results || []).map(m => ({ id: m.id, type: 'movie' }));
            const tFavs = (tData.results || []).map(t => ({ id: t.id, type: 'tv' }));

            tmdbFavoritesCache = [...mFavs, ...tFavs];
            localStorage.setItem('tmdb_favorites_cache', JSON.stringify(tmdbFavoritesCache));
            refreshAllPosterCardUI();
        } catch (e) {
            console.error('Ошибка загрузки кэша избранного', e);
        }
    }

    async function loadTMDBWatchlistCache() {
        const sessionId = localStorage.getItem('tmdb_session_id');
        const accountId = localStorage.getItem('tmdb_account_id');
        if (!sessionId || !accountId) return;

        try {
            const moviesRes = await fetch(`${BASE_URL}/account/${accountId}/watchlist/movies?api_key=${API_KEY}&session_id=${sessionId}`);
            const tvRes = await fetch(`${BASE_URL}/account/${accountId}/watchlist/tv?api_key=${API_KEY}&session_id=${sessionId}`);

            const mData = await moviesRes.json();
            const tData = await tvRes.json();

            const mItems = (mData.results || []).map(m => ({ id: m.id, type: 'movie' }));
            const tItems = (tData.results || []).map(t => ({ id: t.id, type: 'tv' }));

            tmdbWatchlistCache = [...mItems, ...tItems];
            localStorage.setItem('tmdb_watchlist_cache', JSON.stringify(tmdbWatchlistCache));
            refreshAllPosterCardUI();
        } catch (e) {
            console.error('Ошибка загрузки кэша списка', e);
        }
    }

    if (localStorage.getItem('tmdb_session_id')) {
        try {
            const cachedFav = localStorage.getItem('tmdb_favorites_cache');
            if (cachedFav) tmdbFavoritesCache = JSON.parse(cachedFav);
        } catch (e) { }
        try {
            const cachedWatch = localStorage.getItem('tmdb_watchlist_cache');
            if (cachedWatch) tmdbWatchlistCache = JSON.parse(cachedWatch);
        } catch (e) { }

        loadTMDBFavoritesCache();
        loadTMDBWatchlistCache();
    }

    function isFavorite(id, type) {
        if (localStorage.getItem('tmdb_session_id')) {
            return tmdbFavoritesCache.some(item => item.id == id && item.type === type);
        }
        return false;
    }

    function isWatchlist(id, type) {
        if (localStorage.getItem('tmdb_session_id')) {
            return tmdbWatchlistCache.some(item => item.id == id && item.type === type);
        }
        return false;
    }

    async function toggleFavorite(id, type) {
        const sessionId = localStorage.getItem('tmdb_session_id');
        const accountId = localStorage.getItem('tmdb_account_id');

        if (!sessionId || !accountId) {
            window.location.href = 'account.html';
            return false;
        }

        const isFavNow = isFavorite(id, type);
        const newState = !isFavNow;

        if (newState) {
            tmdbFavoritesCache.push({ id: parseInt(id), type });
        } else {
            const idx = tmdbFavoritesCache.findIndex(item => item.id == id && item.type === type);
            if (idx > -1) tmdbFavoritesCache.splice(idx, 1);
        }
        localStorage.setItem('tmdb_favorites_cache', JSON.stringify(tmdbFavoritesCache));

        try {
            const res = await fetch(`${BASE_URL}/account/${accountId}/favorite?api_key=${API_KEY}&session_id=${sessionId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json;charset=utf-8'
                },
                body: JSON.stringify({
                    media_type: type,
                    media_id: parseInt(id),
                    favorite: newState
                })
            });
            const data = await res.json();
            if (!data.success && data.status_code !== 1 && data.status_code !== 12 && data.status_code !== 13) {
                if (!newState) {
                    tmdbFavoritesCache.push({ id: parseInt(id), type });
                } else {
                    const idx = tmdbFavoritesCache.findIndex(item => item.id == id && item.type === type);
                    if (idx > -1) tmdbFavoritesCache.splice(idx, 1);
                }
                localStorage.setItem('tmdb_favorites_cache', JSON.stringify(tmdbFavoritesCache));
                return isFavNow;
            }
        } catch (e) {
            console.error('Network error toggleFavorite', e);
        }

        return newState;
    }

    async function toggleWatchlist(id, type) {
        const sessionId = localStorage.getItem('tmdb_session_id');
        const accountId = localStorage.getItem('tmdb_account_id');

        if (!sessionId || !accountId) {
            window.location.href = 'account.html';
            return false;
        }

        const isInWatchlistNow = isWatchlist(id, type);
        const newState = !isInWatchlistNow;

        if (newState) {
            tmdbWatchlistCache.push({ id: parseInt(id), type });
        } else {
            const idx = tmdbWatchlistCache.findIndex(item => item.id == id && item.type === type);
            if (idx > -1) tmdbWatchlistCache.splice(idx, 1);
        }
        localStorage.setItem('tmdb_watchlist_cache', JSON.stringify(tmdbWatchlistCache));

        try {
            const res = await fetch(`${BASE_URL}/account/${accountId}/watchlist?api_key=${API_KEY}&session_id=${sessionId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json;charset=utf-8'
                },
                body: JSON.stringify({
                    media_type: type,
                    media_id: parseInt(id),
                    watchlist: newState
                })
            });
            const data = await res.json();
            if (!data.success && data.status_code !== 1 && data.status_code !== 12 && data.status_code !== 13) {
                if (!newState) {
                    tmdbWatchlistCache.push({ id: parseInt(id), type });
                } else {
                    const idx = tmdbWatchlistCache.findIndex(item => item.id == id && item.type === type);
                    if (idx > -1) tmdbWatchlistCache.splice(idx, 1);
                }
                localStorage.setItem('tmdb_watchlist_cache', JSON.stringify(tmdbWatchlistCache));
                return isInWatchlistNow;
            }
        } catch (e) {
            console.error('Network error toggleWatchlist', e);
        }

        return newState;
    }

    window.toggleFavorite = toggleFavorite;
    window.isFavorite = isFavorite;
    window.toggleWatchlist = toggleWatchlist;
    window.isWatchlist = isWatchlist;
    window.refreshAllPosterCardUI = refreshAllPosterCardUI;
    window.positionPosterCardMenu = positionPosterCardMenu;
    window.closeAllPosterCardMenus = closeAllPosterCardMenus;
    window.setPosterMenuScrollLock = setPosterMenuScrollLock;
    window.openPosterActionsModal = openPosterActionsModal;

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.poster-card-menu') && !e.target.closest('.poster-card-menu-btn')) {
            closeAllPosterCardMenus();
        }
    });

    function displayMovies(movies, container, type) {
        if (!container) return;
        container.innerHTML = '';
        movies.slice(0, 10).forEach(movie => {
            const movieCard = document.createElement('div');
            movieCard.classList.add('movie-card');
            const posterUrl = movie.poster_path ? `${POSTER_URL}${movie.poster_path}` : NO_PICTURE_URL;
            const rating = movie.vote_average ? parseFloat(movie.vote_average.toFixed(1)) : null;
            const isInFavorites = isFavorite(movie.id, type);
            const isInWatchlist = isWatchlist(movie.id, type);

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
                ${rating ? `<div class="${ratingClass}">${rating}</div>` : ''}
                <div class="card-status-stack">
                    <span class="status-dot status-favorite ${isInFavorites ? '' : 'is-hidden'}"><i class="fa-solid fa-heart"></i></span>
                    <span class="status-dot status-watchlist ${isInWatchlist ? '' : 'is-hidden'}"><i class="fa-solid fa-bookmark"></i></span>
                </div>
                <button class="poster-card-menu-btn" aria-label="Меню">
                    <i class="fa-solid fa-ellipsis"></i>
                </button>
                <div class="poster-card-menu">
                    <button class="poster-card-menu-action" data-action="favorite">
                        <i class="fa-${isInFavorites ? 'solid' : 'regular'} fa-heart"></i>
                        <span>${isInFavorites ? 'Удалить из избранного' : 'Добавить в избранное'}</span>
                    </button>
                    <button class="poster-card-menu-action" data-action="watchlist">
                        <i class="fa-${isInWatchlist ? 'solid' : 'regular'} fa-bookmark"></i>
                        <span>${isInWatchlist ? 'Удалить из списка' : 'Добавить в список'}</span>
                    </button>
                </div>
            `;

            movieCard.dataset.id = movie.id;
            movieCard.dataset.type = type;

            const menuBtn = movieCard.querySelector('.poster-card-menu-btn');

            menuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                openPosterActionsModal({
                    id: movie.id,
                    type,
                    card: movieCard
                });
            });

            movieCard.addEventListener('click', (e) => {
                if (e.target.closest('.poster-card-menu, .poster-card-menu-btn, .poster-card-menu-action')) {
                    return;
                }
                e.preventDefault();
                // НЕ блокируем скролл перед переходом на watch страницу
                openModal(movie.id, type);
                if (searchModal) searchModal.style.display = 'none';
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

    // Функция поиска
    async function performSearch(query) {
        // save to recent searches
        try { saveRecentSearch(query); } catch (e) { }

        // Show search loader
        const searchLoader = document.getElementById('search-loader');
        if (searchLoader) {
            searchLoader.style.display = 'flex';
        }

        try {
            const movieResponse = await fetch(
                `${BASE_URL}/search/movie?api_key=${API_KEY}&language=ru-RU&query=${encodeURIComponent(query)}`
            );
            const movieData = await movieResponse.json();

            const seriesResponse = await fetch(
                `${BASE_URL}/search/tv?api_key=${API_KEY}&language=ru-RU&query=${encodeURIComponent(query)}`
            );
            const seriesData = await seriesResponse.json();

            const actorsResponse = await fetch(
                `${BASE_URL}/search/person?api_key=${API_KEY}&language=ru-RU&query=${encodeURIComponent(query)}`
            );
            const actorsData = await actorsResponse.json();

            // Hide search loader
            if (searchLoader) {
                searchLoader.style.display = 'none';
            }

            // Restore the category structure before displaying results
            const resultsContainer = document.querySelector('.mobile-search-results');
            if (resultsContainer) {
                resultsContainer.innerHTML = `
                    <div class="search-category">
                        <h2>Фильмы</h2>
                        <div id="search-movies" class="movie-row"></div>
                    </div>
                    <div class="search-category">
                        <h2>Сериалы</h2>
                        <div id="search-series" class="movie-row"></div>
                    </div>
                    <div class="search-category">
                        <h2>Актеры</h2>
                        <div id="search-actors" class="movie-row"></div>
                    </div>
                `;
            }

            // Reselect the elements after DOM reconstruction
            const updatedSearchMoviesRow = document.getElementById('search-movies');
            const updatedSearchSeriesRow = document.getElementById('search-series');
            const updatedSearchActorsRow = document.getElementById('search-actors');

            displayMovies(movieData.results || [], updatedSearchMoviesRow, 'movie');
            displayMovies(seriesData.results || [], updatedSearchSeriesRow, 'tv');
            displayActors(actorsData.results || [], updatedSearchActorsRow);
            // Показываем модал с результатами
            if (searchModal) {
                searchModal.style.display = 'block';
                lockScroll();
            }

            // Desktop: animate form up and show results; mobile: default behavior
            try {
                const modalContent = document.querySelector('.mobile-search-content');
                const empty = document.getElementById('search-empty');
                const resultsContainer = document.querySelector('.mobile-search-results');

                if (window.innerWidth >= 769 && modalContent) {
                    // hide empty, show results container and add class to trigger CSS animation
                    if (empty) empty.style.display = 'none';
                    if (resultsContainer) resultsContainer.style.display = 'block';
                    modalContent.classList.add('results-open');

                    // Reorder categories: categories with results first; set 'Ничего не найдено' for empties
                    const categories = Array.from(resultsContainer.querySelectorAll('.search-category'));
                    let anyResults = false;
                    const withResults = [];
                    const withoutResults = [];

                    categories.forEach(cat => {
                        const row = cat.querySelector('.movie-row');
                        const hasItems = row && row.children && row.children.length > 0 && !(row.children.length === 1 && row.children[0].tagName === 'P' && row.children[0].textContent.trim() === '');
                        if (hasItems) {
                            withResults.push(cat);
                            anyResults = true;
                        } else {
                            // show 'Ничего не найдено' in this category
                            if (row) row.innerHTML = '<p>Ничего не найдено</p>';
                            withoutResults.push(cat);
                        }
                    });

                    if (!anyResults) {
                        // none found in all categories
                        resultsContainer.innerHTML = '<p class="no-results-all">Результаты не найдены</p>';
                    } else {
                        // append categories with results first, then empty ones
                        withResults.concat(withoutResults).forEach(c => resultsContainer.appendChild(c));
                    }
                } else {
                    // mobile: if all empty — show single message in movies row (existing behavior)
                    if ((!movieData.results || movieData.results.length === 0) &&
                        (!seriesData.results || seriesData.results.length === 0) &&
                        (!actorsData.results || actorsData.results.length === 0)) {
                        searchMoviesRow.innerHTML = '<p>Результаты не найдены</p>';
                        searchSeriesRow.innerHTML = '';
                        searchActorsRow.innerHTML = '';
                    }
                }
            } catch (err) {
                console.error('Search UI update error', err);
            }
        } catch (error) {
            console.error('Ошибка поиска:', error);
            // Hide search loader on error
            const searchLoader = document.getElementById('search-loader');
            if (searchLoader) {
                searchLoader.style.display = 'none';
            }
            searchMoviesRow.innerHTML = '<p>Ошибка при выполнении поиска</p>';
            searchSeriesRow.innerHTML = '';
            searchActorsRow.innerHTML = '';
        }
    }

    // Открыть модальное окно с деталями фильма
    async function openModal(id, type) {
        // Перенаправляем на watch/watch.html с параметрами вместо открытия встроенного модаладала
        saveWatchSource();
        const tvUrl = `watch/watch.html?TV_ID=${id}`;
        const movieUrl = `watch/watch.html?M_ID=${id}`;

        const url = type === 'tv' ? tvUrl : movieUrl;
        console.log('openModal called with URL:', url);
        window.location.href = url;
    }

    // Инициализация контента
    if (hero) fetchHeroContent();
    if (newMoviesRow) fetchNewMovies();
    if (newSeriesRow) fetchNewSeries();
    if (newAnimationsRow) fetchNewAnimations();
    if (trendingMoviesRow) fetchTrendingMovies();
    if (legendaryMoviesRow) fetchLegendaryMovies();
    if (trendingSeriesRow) fetchTrendingSeries();
    if (legendarySeriesRow) fetchLegendarySeries();

    // Персональные рекомендации (только для авторизованных, секции скрыты по умолчанию)
    fetchMovieRecommendations();
    fetchSeriesRecommendations();

    // Добавляем tooltips для кнопок управления плеером
    // Они будут добавлены динамически когда плеер инициализируется в player.js

    // Инициализируем tooltips для поиска
    setTimeout(() => {
        // tooltip'ы удалены
    }, 100);

    /* ---- Filter and Infinite Scroll Logic for Movies and Series ---- */
    (function () {
        const currentPageUrl = window.location.pathname.split('/').pop() || 'index.html';
        const isMoviesPage = currentPageUrl === 'movies.html';
        const isSeriesPage = currentPageUrl === 'series.html';

        if (!isMoviesPage && !isSeriesPage) return;

        let currentType = isMoviesPage ? 'movie' : 'tv';
        let currentPage = 1;
        let isLoading = false;
        let hasMore = true;

        const genreFilter = document.getElementById('genre-filter');
        const yearFilter = document.getElementById('year-filter');
        const sortFilter = document.getElementById('sort-filter');
        const gridContainer = document.getElementById(isMoviesPage ? 'movies-grid' : 'series-grid');
        const infiniteLoading = document.getElementById('infinite-loading');

        if (!gridContainer) return;

        async function loadGenres() {
            try {
                const response = await fetch(`${BASE_URL}/genre/${currentType}/list?api_key=${API_KEY}&language=ru-RU`);
                const data = await response.json();
                if (data.genres) {
                    data.genres.forEach(genre => {
                        const option = document.createElement('option');
                        option.value = genre.id;
                        option.textContent = genre.name;
                        genreFilter.appendChild(option);
                    });
                }
            } catch (error) {
                console.error('Error loading genres:', error);
            }
        }

        function populateYears() {
            const currentYear = new Date().getFullYear();
            for (let year = currentYear; year >= 1950; year--) {
                const option = document.createElement('option');
                option.value = year;
                option.textContent = year;
                yearFilter.appendChild(option);
            }
        }

        function appendItems(items) {
            items.forEach(item => {
                const card = document.createElement('div');
                card.classList.add('movie-card');

                const posterUrl = item.poster_path ? `${POSTER_URL}${item.poster_path}` : NO_PICTURE_URL;
                const rating = item.vote_average ? parseFloat(item.vote_average.toFixed(1)) : null;
                const isInFavorites = isFavorite(item.id, currentType);
                const isInWatchlist = isWatchlist(item.id, currentType);
                const title = item.title || item.name;

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

                card.innerHTML = `
                    <img src="${posterUrl}" alt="${title}">
                    ${rating ? `<div class="${ratingClass}">${rating}</div>` : ''}
                    <div class="card-status-stack">
                        <span class="status-dot status-favorite ${isInFavorites ? '' : 'is-hidden'}"><i class="fa-solid fa-heart"></i></span>
                        <span class="status-dot status-watchlist ${isInWatchlist ? '' : 'is-hidden'}"><i class="fa-solid fa-bookmark"></i></span>
                    </div>
                    <button class="poster-card-menu-btn" aria-label="Меню">
                        <i class="fa-solid fa-ellipsis"></i>
                    </button>
                    <div class="poster-card-menu">
                        <button class="poster-card-menu-action" data-action="favorite">
                            <i class="fa-${isInFavorites ? 'solid' : 'regular'} fa-heart"></i>
                            <span>${isInFavorites ? 'Удалить из избранного' : 'Добавить в избранное'}</span>
                        </button>
                        <button class="poster-card-menu-action" data-action="watchlist">
                            <i class="fa-${isInWatchlist ? 'solid' : 'regular'} fa-bookmark"></i>
                            <span>${isInWatchlist ? 'Удалить из списка' : 'Добавить в список'}</span>
                        </button>
                    </div>
                `;

                card.dataset.id = item.id;
                card.dataset.type = currentType;

                const menuBtn = card.querySelector('.poster-card-menu-btn');

                menuBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    openPosterActionsModal({
                        id: item.id,
                        type: currentType,
                        card
                    });
                });

                card.addEventListener('click', (e) => {
                    if (e.target.closest('.poster-card-menu, .poster-card-menu-btn, .poster-card-menu-action')) return;
                    e.preventDefault();
                    saveWatchSource();
                    const tvUrl = `watch/watch.html?TV_ID=${item.id}`;
                    const movieUrl = `watch/watch.html?M_ID=${item.id}`;
                    window.location.href = currentType === 'tv' ? tvUrl : movieUrl;
                });

                gridContainer.appendChild(card);
            });
        }

        async function loadItems(reset = false) {
            if (isLoading || (!hasMore && !reset)) return;
            isLoading = true;

            if (reset) {
                currentPage = 1;
                gridContainer.innerHTML = '';
                hasMore = true;
            }

            if (infiniteLoading) infiniteLoading.style.display = 'flex';

            const genre = genreFilter.value;
            const year = yearFilter.value;
            const sort = sortFilter.value;

            let url = `${BASE_URL}/discover/${currentType}?api_key=${API_KEY}&language=ru-RU&page=${currentPage}&sort_by=${sort}`;

            if (genre) url += `&with_genres=${genre}`;

            if (year) {
                if (currentType === 'movie') {
                    url += `&primary_release_year=${year}`;
                } else {
                    url += `&first_air_date_year=${year}`;
                }
            }

            if (sort.includes('popularity')) {
                if (!genre && !year) {
                    if (currentType === 'movie') {
                        url += '&vote_count.gte=100';
                    } else {
                        url += '&vote_count.gte=50';
                    }
                }
            } else if (sort.includes('vote_average')) {
                if (currentType === 'movie') {
                    url += '&vote_count.gte=50';
                } else {
                    url += '&vote_count.gte=25';
                }
            }

            try {
                const response = await fetch(url);
                const data = await response.json();

                if (data.results && data.results.length > 0) {
                    appendItems(data.results);
                    currentPage++;
                    if (currentPage > data.total_pages) {
                        hasMore = false;
                    }
                } else {
                    hasMore = false;
                    if (reset) {
                        gridContainer.innerHTML = '<p style="color:white; text-align:center; width:100%; grid-column: 1 / -1;">Ничего не найдено</p>';
                    }
                }
            } catch (error) {
                console.error('Error fetching items:', error);
            } finally {
                isLoading = false;
                if (infiniteLoading) infiniteLoading.style.display = 'none';
            }
        }

        const handleFilterChange = () => {
            loadItems(true);
        };

        if (genreFilter) genreFilter.addEventListener('change', handleFilterChange);
        if (yearFilter) yearFilter.addEventListener('change', handleFilterChange);
        if (sortFilter) sortFilter.addEventListener('change', handleFilterChange);

        window.addEventListener('scroll', () => {
            if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500) {
                loadItems(false);
            }
        });

        loadGenres();
        populateYears();
        loadItems(true);
    })();
});