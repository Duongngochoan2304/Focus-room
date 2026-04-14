// ============================================================
// tasks.js — Logic bảng nhiệm vụ & shop
// Quản lý: nhiệm vụ hệ thống (auto/manual), nhiệm vụ người dùng,
//          xu thưởng, shop, đồng hồ thực, reset hàng ngày
// Lắng nghe CustomEvent "focusSessionDone" từ main.js
// ============================================================


// ===== DỮ LIỆU NHIỆM VỤ HỆ THỐNG =====
// auto: true  → tự động tick khi đạt điều kiện (trigger từ main.js)
// auto: false → người dùng tự tick thủ công
const SYSTEM_TASKS = [
  {
    id: "sys_1",
    name: "Hoàn thành 1 phiên Pomodoro",
    reward: 10,
    auto: true  // trigger: focusCount >= 1
  },
  {
    id: "sys_2",
    name: "Hoàn thành 3 phiên liên tiếp",
    reward: 25,
    auto: true  // trigger: focusCount >= 3
  },
  {
    id: "sys_3",
    name: "Dùng app đủ 1 chu kỳ Pomodoro",
    reward: 50,
    auto: true  // trigger: cycleComplete === true
  },
  {
    id: "sys_4",
    name: "Đặt mục tiêu học tập hôm nay",
    reward: 5,
    auto: false
  },
  {
    id: "sys_5",
    name: "Tắt điện thoại khi focus",
    reward: 15,
    auto: false
  },
];


// ===== DỮ LIỆU SHOP =====
// Các item có thể mở khoá bằng xu (chức năng thực tế sẽ thêm sau)
const SHOP_ITEMS = [
  { id: "shop_1", icon: "⏱", name: "Custom Timer",  desc: "Tự điều chỉnh thời gian focus/break", price: 50  },
  { id: "shop_2", icon: "🎵", name: "Ambient Music", desc: "Mở khoá nhạc nền khi focus",          price: 80  },
  { id: "shop_3", icon: "🌤", name: "Thời tiết",     desc: "Hiển thị thời tiết theo vị trí",      price: 60  },
  { id: "shop_4", icon: "🎨", name: "Dark Theme",    desc: "Giao diện tối cao cấp hơn",           price: 40  },
  { id: "shop_5", icon: "📊", name: "Thống kê",      desc: "Xem lịch sử focus theo tuần",         price: 100 },
  { id: "shop_6", icon: "🔔", name: "Thông báo",     desc: "Nhắc nhở theo lịch trình",            price: 30  },
];


// ===== STORAGE =====
// Trả về ngày hôm nay dạng "YYYY-MM-DD" để so sánh reset hàng ngày
function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

// Đọc state từ localStorage, trả về {} nếu lỗi
function loadState() {
  try { return JSON.parse(localStorage.getItem("focusroom_tasks")) || {}; }
  catch { return {}; }
}

// Ghi toàn bộ state hiện tại vào localStorage
function saveState() {
  localStorage.setItem("focusroom_tasks", JSON.stringify(state));
}


// ===== STATE =====
const saved = loadState();

// Kiểm tra có phải ngày mới không để reset nhiệm vụ hệ thống
const isNewDay = (saved.lastDate ?? "") !== todayKey();

const state = {
  coins:      saved.coins     ?? 0,   // tổng xu tích luỹ
  systemDone: isNewDay ? [] : (saved.systemDone ?? []), // id các task hệ thống đã xong
  userTasks:  saved.userTasks ?? [],  // [{id, name, reward, done}]
  shopOwned:  saved.shopOwned ?? [],  // id các item shop đã mở khoá
  lastDate:   todayKey(),             // ngày cuối cùng lưu state
  focusCount: isNewDay ? 0 : (saved.focusCount ?? 0), // số session focus hôm nay
};

// Lưu ngay nếu là ngày mới (để cập nhật lastDate và reset systemDone)
if (isNewDay) saveState();


// ===== THAM CHIẾU DOM =====
const miniCoinCount = document.getElementById("miniCoinCount"); // xu ở mini bar
const miniTaskCount = document.getElementById("miniTaskCount"); // số task ở mini bar
const coinCountEl   = document.getElementById("coinCount");     // xu ở panel header
const systemList    = document.getElementById("systemTaskList"); // danh sách task hệ thống
const userList      = document.getElementById("userTaskList");   // danh sách task người dùng
const shopGrid      = document.getElementById("shopGrid");       // lưới shop
const addTaskForm   = document.getElementById("addTaskForm");    // form thêm task
const taskInput     = document.getElementById("taskInput");      // ô nhập tên task
const taskReward    = document.getElementById("taskReward");     // select mức thưởng


