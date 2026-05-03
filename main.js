// ============================================================
// main.js — Logic đồng hồ Pomodoro
// Quản lý: timer, vòng tròn SVG, progress track, preset,
//          chuyển đổi full/mini, sync khi tab ẩn
// ============================================================


// ===== CẤU HÌNH MẶC ĐỊNH =====
// Thời gian tính bằng giây, sẽ được ghi đè khi chọn preset
let focusTime     = 25 * 60; // giây focus mỗi session
let breakTime     = 5  * 60; // giây nghỉ mỗi session
let totalSessions = 8;        // tổng số mốc (focus + break xen kẽ)


// ===== TRẠNG THÁI =====
let timeLeft         = focusTime; // giây còn lại của session hiện tại
let currentMode      = "focus";   // "focus" | "break"
let timer            = null;      // ID của setTimeout hiện tại
let isRunning        = false;     // đang chạy hay không
let sessionIndex     = 0;         // mốc hiện tại (0 → totalSessions-1)
let isMini           = false;     // đang ở chế độ mini hay full
let focusSessionCount = 0;        // số session focus đã xong trong ngày
let tickStartTime    = null;      // timestamp lúc bắt đầu tick (dùng tính time thực)
let tickStartLeft    = null;      // timeLeft lúc bắt đầu tick


// ===== THAM CHIẾU DOM =====
const timerDisplay    = document.getElementById("timer");
const statusDisplay   = document.getElementById("status");
const circle          = document.getElementById("progressCircle");
const circleContainer = document.getElementById("circleContainer");
const progressFill    = document.getElementById("progressFill");
const progressTrack   = document.getElementById("progressTrack");
const uiFull          = document.getElementById("uiFull");
const miniWidget      = document.getElementById("miniWidget");
const miniTimerEl     = document.getElementById("miniTimer");
const miniStatusEl    = document.getElementById("miniStatus");

// Float timer refs
const floatTimerEl  = document.getElementById("floatTimer");
const floatTimeEl   = document.getElementById("floatTime");
const floatModeEl   = document.getElementById("floatMode");


// ===== VÒNG TRÒN SVG =====
const radius       = 88;                        // bán kính vòng tròn (khớp với SVG)
const circumference = 2 * Math.PI * radius;    // chu vi vòng tròn ≈ 553px

// Thiết lập độ dài stroke ban đầu
circle.style.strokeDasharray = circumference;

// Cập nhật vòng tròn mỗi giây dựa trên timeLeft và mode
function updateCircle() {
  let offset;

  if (currentMode === "focus") {
    // Focus: vòng rút dần từ đầy → trống (offset tăng dần)
    offset = circumference * (1 - timeLeft / focusTime);
  } else {
    // Break: vòng fill dần từ trống → đầy (offset giảm dần)
    offset = circumference * (timeLeft / breakTime);
  }

  // Màu cam cho cả 2 mode (có thể tuỳ chỉnh sau)
  circle.style.stroke = "#9b4db5";
  circle.style.filter = "drop-shadow(0 0 6px rgba(155,77,181,0.6))";
  circle.style.strokeDashoffset = offset;
}


// ===== HIỂN THỊ THỜI GIAN =====
// Thêm số 0 phía trước nếu < 10 (vd: 5 → "05")
function pad(n) { return n < 10 ? "0" + n : n; }

// Cập nhật tất cả nơi hiển thị thời gian + vòng tròn + fill
function updateDisplay() {
  const m = Math.floor(timeLeft / 60);
  const s = timeLeft % 60;
  const timeStr = `${pad(m)}:${pad(s)}`;

  timerDisplay.textContent = timeStr;  // số giờ full UI
  miniTimerEl.textContent  = timeStr;  // số giờ mini widget

  // Float timer — luôn sync
  if (floatTimeEl) floatTimeEl.textContent = timeStr;
  if (floatModeEl) floatModeEl.textContent = currentMode === "focus" ? "🎯" : "☕";

  updateCircle();
  renderFill();
}

// Cập nhật text trạng thái ở cả full và mini
function updateStatusText(text) {
  statusDisplay.textContent = text;
  miniStatusEl.textContent  = text;
}


// ===== THANH TIẾN TRÌNH =====

// Xoá toàn bộ dot cũ và tạo lại n dot mới
// Được gọi khi đổi preset hoặc custom
function rebuildDots(n) {
  progressTrack.querySelectorAll(".dot").forEach(d => d.remove());
  for (let i = 0; i < n; i++) {
    const dot = document.createElement("div");
    dot.className = "dot";
    dot.dataset.index = i;
    progressTrack.appendChild(dot);
  }
}

