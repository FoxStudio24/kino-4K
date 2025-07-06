// Обновленный плеер с Vibix, Alloha.tv и Lumex
class MultiPlayer {
    constructor() {
        this.playerContainer = null;
        this.iframe = null;
        this.currentPlayer = 'alloha'; // 'vibix', 'alloha', или 'lumex'
        this.currentContent = null; // Сохраняем текущий контент для переключения
        this.isDropdownOpen = false;
        this.loadingOverlay = null;
        this.hasError = false; // Флаг для отслеживания ошибок
        
        // API ключи
        this.API_KEY = '06936145fe8e20be28b02e26b55d3ce6';
        this.VIBIX_KEY = '15106|xbmqG1x0sj8JRxrLLo6pBlq6cokIEyi4e6q7chD69f47b185';
        this.ALLOHA_TOKEN = '04941a9a3ca3ac16e2b4327347bbc1';
        this.LUMEX_API_TOKEN = 'c9368010a6ff29b02795712d3dd8fdab';
        this.TMDB_BASE_URL = 'https://api.themoviedb.org/3';
        this.LUMEX_API_URL = 'https://portal.lumex.host/api/short';
        
        // Список балансеров
        this.balancers = [
            { id: 'alloha', name: 'Alloha.tv' },
            { id: 'vibix', name: 'Vibix' },
            { id: 'lumex', name: 'Lumex' }
        ];
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
            
            // Добавляем тему "Монохром" (design=2)
            const url = new URL(vibixData.iframe_url);
            url.searchParams.set('design', '2');
            
            return url.toString();
        } catch (error) {
            console.error('Ошибка получения Vibix URL:', error);
            throw error;
        }
    }

    async tryAllohaWithImdb(imdbId) {
        try {
            const allohaApiUrl = `https://api.alloha.tv/?token=${this.ALLOHA_TOKEN}&imdb=${imdbId}`;
            const response = await fetch(allohaApiUrl);
            const data = await response.json();
            
            if (data.status === 'error') {
                console.log(`IMDB ID ${imdbId} не найден в Alloha:`, data.error_info);
                return null;
            }
            
            if (data.data && data.data.iframe) {
                return data.data.iframe;
            } else {
                return `https://alloha.tv/?token=${this.ALLOHA_TOKEN}&imdb=${imdbId}`;
            }
        } catch (error) {
            console.error('Ошибка при попытке воспроизведения с IMDB ID в Alloha:', error);
            return null;
        }
    }

    async tryAllohaWithTmdb(tmdbId) {
        try {
            const allohaApiUrl = `https://api.alloha.tv/?token=${this.ALLOHA_TOKEN}&tmdb=${tmdbId}`;
            const response = await fetch(allohaApiUrl);
            const data = await response.json();
            
            if (data.status === 'error') {
                console.log(`TMDB ID ${tmdbId} не найден в Alloha:`, data.error_info);
                return null;
            }
            
            if (data.data && data.data.iframe) {
                return data.data.iframe;
            } else {
                return `https://alloha.tv/?token=${this.ALLOHA_TOKEN}&tmdb=${tmdbId}`;
            }
        } catch (error) {
            console.error('Ошибка при попытке воспроизведения с TMDB ID в Alloha:', error);
            return null;
        }
    }

    async getAllohaUrl(tmdbId, imdbId) {
        // Сначала пробуем с IMDB ID
        if (imdbId) {
            const imdbUrl = await this.tryAllohaWithImdb(imdbId);
            if (imdbUrl) return imdbUrl;
        }

        // Если IMDB ID не сработал, пробуем с TMDB ID
        const tmdbUrl = await this.tryAllohaWithTmdb(tmdbId);
        if (tmdbUrl) return tmdbUrl;

        throw new Error('Видео не найдено на Alloha.tv');
    }

    async getLumexUrl(imdbId) {
        try {
            const lumexUrl = `${this.LUMEX_API_URL}?api_token=${this.LUMEX_API_TOKEN}&imdb_id=${imdbId}`;
            const lumexResponse = await fetch(lumexUrl);
            const lumexData = await lumexResponse.json();

            if (!lumexData.result || !lumexData.data || lumexData.data.length === 0) {
                throw new Error('Видео не найдено в базе Lumex');
            }

            const videoData = lumexData.data[0];
            const iframeSrc = videoData.iframe_src;
            
            if (!iframeSrc) {
                throw new Error('Не удалось получить ссылку на плеер Lumex');
            }

            return `https:${iframeSrc}`;
        } catch (error) {
            console.error('Ошибка получения Lumex URL:', error);
            throw error;
        }
    }

    toggleDropdown() {
        const dropdown = document.getElementById('balancer-dropdown');
        const dropdownArrow = document.querySelector('.dropdown-arrow');
        
        if (this.isDropdownOpen) {
            dropdown.style.display = 'none';
            dropdownArrow.style.transform = 'rotate(0deg)';
            this.isDropdownOpen = false;
        } else {
            dropdown.style.display = 'block';
            dropdownArrow.style.transform = 'rotate(180deg)';
            this.isDropdownOpen = true;
        }
    }

    selectBalancer(balancerId) {
        if (balancerId === this.currentPlayer) {
            this.toggleDropdown();
            return;
        }
        
        // Сбрасываем флаг ошибки при смене плеера
        this.hasError = false;
        
        // Переключаем плеер
        this.currentPlayer = balancerId;
        
        // Закрываем дропдаун
        this.toggleDropdown();
        
        // Обновляем кнопку и дропдаун
        this.updatePlayerInterface();
        
        // Показываем загрузку при смене плеера
        this.showLoading();
        
        // Перезагружаем контент с новым плеером
        this.loadCurrentContent().then(() => {
            // Настраиваем обработчики для iframe только если нет ошибки
            if (!this.hasError) {
                this.setupIframeHandlers();
            }
        });
    }

    updatePlayerInterface() {
        const currentBalancerBtn = document.getElementById('current-balancer-btn');
        const dropdown = document.getElementById('balancer-dropdown');
        
        if (currentBalancerBtn) {
            const currentBalancer = this.balancers.find(b => b.id === this.currentPlayer);
            // Обновляем содержимое кнопки с сохранением стрелки
            currentBalancerBtn.innerHTML = `
                ${currentBalancer ? currentBalancer.name : 'Balancer'}
                <svg class="dropdown-arrow" width="12" height="12" viewBox="0 0 12 12" fill="none" style="transition: transform 0.3s ease;">
                    <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            `;
        }
        
        // Обновляем дропдаун
        if (dropdown) {
            dropdown.innerHTML = this.balancers.map(balancer => `
                <button onclick="window.multiPlayer.selectBalancer('${balancer.id}')" style="
                    width: 100%;
                    background: ${balancer.id === this.currentPlayer ? 'rgba(255, 255, 255, 0.1)' : 'transparent'};
                    border: none;
                    border-radius: 12px;
                    padding: 8px 12px;
                    color: white;
                    font-size: 14px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    text-align: left;
                    margin-bottom: 4px;
                " onmouseover="this.style.background='rgba(255,255,255,0.15)'" onmouseout="this.style.background='${balancer.id === this.currentPlayer ? 'rgba(255, 255, 255, 0.1)' : 'transparent'}'">
                    ${balancer.name}
                </button>
            `).join('');
        }
    }

    async loadCurrentContent() {
        if (!this.currentContent) return;

        const { tmdbId, type, season, episode } = this.currentContent;
        
        try {
            // Очищаем предыдущий iframe
            if (this.iframe) {
                this.iframe.src = '';
            }
            
            if (this.currentPlayer === 'vibix') {
                await this.loadVibixContent(tmdbId, type, season, episode);
            } else if (this.currentPlayer === 'lumex') {
                await this.loadLumexContent(tmdbId, type, season, episode);
            } else {
                await this.loadAllohaContent(tmdbId, type, season, episode);
            }
            
        } catch (error) {
            console.error(`Ошибка загрузки ${this.currentPlayer}:`, error);
            this.hasError = true;
            this.showError(error.message);
        }
    }

    async loadVibixContent(tmdbId, type, season, episode) {
        const imdbId = await this.getImdbId(tmdbId, type);
        if (!imdbId) {
            throw new Error('IMDB ID не найден');
        }

        const vibixUrl = await this.getVibixUrl(imdbId);
        this.iframe.src = vibixUrl;
        
        // Настраиваем обработчики для iframe
        this.setupIframeHandlers();
    }

    async loadAllohaContent(tmdbId, type, season, episode) {
        const imdbId = await this.getImdbId(tmdbId, type);
        const allohaUrl = await this.getAllohaUrl(tmdbId, imdbId);
        this.iframe.src = allohaUrl;
        
        // Настраиваем обработчики для iframe
        this.setupIframeHandlers();
    }

    async loadLumexContent(tmdbId, type, season, episode) {
        const imdbId = await this.getImdbId(tmdbId, type);
        if (!imdbId) {
            throw new Error('IMDB ID не найден');
        }

        const lumexUrl = await this.getLumexUrl(imdbId);
        this.iframe.src = lumexUrl;
        
        // Настраиваем обработчики для iframe
        this.setupIframeHandlers();
    }

    createPlayerContainer() {
        if (this.playerContainer) {
            this.playerContainer.remove();
        }

        // Блокируем прокрутку
        document.body.classList.add('no-scroll');

        this.playerContainer = document.createElement('div');
        this.playerContainer.id = 'multi-player-modal';
        this.playerContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 999999;
            background-color: #141414;
            font-family: 'buttonbold', sans-serif;
        `;
        
        const currentBalancer = this.balancers.find(b => b.id === this.currentPlayer);
        
        this.playerContainer.innerHTML = `
            <div class="player-overlay" style="position: relative; width: 100%; height: 100%; z-index: 999999;">
            <div class="player-modal" style="position: relative; width: 100%; height: 100%; z-index: 999999;">
                <div class="player-header" style="position: absolute; top: 20px; right: 20px; z-index: 1000000;">
                <div class="player-controls" style="
                    display: flex;
                    align-items: center;
                    background: rgb(24 24 24 / 65%);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(68, 68, 68, 0.3);
                    border-radius: 99px;
                    padding: 3px;
                    gap: 12px;
                ">
                    <div class="balancer-selector" style="position: relative; border-radius: 99px;">
                    <button id="current-balancer-btn" onclick="window.multiPlayer.toggleDropdown()" style="
                        position: relative;
                        z-index: 1000001;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 8px;
                        background: transparent;
                        border: none;
                        border-radius: 99px;
                        padding: 8px 12px;
                        color: white;
                        font-size: 14px;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        min-width: 80px;
                        font-family: 'buttonbold', sans-serif;
                    " onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='transparent'">
                        ${currentBalancer ? currentBalancer.name : 'Balancer'}
                        <svg class="dropdown-arrow" width="12" height="12" viewBox="0 0 12 12" fill="none" style="transition: transform 0.3s ease;">
                        <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                    <div id="balancer-dropdown" style="
                        position: absolute;
                        top: 100%;
                        left: 0;
                        right: 0;
                        background: rgb(24 24 24 / 95%);
                        backdrop-filter: blur(20px);
                        border: 1px solid rgba(68, 68, 68, 0.3);
                        border-radius: 20px;
                        margin-top: 8px;
                        padding: 8px;
                        display: none;
                        z-index: 1000002;
                        min-width: 120px;
                        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                    ">
                        ${this.balancers.map(balancer => `
                        <button onclick="window.multiPlayer.selectBalancer('${balancer.id}')" style="
                            width: 100%;
                            background: ${balancer.id === this.currentPlayer ? 'rgba(255, 255, 255, 0.1)' : 'transparent'};
                            border: none;
                            border-radius: 12px;
                            padding: 8px 12px;
                            color: white;
                            font-size: 14px;
                            cursor: pointer;
                            transition: all 0.3s ease;
                            text-align: left;
                            margin-bottom: 4px;
                        " onmouseover="this.style.background='rgba(255,255,255,0.15)'" onmouseout="this.style.background='${balancer.id === this.currentPlayer ? 'rgba(255, 255, 255, 0.1)' : 'transparent'}'">
                            ${balancer.name}
                        </button>
                        `).join('')}
                    </div>
                    </div>
                    <div class="separator" style="width: 1px; height: 20px; background: rgba(68, 68, 68, 0.5);"></div>
                    <button class="close-btn" onclick="this.closest('#multi-player-modal').remove(); document.body.classList.remove('no-scroll');" style="
                    position: relative;
                    z-index: 1000001;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: transparent;
                    border: none;
                    border-radius: 50%;
                    width: 32px;
                    height: 32px;
                    padding: 0;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    top: 0px;
                    right: 0px;
                    " onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='transparent'">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: white;">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                    </button>
                </div>
                </div>
                <div class="player-content" style="position: relative; width: 100%; height: 100%; z-index: 999999;">
                <div id="player-loading-overlay" class="loading-overlay" style="
                    position: absolute; 
                    top: 0; 
                    left: 0; 
                    width: 100%; 
                    height: 100%; 
                    z-index: 1000000; 
                    display: flex; 
                    flex-direction: column;
                    align-items: center; 
                    justify-content: center; 
                    background: #141414;
                    backdrop-filter: blur(5px);
                ">
                    <div class="loading-animations" style="
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 20px;
                        margin-bottom: 20px;
                    ">
                        <div class="loader">
                            <svg viewBox="0 0 80 80" style="width: 40px; height: 40px;">
                                <circle r="32" cy="40" cx="40" id="test"></circle>
                            </svg>
                        </div>
                        <div class="loader triangle">
                            <svg viewBox="0 0 86 80" style="width: 40px; height: 40px;">
                                <polygon points="43 8 79 72 7 72"></polygon>
                            </svg>
                        </div>
                        <div class="loader">
                            <svg viewBox="0 0 80 80" style="width: 40px; height: 40px;">
                                <rect height="64" width="64" y="8" x="8"></rect>
                            </svg>
                        </div>
                    </div>
                    <div class="loading-text" style="
                        color: white; 
                        font-size: 16px; 
                        font-weight: 500; 
                        text-align: center;
                    ">
                        Загрузка видео...
                    </div>
                </div>
                <iframe id="multi-iframe" frameborder="0" allowfullscreen style="
                    position: absolute; 
                    top: 0; 
                    left: 0; 
                    width: 100%; 
                    height: 100%; 
                    border: none; 
                    z-index: 999998; 
                    display: none;
                "></iframe>
                </div>
            </div>
            </div>
        `;

       
        document.body.appendChild(this.playerContainer);
        this.iframe = document.getElementById('multi-iframe');
        this.loadingOverlay = document.getElementById('player-loading-overlay');
        
        // Добавляем обработчик для закрытия дропдауна при клике вне его
        document.addEventListener('click', (e) => {
            if (this.isDropdownOpen && !e.target.closest('.balancer-selector')) {
                this.toggleDropdown();
            }
        });
    }

    showLoading() {
        if (this.loadingOverlay) {
            this.loadingOverlay.style.display = 'flex';
            // Сброс содержимого оверлея к загрузке
            this.loadingOverlay.innerHTML = `
                <div class="loading-animations" style="
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 20px;
                    margin-bottom: 20px;
                ">
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
                <div class="loading-text" style="
                    color: white; 
                    font-size: 16px; 
                    font-weight: 500; 
                    text-align: center;
                ">
                    Загрузка видео...
                </div>
            `;
            
            // Обновляем текст загрузки
            const loadingText = this.loadingOverlay.querySelector('.loading-text');
            if (loadingText) {
                const currentBalancer = this.balancers.find(b => b.id === this.currentPlayer);
                loadingText.textContent = `Загрузка ${currentBalancer ? currentBalancer.name : 'плеера'}...`;
            }
        }
        if (this.iframe) {
            this.iframe.style.display = 'none';
        }
    }

    hideLoading() {
        // Не скрываем загрузку, если есть ошибка
        if (this.hasError) return;
        
        if (this.loadingOverlay) {
            this.loadingOverlay.style.display = 'none';
        }
        if (this.iframe) {
            this.iframe.style.display = 'block';
        }
    }

    showError(message) {
        if (this.loadingOverlay) {
            // Выбираем случайное видео от 1 до 5
            const randomIndex = Math.floor(Math.random() * 5) + 1;
            const currentBalancer = this.balancers.find(b => b.id === this.currentPlayer);
            const otherBalancers = this.balancers.filter(b => b.id !== this.currentPlayer);
            
            this.loadingOverlay.innerHTML = `
                <div class="nf-err-center" style="display: flex; align-items: center; justify-content: center; height: 100%; background: #141414;">
                    <div class="nf-err-wrap" style="display: flex; align-items: center; justify-content: center; flex-direction: row;">
                        <div class="nf-err-text" style="flex: 1; text-align: left; padding-right: 32px;">
                            <div class="nf-err-title" style="font-size: 2em; font-weight: 900; color: white; margin-bottom: 12px;">
                                Ошибка загрузки
                            </div>
                            <div class="nf-err-desc" style="font-size: 1em; font-weight: 500; color: #aaa; line-height: 1.5;">
                                ${message}<br>
                                Плеер <strong>${currentBalancer ? currentBalancer.name : 'текущий'}</strong> не может воспроизвести этот контент.<br>
                                Попробуйте переключиться на <strong>${otherBalancers.map(b => b.name).join(' или ')}</strong> или выбрать другой контент.
                            </div>
                        </div>
                        <video id="notfound-video" src="ico/404-video/${randomIndex}.mp4" autoplay loop muted playsinline style="flex: 0 0 320px; width: 320px; height: 180px; border-radius: 8px; object-fit: cover; background: #222; box-shadow: 0 2px 16px #0006; margin-left: 24px;"></video>
                    </div>
                </div>
            `;
            this.loadingOverlay.style.display = 'flex';
            
            // Добавим обработчик ошибки для видео
            const nfVideo = document.getElementById('notfound-video');
            if (nfVideo) {
                nfVideo.onerror = function() {
                    nfVideo.style.display = 'none';
                };
            }
        }
    }

    async playContent(tmdbId, type, season = null, episode = null) {
        try {
            // Сохраняем текущий контент
            this.currentContent = { tmdbId, type, season, episode };
            
            // Сбрасываем флаг ошибки
            this.hasError = false;
            
            this.createPlayerContainer();
            this.showLoading();

            // Загружаем контент с текущим плеером
            await this.loadCurrentContent();

        } catch (error) {
            console.error('Ошибка воспроизведения:', error);
            this.hasError = true;
            this.showError(error.message);
        }
    }

    setupIframeHandlers() {
        if (!this.iframe || this.hasError) return;

        // Таймер для принудительного скрытия загрузки
        const loadingTimeout = setTimeout(() => {
            this.hideLoading();
        }, 8000); // 8 секунд максимум

        // Обработчик успешной загрузки
        this.iframe.onload = () => {
            if (this.hasError) return; // Не скрываем загрузку, если есть ошибка
            
            clearTimeout(loadingTimeout);
            // Небольшая задержка для полной загрузки содержимого
            setTimeout(() => {
                this.hideLoading();
            }, 1000);
        };

        // Обработчик ошибки загрузки
        this.iframe.onerror = () => {
            clearTimeout(loadingTimeout);
            this.hasError = true;
            this.showError('Ошибка загрузки видео');
        };
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

    // Методы для совместимости с HTML файлом
    async openPlayer(item) {
        const tmdbId = item.id;
        const type = item.title ? 'movie' : 'tv'; // Определяем тип по наличию title
        return this.playContent(tmdbId, type);
    }
}

// Создаем глобальный экземпляр плеера
window.multiPlayer = new MultiPlayer();
window.vibixPlayer = window.multiPlayer;
window.vidFastPlayer = window.multiPlayer;

// Функция для совместимости с HTML файлом
window.openPlayer = async function(item) {
    return window.multiPlayer.openPlayer(item);
};