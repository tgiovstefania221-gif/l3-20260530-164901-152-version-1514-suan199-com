(function () {
    function ready(callback) {
        if (document.readyState !== "loading") {
            callback();
            return;
        }
        document.addEventListener("DOMContentLoaded", callback);
    }

    function setStatus(shell, message) {
        var status = shell.querySelector("[data-player-status]");
        if (status) {
            status.textContent = message;
        }
    }

    function setupPlayer(shell) {
        var video = shell.querySelector("video");
        var button = shell.querySelector("[data-play-button]");
        var source = shell.getAttribute("data-src");
        var hlsInstance = null;
        var initialized = false;

        if (!video || !source) {
            setStatus(shell, "暂无可用播放源");
            return;
        }

        function attachSource() {
            if (initialized) {
                return Promise.resolve();
            }
            initialized = true;
            setStatus(shell, "正在加载播放源");

            if (window.Hls && window.Hls.isSupported()) {
                hlsInstance = new window.Hls({
                    enableWorker: true,
                    lowLatencyMode: false
                });
                hlsInstance.loadSource(source);
                hlsInstance.attachMedia(video);
                hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, function () {
                    setStatus(shell, "播放源已就绪");
                });
                hlsInstance.on(window.Hls.Events.ERROR, function (event, data) {
                    if (data && data.fatal) {
                        setStatus(shell, "视频加载失败，请稍后重试");
                    }
                });
                return Promise.resolve();
            }

            if (video.canPlayType("application/vnd.apple.mpegurl")) {
                video.src = source;
                setStatus(shell, "播放源已就绪");
                return Promise.resolve();
            }

            setStatus(shell, "当前浏览器不支持 HLS 播放");
            return Promise.reject(new Error("HLS is not supported"));
        }

        function play() {
            attachSource().then(function () {
                var playPromise = video.play();
                if (playPromise && typeof playPromise.then === "function") {
                    playPromise.then(function () {
                        shell.classList.add("is-playing");
                        setStatus(shell, "正在播放");
                    }).catch(function () {
                        setStatus(shell, "请再次点击播放");
                    });
                } else {
                    shell.classList.add("is-playing");
                    setStatus(shell, "正在播放");
                }
            }).catch(function () {
                shell.classList.remove("is-playing");
            });
        }

        if (button) {
            button.addEventListener("click", play);
        }
        video.addEventListener("play", function () {
            shell.classList.add("is-playing");
            setStatus(shell, "正在播放");
        });
        video.addEventListener("pause", function () {
            shell.classList.remove("is-playing");
            setStatus(shell, "已暂停");
        });
        video.addEventListener("click", function () {
            if (video.paused) {
                play();
            }
        });
        window.addEventListener("beforeunload", function () {
            if (hlsInstance) {
                hlsInstance.destroy();
            }
        });
    }

    ready(function () {
        Array.prototype.slice.call(document.querySelectorAll("[data-player]")).forEach(setupPlayer);
    });
})();
