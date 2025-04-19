function initKinoboxPlayer(id, type, backdropUrl) {
    const playerContainer = document.getElementById('kinobox-player');
    playerContainer.innerHTML = `
        <div class="player-wrapper">
            <div class="kinobox_player"></div>
        </div>
    `;

    // Очистка предыдущих скриптов Kinobox
    const existingScripts = document.querySelectorAll('script[src="https://kinobox.tv/kinobox.min.js"]');
    existingScripts.forEach(script => script.remove());

    // Инициализация Kinobox
    const script = document.createElement('script');
    script.src = 'https://kinobox.tv/kinobox.min.js';
    script.onload = () => {
        kbox('.kinobox_player', {
            search: {
                tmdb: id
            },
            menu: {
                enable: true,
                default: 'menu_list',
                mobile: 'menu_button',
                format: '{N} :: {T} ({Q})',
                limit: 5,
                open: false
            },
            notFoundMessage: 'Видео не найдено.',
            players: {
                alloha: { enable: true, position: 1 },
                kodik: { enable: true, position: 2 },
                videocdn: { enable: true, position: 3 }
            },
            params: {
                all: {
                    poster: backdropUrl || 'https://via.placeholder.com/1280x720?text=Backdrop+Not+Available',
                    language: 'ru',
                    server: 'ru'
                }
            },
            events: {
                playerLoaded: function (status, sources) {
                    console.log('Kinobox Player Loaded:', status, sources);
                }
            }
        });
    };
    document.body.appendChild(script);
}