(function () {
    function ready(callback) {
        if (document.readyState !== "loading") {
            callback();
            return;
        }
        document.addEventListener("DOMContentLoaded", callback);
    }

    function setupNavigation() {
        var toggle = document.querySelector("[data-nav-toggle]");
        var menu = document.querySelector("[data-nav-menu]");
        if (!toggle || !menu) {
            return;
        }
        toggle.addEventListener("click", function () {
            menu.classList.toggle("open");
        });
    }

    function setupHero() {
        var slides = Array.prototype.slice.call(document.querySelectorAll("[data-hero-slide]"));
        var dots = Array.prototype.slice.call(document.querySelectorAll("[data-hero-dot]"));
        var prev = document.querySelector("[data-hero-prev]");
        var next = document.querySelector("[data-hero-next]");
        if (!slides.length) {
            return;
        }
        var index = 0;
        var timer = null;

        function show(nextIndex) {
            index = (nextIndex + slides.length) % slides.length;
            slides.forEach(function (slide, slideIndex) {
                slide.classList.toggle("active", slideIndex === index);
            });
            dots.forEach(function (dot, dotIndex) {
                dot.classList.toggle("active", dotIndex === index);
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
            }
        }

        if (prev) {
            prev.addEventListener("click", function () {
                show(index - 1);
                start();
            });
        }
        if (next) {
            next.addEventListener("click", function () {
                show(index + 1);
                start();
            });
        }
        dots.forEach(function (dot) {
            dot.addEventListener("click", function () {
                show(Number(dot.getAttribute("data-hero-dot")) || 0);
                start();
            });
        });
        start();
    }

    function setupFilters() {
        var panels = Array.prototype.slice.call(document.querySelectorAll("[data-filter-panel]"));
        panels.forEach(function (panel) {
            var root = panel.parentElement;
            var grid = root ? root.querySelector("[data-searchable-grid]") : null;
            var input = panel.querySelector("[data-filter-input]");
            var year = panel.querySelector("[data-filter-year]");
            var type = panel.querySelector("[data-filter-type]");
            var reset = panel.querySelector("[data-filter-reset]");
            var count = root ? root.querySelector("[data-filter-count]") : null;
            if (!grid) {
                return;
            }
            var items = Array.prototype.slice.call(grid.children);

            function normalize(value) {
                return String(value || "").toLowerCase().trim();
            }

            function apply() {
                var keyword = normalize(input && input.value);
                var yearValue = normalize(year && year.value);
                var typeValue = normalize(type && type.value);
                var visible = 0;
                items.forEach(function (item) {
                    var haystack = normalize([
                        item.getAttribute("data-title"),
                        item.getAttribute("data-region"),
                        item.getAttribute("data-type"),
                        item.getAttribute("data-tags")
                    ].join(" "));
                    var itemYear = normalize(item.getAttribute("data-year"));
                    var itemType = normalize(item.getAttribute("data-type"));
                    var matched = true;
                    if (keyword && haystack.indexOf(keyword) === -1) {
                        matched = false;
                    }
                    if (yearValue && itemYear !== yearValue) {
                        matched = false;
                    }
                    if (typeValue && itemType !== typeValue) {
                        matched = false;
                    }
                    item.classList.toggle("is-hidden", !matched);
                    if (matched) {
                        visible += 1;
                    }
                });
                if (count) {
                    count.textContent = "当前显示 " + visible + " 部内容";
                }
            }

            [input, year, type].forEach(function (control) {
                if (control) {
                    control.addEventListener("input", apply);
                    control.addEventListener("change", apply);
                }
            });
            if (reset) {
                reset.addEventListener("click", function () {
                    if (input) {
                        input.value = "";
                    }
                    if (year) {
                        year.value = "";
                    }
                    if (type) {
                        type.value = "";
                    }
                    apply();
                });
            }
        });
    }

    function setupSearchPage() {
        var results = document.querySelector("[data-search-results]");
        var summary = document.querySelector("[data-search-summary]");
        var input = document.querySelector("[data-search-input]");
        var form = document.querySelector("[data-search-form]");
        if (!results || !summary || !input || !window.SITE_MOVIES) {
            return;
        }
        var params = new URLSearchParams(window.location.search);
        var initial = params.get("q") || "";
        input.value = initial;

        function normalize(value) {
            return String(value || "").toLowerCase().trim();
        }

        function card(movie) {
            var tags = (movie.tags || []).slice(0, 4).map(function (tag) {
                return "<span>" + escapeHtml(tag) + "</span>";
            }).join("");
            return [
                "<article class=\"movie-card\">",
                "<a class=\"poster-link\" href=\"" + escapeHtml(movie.file) + "\">",
                "<img src=\"" + escapeHtml(movie.cover) + "\" alt=\"" + escapeHtml(movie.title) + " 封面\" loading=\"lazy\">",
                "<span class=\"score-badge\">★ " + escapeHtml(movie.rating) + "</span>",
                "<span class=\"play-badge\">▶</span>",
                "</a>",
                "<div class=\"movie-card-body\">",
                "<h3><a href=\"" + escapeHtml(movie.file) + "\">" + escapeHtml(movie.title) + "</a></h3>",
                "<p class=\"movie-line\">" + escapeHtml(movie.oneLine) + "</p>",
                "<div class=\"movie-meta\"><span>" + escapeHtml(movie.year) + "</span><span>" + escapeHtml(movie.region) + "</span><span>" + escapeHtml(movie.type) + "</span></div>",
                "<div class=\"tag-list\">" + tags + "</div>",
                "</div>",
                "</article>"
            ].join("");
        }

        function escapeHtml(value) {
            return String(value || "").replace(/[&<>\"]/g, function (char) {
                return {
                    "&": "&amp;",
                    "<": "&lt;",
                    ">": "&gt;",
                    "\"": "&quot;"
                }[char];
            });
        }

        function render(query) {
            var keyword = normalize(query);
            if (!keyword) {
                results.innerHTML = "";
                summary.textContent = "输入关键词后显示搜索结果。";
                return;
            }
            var matched = window.SITE_MOVIES.filter(function (movie) {
                var haystack = normalize([
                    movie.title,
                    movie.region,
                    movie.type,
                    movie.year,
                    movie.genre,
                    (movie.tags || []).join(" "),
                    movie.oneLine
                ].join(" "));
                return haystack.indexOf(keyword) !== -1;
            });
            summary.textContent = "搜索 “" + query + "” 找到 " + matched.length + " 个结果";
            results.innerHTML = matched.slice(0, 200).map(card).join("");
            if (matched.length > 200) {
                summary.textContent += "，已展示前 200 个结果";
            }
        }

        if (form) {
            form.addEventListener("submit", function (event) {
                event.preventDefault();
                var value = input.value.trim();
                var url = new URL(window.location.href);
                if (value) {
                    url.searchParams.set("q", value);
                } else {
                    url.searchParams.delete("q");
                }
                window.history.replaceState(null, "", url.toString());
                render(value);
            });
        }
        input.addEventListener("input", function () {
            render(input.value);
        });
        render(initial);
    }

    function setupScrollPlayer() {
        var buttons = Array.prototype.slice.call(document.querySelectorAll("[data-scroll-player]"));
        buttons.forEach(function (button) {
            button.addEventListener("click", function (event) {
                var player = document.querySelector("[data-player]");
                if (!player) {
                    return;
                }
                event.preventDefault();
                player.scrollIntoView({ behavior: "smooth", block: "center" });
            });
        });
    }

    ready(function () {
        setupNavigation();
        setupHero();
        setupFilters();
        setupSearchPage();
        setupScrollPlayer();
    });
})();
