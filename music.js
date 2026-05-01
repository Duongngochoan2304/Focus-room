// ============================================================
// music.js — Music Player + White Noise
// ============================================================


// ===== PLAYLIST NHẠC NỀN =====
// Thêm bài: copy .mp3 vào music/, thêm object { name, src } vào đây
const PLAYLIST = [
  {
    name: "Lofi Chill Music — Free Music For Video",
    src:  "music/freemusicforvideo-lofi-chill-music-495628.mp3"
  },
  {
    name: "Lofi Jazz Music — Lofi Dreams",
    src:  "music/lofidreams-lofi-jazz-music-485312.mp3"
  },
  {
    name: "Lofi Chill — Monda Music",
    src:  "music/mondamusic-lofi-chill-491719.mp3"
  },
  // ── THÊM BÀI MỚI VÀO ĐÂY ──
  // { name: "Tên bài", src: "music/tenfile.mp3" },
];


// ===== WHITE NOISE OPTIONS =====
// Danh sách này ĐỒNG BỘ với các .wn-option trong HTML (cùng thứ tự)
// data-src trong HTML là nguồn chính — JS đọc trực tiếp từ DOM
// Chỉ cần sửa data-src trong HTML để đổi file âm thanh
// Thư mục gợi ý: sounds/rain.mp3, sounds/forest.mp3, ...


// ===== TRẠNG THÁI =====
let currentIndex   = 0;      // index bài đang phát
let isPlaying      = false;  // nhạc đang phát hay không
let activeNoiseBtn = null;   // nút white noise đang active (null = tắt)


// ===== AUDIO ELEMENTS =====
// Audio chính cho nhạc nền playlist
const audio = new Audio();
audio.loop   = false;          // loop toàn playlist: bài cuối → bài đầu
audio.volume = loadVolume();

// Audio riêng cho white noise — loop liên tục
const noiseAudio = new Audio();
noiseAudio.loop   = true;
noiseAudio.volume = 0.5;      // volume mặc định white noise


// ===== THAM CHIẾU DOM =====
const musicWidget        = document.getElementById("musicWidget");
const musicPlayBtn       = document.getElementById("musicPlayBtn");
const musicPlayIcon      = document.getElementById("musicPlayIcon");
const musicTitle         = document.getElementById("musicTitle");
const musicTitleWrapper  = document.getElementById("musicTitleWrapper");
const musicVolumeSlider  = document.getElementById("musicVolumeSlider");
const musicVolumeIcon    = document.getElementById("musicVolumeIcon");
const musicVolumeValue   = document.getElementById("musicVolumeValue");
const musicVolumeWrap    = document.getElementById("musicVolumeWrap");
const musicVolumePopup   = document.getElementById("musicVolumePopup");
const whiteNoiseBtn      = document.getElementById("whiteNoiseBtn");
const whiteNoisePanel    = document.getElementById("whiteNoisePanel");
const wnOptions          = document.querySelectorAll(".wn-option");


// ===== LOAD / SAVE VOLUME =====
function loadVolume() {
  const v = localStorage.getItem("focusroom_volume");
  return v !== null ? parseFloat(v) : 0.7;
}

function saveVolume(val) {
  localStorage.setItem("focusroom_volume", String(val));
}


// ===== PLAYLIST — NẠP & PHÁT =====
function loadTrack(index) {
  const track = PLAYLIST[index];
  audio.src   = track.src;
  audio.load();

  // Reset marquee về đầu
  musicTitle.style.animation = "none";
  musicTitle.style.transform = "translateX(0)";
  musicTitle.textContent     = track.name;
  requestAnimationFrame(setupMarquee);
}

// Khi hết bài: chuyển bài tiếp (playlist loop)
audio.addEventListener("ended", () => {
  currentIndex = (currentIndex + 1) % PLAYLIST.length;
  loadTrack(currentIndex);
  playAudio();
});

audio.addEventListener("error", (e) => {
  console.error("Audio error — kiểm tra đường dẫn file:", audio.src, e);
});


// ===== PLAY / PAUSE =====
function playAudio() {
  const p = audio.play();
  if (p !== undefined) {
    p.then(() => {
      isPlaying = true;
      updatePlayUI();
    }).catch(err => {
      console.warn("Trình duyệt chặn autoplay:", err);
      isPlaying = false;
      updatePlayUI();
    });
  } else {
    isPlaying = true;
    updatePlayUI();
  }
}

function pauseAudio() {
  audio.pause();
  isPlaying = false;
  updatePlayUI();
}

function togglePlay() {
  isPlaying ? pauseAudio() : playAudio();
}

// SVG icon play ▶ và pause ⏸
const SVG_PLAY  = '<path d="M8 5v14l11-7z"/>';
const SVG_PAUSE = '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>';

function updatePlayUI() {
  musicPlayIcon.innerHTML = isPlaying ? SVG_PAUSE : SVG_PLAY;
  musicPlayBtn.title      = isPlaying ? "Pause" : "Play";
  musicWidget.classList.toggle("playing", isPlaying);
}

musicPlayBtn.addEventListener("click", togglePlay);