// Cập nhật class cho từng dot: done / active / chưa tới
function updateProgress() {
  const dots = document.querySelectorAll(".dot");
  dots.forEach((dot, i) => {
    // Reset toàn bộ style inline và class trước
    dot.classList.remove("active", "done-focus", "done-break");
    dot.style.background  = "";
    dot.style.borderColor = "";
    dot.style.transform   = "";

    if (i < sessionIndex) {
      // Dot đã hoàn thành: tô màu theo loại session
      dot.classList.add(i % 2 === 0 ? "done-focus" : "done-break");
    } else if (i === sessionIndex && sessionIndex < totalSessions) {
      // Dot đang chạy
      dot.classList.add("active");
    }
    // Dot chưa tới: không thêm class gì
  });

  renderFill();
}

// Fill dot hiện tại dần theo % thời gian + fill đường line ngang
function renderFill() {
  const dots    = document.querySelectorAll(".dot");
  const total   = currentMode === "focus" ? focusTime : breakTime;
  const elapsed = total - timeLeft;
  const fraction = Math.min(elapsed / total, 1); // 0.0 → 1.0

  // Fill màu vào dot đang active theo tỉ lệ thời gian đã qua
  if (sessionIndex < totalSessions && dots[sessionIndex]) {
    const dot         = dots[sessionIndex];
    const isFocusDot  = sessionIndex % 2 === 0;
    const color       = isFocusDot ? "155,77,181" : "78,168,160"; // cam : teal
    const borderColor = isFocusDot ? "#9b4db5" : "#9b4db5";

    dot.style.background  = `rgba(${color}, ${fraction})`;
    dot.style.borderColor = borderColor;
    // Dot phình nhẹ khi gần đầy
    dot.style.transform   = `scale(${(1.25 + fraction * 0.15).toFixed(3)})`;
  }

  // Fill đường line ngang theo tổng tiến trình
  const segmentSize = totalSessions > 1 ? 1 / (totalSessions - 1) : 1;
  const pct = Math.min((sessionIndex + fraction) * segmentSize * 100, 100);
  progressFill.style.width      = pct + "%";
  progressFill.style.background = "#9b4db5";
}


// ===== CHUYỂN MODE =====
// Được gọi khi một session kết thúc: focus → break hoặc break → focus
function switchMode() {
  sessionIndex++; // tiến sang mốc tiếp theo

  // Tắt transition vòng tròn để reset vị trí không bị animation ngược
  circle.style.transition = "none";

  if (currentMode === "focus") {
    // Focus vừa xong → đếm session, bắn event cho tasks.js xử lý thưởng
    focusSessionCount++;
    const cycleComplete = sessionIndex >= totalSessions;

    // CustomEvent để tasks.js lắng nghe mà không cần coupling trực tiếp
    window.dispatchEvent(new CustomEvent("focusSessionDone", {
      detail: { focusCount: focusSessionCount, cycleComplete }
    }));

    currentMode = "break";
    timeLeft    = breakTime;
    updateStatusText("Break Time ☕");
  } else {
    // Break xong → quay lại focus
    currentMode = "focus";
    timeLeft    = focusTime;
    updateStatusText("Focus Time 🎯");
  }

  // Bật lại transition sau 1 frame (tránh flash)
  requestAnimationFrame(() => {
    circle.style.transition = "stroke-dashoffset 1s linear, stroke 0.6s ease, filter 0.6s ease";
  });

  updateProgress();
}


// ===== TIMER =====
// Dùng Date.now() thay vì setInterval để chính xác khi tab bị ẩn

function startTimer() {
  if (isRunning) return;                    // tránh tạo nhiều timer cùng lúc
  if (sessionIndex >= totalSessions) return; // đã hết chu kỳ

  isRunning     = true;
  tickStartTime = Date.now();   // lưu mốc thời gian bắt đầu
  tickStartLeft = timeLeft;     // lưu timeLeft lúc bắt đầu

  updateStatusText(currentMode === "focus" ? "Focus Time 🎯" : "Break Time ☕");

  function tick() {
    if (!isRunning) return; // đã bị pause/reset thì dừng

    // Tính timeLeft dựa trên thời gian thực → không bị lệch khi tab ẩn
    const elapsed = Math.floor((Date.now() - tickStartTime) / 1000);
    timeLeft = Math.max(tickStartLeft - elapsed, 0);

    if (timeLeft <= 0) {
      // Session kết thúc
      isRunning = false;

      if (sessionIndex + 1 >= totalSessions) {
        // Đây là session CUỐI cùng của chu kỳ
        focusSessionCount++;
        window.dispatchEvent(new CustomEvent("focusSessionDone", {
          detail: { focusCount: focusSessionCount, cycleComplete: true }
        }));
        sessionIndex++;
        updateProgress();
        updateStatusText("Done! 🎉");
        updateDisplay();
        return;
      }

      // Chuyển sang mode tiếp theo và tự động start
      switchMode();
      updateDisplay();
      startTimer();
      return;
    }

    updateDisplay();
    // Poll mỗi 200ms: đủ mượt cho UI, không quá nặng
    timer = setTimeout(tick, 200);
  }

  tick(); // bắt đầu ngay lập tức
}

