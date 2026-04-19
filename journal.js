// ============================================================
// journal.js — Logic Calendar + Journal (Cuốn sổ 2 trang)
// Quản lý: render lịch tháng, điều hướng tháng, click chọn ngày,
//          lưu/đọc ghi chú vào localStorage, auto-save debounced,
//          mở/đóng modal cuốn sổ
// ============================================================


// ===== STORAGE KEY =====
// Tất cả ghi chú journal lưu dưới key này trong localStorage
// Cấu trúc: { "YYYY-MM-DD": "nội dung ghi chú", ... }
const JOURNAL_KEY = "focusroom_journal";


// ===== ĐỌC / GHI DỮ LIỆU =====

// Đọc toàn bộ journal từ localStorage, trả về {} nếu lỗi
function loadJournal() {
  try {
    return JSON.parse(localStorage.getItem(JOURNAL_KEY)) || {};
  } catch {
    return {};
  }
}

// Ghi toàn bộ đối tượng journal vào localStorage
function saveJournal(data) {
  localStorage.setItem(JOURNAL_KEY, JSON.stringify(data));
}

// Lấy ghi chú của một ngày cụ thể (trả về "" nếu chưa có)
function getNoteForDate(dateKey) {
  return loadJournal()[dateKey] || "";
}

// Lưu hoặc xoá ghi chú cho một ngày cụ thể
// Nếu content rỗng → xoá khỏi object (tiết kiệm storage)
function setNoteForDate(dateKey, content) {
  const data = loadJournal();
  if (content.trim()) {
    data[dateKey] = content;
  } else {
    delete data[dateKey]; // xoá key nếu nội dung rỗng
  }
  saveJournal(data);
}

// Xoá ghi chú của một ngày (wrapper gọn hơn)
function clearNoteForDate(dateKey) {
  setNoteForDate(dateKey, "");
}

// Chuyển đối tượng Date thành chuỗi "YYYY-MM-DD"
// Dùng toISOString().slice(0,10) có thể bị lệch múi giờ → dùng thủ công
function toDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}


// ===== THAM CHIẾU DOM =====
const journalToggleBtn  = document.getElementById("journalToggleBtn");  // nút mở/đóng
const journalOverlay    = document.getElementById("journalOverlay");    // overlay nền mờ
const journalModal      = document.getElementById("journalModal");      // modal cuốn sổ
const calendarMonthLbl  = document.getElementById("calendarMonthLabel"); // "Tháng 4 — 2025"
const calendarGrid      = document.getElementById("calendarGrid");       // lưới ngày
const calPrevBtn        = document.getElementById("calPrevBtn");         // nút tháng trước
const calNextBtn        = document.getElementById("calNextBtn");         // nút tháng sau
const journalSelectedDt = document.getElementById("journalSelectedDate"); // ngày ở trang phải
const journalClearBtn   = document.getElementById("journalClearBtn");    // nút xoá ghi chú
const journalTextarea   = document.getElementById("journalTextarea");    // ô ghi chú
const journalCharCount  = document.getElementById("journalCharCount");   // đếm ký tự
const journalSaveStatus = document.getElementById("journalSaveStatus");  // trạng thái lưu
const journalEmptyState = document.getElementById("journalEmptyState"); // màn hình chưa chọn ngày
const journalContent    = document.getElementById("journalContent");     // nội dung journal


// ===== TRẠNG THÁI LỊCH =====
// viewDate: ngày đại diện tháng đang xem (chỉ cần year + month)
let viewDate     = new Date();
// selectedDate: ngày đang được chọn để ghi journal (null = chưa chọn)
let selectedDate = null;
// Debounce timer cho auto-save (tránh lưu mỗi phím bấm)
let saveDebounce = null;

// Tên các tháng tiếng Việt
const MONTH_NAMES_VI = [
  "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4",
  "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8",
  "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"
];

// Tên các thứ trong tuần (bắt đầu từ T2)
const DAY_NAMES = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];


// ===== RENDER LỊCH =====

