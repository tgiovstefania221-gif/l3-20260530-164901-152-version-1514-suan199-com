(function() {
  const slider = document.querySelector("[data-hero-slider]");
  if (slider) {
    const slides = Array.from(slider.querySelectorAll(".hero-slide"));
    const dots = Array.from(slider.querySelectorAll(".hero-dot"));
    let current = 0;

    function show(index) {
      current = (index + slides.length) % slides.length;
      slides.forEach(function(slide, slideIndex) {
        slide.classList.toggle("is-active", slideIndex === current);
      });
      dots.forEach(function(dot, dotIndex) {
        dot.classList.toggle("is-active", dotIndex === current);
      });
    }

    dots.forEach(function(dot, index) {
      dot.addEventListener("click", function() {
        show(index);
      });
    });

    if (slides.length > 1) {
      setInterval(function() {
        show(current + 1);
      }, 5200);
    }
  }

  const grids = Array.from(document.querySelectorAll(".searchable-grid"));
  grids.forEach(function(grid) {
    const panel = grid.closest(".content-section");
    if (!panel) {
      return;
    }
    const input = panel.querySelector(".movie-search");
    const select = panel.querySelector(".year-filter");
    const cards = Array.from(grid.querySelectorAll(".movie-card"));
    const years = Array.from(new Set(cards.map(function(card) {
      return card.getAttribute("data-year") || "";
    }).filter(Boolean))).sort(function(a, b) {
      return Number(b) - Number(a);
    });

    if (select && select.children.length === 1) {
      years.forEach(function(year) {
        const option = document.createElement("option");
        option.value = year;
        option.textContent = year;
        select.appendChild(option);
      });
    }

    function filterCards() {
      const keyword = input ? input.value.trim().toLowerCase() : "";
      const year = select ? select.value : "";
      cards.forEach(function(card) {
        const title = (card.getAttribute("data-title") || "").toLowerCase();
        const region = (card.getAttribute("data-region") || "").toLowerCase();
        const genre = (card.getAttribute("data-genre") || "").toLowerCase();
        const cardYear = card.getAttribute("data-year") || "";
        const text = title + " " + region + " " + genre + " " + cardYear;
        const keywordMatch = !keyword || text.indexOf(keyword) !== -1;
        const yearMatch = !year || cardYear === year;
        card.classList.toggle("is-hidden-card", !(keywordMatch && yearMatch));
      });
    }

    if (input) {
      input.addEventListener("input", filterCards);
    }
    if (select) {
      select.addEventListener("change", filterCards);
    }
  });

  const params = new URLSearchParams(window.location.search);
  const query = params.get("q");
  if (query) {
    const searchInput = document.querySelector(".movie-search");
    if (searchInput) {
      searchInput.value = query;
      searchInput.dispatchEvent(new Event("input"));
    }
  }
})();
