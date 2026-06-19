document.addEventListener('DOMContentLoaded', function () {
  var toggle = document.querySelector('.nav-toggle');
  var mobilePanel = document.querySelector('.mobile-panel');

  if (toggle && mobilePanel) {
    toggle.addEventListener('click', function () {
      var open = mobilePanel.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  document.querySelectorAll('.site-search-form').forEach(function (form) {
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var input = form.querySelector('input[name="q"]');
      var query = input ? input.value.trim() : '';
      var url = './search.html';
      if (query) {
        url += '?q=' + encodeURIComponent(query);
      }
      window.location.href = url;
    });
  });

  document.querySelectorAll('img[data-cover]').forEach(function (img) {
    img.addEventListener('error', function () {
      img.classList.add('image-muted');
    });
  });

  initHero();
  initFilters();
  initPlayers();

  document.querySelectorAll('.back-top').forEach(function (button) {
    button.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });
});

function initHero() {
  var hero = document.querySelector('.hero');
  if (!hero) {
    return;
  }

  var slides = Array.prototype.slice.call(hero.querySelectorAll('.hero-slide'));
  var dots = Array.prototype.slice.call(hero.querySelectorAll('.hero-dot'));
  var prev = hero.querySelector('[data-hero-prev]');
  var next = hero.querySelector('[data-hero-next]');
  var index = 0;
  var timer = null;

  function show(nextIndex) {
    if (!slides.length) {
      return;
    }
    index = (nextIndex + slides.length) % slides.length;
    slides.forEach(function (slide, slideIndex) {
      slide.classList.toggle('is-active', slideIndex === index);
    });
    dots.forEach(function (dot, dotIndex) {
      dot.classList.toggle('is-active', dotIndex === index);
    });
  }

  function start() {
    stop();
    timer = window.setInterval(function () {
      show(index + 1);
    }, 5000);
  }

  function stop() {
    if (timer) {
      window.clearInterval(timer);
      timer = null;
    }
  }

  if (prev) {
    prev.addEventListener('click', function () {
      show(index - 1);
      start();
    });
  }

  if (next) {
    next.addEventListener('click', function () {
      show(index + 1);
      start();
    });
  }

  dots.forEach(function (dot) {
    dot.addEventListener('click', function () {
      show(Number(dot.getAttribute('data-hero-dot')) || 0);
      start();
    });
  });

  hero.addEventListener('mouseenter', stop);
  hero.addEventListener('mouseleave', start);
  show(0);
  start();
}

function initFilters() {
  var panel = document.querySelector('.filter-panel');
  var results = document.querySelector('.filter-results');
  if (!panel || !results) {
    return;
  }

  var search = panel.querySelector('.filter-search');
  var year = panel.querySelector('.filter-year');
  var region = panel.querySelector('.filter-region');
  var type = panel.querySelector('.filter-type');
  var cards = Array.prototype.slice.call(results.children);
  var params = new URLSearchParams(window.location.search);
  var q = params.get('q') || '';

  if (q && search) {
    search.value = q;
  }

  function normalize(value) {
    return String(value || '').toLowerCase().trim();
  }

  function apply() {
    var keyword = normalize(search && search.value);
    var yearValue = normalize(year && year.value);
    var regionValue = normalize(region && region.value);
    var typeValue = normalize(type && type.value);

    cards.forEach(function (card) {
      var text = normalize([
        card.getAttribute('data-title'),
        card.getAttribute('data-region'),
        card.getAttribute('data-type'),
        card.getAttribute('data-year'),
        card.getAttribute('data-genre'),
        card.getAttribute('data-tags'),
        card.textContent
      ].join(' '));
      var ok = true;
      if (keyword && text.indexOf(keyword) === -1) {
        ok = false;
      }
      if (yearValue && normalize(card.getAttribute('data-year')) !== yearValue) {
        ok = false;
      }
      if (regionValue && normalize(card.getAttribute('data-region')) !== regionValue) {
        ok = false;
      }
      if (typeValue && normalize(card.getAttribute('data-type')) !== typeValue) {
        ok = false;
      }
      card.classList.toggle('filter-hidden', !ok);
    });
  }

  [search, year, region, type].forEach(function (control) {
    if (control) {
      control.addEventListener('input', apply);
      control.addEventListener('change', apply);
    }
  });

  apply();
}

function initPlayers() {
  document.querySelectorAll('.video-shell').forEach(function (shell) {
    var video = shell.querySelector('video');
    var button = shell.querySelector('.player-start');
    var url = shell.getAttribute('data-video-url');
    var loaded = false;
    var hls = null;

    if (!video || !url) {
      return;
    }

    function markError() {
      shell.classList.add('player-error');
      if (button) {
        button.style.display = 'none';
      }
    }

    function playVideo() {
      var promise = video.play();
      if (promise && promise.catch) {
        promise.catch(function () {});
      }
    }

    function load() {
      if (loaded) {
        playVideo();
        return;
      }

      loaded = true;
      shell.classList.add('is-loading');

      if (window.Hls && window.Hls.isSupported()) {
        hls = new window.Hls({ enableWorker: true, lowLatencyMode: false });
        hls.loadSource(url);
        hls.attachMedia(video);
        hls.on(window.Hls.Events.MANIFEST_PARSED, function () {
          shell.classList.add('is-playing');
          shell.classList.remove('is-loading');
          playVideo();
        });
        hls.on(window.Hls.Events.ERROR, function (event, data) {
          if (data && data.fatal) {
            markError();
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = url;
        video.addEventListener('loadedmetadata', function () {
          shell.classList.add('is-playing');
          shell.classList.remove('is-loading');
          playVideo();
        }, { once: true });
        video.addEventListener('error', markError, { once: true });
      } else {
        markError();
      }
    }

    if (button) {
      button.addEventListener('click', load);
    }

    video.addEventListener('click', function () {
      if (!loaded || video.paused) {
        load();
      } else {
        video.pause();
      }
    });

    video.addEventListener('play', function () {
      shell.classList.add('is-playing');
    });

    video.addEventListener('pause', function () {
      if (!video.ended) {
        shell.classList.remove('is-playing');
      }
    });

    window.addEventListener('beforeunload', function () {
      if (hls) {
        hls.destroy();
      }
    });
  });
}