// ===== VOLUME — popup dọc qua JS (không dùng CSS :hover) =====
// Dùng JS để kiểm soát show/hide popup: tránh bị đóng khi kéo slider
// ra khỏi vùng icon một chút

let volumeHideTimer = null; // delay trước khi đóng popup

function showVolumePopup() {
  clearTimeout(volumeHideTimer);
  musicVolumePopup.classList.add("vol-visible");
}

function hideVolumePopupDelayed() {
  // Đợi 300ms trước khi đóng — đủ để chuột di chuyển giữa icon và popup
  volumeHideTimer = setTimeout(() => {
    musicVolumePopup.classList.remove("vol-visible");
  }, 300);
}

// Hover vào wrap (icon + popup) → mở
musicVolumeWrap.addEventListener("mouseenter", showVolumePopup);
musicVolumeWrap.addEventListener("mouseleave", hideVolumePopupDelayed);

// Hover vào popup riêng → giữ mở (cancel timer)
musicVolumePopup.addEventListener("mouseenter", showVolumePopup);
musicVolumePopup.addEventListener("mouseleave", hideVolumePopupDelayed);

// Cập nhật volume UI
musicVolumeSlider.value = audio.volume;
updateVolumeUI(audio.volume);

function updateVolumeUI(val) {
  const pct = Math.round(val * 100);
  if (musicVolumeValue) musicVolumeValue.textContent = pct + "%";

  // Icon loa theo mức âm lượng
  if (val === 0)       musicVolumeIcon.textContent = "🔇";
  else if (val < 0.4)  musicVolumeIcon.textContent = "🔈";
  else if (val < 0.75) musicVolumeIcon.textContent = "🔉";
  else                 musicVolumeIcon.textContent = "🔊";

  musicWidget.classList.toggle("muted", val === 0);
}

musicVolumeSlider.addEventListener("input", () => {
  const val    = parseFloat(musicVolumeSlider.value);
  audio.volume = val;
  saveVolume(val);
  updateVolumeUI(val);
});

// Click icon loa → mute/unmute
let volBeforeMute = audio.volume;
musicVolumeIcon.addEventListener("click", (e) => {
  e.stopPropagation();
  if (audio.volume > 0) {
    volBeforeMute          = audio.volume;
    audio.volume           = 0;
    musicVolumeSlider.value = 0;
    saveVolume(0);
  } else {
    const r                = volBeforeMute > 0 ? volBeforeMute : 0.7;
    audio.volume           = r;
    musicVolumeSlider.value = r;
    saveVolume(r);
  }
  updateVolumeUI(audio.volume);
});


// ===== WHITE NOISE PANEL =====
// Toggle hiện / ẩn panel khi click nút white noise
whiteNoiseBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  whiteNoisePanel.classList.toggle("wn-hidden");
  whiteNoiseBtn.classList.toggle("wn-btn-active");
});

// Đóng panel khi click bên ngoài widget
document.addEventListener("click", (e) => {
  if (!musicWidget.contains(e.target)) {
    whiteNoisePanel.classList.add("wn-hidden");
    whiteNoiseBtn.classList.remove("wn-btn-active");
  }
});

// Xử lý chọn / bỏ chọn từng option white noise
wnOptions.forEach(btn => {
  btn.addEventListener("click", () => {
    const src = btn.dataset.src;

    if (activeNoiseBtn === btn) {
      // Click lại option đang chạy → tắt white noise
      noiseAudio.pause();
      noiseAudio.src = "";
      btn.classList.remove("wn-active");
      activeNoiseBtn = null;
      whiteNoiseBtn.classList.remove("wn-noise-on");
    } else {
      // Tắt option trước (nếu có)
      if (activeNoiseBtn) activeNoiseBtn.classList.remove("wn-active");

      // Phát option mới
      // ── LƯU Ý: nếu file chưa có, audio.play() sẽ lỗi ──
      // ── Thêm file vào thư mục sounds/ và đặt đúng data-src ──
      noiseAudio.src = src;
      noiseAudio.load();
      noiseAudio.play().catch(err =>
        console.warn("White noise error — kiểm tra file:", src, err)
      );

      btn.classList.add("wn-active");
      activeNoiseBtn = btn;
      whiteNoiseBtn.classList.add("wn-noise-on"); // dot trên nút báo đang bật
    }
  });
});


// ===== MARQUEE — tên bài chạy khi hover nếu dài =====
function setupMarquee() {
  const wrapW = musicTitleWrapper.offsetWidth;
  const textW = musicTitle.scrollWidth;

  if (textW > wrapW) {
    musicTitle.classList.add("scrolling");
    const dist = textW - wrapW + 12;
    const dur  = Math.max(dist / 40, 2);
    musicTitle.style.setProperty("--marquee-distance", `-${dist}px`);
    musicTitle.style.setProperty("--marquee-duration",  `${dur}s`);
  } else {
    musicTitle.classList.remove("scrolling");
  }
}

musicTitleWrapper.addEventListener("mouseleave", () => {
  musicTitle.style.animation = "none";
  musicTitle.style.transform = "translateX(0)";
  void musicTitle.offsetWidth;
  musicTitle.style.animation  = "";
});


// ===== KHỞI TẠO =====
loadTrack(currentIndex);
updatePlayUI();