function pauseTimer() {
  clearTimeout(timer);
  isRunning = false;
  updateStatusText("Paused ⏸");
}

function resetTimer() {
  clearTimeout(timer);
  isRunning     = false;
  currentMode   = "focus";
  timeLeft      = focusTime;
  sessionIndex  = 0;
  tickStartTime = null;
  tickStartLeft = null;
  updateStatusText("Ready");
  updateProgress();
  updateDisplay();
}


// ===== PRESET =====
// Áp dụng chế độ thời gian được chọn, rebuild dot và reset timer
function applyPreset(btn) {
  if (isRunning) return; // không cho đổi khi đang chạy

  // Bỏ active khỏi tất cả, đánh dấu nút được chọn
  document.querySelectorAll(".preset-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");

  // Đọc giá trị từ data attribute (đơn vị: phút → đổi sang giây)
  focusTime     = Math.round(parseFloat(btn.dataset.focus) * 60);
  breakTime     = Math.round(parseFloat(btn.dataset.break) * 60);
  totalSessions = parseInt(btn.dataset.sessions);

  rebuildDots(totalSessions);
  resetTimer();
}

// Gán sự kiện cho tất cả preset button (trừ customBtn — xử lý riêng)
document.querySelectorAll(".preset-btn").forEach(btn => {
  btn.onclick = () => applyPreset(btn);
});


// ===== CUSTOM PANEL =====
const customBtn      = document.getElementById("customBtn");
const customPanel    = document.getElementById("customPanel");
const customApplyBtn = document.getElementById("customApplyBtn");

// Toggle hiện/ẩn panel nhập tay
customBtn.onclick = () => {
  if (isRunning) return;
  customPanel.classList.toggle("visible");
};

// Áp dụng thời gian tuỳ chỉnh
customApplyBtn.onclick = () => {
  if (isRunning) return;

  const fVal = parseFloat(document.getElementById("customFocus").value);
  const bVal = parseFloat(document.getElementById("customBreak").value);
  if (!fVal || fVal <= 0 || !bVal || bVal <= 0) return;

  focusTime     = Math.round(fVal * 60);
  breakTime     = Math.round(bVal * 60);
  totalSessions = 6; // custom cố định 6 mốc

  document.querySelectorAll(".preset-btn").forEach(b => b.classList.remove("active"));
  customBtn.classList.add("active");

  rebuildDots(totalSessions);
  resetTimer();
  customPanel.classList.remove("visible");
};


// ===== CHUYỂN ĐỔI FULL / MINI =====
function goMini() {
  isMini = true;
  uiFull.classList.add("hidden");       // ẩn full UI (scale out)
  miniWidget.classList.remove("hidden"); // hiện mini widget (scale in)
}

function goFull() {
  isMini = false;
  miniWidget.classList.add("hidden");   // ẩn mini
  uiFull.classList.remove("hidden");    // hiện full
}


// ===== HIỆN / ẨN FLOAT TIMER =====
function showFloatTimer() {
  if (!floatTimerEl) return;
  floatTimerEl.classList.remove("float-hidden");
}

function hideFloatTimer() {
  if (!floatTimerEl) return;
  floatTimerEl.classList.add("float-hidden");
}

// ===== SYNC KHI TAB ĐƯỢC FOCUS LẠI =====
// Dùng cả 3 event để bắt mọi trường hợp chuyển tab / chuyển app
// trên tất cả trình duyệt (Chrome, Cốc Cốc, Firefox, Safari...)

document.addEventListener("visibilitychange", () => {
  // Sync timer khi quay lại tab
  if (!document.hidden && isRunning) {
    const elapsed = Math.floor((Date.now() - tickStartTime) / 1000);
    timeLeft = Math.max(tickStartLeft - elapsed, 0);
    updateDisplay();
  }
  // Hiện/ẩn float timer
  document.hidden ? showFloatTimer() : hideFloatTimer();
});

// window blur: người dùng chuyển sang tab/app khác
window.addEventListener("blur", () => {
  showFloatTimer();
});

