(function () {
  function ready(callback) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback);
    } else {
      callback();
    }
  }

  ready(function () {
    setupMenu();
    setupSearchForms();
    setupSearchResults();
    setupHero();
    setupFilters();
    setupPlayers();
  });

  function setupMenu() {
    var button = document.querySelector('[data-menu-button]');
    var panel = document.querySelector('[data-mobile-panel]');
    if (!button || !panel) {
      return;
    }
    button.addEventListener('click', function () {
      panel.classList.toggle('is-open');
    });
  }

  function setupSearchForms() {
    var forms = document.querySelectorAll('[data-search-form]');
    forms.forEach(function (form) {
      form.addEventListener('submit', function (event) {
        var input = form.querySelector('input[name="search"]');
        if (!input) {
          return;
        }
        var value = input.value.trim();
        if (!value) {
          event.preventDefault();
          input.focus();
          return;
        }
        event.preventDefault();
        window.location.href = './index.html?search=' + encodeURIComponent(value);
      });
    });
  }

  function setupSearchResults() {
    var params = new URLSearchParams(window.location.search);
    var query = params.get('search');
    var page = document.querySelector('[data-search-page]');
    var home = document.querySelector('[data-home-content]');
    var list = document.querySelector('[data-search-results]');
    var title = document.querySelector('[data-search-title]');
    if (!query || !page || !list || typeof SEARCH_INDEX === 'undefined') {
      return;
    }
    var normalized = query.trim().toLowerCase();
    if (!normalized) {
      return;
    }
    if (home) {
      home.hidden = true;
    }
    page.hidden = false;
    if (title) {
      title.textContent = '“' + query + '” 的搜索结果';
    }
    var terms = normalized.split(/\s+/).filter(Boolean);
    var results = SEARCH_INDEX.filter(function (item) {
      var haystack = [item.title, item.year, item.region, item.type, item.genre, item.tags].join(' ').toLowerCase();
      return terms.every(function (term) {
        return haystack.indexOf(term) !== -1;
      });
    }).slice(0, 96);
    if (!results.length) {
      list.innerHTML = '<p class="empty-text">没有找到匹配内容。</p>';
      return;
    }
    list.innerHTML = results.map(renderSearchCard).join('');
  }

  function renderSearchCard(item) {
    var safeTitle = escapeHtml(item.title);
    var safeDesc = escapeHtml(item.oneLine || '');
    var safeRegion = escapeHtml(item.region || '');
    var safeType = escapeHtml(item.type || '');
    var safeGenre = escapeHtml(item.genre || '');
    var tags = (item.tags || '').split(/[、,，\s]+/).filter(Boolean).slice(0, 3).map(function (tag) {
      return '<span>' + escapeHtml(tag) + '</span>';
    }).join('');
    return '<article class="movie-card">' +
      '<a class="poster-link" href="./' + item.url + '" aria-label="' + safeTitle + '">' +
      '<img src="' + item.cover + '" alt="' + safeTitle + '" loading="lazy" onerror="this.style.opacity=\'0\'">' +
      '<span class="poster-shade"></span><span class="poster-play">播放</span></a>' +
      '<div class="card-body"><p class="card-meta">' + item.year + ' · ' + safeRegion + ' · ' + safeType + '</p>' +
      '<h3><a href="./' + item.url + '">' + safeTitle + '</a></h3>' +
      '<p class="card-text">' + safeDesc + '</p>' +
      '<div class="card-foot"><span>' + escapeHtml(item.rating || '') + '</span><a href="./' + item.categoryUrl + '">' + escapeHtml(item.category || '') + '</a></div>' +
      '<div class="tag-row">' + tags + '</div><p class="card-meta">' + safeGenre + '</p></div></article>';
  }

  function setupHero() {
    var hero = document.querySelector('[data-hero]');
    if (!hero) {
      return;
    }
    var slides = Array.prototype.slice.call(hero.querySelectorAll('.hero-slide'));
    var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-dot]'));
    var prev = hero.querySelector('[data-hero-prev]');
    var next = hero.querySelector('[data-hero-next]');
    var index = 0;
    var timer;
    function show(nextIndex) {
      if (!slides.length) {
        return;
      }
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle('is-active', i === index);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle('is-active', i === index);
      });
    }
    function play() {
      clearInterval(timer);
      timer = setInterval(function () {
        show(index + 1);
      }, 5200);
    }
    if (prev) {
      prev.addEventListener('click', function () {
        show(index - 1);
        play();
      });
    }
    if (next) {
      next.addEventListener('click', function () {
        show(index + 1);
        play();
      });
    }
    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        show(Number(dot.getAttribute('data-hero-dot')) || 0);
        play();
      });
    });
    play();
  }

  function setupFilters() {
    var list = document.querySelector('[data-filter-list]');
    if (!list) {
      return;
    }
    var input = document.querySelector('[data-card-filter]');
    var year = document.querySelector('[data-year-filter]');
    var cards = Array.prototype.slice.call(list.querySelectorAll('[data-card]'));
    function apply() {
      var text = input ? input.value.trim().toLowerCase() : '';
      var selectedYear = year ? year.value : 'all';
      cards.forEach(function (card) {
        var haystack = [card.dataset.title, card.dataset.type, card.dataset.region, card.dataset.genre, card.dataset.tags].join(' ').toLowerCase();
        var matchText = !text || haystack.indexOf(text) !== -1;
        var matchYear = selectedYear === 'all' || card.dataset.year === selectedYear;
        card.hidden = !(matchText && matchYear);
      });
    }
    if (input) {
      input.addEventListener('input', apply);
    }
    if (year) {
      year.addEventListener('change', apply);
    }
  }

  function setupPlayers() {
    var players = document.querySelectorAll('[data-player]');
    players.forEach(function (player) {
      var video = player.querySelector('video');
      var button = player.querySelector('[data-play-button]');
      if (!video || !button) {
        return;
      }
      function start() {
        var url = video.getAttribute('data-url');
        if (!url) {
          return;
        }
        player.classList.add('is-playing');
        video.controls = true;
        if (window.Hls && window.Hls.isSupported()) {
          if (!video._hlsInstance) {
            var hls = new window.Hls({ enableWorker: true, lowLatencyMode: true });
            video._hlsInstance = hls;
            hls.loadSource(url);
            hls.attachMedia(video);
            hls.on(window.Hls.Events.MANIFEST_PARSED, function () {
              video.play().catch(function () {});
            });
            hls.on(window.Hls.Events.ERROR, function (event, data) {
              if (data && data.fatal) {
                hls.destroy();
                video._hlsInstance = null;
                video.src = url;
                video.play().catch(function () {});
              }
            });
          } else {
            video.play().catch(function () {});
          }
        } else {
          if (!video.src) {
            video.src = url;
          }
          video.play().catch(function () {});
        }
      }
      button.addEventListener('click', start);
      video.addEventListener('click', function () {
        if (video.paused) {
          start();
        }
      });
    });
  }

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"]/g, function (character) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;'
      }[character];
    });
  }
})();