// Hàm chính: vẽ toàn bộ lịch tháng đang xem
function renderCalendar() {
  const year  = viewDate.getFullYear();
  const month = viewDate.getMonth(); // 0-indexed

  // Cập nhật nhãn tháng/năm ở header
  calendarMonthLbl.textContent = `${MONTH_NAMES_VI[month]} — ${year}`;

  // Xác định ngày đầu và cuối tháng
  const firstDay = new Date(year, month, 1);
  const lastDay  = new Date(year, month + 1, 0);

  // Tính ngày bắt đầu ô đầu tiên trên lịch
  // Lịch bắt đầu từ T2 (dayOfWeek: 0=Sun, 1=Mon,...6=Sat)
  // Nếu firstDay là Chủ nhật (0) → offset = 6, T2 (1) → offset = 0
  let startOffset = (firstDay.getDay() + 6) % 7; // T2=0, CN=6

  // Đọc journal hiện tại để biết ngày nào có ghi chú
  const journal  = loadJournal();
  const today    = toDateKey(new Date());
  const selectedKey = selectedDate ? toDateKey(selectedDate) : null;

  // Xoá lưới cũ và vẽ lại
  calendarGrid.innerHTML = "";

  // Tổng số ô = offset đầu + số ngày trong tháng, làm tròn lên bội của 7
  const totalCells = Math.ceil((startOffset + lastDay.getDate()) / 7) * 7;

  for (let i = 0; i < totalCells; i++) {
    const dayDiv   = document.createElement("div");
    dayDiv.className = "cal-day";

    // Tính ngày tương ứng với ô này
    const dayNum = i - startOffset + 1; // ngày trong tháng (có thể âm = tháng trước)
    const cellDate = new Date(year, month, dayNum);
    const dateKey  = toDateKey(cellDate);

    // Xác định ô thuộc tháng hiện tại hay tháng trước/sau
    if (dayNum < 1 || dayNum > lastDay.getDate()) {
      dayDiv.classList.add("other-month");
      dayDiv.textContent = cellDate.getDate();
      calendarGrid.appendChild(dayDiv);
      continue; // ngày tháng khác: không thêm event, không highlight
    }

    dayDiv.textContent = dayNum;

    // Đánh dấu ngày hôm nay
    if (dateKey === today) dayDiv.classList.add("today");

    // Đánh dấu ngày đang được chọn
    if (dateKey === selectedKey) dayDiv.classList.add("selected");

    // Chấm vàng nếu ngày đó có ghi chú
    if (journal[dateKey] && journal[dateKey].trim()) {
      dayDiv.classList.add("has-note");
    }

    // Click vào ngày → chọn ngày đó và hiện journal
    dayDiv.addEventListener("click", () => selectDate(cellDate));

    calendarGrid.appendChild(dayDiv);
  }
}


// ===== CHỌN NGÀY =====

// Được gọi khi người dùng click vào một ô ngày trên lịch
function selectDate(date) {
  // Nếu đang có ngày được chọn khác → lưu ngay trước khi chuyển
  if (selectedDate && saveDebounce) {
    clearTimeout(saveDebounce);
    doSave(); // lưu tức thì
  }

  selectedDate = date;

  // Cập nhật UI trang phải: hiện nội dung, ẩn empty state
  journalEmptyState.classList.add("hidden");
  journalContent.classList.remove("hidden");

  // Định dạng ngày được chọn để hiển thị ở header trang phải
  const options = { weekday: "long", day: "numeric", month: "long", year: "numeric" };
  journalSelectedDt.textContent = date.toLocaleDateString("vi-VN", options);

  // Tải nội dung ghi chú của ngày đó vào textarea
  const dateKey = toDateKey(date);
  journalTextarea.value = getNoteForDate(dateKey);
  updateCharCount(); // cập nhật đếm ký tự

  // Reset trạng thái lưu
  journalSaveStatus.textContent = "";
  journalSaveStatus.classList.remove("saved");

  // Render lại lịch để cập nhật ô "selected"
  renderCalendar();

  // Focus vào textarea để gõ ngay
  setTimeout(() => journalTextarea.focus(), 50);
}


// ===== AUTO-SAVE =====

