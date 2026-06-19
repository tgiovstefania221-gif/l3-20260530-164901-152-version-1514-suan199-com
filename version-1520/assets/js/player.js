(function () {
  const cards = Array.from(document.querySelectorAll('.player-card'));
  cards.forEach(function (card) {
    const video = card.querySelector('video');
    const button = card.querySelector('.player-start');
    const mediaUrl = card.getAttribute('data-video-url');
    let ready = false;

    function prepare() {
      if (!video || !mediaUrl) {
        return;
      }
      if (ready) {
        playVideo();
        return;
      }
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = mediaUrl;
        ready = true;
        playVideo();
        return;
      }
      if (window.Hls && window.Hls.isSupported()) {
        const hls = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hls.loadSource(mediaUrl);
        hls.attachMedia(video);
        hls.on(window.Hls.Events.MANIFEST_PARSED, function () {
          ready = true;
          playVideo();
        });
        return;
      }
      video.src = mediaUrl;
      ready = true;
      playVideo();
    }

    function playVideo() {
      card.classList.add('is-playing');
      const promise = video.play();
      if (promise && typeof promise.catch === 'function') {
        promise.catch(function () {});
      }
    }

    if (button) {
      button.addEventListener('click', prepare);
    }

    if (video) {
      video.addEventListener('click', function () {
        if (!ready) {
          prepare();
          return;
        }
        if (video.paused) {
          playVideo();
        } else {
          video.pause();
        }
      });
      video.addEventListener('play', function () {
        card.classList.add('is-playing');
      });
      video.addEventListener('pause', function () {
        if (video.currentTime === 0 || video.ended) {
          card.classList.remove('is-playing');
        }
      });
    }
  });
})();