// window focus: người dùng quay lại tab này
window.addEventListener("focus", () => {
  hideFloatTimer();
  // Sync timer khi quay lại
  if (isRunning) {
    const elapsed = Math.floor((Date.now() - tickStartTime) / 1000);
    timeLeft = Math.max(tickStartLeft - elapsed, 0);
    updateDisplay();
  }
});


// ===== GÁN SỰ KIỆN NÚT =====
document.getElementById("startBtn").onclick         = startTimer;
document.getElementById("pauseBtn").onclick         = pauseTimer;
document.getElementById("resetBtn").onclick         = resetTimer;
document.getElementById("clockCollapseBtn").onclick = goMini;
document.getElementById("miniStartBtn").onclick     = startTimer;
document.getElementById("miniPauseBtn").onclick     = pauseTimer;
document.getElementById("miniExpandBtn").onclick    = goFull;

// Float timer buttons
if (document.getElementById("floatStartBtn")) {
  document.getElementById("floatStartBtn").onclick = startTimer;
}
if (document.getElementById("floatPauseBtn")) {
  document.getElementById("floatPauseBtn").onclick = pauseTimer;
}


// ===== FLOAT TIMER DRAG TO MOVE =====
(function initFloatDrag() {
  if (!floatTimerEl) return;

  let dragging    = false;
  let offsetX     = 0;
  let offsetY     = 0;

  // Khôi phục vị trí đã lưu
  const saved = localStorage.getItem("focusroom_float_pos");
  if (saved) {
    try {
      const { x, y } = JSON.parse(saved);
      floatTimerEl.style.right = "auto";
      floatTimerEl.style.left  = Math.max(8, Math.min(window.innerWidth  - 180, x)) + "px";
      floatTimerEl.style.top   = Math.max(8, Math.min(window.innerHeight - 60,  y)) + "px";
    } catch {}
  }

  function savePos() {
    localStorage.setItem("focusroom_float_pos", JSON.stringify({
      x: parseInt(floatTimerEl.style.left  || 0),
      y: parseInt(floatTimerEl.style.top   || 20),
    }));
  }

  // Mouse
  floatTimerEl.addEventListener("mousedown", (e) => {
    if (e.target.closest("#floatControls")) return; // click nút thì không drag
    dragging = true;
    const r  = floatTimerEl.getBoundingClientRect();
    offsetX  = e.clientX - r.left;
    offsetY  = e.clientY - r.top;
    floatTimerEl.style.right      = "auto";
    floatTimerEl.style.transition = "opacity 0.3s ease, transform 0.3s ease";
    floatTimerEl.classList.add("float-dragging");
    e.preventDefault();
  });

  document.addEventListener("mousemove", (e) => {
    if (!dragging) return;
    const fw = floatTimerEl.offsetWidth;
    const fh = floatTimerEl.offsetHeight;
    floatTimerEl.style.left = Math.max(8, Math.min(window.innerWidth  - fw - 8, e.clientX - offsetX)) + "px";
    floatTimerEl.style.top  = Math.max(8, Math.min(window.innerHeight - fh - 8, e.clientY - offsetY)) + "px";
  });

  document.addEventListener("mouseup", () => {
    if (!dragging) return;
    dragging = false;
    floatTimerEl.classList.remove("float-dragging");
    floatTimerEl.style.transition = "opacity 0.3s ease, transform 0.3s ease, box-shadow 0.2s ease";
    savePos();
  });

  // Touch
  floatTimerEl.addEventListener("touchstart", (e) => {
    if (e.target.closest("#floatControls")) return;
    dragging = true;
    const r = floatTimerEl.getBoundingClientRect();
    offsetX = e.touches[0].clientX - r.left;
    offsetY = e.touches[0].clientY - r.top;
    floatTimerEl.style.right = "auto";
    e.preventDefault();
  }, { passive: false });

  document.addEventListener("touchmove", (e) => {
    if (!dragging) return;
    const fw = floatTimerEl.offsetWidth;
    const fh = floatTimerEl.offsetHeight;
    floatTimerEl.style.left = Math.max(8, Math.min(window.innerWidth  - fw - 8, e.touches[0].clientX - offsetX)) + "px";
    floatTimerEl.style.top  = Math.max(8, Math.min(window.innerHeight - fh - 8, e.touches[0].clientY - offsetY)) + "px";
    e.preventDefault();
  }, { passive: false });

  document.addEventListener("touchend", () => {
    if (!dragging) return;
    dragging = false;
    savePos();
  });
})();


// ===== KHỞI TẠO =====
uiFull.classList.add("hidden");
applyPreset(document.querySelector(".preset-btn.active"));