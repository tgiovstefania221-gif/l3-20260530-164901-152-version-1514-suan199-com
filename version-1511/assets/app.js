(function () {
  "use strict";

  var HLS_LIBRARY_URL = "https://cdn.jsdelivr.net/npm/hls.js@1.6.16/dist/hls.min.js";
  var DEFAULT_HLS_SOURCE = "https://video-dev.github.io/streams/x36xhzz/x36xhzz.m3u8";
  var hlsScriptPromise = null;

  function depthPrefix() {
    var depth = Number(document.body.getAttribute("data-depth") || "0");
    if (!Number.isFinite(depth) || depth <= 0) {
      return "";
    }
    return "../".repeat(depth);
  }

  function resolveHref(href) {
    if (!href || /^(https?:|mailto:|tel:|#)/i.test(href)) {
      return href;
    }
    return depthPrefix() + href;
  }

  function setupMobileNav() {
    document.querySelectorAll(".js-nav-toggle").forEach(function (button) {
      var panel = document.querySelector(".js-mobile-panel");
      if (!panel) {
        return;
      }
      button.addEventListener("click", function () {
        panel.hidden = !panel.hidden;
        button.classList.toggle("is-open", !panel.hidden);
      });
    });
  }

  function setupHero() {
    var hero = document.querySelector(".js-hero");
    if (!hero) {
      return;
    }
    var slides = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-slide]"));
    var dots = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-dot]"));
    var prev = hero.querySelector("[data-hero-prev]");
    var next = hero.querySelector("[data-hero-next]");
    var current = 0;
    var timer = null;

    function show(index) {
      if (!slides.length) {
        return;
      }
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle("is-active", slideIndex === current);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle("is-active", dotIndex === current);
      });
    }

    function restart() {
      window.clearInterval(timer);
      timer = window.setInterval(function () {
        show(current + 1);
      }, 5000);
    }

    dots.forEach(function (dot, index) {
      dot.addEventListener("click", function () {
        show(index);
        restart();
      });
    });

    if (prev) {
      prev.addEventListener("click", function () {
        show(current - 1);
        restart();
      });
    }

    if (next) {
      next.addEventListener("click", function () {
        show(current + 1);
        restart();
      });
    }

    show(0);
    restart();
  }

  function setupSearch() {
    var index = window.MOVIE_SEARCH_INDEX || [];
    document.querySelectorAll(".site-search").forEach(function (form) {
      var input = form.querySelector(".js-site-search");
      var results = form.querySelector(".js-site-results");
      if (!input || !results) {
        return;
      }

      function render(query) {
        var normalized = query.trim().toLowerCase();
        if (!normalized) {
          results.hidden = true;
          results.innerHTML = "";
          return;
        }
        var matches = index.filter(function (item) {
          return item.search.toLowerCase().indexOf(normalized) !== -1;
        }).slice(0, 10);
        if (!matches.length) {
          results.hidden = false;
          results.innerHTML = '<div class="search-result"><strong>没有匹配结果</strong><span>请尝试片名、年份、地区或类型</span></div>';
          return;
        }
        results.hidden = false;
        results.innerHTML = matches.map(function (item) {
          return [
            '<a class="search-result" href="' + resolveHref(item.href) + '">',
            '<strong>' + escapeHtml(item.title) + '</strong>',
            '<span>' + escapeHtml(item.year + ' · ' + item.region + ' · ' + item.type) + '</span>',
            '</a>'
          ].join('');
        }).join('');
      }

      input.addEventListener("input", function () {
        render(input.value);
      });
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        var firstLink = results.querySelector("a");
        if (firstLink) {
          window.location.href = firstLink.href;
        }
      });
      document.addEventListener("click", function (event) {
        if (!form.contains(event.target)) {
          results.hidden = true;
        }
      });
    });
  }

  function setupFilters() {
    document.querySelectorAll(".js-filter-area").forEach(function (area) {
      var cards = Array.prototype.slice.call(area.querySelectorAll(".js-movie-card"));
      var chips = Array.prototype.slice.call(area.querySelectorAll(".js-filter-chip"));
      var search = area.querySelector(".js-card-search");
      var count = area.querySelector(".js-filter-count");
      var state = {
        region: "全部",
        year: "全部",
        type: "全部"
      };

      function apply() {
        var keyword = search ? search.value.trim().toLowerCase() : "";
        var visible = 0;
        cards.forEach(function (card) {
          var ok = true;
          Object.keys(state).forEach(function (key) {
            if (state[key] !== "全部" && card.getAttribute("data-" + key) !== state[key]) {
              ok = false;
            }
          });
          if (keyword && (card.getAttribute("data-search") || "").toLowerCase().indexOf(keyword) === -1) {
            ok = false;
          }
          card.classList.toggle("is-hidden-card", !ok);
          if (ok) {
            visible += 1;
          }
        });
        if (count) {
          count.textContent = String(visible);
        }
      }

      chips.forEach(function (chip) {
        chip.addEventListener("click", function () {
          var type = chip.getAttribute("data-filter-type");
          var value = chip.getAttribute("data-filter-value");
          state[type] = value;
          chips.filter(function (item) {
            return item.getAttribute("data-filter-type") === type;
          }).forEach(function (item) {
            item.classList.toggle("is-active", item === chip);
          });
          apply();
        });
      });

      if (search) {
        search.addEventListener("input", apply);
      }
      apply();
    });
  }

  function loadHlsScript() {
    if (window.Hls) {
      return Promise.resolve(window.Hls);
    }
    if (hlsScriptPromise) {
      return hlsScriptPromise;
    }
    hlsScriptPromise = new Promise(function (resolve, reject) {
      var script = document.createElement("script");
      script.src = HLS_LIBRARY_URL;
      script.async = true;
      script.onload = function () {
        resolve(window.Hls);
      };
      script.onerror = function () {
        reject(new Error("HLS 脚本加载失败"));
      };
      document.head.appendChild(script);
    });
    return hlsScriptPromise;
  }

  function setupPlayers() {
    document.querySelectorAll(".js-player-card").forEach(function (card) {
      var video = card.querySelector(".js-hls-player");
      var start = card.querySelector(".js-player-start");
      var status = card.querySelector(".js-player-status");
      if (!video || !start) {
        return;
      }
      var source = video.getAttribute("data-hls-src") || DEFAULT_HLS_SOURCE;
      var initialized = false;

      function setStatus(message) {
        if (status) {
          status.textContent = message;
        }
      }

      function playVideo() {
        var playPromise = video.play();
        if (playPromise && typeof playPromise.catch === "function") {
          playPromise.catch(function () {
            setStatus("浏览器阻止了自动播放，请再次点击视频播放按钮。");
          });
        }
      }

      function initPlayer() {
        start.classList.add("is-hidden");
        if (initialized) {
          playVideo();
          return;
        }
        initialized = true;
        setStatus("正在初始化 HLS 播放线路...");

        if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = source;
          video.addEventListener("loadedmetadata", playVideo, { once: true });
          setStatus("已使用浏览器原生 HLS 播放能力。");
          return;
        }

        loadHlsScript().then(function (Hls) {
          if (Hls && Hls.isSupported()) {
            var hls = new Hls({
              enableWorker: true,
              lowLatencyMode: true
            });
            hls.loadSource(source);
            hls.attachMedia(video);
            hls.on(Hls.Events.MANIFEST_PARSED, function () {
              setStatus("HLS 播放线路加载完成。");
              playVideo();
            });
            hls.on(Hls.Events.ERROR, function (event, data) {
              if (data && data.fatal) {
                setStatus("播放线路暂时不可用，请检查 m3u8 地址或网络状态。");
              }
            });
          } else {
            setStatus("当前浏览器不支持 HLS 播放，请更换浏览器或使用支持 MSE 的环境。");
          }
        }).catch(function () {
          setStatus("HLS 播放脚本加载失败，请检查网络或本地部署环境。");
        });
      }

      start.addEventListener("click", initPlayer);
      video.addEventListener("click", function () {
        if (!initialized) {
          initPlayer();
        }
      });
    });
  }

  function setupImageFallbacks() {
    document.querySelectorAll(".poster img, .wide-card__poster img, .detail-poster img, .hero-slide img, .detail-hero > img").forEach(function (image) {
      image.addEventListener("error", function () {
        var parent = image.parentElement;
        if (parent) {
          parent.classList.add("is-missing");
        }
        image.style.opacity = "0";
      });
    });
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  document.addEventListener("DOMContentLoaded", function () {
    setupMobileNav();
    setupHero();
    setupSearch();
    setupFilters();
    setupPlayers();
    setupImageFallbacks();
  });
}());
