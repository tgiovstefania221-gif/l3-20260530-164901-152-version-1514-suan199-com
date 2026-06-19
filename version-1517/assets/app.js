(function () {
  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  function setupMenu() {
    var button = document.querySelector(".menu-toggle");
    if (!button) {
      return;
    }
    button.addEventListener("click", function () {
      var open = document.body.classList.toggle("menu-open");
      button.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  function setupHero() {
    var carousel = document.querySelector("[data-hero-carousel]");
    if (!carousel) {
      return;
    }
    var slides = Array.prototype.slice.call(carousel.querySelectorAll(".hero-slide"));
    var dots = Array.prototype.slice.call(carousel.querySelectorAll(".hero-dot"));
    var index = 0;
    function show(next) {
      index = (next + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle("is-active", i === index);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle("is-active", i === index);
      });
    }
    dots.forEach(function (dot, i) {
      dot.addEventListener("click", function () {
        show(i);
      });
    });
    if (slides.length > 1) {
      setInterval(function () {
        show(index + 1);
      }, 5200);
    }
  }

  function normalize(text) {
    return (text || "").toString().trim().toLowerCase();
  }

  function cardText(card) {
    return normalize([
      card.dataset.title,
      card.dataset.region,
      card.dataset.genre,
      card.dataset.year,
      card.textContent
    ].join(" "));
  }

  function setupCardFilter() {
    var forms = document.querySelectorAll("[data-card-filter]");
    forms.forEach(function (form) {
      var input = form.querySelector("input");
      var select = form.querySelector("select");
      var grid = document.querySelector(".filter-targets");
      if (!grid || !input) {
        return;
      }
      var cards = Array.prototype.slice.call(grid.querySelectorAll(".movie-card"));
      function apply() {
        var query = normalize(input.value);
        var year = select ? normalize(select.value) : "";
        cards.forEach(function (card) {
          var okText = !query || cardText(card).indexOf(query) >= 0;
          var okYear = !year || normalize(card.dataset.year) === year;
          card.classList.toggle("is-hidden-card", !(okText && okYear));
        });
      }
      input.addEventListener("input", apply);
      if (select) {
        select.addEventListener("change", apply);
      }
    });
  }

  function setupGlobalSearch() {
    var form = document.querySelector("[data-global-search]");
    if (!form) {
      return;
    }
    var input = form.querySelector("input[name='q']");
    var genre = form.querySelector("select[name='genre']");
    var year = form.querySelector("select[name='year']");
    var cards = Array.prototype.slice.call(document.querySelectorAll(".filter-targets .movie-card"));
    var params = new URLSearchParams(window.location.search);
    if (params.get("q")) {
      input.value = params.get("q");
    }
    function apply() {
      var query = normalize(input.value);
      var genreValue = normalize(genre.value);
      var yearValue = normalize(year.value);
      cards.forEach(function (card) {
        var text = cardText(card);
        var okQuery = !query || text.indexOf(query) >= 0;
        var okGenre = !genreValue || normalize(card.dataset.genre).indexOf(genreValue) >= 0 || text.indexOf(genreValue) >= 0;
        var okYear = !yearValue || normalize(card.dataset.year) === yearValue;
        card.classList.toggle("is-hidden-card", !(okQuery && okGenre && okYear));
      });
    }
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      apply();
    });
    input.addEventListener("input", apply);
    genre.addEventListener("change", apply);
    year.addEventListener("change", apply);
    apply();
  }

  window.initVideoPlayer = function (id, sourceUrl) {
    var root = document.getElementById(id);
    if (!root) {
      return;
    }
    var video = root.querySelector("video");
    var overlay = root.querySelector(".player-overlay");
    var playButton = root.querySelector(".player-control-play");
    var muteButton = root.querySelector(".player-mute");
    var fullscreenButton = root.querySelector(".player-fullscreen");
    var loaded = false;
    var hls = null;

    function load() {
      if (loaded || !video) {
        return;
      }
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = sourceUrl;
      } else if (window.Hls && window.Hls.isSupported()) {
        hls = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hls.loadSource(sourceUrl);
        hls.attachMedia(video);
      } else {
        video.src = sourceUrl;
      }
      loaded = true;
    }

    function setPlaying(playing) {
      root.classList.toggle("is-playing", playing);
      if (overlay) {
        overlay.classList.toggle("is-hidden", playing);
      }
      if (playButton) {
        playButton.textContent = playing ? "Ⅱ" : "▶";
      }
    }

    function start() {
      load();
      var promise = video.play();
      if (promise && promise.catch) {
        promise.catch(function () {
          setPlaying(false);
        });
      }
    }

    function toggle() {
      if (video.paused) {
        start();
      } else {
        video.pause();
      }
    }

    if (overlay) {
      overlay.addEventListener("click", start);
    }
    if (playButton) {
      playButton.addEventListener("click", toggle);
    }
    if (video) {
      video.addEventListener("click", toggle);
      video.addEventListener("play", function () {
        setPlaying(true);
      });
      video.addEventListener("pause", function () {
        setPlaying(false);
      });
      video.addEventListener("ended", function () {
        setPlaying(false);
      });
    }
    if (muteButton) {
      muteButton.addEventListener("click", function () {
        video.muted = !video.muted;
        muteButton.textContent = video.muted ? "🔇" : "🔊";
      });
    }
    if (fullscreenButton) {
      fullscreenButton.addEventListener("click", function () {
        if (document.fullscreenElement) {
          document.exitFullscreen();
        } else if (root.requestFullscreen) {
          root.requestFullscreen();
        }
      });
    }
    window.addEventListener("pagehide", function () {
      if (hls) {
        hls.destroy();
      }
    });
  };

  ready(function () {
    setupMenu();
    setupHero();
    setupCardFilter();
    setupGlobalSearch();
  });
})();
