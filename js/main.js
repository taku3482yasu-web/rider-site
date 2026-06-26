let mainPlayer;
let soundPlayer; // ★音専用プレイヤー
const subPlayers = [];
let mainVideoList = [];
let currentMainIndex = 0;
let soundTimeout;

/* ===== メイン動画取得 ===== */
function getMainVideoList() {
  const el = document.getElementById('mainPlayer');
  if (!el) return [];

  if (el.dataset.videos) {
    return el.dataset.videos.split(',').map(v => v.trim());
  }

  if (el.dataset.videoid) {
    return [el.dataset.videoid];
  }

  return [];
}

let ytInitialized = false;

/* ===== YouTube準備 ===== */
function initYouTubePlayers() {
  if (ytInitialized) return;
  ytInitialized = true;

  const mainEl = document.getElementById('mainPlayer');

  /* ===== メイン動画 ===== */
  if (mainEl) {
    mainVideoList = getMainVideoList();

    if (mainVideoList.length > 0) {
      mainPlayer = new YT.Player('mainPlayer', {
        videoId: mainVideoList[0],
        playerVars: {
          autoplay: 1,
          playsinline: 1,
          loop: 1,
        
          controls: 0,
          playlist: mainVideoList.join(',')
        },
        events: {
          onReady: (e) => {
            
            e.target.playVideo();
          },
          onStateChange: onMainStateChange
        }
      });
    }
  }

  /* ===== 音専用プレイヤー（見えない） ===== */
  soundPlayer = new YT.Player('soundPlayer', {
    height: '0',
    width: '0'
  });

  /* ===== サブ動画 ===== */
  document.querySelectorAll('.subPlayer').forEach(el => {
    const p = new YT.Player(el, {
      events: { onStateChange: onSubStateChange }
    });
    subPlayers.push(p);
  });
}

window.onYouTubeIframeAPIReady = initYouTubePlayers;

// APIが先に準備済みでも初期化する
if (window.YT && typeof YT.Player === "function") {
  initYouTubePlayers();
}

/* ===== サブ動画制御 ===== */
function onSubStateChange(event) {

  // soundPlayer がまだ生成されていない場合は何もしない
  if (!soundPlayer || typeof soundPlayer.getPlayerState !== "function") {
    return;
  }

  // サブ動画が再生開始したら
  if (event.data === YT.PlayerState.PLAYING) {

    // ① メイン動画があれば停止
    if (mainPlayer && typeof mainPlayer.pauseVideo === "function") {
      mainPlayer.pauseVideo();
    }

    // ② 変身音も完全停止（安全にチェック）
    const spState = soundPlayer.getPlayerState();
    if (spState === YT.PlayerState.PLAYING || spState === YT.PlayerState.BUFFERING) {
      soundPlayer.stopVideo();
      clearTimeout(soundTimeout);
    }
  }

  // サブ動画が停止したらメイン動画を再開
  if (
    event.data === YT.PlayerState.PAUSED ||
    event.data === YT.PlayerState.ENDED
  ) {

    const playing = subPlayers.some(
      p => p.getPlayerState() === YT.PlayerState.PLAYING
    );

    if (!playing && mainPlayer && typeof mainPlayer.playVideo === "function") {
      mainPlayer.playVideo();
    }
  }
}



/* ===== メイン動画ループ ===== */
function onMainStateChange(event) {
  if (event.data !== YT.PlayerState.ENDED) return;

  currentMainIndex++;
  if (currentMainIndex >= mainVideoList.length) {
    currentMainIndex = 0;
  }

  event.target.loadVideoById(mainVideoList[currentMainIndex]);
}

/* ===== ★音再生（YouTube版） ===== */
function playSound(videoId, startTime, duration) {
  if (!soundPlayer) return;

  // ① 前の音を完全停止
  clearTimeout(soundTimeout);
  soundPlayer.stopVideo();

  // ② メイン動画を停止
  if (mainPlayer) {
    mainPlayer.pauseVideo();
  }

  // ③ サブ動画をすべて停止
  subPlayers.forEach(p => {
    const state = p.getPlayerState();
    if (state === YT.PlayerState.PLAYING || state === YT.PlayerState.BUFFERING) {
      p.stopVideo();
    }
  });

  // ④ 変身音を再生
  soundPlayer.loadVideoById({
    videoId: videoId,
    startSeconds: startTime
  });

  // ⑤ duration 秒後に完全停止し、メイン動画を再開
  soundTimeout = setTimeout(() => {

    // 完全停止
    soundPlayer.stopVideo();

    // ★★★ ここが重要 ★★★
    // soundPlayer が完全停止するまで待つ
    const waitStop = setInterval(() => {
      const state = soundPlayer.getPlayerState();

      // 完全停止状態（UNSTARTED or CUED）になったら再開処理へ
      if (state === YT.PlayerState.UNSTARTED || state === YT.PlayerState.CUED) {
        clearInterval(waitStop);

        // サブ動画が再生中でなければメイン動画を再開
        const playingSub = subPlayers.some(
          p => p.getPlayerState() === YT.PlayerState.PLAYING
        );

        if (!playingSub && mainPlayer) {
          mainPlayer.playVideo();
        }
      }
    }, 50); // 50msごとにチェック
  }, duration * 1000);
}
//ライダーズクレスト
window.addEventListener("DOMContentLoaded", () => {

    document.querySelectorAll(".riders button").forEach(button => {
        const img = button.dataset.img;

        if (img) {
            button.style.backgroundImage = `url(images/${img}.png)`;
            button.style.backgroundSize = "cover";
            button.style.backgroundPosition = "center";
            button.style.backgroundRepeat = "no-repeat";
        }
    });

});

/* ===== トップへ ===== */
$(function () {
  $('.top').on('click', function () {
    $('html,body').animate({ scrollTop: 0 }, 300);
  });
});