// ===== XU THƯỞNG =====

// Hiệu ứng số xu bay lên tại vị trí element được click
function spawnCoinPop(amount, el) {
  const rect = el.getBoundingClientRect();
  const pop  = document.createElement("div");
  pop.className   = "coin-pop";
  pop.textContent = `+${amount} ◈`;
  pop.style.left  = rect.left + "px";
  pop.style.top   = (rect.top - 10) + "px";
  document.body.appendChild(pop);
  setTimeout(() => pop.remove(), 900); // xoá sau khi animation xong
}

// Cộng xu vào state, lưu, render lại, và hiện animation
function earnCoin(amount, el) {
  state.coins += amount;
  saveState();
  renderCoin();
  if (el) spawnCoinPop(amount, el);
}

// Cập nhật hiển thị xu ở cả mini bar và panel header
function renderCoin() {
  miniCoinCount.textContent = state.coins;
  coinCountEl.textContent   = state.coins;
}


// ===== TỰ ĐỘNG HOÀN THÀNH NHIỆM VỤ HỆ THỐNG =====

// Được gọi khi nhận CustomEvent "focusSessionDone" từ main.js
function handleFocusSessionDone(detail) {
  const { focusCount, cycleComplete } = detail;
  state.focusCount = focusCount;
  saveState();

  // Kiểm tra và auto-complete từng task theo điều kiện
  tryAutoComplete("sys_1");                          // >= 1 session
  if (focusCount >= 3) tryAutoComplete("sys_2");     // >= 3 session
  if (cycleComplete)   tryAutoComplete("sys_3");     // hoàn thành cả chu kỳ
}

// Thử đánh dấu hoàn thành task tự động (chỉ thực hiện nếu chưa done)
function tryAutoComplete(id) {
  if (state.systemDone.includes(id)) return; // đã xong rồi, bỏ qua

  const task = SYSTEM_TASKS.find(t => t.id === id);
  if (!task) return;

  state.systemDone.push(id);
  saveState();

  // Spawn coin pop gần mini bar
  const anchor = document.getElementById("miniBar") || document.body;
  earnCoin(task.reward, anchor);
  renderSystemTasks();
  renderMiniCount();
}


// ===== RENDER NHIỆM VỤ HỆ THỐNG =====
function renderSystemTasks() {
  systemList.innerHTML = "";

  SYSTEM_TASKS.forEach(task => {
    const done = state.systemDone.includes(task.id);
    const li   = document.createElement("li");
    li.className = "task-item" + (done ? " done" : "");

    // Task auto: hiện icon ◎ (không click được)
    // Task manual: hiện nút ✓ (click để tick)
    const checkBtn = task.auto
      ? `<div class="task-check auto ${done ? "checked" : ""}" title="Tự động">◎</div>`
      : `<button class="task-check manual ${done ? "checked" : ""}" title="Đánh dấu hoàn thành">✓</button>`;

    li.innerHTML = `
      ${checkBtn}
      <span class="task-name">${task.name}</span>
      <span class="task-badge">${task.auto ? "auto" : "manual"}</span>
      <span class="task-reward">◈${task.reward}</span>
    `;

    // Chỉ gán onclick cho task manual chưa hoàn thành
    if (!task.auto && !done) {
      li.querySelector(".task-check").onclick = function() {
        state.systemDone.push(task.id);
        saveState();
        earnCoin(task.reward, this);
        renderSystemTasks();
        renderMiniCount();
      };
    }

    systemList.appendChild(li);
  });
}


// ===== RENDER NHIỆM VỤ NGƯỜI DÙNG =====
function renderUserTasks() {
  userList.innerHTML = "";

  state.userTasks.forEach((task, idx) => {
    const li = document.createElement("li");
    li.className = "task-item" + (task.done ? " done" : "");
    li.innerHTML = `
      <button class="task-check manual ${task.done ? "checked" : ""}" title="Hoàn thành">✓</button>
      <span class="task-name">${task.name}</span>
      <span class="task-reward">◈${task.reward}</span>
      <button class="task-delete" title="Xoá">✕</button>
    `;

    // Tick hoàn thành
    if (!task.done) {
      li.querySelector(".task-check").onclick = function() {
        state.userTasks[idx].done = true;
        saveState();
        earnCoin(task.reward, this);
        renderUserTasks();
        renderMiniCount();
      };
    }

    // Xoá nhiệm vụ khỏi danh sách
    li.querySelector(".task-delete").onclick = () => {
      state.userTasks.splice(idx, 1);
      saveState();
      renderUserTasks();
      renderMiniCount();
    };

    userList.appendChild(li);
  });
}


