document.addEventListener('DOMContentLoaded', function () {
  const mobileToggle = document.querySelector('[data-mobile-toggle]');
  const mobileMenu = document.querySelector('[data-mobile-menu]');

  if (mobileToggle && mobileMenu) {
    mobileToggle.addEventListener('click', function () {
      mobileMenu.classList.toggle('open');
    });
  }

  const heroSlides = Array.from(document.querySelectorAll('.hero-slide'));
  const heroDots = Array.from(document.querySelectorAll('[data-hero-dot]'));
  let heroIndex = 0;

  function showHeroSlide(index) {
    if (!heroSlides.length) {
      return;
    }

    heroIndex = (index + heroSlides.length) % heroSlides.length;
    heroSlides.forEach(function (slide, slideIndex) {
      slide.classList.toggle('active', slideIndex === heroIndex);
    });
    heroDots.forEach(function (dot, dotIndex) {
      dot.classList.toggle('active', dotIndex === heroIndex);
    });
  }

  heroDots.forEach(function (dot) {
    dot.addEventListener('click', function () {
      const index = Number(dot.getAttribute('data-hero-dot')) || 0;
      showHeroSlide(index);
    });
  });

  if (heroSlides.length > 1) {
    setInterval(function () {
      showHeroSlide(heroIndex + 1);
    }, 5200);
  }

  const searchForms = Array.from(document.querySelectorAll('[data-global-search-form]'));

  searchForms.forEach(function (form) {
    const input = form.querySelector('[data-global-search]');
    const box = form.querySelector('[data-search-results]');

    if (!input || !box || !Array.isArray(window.MOVIE_SEARCH_DATA)) {
      return;
    }

    function renderSearch() {
      const query = input.value.trim().toLowerCase();
      if (!query) {
        box.classList.remove('active');
        box.innerHTML = '';
        return;
      }

      const results = window.MOVIE_SEARCH_DATA.filter(function (movie) {
        return movie.text.indexOf(query) !== -1;
      }).slice(0, 8);

      if (!results.length) {
        box.innerHTML = '<div class="search-empty">没有找到匹配内容</div>';
        box.classList.add('active');
        return;
      }

      box.innerHTML = results.map(function (movie) {
        return '<a class="search-result-item" href="' + movie.url + '">' +
          '<img src="' + movie.cover + '" alt="' + escapeHtml(movie.title) + '">' +
          '<span><strong>' + escapeHtml(movie.title) + '</strong>' +
          '<span>' + escapeHtml(movie.meta) + '</span></span>' +
          '</a>';
      }).join('');
      box.classList.add('active');
    }

    input.addEventListener('input', renderSearch);
    input.addEventListener('focus', renderSearch);

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      const first = box.querySelector('a');
      if (first) {
        window.location.href = first.getAttribute('href');
      }
    });

    document.addEventListener('click', function (event) {
      if (!form.contains(event.target)) {
        box.classList.remove('active');
      }
    });
  });

  const listingSections = Array.from(document.querySelectorAll('[data-listing-section]'));

  listingSections.forEach(function (section) {
    const search = section.querySelector('[data-card-search]');
    const chips = Array.from(section.querySelectorAll('[data-filter-value]'));
    const cards = Array.from(section.querySelectorAll('.movie-card-item'));
    let activeValue = 'all';

    function applyFilters() {
      const keyword = search ? search.value.trim().toLowerCase() : '';

      cards.forEach(function (card) {
        const dataText = [
          card.getAttribute('data-title'),
          card.getAttribute('data-region'),
          card.getAttribute('data-year'),
          card.getAttribute('data-genre')
        ].join(' ').toLowerCase();
        const matchesKeyword = !keyword || dataText.indexOf(keyword) !== -1;
        const matchesChip = activeValue === 'all' || dataText.indexOf(activeValue.toLowerCase()) !== -1;
        card.style.display = matchesKeyword && matchesChip ? '' : 'none';
      });
    }

    if (search) {
      search.addEventListener('input', applyFilters);
    }

    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        activeValue = chip.getAttribute('data-filter-value') || 'all';
        chips.forEach(function (item) {
          item.classList.toggle('active', item === chip);
        });
        applyFilters();
      });
    });
  });
});

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
