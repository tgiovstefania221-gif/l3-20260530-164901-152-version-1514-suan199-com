(function () {
  const body = document.body;
  const menu = document.querySelector('.menu-toggle');
  if (menu) {
    menu.addEventListener('click', function () {
      body.classList.toggle('menu-open');
    });
  }

  const slides = Array.from(document.querySelectorAll('.hero-slide'));
  const dots = Array.from(document.querySelectorAll('.hero-dot'));
  let current = 0;
  let timer = null;

  function showSlide(index) {
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

  function startHero() {
    if (slides.length < 2) {
      return;
    }
    window.clearInterval(timer);
    timer = window.setInterval(function () {
      showSlide(current + 1);
    }, 5200);
  }

  dots.forEach(function (dot) {
    dot.addEventListener('click', function () {
      const index = Number(dot.getAttribute('data-slide') || 0);
      showSlide(index);
      startHero();
    });
  });

  startHero();

  const inputs = Array.from(document.querySelectorAll('.movie-search'));
  inputs.forEach(function (input) {
    input.addEventListener('input', function () {
      const term = input.value.trim().toLowerCase();
      const areas = Array.from(document.querySelectorAll('.searchable-area'));
      areas.forEach(function (area) {
        const cards = Array.from(area.querySelectorAll('.movie-card, .rank-item'));
        let shown = 0;
        cards.forEach(function (card) {
          const haystack = [
            card.getAttribute('data-title') || '',
            card.getAttribute('data-year') || '',
            card.getAttribute('data-genre') || '',
            card.getAttribute('data-category') || '',
            card.textContent || ''
          ].join(' ').toLowerCase();
          const match = !term || haystack.includes(term);
          card.style.display = match ? '' : 'none';
          if (match) {
            shown += 1;
          }
        });
        let empty = area.querySelector('.no-results');
        if (!shown && term) {
          if (!empty) {
            empty = document.createElement('div');
            empty.className = 'no-results';
            empty.textContent = '没有找到匹配影片';
            area.appendChild(empty);
          }
        } else if (empty) {
          empty.remove();
        }
      });
    });
  });
})();
