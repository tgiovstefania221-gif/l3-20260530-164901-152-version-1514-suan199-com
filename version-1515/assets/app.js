(function () {
  var navButton = document.querySelector('[data-nav-toggle]');
  var navLinks = document.querySelector('[data-nav-links]');
  if (navButton && navLinks) {
    navButton.addEventListener('click', function () {
      navLinks.classList.toggle('open');
    });
  }

  var sliders = document.querySelectorAll('[data-hero-slider]');
  sliders.forEach(function (slider) {
    var slides = Array.prototype.slice.call(slider.querySelectorAll('.hero-slide'));
    var dots = Array.prototype.slice.call(slider.querySelectorAll('[data-slide-dot]'));
    var current = 0;
    function activate(index) {
      if (!slides.length) {
        return;
      }
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle('active', i === current);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle('active', i === current);
      });
    }
    dots.forEach(function (dot, i) {
      dot.addEventListener('click', function () {
        activate(i);
      });
    });
    activate(0);
    if (slides.length > 1) {
      setInterval(function () {
        activate(current + 1);
      }, 5200);
    }
  });

  var filterForm = document.querySelector('[data-filter-form]');
  if (filterForm) {
    var input = filterForm.querySelector('[data-filter-input]');
    var year = filterForm.querySelector('[data-filter-year]');
    var type = filterForm.querySelector('[data-filter-type]');
    var cards = Array.prototype.slice.call(document.querySelectorAll('[data-movie-card]'));
    function applyFilter() {
      var keyword = input ? input.value.trim().toLowerCase() : '';
      var yearValue = year ? year.value : '';
      var typeValue = type ? type.value : '';
      cards.forEach(function (card) {
        var text = (card.getAttribute('data-title') + ' ' + card.getAttribute('data-tags')).toLowerCase();
        var okKeyword = !keyword || text.indexOf(keyword) !== -1;
        var okYear = !yearValue || card.getAttribute('data-year') === yearValue;
        var okType = !typeValue || card.getAttribute('data-type') === typeValue;
        card.style.display = okKeyword && okYear && okType ? '' : 'none';
      });
    }
    [input, year, type].forEach(function (node) {
      if (node) {
        node.addEventListener('input', applyFilter);
        node.addEventListener('change', applyFilter);
      }
    });
  }

  function startStream(player) {
    var video = player.querySelector('video');
    var overlay = player.querySelector('.play-overlay');
    if (!video) {
      return;
    }
    var src = video.getAttribute('data-stream');
    if (!src) {
      return;
    }
    var play = function () {
      var promise = video.play();
      if (promise && typeof promise.catch === 'function') {
        promise.catch(function () {});
      }
    };
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
      play();
    } else if (window.Hls && window.Hls.isSupported()) {
      if (!video._hlsReady) {
        var hls = new window.Hls({ enableWorker: true });
        hls.loadSource(src);
        hls.attachMedia(video);
        video._hlsReady = hls;
      }
      play();
    } else {
      video.src = src;
      play();
    }
    if (overlay) {
      overlay.classList.add('hidden');
    }
    video.setAttribute('controls', 'controls');
  }

  document.querySelectorAll('[data-player]').forEach(function (player) {
    var overlay = player.querySelector('.play-overlay');
    var video = player.querySelector('video');
    if (overlay) {
      overlay.addEventListener('click', function () {
        startStream(player);
      });
    }
    if (video) {
      video.addEventListener('click', function () {
        if (video.paused) {
          startStream(player);
        }
      });
    }
  });

  var searchRoot = document.querySelector('[data-search-root]');
  if (searchRoot && window.siteSearchItems) {
    var searchInput = searchRoot.querySelector('[data-search-input]');
    var searchType = searchRoot.querySelector('[data-search-type]');
    var searchYear = searchRoot.querySelector('[data-search-year]');
    var resultBox = searchRoot.querySelector('[data-search-results]');
    var params = new URLSearchParams(window.location.search);
    var initial = params.get('q') || '';
    if (searchInput) {
      searchInput.value = initial;
    }
    function itemCard(item) {
      var tags = item.tags.slice(0, 3).map(function (tag) {
        return '<span class="tag">' + escapeHtml(tag) + '</span>';
      }).join('');
      return '<a class="movie-card" href="' + item.url + '">' +
        '<div class="poster" style="background-image: linear-gradient(135deg, rgba(8,145,178,.25), rgba(20,184,166,.25)), url(' + item.cover + ')">' +
        '<span class="poster-badge">' + escapeHtml(item.year) + '</span>' +
        '</div>' +
        '<div class="card-body">' +
        '<h2 class="card-title">' + escapeHtml(item.title) + '</h2>' +
        '<p class="card-text">' + escapeHtml(item.desc) + '</p>' +
        '<div class="tag-row">' + tags + '</div>' +
        '</div>' +
        '</a>';
    }
    function escapeHtml(value) {
      return String(value || '').replace(/[&<>"']/g, function (char) {
        return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char];
      });
    }
    function runSearch() {
      var keyword = searchInput ? searchInput.value.trim().toLowerCase() : '';
      var typeValue = searchType ? searchType.value : '';
      var yearValue = searchYear ? searchYear.value : '';
      var items = window.siteSearchItems.filter(function (item) {
        var hay = (item.title + ' ' + item.desc + ' ' + item.tags.join(' ') + ' ' + item.genre).toLowerCase();
        var okKeyword = !keyword || hay.indexOf(keyword) !== -1;
        var okType = !typeValue || item.type === typeValue;
        var okYear = !yearValue || String(item.year) === yearValue;
        return okKeyword && okType && okYear;
      }).slice(0, 120);
      if (!resultBox) {
        return;
      }
      if (!items.length) {
        resultBox.innerHTML = '<div class="empty-state">没有找到匹配内容，可换一个关键词继续检索。</div>';
        return;
      }
      resultBox.innerHTML = items.map(itemCard).join('');
    }
    [searchInput, searchType, searchYear].forEach(function (node) {
      if (node) {
        node.addEventListener('input', runSearch);
        node.addEventListener('change', runSearch);
      }
    });
    runSearch();
  }
})();
