(function () {
  function ready(fn) {
    if (document.readyState !== "loading") {
      fn();
      return;
    }
    document.addEventListener("DOMContentLoaded", fn);
  }

  function bindMenu() {
    var toggle = document.querySelector("[data-menu-toggle]");
    var nav = document.querySelector("[data-mobile-nav]");
    if (!toggle || !nav) {
      return;
    }
    toggle.addEventListener("click", function () {
      nav.classList.toggle("is-open");
    });
  }

  function bindHero() {
    var slides = Array.prototype.slice.call(document.querySelectorAll("[data-hero-slide]"));
    var dots = Array.prototype.slice.call(document.querySelectorAll("[data-hero-dot]"));
    if (!slides.length) {
      return;
    }
    var current = 0;
    var timer = null;

    function activate(index) {
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle("is-active", slideIndex === current);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle("is-active", dotIndex === current);
      });
    }

    dots.forEach(function (dot) {
      dot.addEventListener("click", function () {
        activate(Number(dot.getAttribute("data-hero-dot")) || 0);
        start();
      });
    });

    function start() {
      if (timer) {
        clearInterval(timer);
      }
      timer = setInterval(function () {
        activate(current + 1);
      }, 5200);
    }

    activate(0);
    start();
  }

  function bindFilters() {
    var forms = Array.prototype.slice.call(document.querySelectorAll("[data-filter-form]"));
    forms.forEach(function (form) {
      var input = form.querySelector("[data-search-input]");
      var selects = Array.prototype.slice.call(form.querySelectorAll("[data-filter-select]"));
      var scope = form.parentElement || document;
      var cards = Array.prototype.slice.call(scope.querySelectorAll("[data-card]"));

      function normalize(value) {
        return String(value || "").trim().toLowerCase();
      }

      function apply() {
        var query = normalize(input ? input.value : "");
        var selected = selects.map(function (select) {
          return normalize(select.value);
        }).filter(Boolean);

        cards.forEach(function (card) {
          var content = normalize(card.getAttribute("data-search"));
          var matchQuery = !query || content.indexOf(query) !== -1;
          var matchSelect = selected.every(function (value) {
            return content.indexOf(value) !== -1;
          });
          card.style.display = matchQuery && matchSelect ? "" : "none";
        });
      }

      if (input) {
        input.addEventListener("input", apply);
      }
      selects.forEach(function (select) {
        select.addEventListener("change", apply);
      });
    });
  }

  window.bindPlayer = function (videoUrl) {
    var video = document.getElementById("movie-player");
    var layer = document.querySelector(".play-layer");
    var initialized = false;
    var hls = null;

    if (!video || !videoUrl) {
      return;
    }

    function loadVideo() {
      if (initialized) {
        return;
      }
      initialized = true;

      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = videoUrl;
      } else if (window.Hls && window.Hls.isSupported()) {
        hls = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hls.loadSource(videoUrl);
        hls.attachMedia(video);
      } else {
        video.src = videoUrl;
      }
    }

    function play() {
      loadVideo();
      if (layer) {
        layer.classList.add("is-hidden");
      }
      var promise = video.play();
      if (promise && typeof promise.catch === "function") {
        promise.catch(function () {});
      }
    }

    if (layer) {
      layer.addEventListener("click", play);
    }
    video.addEventListener("click", function () {
      if (video.paused) {
        play();
      }
    });
    video.addEventListener("play", function () {
      if (layer) {
        layer.classList.add("is-hidden");
      }
    });
    window.addEventListener("pagehide", function () {
      if (hls) {
        hls.destroy();
      }
    });
  };

  ready(function () {
    bindMenu();
    bindHero();
    bindFilters();
  });
})();
