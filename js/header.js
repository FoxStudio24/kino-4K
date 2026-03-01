/**
 * header.js — загружает header.html (содержит <style> + <header>) через fetch
 * и вставляет их в #site-header-placeholder на каждой странице.
 *
 * Использование в <head>:
 *   <script src="js/header.js" data-page="index|movies|series|account" defer></script>
 * Для страниц в подпапках (watch/):
 *   <script src="../js/header.js" data-page="watch" data-base="../" defer></script>
 */
(function () {
    var script = document.currentScript || (function () {
        var scripts = document.getElementsByTagName('script');
        return scripts[scripts.length - 1];
    })();
    var base = script.getAttribute('data-base') || '';

    function initHeader(html) {
        var placeholder = document.getElementById('site-header-placeholder');
        if (!placeholder) return;

        // Фиксируем пути для подпапок
        if (base) {
            html = html.replace(/(href|src)="(?!https?:|\/\/|#)/g, '$1="' + base);
        }

        // Парсим: внутри могут быть <style> и <header>
        var temp = document.createElement('div');
        temp.innerHTML = html;

        // Вставляем все дочерние элементы вместо плейсхолдера
        var fragment = document.createDocumentFragment();
        while (temp.firstChild) {
            fragment.appendChild(temp.firstChild);
        }
        placeholder.parentNode.replaceChild(fragment, placeholder);

        // Ставим active класс по имени файла
        var filename = window.location.pathname.split('/').pop() || 'index.html';
        if (!filename) filename = 'index.html';
        var navLinks = document.querySelectorAll('#main-nav .nav-button');
        navLinks.forEach(function (link) {
            var href = link.getAttribute('href') || '';
            if (base) href = href.replace(base, '');
            if (href === filename) {
                link.classList.add('active');
            }
        });

        // Скользящий индикатор
        var slider = document.getElementById('nav-slider');
        function moveSlider(el) {
            if (!slider || !el) return;
            slider.style.width = el.offsetWidth + 'px';
            slider.style.left = el.offsetLeft + 'px';
        }
        function updateSlider() {
            var active = document.querySelector('#main-nav .nav-button.active');
            if (active) moveSlider(active);
        }
        if (document.readyState === 'complete') {
            updateSlider();
        } else {
            window.addEventListener('load', updateSlider);
        }
        window.addEventListener('resize', updateSlider);

        // Кнопка аккаунта — показываем профиль если залогинен
        var sessionId = localStorage.getItem('tmdb_session_id');
        var username = localStorage.getItem('tmdb_username');
        var avatarPath = localStorage.getItem('tmdb_avatar_path');
        var gravatarHash = localStorage.getItem('tmdb_gravatar_hash');
        var btn = document.getElementById('header-account-btn');
        var label = document.getElementById('header-account-label');
        if (sessionId && username && btn && label) {
            btn.className = 'header-btn profile-button';
            var avatarSrc = null;
            if (avatarPath) {
                avatarSrc = 'https://image.tmdb.org/t/p/w185' + avatarPath;
            } else if (gravatarHash) {
                avatarSrc = 'https://www.gravatar.com/avatar/' + gravatarHash + '?s=60';
            }
            if (avatarSrc) {
                var img = document.createElement('img');
                img.src = avatarSrc;
                img.alt = 'Avatar';
                img.style.cssText = 'width:30px;height:30px;border-radius:50%;object-fit:cover;border:1px solid rgba(255,255,255,0.2);flex-shrink:0;';
                var icon = btn.querySelector('i');
                if (icon) icon.replaceWith(img);
            }
            label.textContent = username;
            label.className = 'nickname-truncate';
        }
    }

    fetch(base + 'header.html')
        .then(function (r) { return r.text(); })
        .then(function (html) { initHeader(html); })
        .catch(function (err) {
            console.warn('[header.js] Не удалось загрузить header.html:', err);
        });
})();
