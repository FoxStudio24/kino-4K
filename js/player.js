// Обновленный плеер только с Vibix
class SimpleVibixPlayer {
    constructor() {
        this.playerContainer = null;
        this.iframe = null;
        this.API_KEY = '06936145fe8e20be28b02e26b55d3ce6';
        this.VIBIX_KEY = '15106|xbmqG1x0sj8JRxrLLo6pBlq6cokIEyi4e6q7chD69f47b185';
        this.TMDB_BASE_URL = 'https://api.themoviedb.org/3';
    }

    async getImdbId(tmdbId, type) {
        try {
            const url = `${this.TMDB_BASE_URL}/${type}/${tmdbId}?api_key=${this.API_KEY}&append_to_response=external_ids`;
            const response = await fetch(url);
            const data = await response.json();
            return data.external_ids?.imdb_id || null;
        } catch (error) {
            console.error('Ошибка получения IMDB ID:', error);
            return null;
        }
    }

    async getVibixUrl(imdbId) {
        try {
            const vibixRes = await fetch(`https://vibix.org/api/v1/publisher/videos/imdb/${imdbId}`, {
                headers: {
                    "Authorization": `Bearer ${this.VIBIX_KEY}`
                }
            });
            const vibixData = await vibixRes.json();
            
            if (!vibixData || !vibixData.iframe_url) {
                throw new Error('Видео не найдено на Vibix');
            }
            
            return vibixData.iframe_url;
        } catch (error) {
            console.error('Ошибка получения Vibix URL:', error);
            throw error;
        }
    }

    createPlayerContainer() {
        if (this.playerContainer) {
            this.playerContainer.remove();
        }

        // Блокируем прокрутку
        document.body.classList.add('no-scroll');

        this.playerContainer = document.createElement('div');
        this.playerContainer.id = 'vibix-player-modal';
        this.playerContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 999999;
            background: rgba(0, 0, 0, 0.9);
        `;
        
        this.playerContainer.innerHTML = `
            <div class="player-overlay" style="position: relative; width: 100%; height: 100%; z-index: 999999;">
                <div class="player-modal" style="position: relative; width: 100%; height: 100%; z-index: 999999;">
                    <div class="player-header" style="position: absolute; top: 20px; right: 20px; z-index: 1000000;">
                        <button class="close-btn" onclick="this.closest('#vibix-player-modal').remove(); document.body.classList.remove('no-scroll');" style="position: relative; z-index: 1000001;">×</button>
                    </div>
                    <div class="player-content" style="position: relative; width: 100%; height: 100%; z-index: 999999;">
                        <div id="player-loading-overlay" class="loading-overlay" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 1000000;">
                            <div class="loader">
                                <svg viewBox="0 0 80 80">
                                    <circle r="32" cy="40" cx="40" id="test"></circle>
                                </svg>
                            </div>
                            <div class="loader triangle">
                                <svg viewBox="0 0 86 80">
                                    <polygon points="43 8 79 72 7 72"></polygon>
                                </svg>
                            </div>
                            <div class="loader">
                                <svg viewBox="0 0 80 80">
                                    <rect height="64" width="64" y="8" x="8"></rect>
                                </svg>
                            </div>
                        </div>
                        <iframe id="vibix-iframe" frameborder="0" allowfullscreen style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none; z-index: 999998;"></iframe>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(this.playerContainer);
        this.iframe = document.getElementById('vibix-iframe');
        this.loadingOverlay = document.getElementById('player-loading-overlay');
    }

    hideLoading() {
        if (this.loadingOverlay) {
            this.loadingOverlay.style.display = 'none';
        }
        if (this.iframe) {
            this.iframe.style.display = 'block';
        }
    }

    async playContent(tmdbId, type, season = null, episode = null) {
        try {
            this.createPlayerContainer();

            // Получаем IMDB ID
            const imdbId = await this.getImdbId(tmdbId, type);
            if (!imdbId) {
                throw new Error('IMDB ID не найден');
            }

            // Получаем URL от Vibix
            const vibixUrl = await this.getVibixUrl(imdbId);
            
            // Загружаем видео
            this.iframe.src = vibixUrl;
            
            // Принудительно скрываем загрузку через 2 секунды
            setTimeout(() => {
                this.hideLoading();
            }, 2000);

            // Скрываем загрузку после загрузки iframe
            this.iframe.onload = () => {
                this.hideLoading();
            };

        } catch (error) {
            console.error('Ошибка воспроизведения:', error);
            if (this.loadingOverlay) {
                // Выбираем случайное видео от 1 до 5
                const randomIndex = Math.floor(Math.random() * 5) + 1;
                this.loadingOverlay.innerHTML = `
                    <div class="nf-err-center" style="display: flex; align-items: center; justify-content: center; height: 100%;">
                        <div class="nf-err-wrap" style="display: flex; align-items: center; justify-content: center; flex-direction: row;">
                            <div class="nf-err-text" style="flex: 1; text-align: left; padding-right: 32px;">
                                <div class="nf-err-title" style="font-size: 2em; font-weight: 900; color: white; margin-bottom: 12px;">
                                    Ошибка загрузки
                                </div>
                                <div class="nf-err-desc" style="font-size: 1em; font-weight: 500; color: #aaa; line-height: 1.5;">
                                    Видео не найдено.<br>Попробуйте выбрать другой фильм или сериал.
                                </div>
                            </div>
                            <video id="notfound-video" src="ico/404-video/${randomIndex}.mp4" autoplay loop muted playsinline style="flex: 0 0 320px; width: 320px; height: 180px; border-radius: 8px; object-fit: cover; background: #222; box-shadow: 0 2px 16px #0006; margin-left: 24px;"></video>
                        </div>
                    </div>
                `;
                // Добавим обработчик ошибки для видео
                const nfVideo = document.getElementById('notfound-video');
                if (nfVideo) {
                    nfVideo.onerror = function() {
                        nfVideo.style.display = 'none';
                    };
                }
            }
        }
    }

    // Методы для совместимости
    async playMovie(tmdbId) {
        return this.playContent(tmdbId, 'movie');
    }

    async playTVShow(tmdbId, season, episode) {
        return this.playContent(tmdbId, 'tv', season, episode);
    }

    async openMovie(tmdbId) {
        return this.playContent(tmdbId, 'movie');
    }

    async openTVShow(tmdbId, season, episode) {
        return this.playContent(tmdbId, 'tv', season, episode);
    }
}

// Создаем глобальный экземпляр плеера
window.vibixPlayer = new SimpleVibixPlayer();
window.vidFastPlayer = window.vibixPlayer;