// Cập nhật số ký tự đã nhập
function updateCharCount() {
  const len = journalTextarea.value.length;
  journalCharCount.textContent = len > 0 ? `${len} ký tự` : "";
}

// Thực sự ghi vào localStorage
function doSave() {
  if (!selectedDate) return;
  const dateKey = toDateKey(selectedDate);
  setNoteForDate(dateKey, journalTextarea.value);

  // Hiện trạng thái "Đã lưu" thoáng qua rồi mờ dần
  journalSaveStatus.textContent = "✓ Đã lưu";
  journalSaveStatus.classList.add("saved");
  setTimeout(() => {
    journalSaveStatus.textContent = "";
    journalSaveStatus.classList.remove("saved");
  }, 1800);

  // Render lại lịch để cập nhật chấm vàng (nếu vừa thêm/xoá ghi chú)
  renderCalendar();
}

// Lắng nghe mỗi lần gõ phím vào textarea
journalTextarea.addEventListener("input", () => {
  updateCharCount();

  // Debounce 800ms: chờ 0.8s sau phím cuối mới lưu
  clearTimeout(saveDebounce);
  saveDebounce = setTimeout(() => {
    doSave();
    saveDebounce = null;
  }, 800);
});


// ===== NÚT XOÁ GHI CHÚ + DIALOG XÁC NHẬN =====

// Tham chiếu dialog xác nhận (thay thế confirm() mặc định của trình duyệt)
const journalConfirmOverlay = document.getElementById("journalConfirmOverlay");
const confirmCancelBtn      = document.getElementById("confirmCancelBtn");
const confirmDeleteBtn      = document.getElementById("confirmDeleteBtn");

// Click nút "Xoá" → mở dialog đẹp ở giữa màn hình
journalClearBtn.addEventListener("click", () => {
  if (!selectedDate) return;
  if (!journalTextarea.value.trim()) return; // không có gì để xoá
  journalConfirmOverlay.classList.add("visible");
});

// Nhấn "Huỷ" trong dialog → đóng, không làm gì
confirmCancelBtn.addEventListener("click", () => {
  journalConfirmOverlay.classList.remove("visible");
});

// Nhấn "Xoá" trong dialog → xoá nội dung và lưu
confirmDeleteBtn.addEventListener("click", () => {
  journalConfirmOverlay.classList.remove("visible");
  journalTextarea.value = "";
  updateCharCount();
  clearTimeout(saveDebounce);
  doSave(); // lưu chuỗi rỗng = xoá key khỏi storage
});


// ===== ĐIỀU HƯỚNG THÁNG =====

// Tháng trước
calPrevBtn.addEventListener("click", () => {
  viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1);
  renderCalendar();
});

// Tháng sau
calNextBtn.addEventListener("click", () => {
  viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1);
  renderCalendar();
});


// ===== MỞ / ĐÓNG MODAL =====

// Mở cuốn sổ
function openJournal() {
  journalOverlay.classList.add("visible");
  journalModal.classList.add("open");
  journalToggleBtn.classList.add("active");
  renderCalendar(); // render lại lịch mỗi lần mở (phòng thay đổi ghi chú)
}

// Đóng cuốn sổ
function closeJournal() {
  // Lưu nếu đang có ghi chú chưa lưu
  if (saveDebounce) {
    clearTimeout(saveDebounce);
    doSave();
  }
  journalOverlay.classList.remove("visible");
  journalModal.classList.remove("open");
  journalToggleBtn.classList.remove("active");
}

// Toggle khi nhấn nút
journalToggleBtn.addEventListener("click", () => {
  if (journalModal.classList.contains("open")) {
    closeJournal();
  } else {
    openJournal();
  }
});

// Click overlay (nền mờ bên ngoài) → đóng journal
journalOverlay.addEventListener("click", closeJournal);

// Phím Escape → đóng journal
document.addEventListener("keydown", e => {
  if (e.key === "Escape" && journalModal.classList.contains("open")) {
    closeJournal();
  }
});


// ===== KHỞI TẠO =====
// Render lịch tháng hiện tại khi page load
renderCalendar();