// ===== CẬP NHẬT SỐ TASK CHƯA XONG Ở MINI BAR =====
function renderMiniCount() {
  const pending =
    SYSTEM_TASKS.filter(t => !state.systemDone.includes(t.id)).length +
    state.userTasks.filter(t => !t.done).length;
  miniTaskCount.textContent = pending;
}


// ===== RENDER SHOP =====
function renderShop() {
  shopGrid.innerHTML = "";

  SHOP_ITEMS.forEach(item => {
    const owned = state.shopOwned.includes(item.id);
    const div   = document.createElement("div");
    div.className = "shop-item " + (owned ? "unlocked" : "locked");
    div.innerHTML = `
      <div class="shop-icon">${item.icon}</div>
      <div class="shop-name">${item.name}</div>
      <div class="shop-desc">${item.desc}</div>
      <div class="shop-price ${owned ? "owned" : ""}">
        ${owned ? "✓ Đã có" : `◈ ${item.price}`}
      </div>
    `;
    shopGrid.appendChild(div);
  });
}


// ===== THÊM NHIỆM VỤ =====
// Toggle hiện/ẩn form thêm task
document.getElementById("addTaskBtn").onclick = () => {
  addTaskForm.classList.toggle("hidden");
  if (!addTaskForm.classList.contains("hidden")) taskInput.focus();
};

// Huỷ và đóng form
document.getElementById("taskCancel").onclick = () => {
  addTaskForm.classList.add("hidden");
  taskInput.value = "";
};

// Xác nhận thêm task (cả click lẫn Enter)
document.getElementById("taskConfirm").onclick = addTask;
taskInput.addEventListener("keydown", e => { if (e.key === "Enter") addTask(); });

function addTask() {
  const name = taskInput.value.trim();
  if (!name) return; // không thêm task rỗng

  const reward = parseInt(taskReward.value);
  state.userTasks.push({
    id: "user_" + Date.now(), // ID unique dựa trên timestamp
    name,
    reward,
    done: false
  });

  saveState();
  taskInput.value = "";
  addTaskForm.classList.add("hidden");
  renderUserTasks();
  renderMiniCount();
}


// ===== TAB CHUYỂN ĐỔI =====
document.querySelectorAll(".tab").forEach(btn => {
  btn.onclick = () => {
    // Bỏ active tất cả tab và ẩn tất cả content
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(c => c.classList.add("hidden"));

    // Kích hoạt tab được chọn
    btn.classList.add("active");
    const tabId = "tab" + btn.dataset.tab.charAt(0).toUpperCase() + btn.dataset.tab.slice(1);
    document.getElementById(tabId).classList.remove("hidden");

    // Render shop khi chuyển sang tab shop
    if (btn.dataset.tab === "shop") renderShop();
  };
});


// ===== MỞ RỘNG / THU NHỎ PANEL =====
const taskPanel = document.getElementById("taskPanel");

document.getElementById("expandBtn").onclick  = () => taskPanel.classList.remove("hidden");
document.getElementById("collapseBtn").onclick = () => taskPanel.classList.add("hidden");


// ===== ĐỒNG HỒ THỰC + RESET QUA ĐÊM =====
const realClockEl = document.getElementById("realClock");

function tickClock() {
  const now = new Date();
  const h   = String(now.getHours()).padStart(2, "0");
  const m   = String(now.getMinutes()).padStart(2, "0");
  const s   = String(now.getSeconds()).padStart(2, "0");

  // Hiển thị giờ thực HH:MM:SS
  if (realClockEl) realClockEl.textContent = `${h}:${m}:${s}`;

  // Phát hiện qua ngày mới (00:00:00) → reset nhiệm vụ hệ thống
  const currentDate = now.toISOString().slice(0, 10);
  if (state.lastDate !== currentDate) {
    state.lastDate   = currentDate;
    state.systemDone = [];
    state.focusCount = 0;
    saveState();
    renderSystemTasks();
    renderMiniCount();
  }
}

// Chạy ngay và lặp mỗi giây
setInterval(tickClock, 1000);
tickClock();


// ===== LẮNG NGHE EVENT TỪ main.js =====
// main.js bắn "focusSessionDone" mỗi khi 1 focus session kết thúc
window.addEventListener("focusSessionDone", e => handleFocusSessionDone(e.detail));


// ===== KHỞI TẠO =====
renderCoin();
renderSystemTasks();
renderUserTasks();
renderMiniCount();