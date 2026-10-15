// =============================================
// INITIAL SEED DATA
// =============================================
const defaultObjectives = [
  {
    id: "obj-1",
    title: "Meningkatkan Profitabilitas Perusahaan",
    team: "finance",
    perspective: "financial",
  },
  {
    id: "obj-2",
    title: "Meningkatkan Kepuasan dan Loyalitas Pelanggan",
    team: "growth",
    perspective: "customer",
  },
  {
    id: "obj-3",
    title: "Optimalisasi Proses Delivery Fitur Produk",
    team: "product",
    perspective: "internal-process",
  },
  {
    id: "obj-4",
    title: "Meningkatkan Kapabilitas dan Kesejahteraan Tim",
    team: "engineering",
    perspective: "learning-growth",
  },
];

const defaultKRs = [
  {
    id: "kr-1-1",
    objId: "obj-1",
    title: "Mencapai Revenue Semester I sebesar $2.0M",
    owner: "Jane Doe",
    team: "finance",
    current: 1.6,
    target: 2.0,
    unit: "M USD",
    status: "on-track",
    direction: "up",
    source: "Manual Input",
    lastUpdated: "2026-07-03 08:30",
  },
  {
    id: "kr-1-2",
    objId: "obj-1",
    title: "Mengurangi Operating Expenses sebesar 10%",
    owner: "Jane Doe",
    team: "finance",
    current: 4,
    target: 10,
    unit: "%",
    status: "off-track",
    direction: "up",
    source: "Manual Input",
    lastUpdated: "2026-07-03 09:00",
  },
  {
    id: "kr-2-1",
    objId: "obj-2",
    title: "Meningkatkan Net Promoter Score (NPS) ke 75",
    owner: "Sarah Smith",
    team: "growth",
    current: 70,
    target: 75,
    unit: "Poin",
    status: "on-track",
    direction: "up",
    source: "Manual Input",
    lastUpdated: "2026-07-02 14:15",
  },
  {
    id: "kr-2-2",
    objId: "obj-2",
    title: "Menurunkan Customer Churn Rate di bawah 2%",
    owner: "Sarah Smith",
    team: "growth",
    current: 3.5,
    target: 2.0,
    unit: "%",
    status: "at-risk",
    direction: "down",
    source: "Manual Input",
    lastUpdated: "2026-07-03 07:45",
  },
  {
    id: "kr-3-1",
    objId: "obj-3",
    title: "Mempercepat Cycle Time deployment menjadi 3 hari",
    owner: "John Doe",
    team: "engineering",
    current: 5,
    target: 3,
    unit: "Hari",
    status: "at-risk",
    direction: "down",
    source: "Manual Input",
    lastUpdated: "2026-07-03 10:10",
  },
  {
    id: "kr-3-2",
    objId: "obj-3",
    title: "Meningkatkan test coverage kode utama ke 90%",
    owner: "John Doe",
    team: "engineering",
    current: 88,
    target: 90,
    unit: "%",
    status: "on-track",
    direction: "up",
    source: "Manual Input",
    lastUpdated: "2026-07-02 16:30",
  },
  {
    id: "kr-4-1",
    objId: "obj-4",
    title: "Menyelesaikan sertifikasi cloud untuk 15 engineer",
    owner: "Bob Johnson",
    team: "engineering",
    current: 12,
    target: 15,
    unit: "Orang",
    status: "on-track",
    direction: "up",
    source: "Manual Input",
    lastUpdated: "2026-07-03 11:20",
  },
  {
    id: "kr-4-2",
    objId: "obj-4",
    title: "Meningkatkan Employee Engagement Score ke 4.5/5",
    owner: "HR Team",
    team: "engineering",
    current: 4.2,
    target: 4.5,
    unit: "Skor",
    status: "on-track",
    direction: "up",
    source: "Manual Input",
    lastUpdated: "2026-07-01 10:00",
  },
];

const defaultCausalRelations = [
  { from: "kr-4-1", to: "kr-3-1" },
  { from: "kr-3-2", to: "kr-3-1" },
  { from: "kr-3-1", to: "kr-2-1" },
  { from: "kr-3-1", to: "kr-2-2" },
  { from: "kr-2-1", to: "kr-1-1" },
  { from: "kr-2-2", to: "kr-1-1" },
];

const defaultAuditLog = [
  {
    timestamp: "2026-07-03 11:20",
    user: "Admin",
    action: "Update Capaian",
    target: "Menyelesaikan sertifikasi cloud untuk 15 engineer",
    oldVal: "10",
    newVal: "12",
    note: "",
  },
  {
    timestamp: "2026-07-03 10:10",
    user: "Admin",
    action: "Update Capaian",
    target: "Mempercepat Cycle Time deployment menjadi 3 hari",
    oldVal: "6",
    newVal: "5",
    note: "Update berdasarkan laporan sprint review Q3.",
  },
  {
    timestamp: "2026-07-03 09:00",
    user: "Admin",
    action: "Update Capaian",
    target: "Mengurangi Operating Expenses sebesar 10%",
    oldVal: "2",
    newVal: "4",
    note: "",
  },
];

const defaultNotifications = [
  {
    id: "n1",
    type: "warning",
    message: "Key Result 'Mempercepat Cycle Time deployment' berada pada status At Risk (5/3 Hari).",
    time: "2 jam lalu",
    read: false,
  },
  {
    id: "n2",
    type: "danger",
    message: "Key Result 'Mengurangi Operating Expenses' berada pada status Off Track (4/10%).",
    time: "4 jam lalu",
    read: false,
  },
];

// =============================================
// INITIALIZE STATE
// =============================================
let state = {
  objectives:
    JSON.parse(localStorage.getItem("dashboard_objectives")) || defaultObjectives,
  keyResults:
    JSON.parse(localStorage.getItem("dashboard_krs")) || defaultKRs,
  causalRelations:
    JSON.parse(localStorage.getItem("dashboard_causal")) || defaultCausalRelations,
  auditLog:
    JSON.parse(localStorage.getItem("dashboard_audit")) || defaultAuditLog,
  notifications:
    JSON.parse(localStorage.getItem("dashboard_notifications")) || defaultNotifications,
  currentRole: localStorage.getItem("dashboard_role") || "c-level",
  theme: localStorage.getItem("dashboard_theme") || "light-theme",
};

// =============================================
// STATE HELPERS
// =============================================
function saveState() {
  localStorage.setItem("dashboard_objectives", JSON.stringify(state.objectives));
  localStorage.setItem("dashboard_krs", JSON.stringify(state.keyResults));
  localStorage.setItem("dashboard_causal", JSON.stringify(state.causalRelations));
  localStorage.setItem("dashboard_audit", JSON.stringify(state.auditLog));
  localStorage.setItem("dashboard_notifications", JSON.stringify(state.notifications));
  localStorage.setItem("dashboard_role", state.currentRole);
}

// =============================================
// PROGRESS & STATUS CALCULATORS
// Dev plan threshold: >= 80% → ON_TRACK, 50–79% → AT_RISK, < 50% → OFF_TRACK
// =============================================
function calculateKRProgress(kr) {
  if (kr.direction === "down") {
    if (kr.current <= kr.target) return 100;
    const baseline = kr.target * 2;
    if (kr.current >= baseline) return 0;
    return Math.round(((baseline - kr.current) / (baseline - kr.target)) * 100);
  } else {
    if (kr.current >= kr.target) return 100;
    return Math.round((kr.current / kr.target) * 100);
  }
}

function calculateAutoStatus(progress) {
  if (progress >= 80) return "on-track";
  if (progress >= 50) return "at-risk";
  return "off-track";
}

function calculateObjProgress(objId) {
  const krs = state.keyResults.filter((k) => k.objId === objId);
  if (krs.length === 0) return 0;
  const totalProgress = krs.reduce((acc, kr) => acc + calculateKRProgress(kr), 0);
  return Math.round(totalProgress / krs.length);
}

// =============================================
// ROLE CONFIG
// =============================================
const roleInfoMap = {
  "c-level": {
    name: "C-Level Executive",
    label: "Company-wide Strategy View",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80",
  },
  manager: {
    name: "Sarah Smith",
    label: "Manager — Product & Tech",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=100&q=80",
  },
  employee: {
    name: "John Doe",
    label: "Product Engineer",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80",
  },
  admin: {
    name: "Sistem Admin",
    label: "Admin Console Active",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=100&q=80",
  },
};

// =============================================
// DOM ELEMENTS
// =============================================
const roleSelect = document.getElementById("role-select");
const userAvatar = document.getElementById("user-avatar");
const userName = document.getElementById("user-name");
const userRoleLabel = document.getElementById("user-role-label");
const themeToggleBtn = document.getElementById("theme-toggle-btn");
const searchInput = document.getElementById("search-input");
const filterTeam = document.getElementById("filter-team");
const filterStatus = document.getElementById("filter-status");
const notifBtn = document.getElementById("notif-btn");
const notifDropdown = document.getElementById("notif-dropdown");
const notifList = document.getElementById("notif-list");
const notifCount = document.getElementById("notif-count");
const markAllReadBtn = document.getElementById("mark-all-read");

// =============================================
// THEME MANAGEMENT
// =============================================
function applyTheme(theme) {
  document.body.classList.remove("light-theme", "dark-theme");
  document.body.classList.add(theme);
}

applyTheme(state.theme);

themeToggleBtn.addEventListener("click", () => {
  state.theme = state.theme === "dark-theme" ? "light-theme" : "dark-theme";
  applyTheme(state.theme);
  localStorage.setItem("dashboard_theme", state.theme);
  if (document.getElementById("tab-strategy-map").classList.contains("active")) {
    drawStrategyConnections();
  }
});

// =============================================
// TAB NAVIGATION (Sidebar + Bottom Nav)
// =============================================
const navItems = document.querySelectorAll(".nav-item, .bottom-nav-item");
const tabPanes = document.querySelectorAll(".tab-pane");

function switchTab(targetTab) {
  // Update all nav items (sidebar + bottom nav)
  document.querySelectorAll(".nav-item, .bottom-nav-item").forEach((i) => {
    if (i.getAttribute("data-tab") === targetTab) {
      i.classList.add("active");
    } else {
      i.classList.remove("active");
    }
  });

  tabPanes.forEach((pane) => pane.classList.remove("active"));
  const activePane = document.getElementById(`tab-${targetTab}`);
  if (activePane) activePane.classList.add("active");

  if (targetTab === "strategy-map") {
    setTimeout(drawStrategyConnections, 100);
  }
}

navItems.forEach((item) => {
  item.addEventListener("click", (e) => {
    e.preventDefault();
    const targetTab = item.getAttribute("data-tab");
    if (targetTab) switchTab(targetTab);
  });
});

// =============================================
// ROLE MANAGEMENT
// =============================================
roleSelect.value = state.currentRole;
updateRoleUI(state.currentRole);

roleSelect.addEventListener("change", (e) => {
  state.currentRole = e.target.value;
  saveState();
  updateRoleUI(state.currentRole);
  renderDashboard();
  renderBSCGrid();
  renderStrategyMap();
  populateAdminDropdowns();
});

function updateRoleUI(role) {
  const info = roleInfoMap[role];
  userName.textContent = info.name;
  userRoleLabel.textContent = info.label;
  userAvatar.src = info.avatar;

  // Show/hide Admin tab in both sidebar and bottom nav
  const adminTabBtn = document.querySelector('.nav-item[data-tab="admin"]');
  const adminBottomBtn = document.querySelector('.bottom-nav-item[data-tab="admin"]');

  if (role === "admin") {
    if (adminTabBtn) adminTabBtn.style.display = "flex";
    if (adminBottomBtn) adminBottomBtn.style.display = "flex";
  } else {
    if (adminTabBtn) adminTabBtn.style.display = "none";
    if (adminBottomBtn) adminBottomBtn.style.display = "none";

    // If currently on admin tab, redirect to dashboard
    if (document.querySelector('.nav-item[data-tab="admin"]')?.classList.contains("active") ||
        document.getElementById("tab-admin")?.classList.contains("active")) {
      switchTab("dashboard");
    }
  }
}

// =============================================
// NOTIFICATIONS
// =============================================
notifBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  notifDropdown.classList.toggle("show");
});

document.addEventListener("click", () => {
  notifDropdown.classList.remove("show");
});

notifDropdown.addEventListener("click", (e) => e.stopPropagation());

markAllReadBtn.addEventListener("click", () => {
  state.notifications.forEach((n) => (n.read = true));
  saveState();
  renderNotifications();
});

function renderNotifications() {
  const unread = state.notifications.filter((n) => !n.read);
  notifCount.textContent = unread.length;
  notifCount.style.display = unread.length > 0 ? "flex" : "none";

  notifList.innerHTML = "";
  if (state.notifications.length === 0) {
    notifList.innerHTML = `<div style="padding: 20px; text-align: center; color: var(--text-muted); font-size: 0.82rem;">Tidak ada notifikasi</div>`;
    return;
  }

  state.notifications.forEach((n) => {
    const icon = n.type === "warning" ? "alert-triangle" : "x-circle";
    const iconClass = n.type === "warning" ? "icon-orange" : "icon-red";

    const item = document.createElement("div");
    item.className = `notif-item ${n.read ? "" : "unread"}`;
    item.innerHTML = `
      <div class="notif-item-icon ${iconClass}">
        <i data-lucide="${icon}" style="width: 16px; height: 16px;"></i>
      </div>
      <div class="notif-item-content">
        <p>${n.message}</p>
        <span class="notif-item-time">${n.time}</span>
      </div>
    `;
    item.addEventListener("click", () => {
      n.read = true;
      saveState();
      renderNotifications();
    });
    notifList.appendChild(item);
  });
  lucide.createIcons();
}

// =============================================
// MAIN DASHBOARD RENDERER
// =============================================
function renderDashboard() {
  const okrContainer = document.getElementById("okr-list-container");
  okrContainer.innerHTML = "";

  const totalObjectives = state.objectives.length;
  let sumProgress = 0;
  state.objectives.forEach((obj) => {
    sumProgress += calculateObjProgress(obj.id);
  });
  const avgProgress = totalObjectives > 0 ? Math.round(sumProgress / totalObjectives) : 0;

  const onTrackKRs = state.keyResults.filter((k) => k.status === "on-track").length;
  const atRiskKRs = state.keyResults.filter((k) => k.status === "at-risk" || k.status === "off-track").length;

  document.getElementById("stat-total-objectives").textContent = totalObjectives;
  document.getElementById("stat-avg-progress").textContent = `${avgProgress}%`;
  document.getElementById("stat-on-track").textContent = `${onTrackKRs} / ${state.keyResults.length} KR`;
  document.getElementById("stat-at-risk").textContent = `${atRiskKRs} / ${state.keyResults.length} KR`;

  // Show/hide team filter based on role
  const filterTeamWrap = filterTeam.parentElement;
  if (state.currentRole === "employee") {
    filterTeamWrap.style.display = "none";
  } else {
    filterTeamWrap.style.display = "";
  }

  const activeKRs = filterAndSearchKRs();

  state.objectives.forEach((obj) => {
    // Role-based visibility
    const isCLevel = state.currentRole === "c-level" || state.currentRole === "admin";
    const isManager = state.currentRole === "manager" &&
      (obj.team === "product" || obj.team === "engineering");
    const isEmployee = state.currentRole === "employee";

    if (!isCLevel && !isManager && !isEmployee) return;

    // For employee, filter only their own KRs
    let objKRs;
    if (state.currentRole === "employee") {
      objKRs = activeKRs.filter((kr) => kr.objId === obj.id && kr.owner === "John Doe");
    } else {
      objKRs = activeKRs.filter((kr) => kr.objId === obj.id);
    }

    // Skip objective if no KRs match (when filters active)
    if (
      objKRs.length === 0 &&
      (filterTeam.value !== "all" ||
        filterStatus.value !== "all" ||
        searchInput.value !== "")
    ) return;

    // For employee, skip objectives with no KRs assigned to them
    if (state.currentRole === "employee" && objKRs.length === 0) return;

    const objProgress = calculateObjProgress(obj.id);
    const objProgressColor = objProgress >= 80 ? "bg-green" : objProgress >= 50 ? "bg-orange" : "bg-red";

    let krListHtml = "";
    objKRs.forEach((kr) => {
      const progress = calculateKRProgress(kr);
      const progressColor = progress >= 80 ? "bg-green" : progress >= 50 ? "bg-orange" : "bg-red";
      const statusLabel = kr.status.replace("-", " ");

      const actionBtns = isCLevel && state.currentRole === "admin" ? `
        <div class="card-actions" style="margin-top: 8px;">
          <button class="action-btn edit-btn edit-kr" data-id="${kr.id}" title="Edit Key Result"><i data-lucide="edit-2"></i></button>
          <button class="action-btn delete-btn delete-kr" data-id="${kr.id}" title="Hapus Key Result"><i data-lucide="trash-2"></i></button>
        </div>
      ` : "";

      krListHtml += `
        <div class="kr-item">
          <div class="kr-left">
            <div class="kr-status-indicator ${kr.status}"></div>
            <div class="kr-details">
              <h5>${kr.title}</h5>
              <div class="kr-meta">
                <span><i data-lucide="user"></i> ${kr.owner}</span>
                <span><i data-lucide="users"></i> Tim: ${kr.team.toUpperCase()}</span>
                <span>
                  <i data-lucide="database"></i> ${kr.source}
                  <span class="source-tooltip-trigger"><i data-lucide="info" style="width: 12px; height: 12px;"></i></span>
                  <span class="source-tooltip-content">Sumber: ${kr.source}<br>Terakhir Update: ${kr.lastUpdated}</span>
                </span>
              </div>
            </div>
          </div>
          <div class="kr-right" style="display:flex; flex-direction:column; align-items:flex-end;">
            <div style="display:flex; gap:16px; align-items:center;">
              <div class="obj-progress-bar-container" style="width: 140px;">
              <div class="progress-bar-track">
                <div class="progress-bar-fill ${progressColor}" style="width: ${progress}%;"></div>
              </div>
              <span class="obj-progress-val">${progress}%</span>
            </div>
            <div class="kr-numeric-progress">
              <span class="current">${kr.current}</span> / ${kr.target} ${kr.unit}
            </div>
            <span class="status-badge ${kr.status}">${statusLabel}</span>
            </div>
            ${actionBtns}
          </div>
        </div>
      `;
    });

    const objCard = document.createElement("div");
    objCard.className = "objective-item";
    objCard.innerHTML = `
      <div class="objective-header">
        <div class="obj-title-area">
          <span class="perspective-tag ${obj.perspective}">${obj.perspective.replace(/-/g, " ")}</span>
          <h4>${obj.title}</h4>
        </div>
        <div class="obj-progress-bar-container">
          <div class="progress-bar-track">
            <div class="progress-bar-fill ${objProgressColor}" style="width: ${objProgress}%;"></div>
          </div>
          <span class="obj-progress-val">${objProgress}%</span>
        </div>
        ${isCLevel && state.currentRole === "admin" ? `
        <div class="card-actions">
          <button class="action-btn edit-btn edit-obj" data-id="${obj.id}" title="Edit Objective"><i data-lucide="edit-2"></i></button>
          <button class="action-btn delete-btn delete-obj" data-id="${obj.id}" title="Hapus Objective"><i data-lucide="trash-2"></i></button>
        </div>` : ""}
      </div>
      <div class="kr-container">
        ${krListHtml || `<div style="color: var(--text-muted); font-size: 0.85rem; padding: 10px 0;">Tidak ada Key Results yang cocok dengan filter</div>`}
      </div>
    `;

    okrContainer.appendChild(objCard);
  });

  lucide.createIcons();
}

function filterAndSearchKRs() {
  const teamVal = filterTeam.value;
  const statusVal = filterStatus.value;
  const searchVal = searchInput.value.toLowerCase().trim();

  return state.keyResults.filter((kr) => {
    const matchesTeam = teamVal === "all" || kr.team === teamVal;
    const matchesStatus = statusVal === "all" || kr.status === statusVal;
    const matchesSearch =
      searchVal === "" ||
      kr.title.toLowerCase().includes(searchVal) ||
      kr.owner.toLowerCase().includes(searchVal);
    return matchesTeam && matchesStatus && matchesSearch;
  });
}

searchInput.addEventListener("input", renderDashboard);
filterTeam.addEventListener("change", renderDashboard);
filterStatus.addEventListener("change", renderDashboard);

// =============================================
// BALANCED SCORECARD RENDERER
// =============================================
function renderBSCGrid() {
  const perspectives = ["financial", "customer", "internal-process", "learning-growth"];

  perspectives.forEach((p) => {
    const pKRs = state.keyResults.filter((kr) => {
      const obj = state.objectives.find((o) => o.id === kr.objId);
      return obj && obj.perspective === p;
    });

    const avgBscProgress =
      pKRs.length > 0
        ? Math.round(pKRs.reduce((acc, kr) => acc + calculateKRProgress(kr), 0) / pKRs.length)
        : 0;
    document.getElementById(`bsc-progress-${p}`).textContent = `${avgBscProgress}%`;

    const listContainer = document.getElementById(`bsc-list-${p}`);
    listContainer.innerHTML = "";

    if (pKRs.length === 0) {
      listContainer.innerHTML = `<div style="color: var(--text-muted); font-size: 0.8rem; padding: 10px 0;">Belum ada metrics yang di-mapping</div>`;
      return;
    }

    pKRs.slice(0, 3).forEach((kr) => {
      const progress = calculateKRProgress(kr);
      const row = document.createElement("div");
      row.className = "bsc-row-item";
      row.innerHTML = `
        <div class="bsc-row-left" title="${kr.title}">
          <span class="kr-status-indicator ${kr.status}" style="width: 6px; height: 6px;"></span>
          <span>${kr.title}</span>
        </div>
        <span class="obj-progress-val">${progress}%</span>
      `;
      listContainer.appendChild(row);
    });

    if (pKRs.length > 3) {
      const moreDiv = document.createElement("div");
      moreDiv.style.cssText = "font-size: 0.75rem; color: var(--primary); text-align: right; padding-top: 4px; font-weight: 600;";
      moreDiv.textContent = `+ ${pKRs.length - 3} metrik lainnya`;
      listContainer.appendChild(moreDiv);
    }
  });
}

// =============================================
// BSC DRILL-DOWN MODAL
// =============================================
const bscCards = document.querySelectorAll(".bsc-card");
const bscModal = document.getElementById("bsc-modal");
const closeModalBtn = document.getElementById("close-modal-btn");
const modalTitle = document.getElementById("modal-title");
const modalContent = document.getElementById("modal-content");

bscCards.forEach((card) => {
  card.addEventListener("click", () => {
    const perspective = card.getAttribute("data-perspective");
    const titleText = card.querySelector("h3").textContent;
    const pKRs = state.keyResults.filter((kr) => {
      const obj = state.objectives.find((o) => o.id === kr.objId);
      return obj && obj.perspective === perspective;
    });

    modalTitle.textContent = `Drill-down: ${titleText}`;
    modalContent.innerHTML = "";

    if (pKRs.length === 0) {
      modalContent.innerHTML = `<p style="color: var(--text-muted); text-align: center; padding: 24px;">Tidak ada metrics untuk perspektif ini</p>`;
    } else {
      pKRs.forEach((kr) => {
        const progress = calculateKRProgress(kr);
        const progressColor = progress >= 80 ? "bg-green" : progress >= 50 ? "bg-orange" : "bg-red";
        const div = document.createElement("div");
        div.className = "kr-item";
        div.innerHTML = `
          <div class="kr-left">
            <div class="kr-status-indicator ${kr.status}"></div>
            <div class="kr-details">
              <h5>${kr.title}</h5>
              <div class="kr-meta">
                <span>Owner: ${kr.owner}</span>
                <span>Tim: ${kr.team.toUpperCase()}</span>
              </div>
            </div>
          </div>
          <div class="kr-right">
            <div class="obj-progress-bar-container" style="width: 120px;">
              <div class="progress-bar-track">
                <div class="progress-bar-fill ${progressColor}" style="width: ${progress}%;"></div>
              </div>
              <span class="obj-progress-val">${progress}%</span>
            </div>
            <span class="status-badge ${kr.status}">${kr.status.replace("-", " ")}</span>
          </div>
        `;
        modalContent.appendChild(div);
      });
    }

    bscModal.classList.add("show");
  });
});

closeModalBtn.addEventListener("click", () => bscModal.classList.remove("show"));
window.addEventListener("click", (e) => {
  if (e.target === bscModal) bscModal.classList.remove("show");
});

// =============================================
// STRATEGY MAP RENDERER
// =============================================
function renderStrategyMap() {
  const containers = {
    financial: document.getElementById("nodes-financial"),
    customer: document.getElementById("nodes-customer"),
    "internal-process": document.getElementById("nodes-internal-process"),
    "learning-growth": document.getElementById("nodes-learning-growth"),
  };

  Object.values(containers).forEach((c) => (c.innerHTML = ""));

  state.keyResults.forEach((kr) => {
    const obj = state.objectives.find((o) => o.id === kr.objId);
    if (!obj) return;

    const container = containers[obj.perspective];
    if (!container) return;

    const progress = calculateKRProgress(kr);
    const progressColor = progress >= 80 ? "bg-green" : progress >= 50 ? "bg-orange" : "bg-red";
    const node = document.createElement("div");
    node.className = "node";
    node.id = `node-${kr.id}`;
    node.setAttribute("data-kr-id", kr.id);

    node.innerHTML = `
      <div class="node-title" title="${kr.title}">${kr.title}</div>
      <div class="node-footer">
        <div class="node-progress-wrapper">
          <div class="progress-bar-track" style="height: 5px;">
            <div class="progress-bar-fill ${progressColor}" style="width: ${progress}%;"></div>
          </div>
          <span class="node-percent">${progress}%</span>
        </div>
        <span class="kr-status-indicator ${kr.status}" style="width: 8px; height: 8px;"></span>
      </div>
    `;

    node.addEventListener("mouseenter", () => highlightRelations(kr.id));
    node.addEventListener("mouseleave", clearHighlights);
    container.appendChild(node);
  });
}

function highlightRelations(krId) {
  const selfNode = document.getElementById(`node-${krId}`);
  if (selfNode) selfNode.classList.add("highlighted");

  state.causalRelations.forEach((rel) => {
    if (rel.to === krId) {
      const dNode = document.getElementById(`node-${rel.from}`);
      if (dNode) dNode.classList.add("driver-highlighted");
      const path = document.getElementById(`path-${rel.from}-${rel.to}`);
      if (path) path.classList.add("highlighted");
    }
    if (rel.from === krId) {
      const oNode = document.getElementById(`node-${rel.to}`);
      if (oNode) oNode.classList.add("outcome-highlighted");
      const path = document.getElementById(`path-${rel.from}-${rel.to}`);
      if (path) path.classList.add("highlighted");
    }
  });
}

function clearHighlights() {
  document.querySelectorAll(".node").forEach((n) =>
    n.classList.remove("highlighted", "driver-highlighted", "outcome-highlighted")
  );
  document.querySelectorAll(".connection-path").forEach((p) =>
    p.classList.remove("highlighted")
  );
}

function drawStrategyConnections() {
  const svg = document.getElementById("connections-svg");
  svg.innerHTML = "";

  const wrapper = document.querySelector(".strategy-canvas-wrapper");
  if (!wrapper) return;

  const wrapperRect = wrapper.getBoundingClientRect();
  svg.setAttribute("width", wrapperRect.width);
  svg.setAttribute("height", wrapperRect.height);

  const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
  defs.innerHTML = `
    <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--text-muted)" />
    </marker>
    <marker id="arrow-highlighted" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--primary)" />
    </marker>
  `;
  svg.appendChild(defs);

  state.causalRelations.forEach((rel) => {
    const fromNode = document.getElementById(`node-${rel.from}`);
    const toNode = document.getElementById(`node-${rel.to}`);
    if (!fromNode || !toNode) return;

    const fromRect = fromNode.getBoundingClientRect();
    const toRect = toNode.getBoundingClientRect();

    const fromX = fromRect.left + fromRect.width / 2 - wrapperRect.left;
    const fromY = fromRect.bottom - wrapperRect.top;
    const toX = toRect.left + toRect.width / 2 - wrapperRect.left;
    const toY = toRect.top - wrapperRect.top;

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.id = `path-${rel.from}-${rel.to}`;
    path.className.baseVal = "connection-path";

    const controlY1 = fromY + (toY - fromY) / 2;
    const controlY2 = toY - (toY - fromY) / 2;
    const d = `M ${fromX} ${fromY} C ${fromX} ${controlY1}, ${toX} ${controlY2}, ${toX} ${toY}`;
    path.setAttribute("d", d);
    path.setAttribute("marker-end", "url(#arrow)");
    svg.appendChild(path);
  });
}

window.addEventListener("resize", () => {
  if (document.getElementById("tab-strategy-map").classList.contains("active")) {
    drawStrategyConnections();
  }
});

// =============================================
// ADMIN MODULE
// =============================================
const overrideKRSelect = document.getElementById("override-kr-select");
const overrideCurrentVal = document.getElementById("override-current-val");
const overrideTargetVal = document.getElementById("override-target-val");
const overrideNote = document.getElementById("override-note");
const overrideForm = document.getElementById("override-form");
const builderObjSelect = document.getElementById("builder-objective-select");
const builderForm = document.getElementById("builder-form");
const objectiveBuilderForm = document.getElementById("objective-builder-form");

function populateAdminDropdowns() {
  if (!overrideKRSelect || !builderObjSelect) return;

  overrideKRSelect.innerHTML = "";
  state.keyResults.forEach((kr) => {
    const opt = document.createElement("option");
    opt.value = kr.id;
    opt.textContent = kr.title;
    overrideKRSelect.appendChild(opt);
  });

  builderObjSelect.innerHTML = "";
  state.objectives.forEach((obj) => {
    const opt = document.createElement("option");
    opt.value = obj.id;
    opt.textContent = `[${obj.perspective.toUpperCase().replace(/-/g, " ")}] ${obj.title}`;
    builderObjSelect.appendChild(opt);
  });

  updateOverrideTarget();
}

if (overrideKRSelect) {
  overrideKRSelect.addEventListener("change", updateOverrideTarget);
}

function updateOverrideTarget() {
  const krId = overrideKRSelect.value;
  const kr = state.keyResults.find((k) => k.id === krId);
  if (kr) {
    overrideCurrentVal.value = kr.current;
    overrideTargetVal.value = kr.target;
  }
}

// --- Quick Update Capaian KR ---
if (overrideForm) {
  overrideForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const krId = overrideKRSelect.value;
    const krIndex = state.keyResults.findIndex((k) => k.id === krId);
    if (krIndex === -1) return;

    const kr = state.keyResults[krIndex];
    const oldVal = kr.current;
    const newVal = parseFloat(overrideCurrentVal.value);
    const noteVal = overrideNote ? overrideNote.value.trim() : "";

    // Calculate new status using correct thresholds (dev plan: >= 80% ON_TRACK, 50-79% AT_RISK, < 50% OFF_TRACK)
    const progress = calculateKRProgress({ ...kr, current: newVal });
    const newStatus = calculateAutoStatus(progress);

    // Update state
    state.keyResults[krIndex].current = newVal;
    state.keyResults[krIndex].status = newStatus;
    state.keyResults[krIndex].lastUpdated = new Date()
      .toISOString()
      .slice(0, 16)
      .replace("T", " ");

    // Log to Audit Trail (with optional note)
    const logEntry = {
      timestamp: new Date().toISOString().slice(0, 16).replace("T", " "),
      user: "Admin",
      action: "Override Capaian",
      target: kr.title,
      oldVal: `${oldVal} ${kr.unit}`,
      newVal: `${newVal} ${kr.unit}`,
      note: noteVal,
    };
    state.auditLog.unshift(logEntry);

    // Add notification if status is risky
    if (newStatus === "at-risk" || newStatus === "off-track") {
      const notifMsg = `Key Result '${kr.title}' berubah status menjadi ${newStatus.replace("-", " ").toUpperCase()} (${newVal}/${kr.target} ${kr.unit}).`;
      state.notifications.unshift({
        id: "notif-" + Date.now(),
        type: newStatus === "off-track" ? "danger" : "warning",
        message: notifMsg,
        time: "Baru saja",
        read: false,
      });
    }

    saveState();
    renderDashboard();
    renderBSCGrid();
    renderAuditTrail();
    renderNotifications();

    // Clear note field
    if (overrideNote) overrideNote.value = "";

    // Show inline success message
    showInlineSuccess(overrideForm, "Capaian berhasil diperbarui dan dicatat di audit trail!");
  });
}

// --- Add New Objective ---
if (objectiveBuilderForm) {
  objectiveBuilderForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const title = document.getElementById("obj-title").value.trim();
    const perspective = document.getElementById("obj-perspective").value;
    const team = document.getElementById("obj-team").value;

    if (!title) return;

    const newObj = {
      id: "obj-" + Date.now(),
      title,
      team,
      perspective,
    };

    state.objectives.push(newObj);

    // Log to audit trail
    state.auditLog.unshift({
      timestamp: new Date().toISOString().slice(0, 16).replace("T", " "),
      user: "Admin",
      action: "Tambah Objective Baru",
      target: title,
      oldVal: "-",
      newVal: `Perspective: ${perspective}`,
      note: "",
    });

    saveState();
    renderDashboard();
    renderBSCGrid();
    renderAuditTrail();
    populateAdminDropdowns();

    // Reset form
    document.getElementById("obj-title").value = "";
    showInlineSuccess(objectiveBuilderForm, "Objective baru berhasil dibuat!");
  });
}

// --- Add New Key Result ---
if (builderForm) {
  builderForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const objId = builderObjSelect.value;
    const title = document.getElementById("builder-kr-title").value.trim();
    const owner = document.getElementById("builder-owner").value.trim();
    const team = document.getElementById("builder-team").value;
    const target = parseFloat(document.getElementById("builder-target").value);
    const unit = document.getElementById("builder-unit").value.trim();

    const newKR = {
      id: `kr-${Date.now()}`,
      objId,
      title,
      owner,
      team,
      current: 0,
      target,
      unit,
      status: "off-track",
      direction: "up",
      source: "Manual Input",
      lastUpdated: new Date().toISOString().slice(0, 16).replace("T", " "),
    };

    state.keyResults.push(newKR);

    state.auditLog.unshift({
      timestamp: new Date().toISOString().slice(0, 16).replace("T", " "),
      user: "Admin",
      action: "Tambah KR Baru",
      target: title,
      oldVal: "-",
      newVal: `Target: ${target} ${unit}`,
      note: "",
    });

    saveState();
    renderDashboard();
    renderBSCGrid();
    renderAuditTrail();
    populateAdminDropdowns();

    // Reset form
    document.getElementById("builder-kr-title").value = "";
    document.getElementById("builder-owner").value = "";
    document.getElementById("builder-target").value = "";
    document.getElementById("builder-unit").value = "";
    showInlineSuccess(builderForm, "Key Result baru berhasil ditambahkan!");
  });
}

// =============================================
// INLINE SUCCESS MESSAGE (replaces alert())
// =============================================
function showInlineSuccess(formEl, message) {
  // Remove any existing success message
  const existing = formEl.querySelector(".inline-success");
  if (existing) existing.remove();

  const el = document.createElement("div");
  el.className = "inline-success";
  el.style.cssText = `
    background: var(--green-light);
    color: var(--green);
    border: 1px solid rgba(16, 185, 129, 0.25);
    border-radius: 8px;
    padding: 10px 14px;
    font-size: 0.83rem;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 8px;
  `;
  el.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> ${message}`;
  formEl.appendChild(el);

  setTimeout(() => el.remove(), 4000);
}

// =============================================
// AUDIT TRAIL RENDERER
// =============================================
function renderAuditTrail() {
  const auditBody = document.getElementById("audit-trail-body");
  if (!auditBody) return;

  auditBody.innerHTML = "";

  if (state.auditLog.length === 0) {
    auditBody.innerHTML = `<tr><td colspan="7" style="text-align:center; color: var(--text-muted); padding: 24px;">Belum ada aktivitas tercatat</td></tr>`;
    return;
  }

  state.auditLog.forEach((log) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td><strong style="font-size: 0.82rem;">${log.timestamp}</strong></td>
      <td>${log.user}</td>
      <td><span class="status-badge" style="background: var(--primary-light); color: var(--primary); border: 1px solid rgba(14,151,214,0.2);">${log.action}</span></td>
      <td style="max-width: 220px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${log.target}">${log.target}</td>
      <td><span style="color: var(--text-muted);">${log.oldVal}</span></td>
      <td><span style="font-weight: 600; color: var(--green);">${log.newVal}</span></td>
      <td style="max-width: 180px; color: var(--text-secondary); font-size: 0.8rem;">${log.note || '<span style="color: var(--text-muted);">—</span>'}</td>
    `;
    auditBody.appendChild(row);
  });
}

// =============================================
// APPLICATION STARTUP
// =============================================
function initApp() {
  renderDashboard();
  renderBSCGrid();
  renderStrategyMap();
  populateAdminDropdowns();
  renderAuditTrail();
  renderNotifications();

  // Initialize icons
  lucide.createIcons();
}

// =============================================
// CRUD OPERATIONS (Edit/Delete OKR & KR)
// =============================================
const editModal = document.getElementById("edit-modal");
const deleteModal = document.getElementById("delete-modal");
const editForm = document.getElementById("edit-dynamic-form");
const dynFields = document.getElementById("dynamic-fields-container");

let itemToDelete = null;

// Event Delegation for Edit & Delete buttons on Dashboard
document.getElementById("okr-list-container").addEventListener("click", (e) => {
  const btn = e.target.closest(".action-btn");
  if (!btn) return;

  const id = btn.getAttribute("data-id");

  if (btn.classList.contains("edit-obj")) {
    openEditModal("objective", id);
  } else if (btn.classList.contains("delete-obj")) {
    openDeleteModal("objective", id);
  } else if (btn.classList.contains("edit-kr")) {
    openEditModal("kr", id);
  } else if (btn.classList.contains("delete-kr")) {
    openDeleteModal("kr", id);
  }
});

function openEditModal(type, id) {
  document.getElementById("edit-type").value = type;
  document.getElementById("edit-id").value = id;
  dynFields.innerHTML = "";
  
  if (type === "objective") {
    const obj = state.objectives.find((o) => o.id === id);
    if (!obj) return;
    document.getElementById("edit-modal-title").textContent = "Edit Objective";
    dynFields.innerHTML = `
      <div class="form-group">
        <label>Judul Objective</label>
        <input type="text" id="edit-obj-title" value="${obj.title.replace(/"/g, '&quot;')}" required />
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Perspective</label>
          <select id="edit-obj-persp" required>
            <option value="financial" ${obj.perspective==="financial"?"selected":""}>Financial</option>
            <option value="customer" ${obj.perspective==="customer"?"selected":""}>Customer</option>
            <option value="internal-process" ${obj.perspective==="internal-process"?"selected":""}>Internal Business Process</option>
            <option value="learning-growth" ${obj.perspective==="learning-growth"?"selected":""}>Learning & Growth</option>
          </select>
        </div>
        <div class="form-group">
          <label>Tim</label>
          <select id="edit-obj-team" required>
            <option value="product" ${obj.team==="product"?"selected":""}>Product</option>
            <option value="engineering" ${obj.team==="engineering"?"selected":""}>Engineering</option>
            <option value="finance" ${obj.team==="finance"?"selected":""}>Finance</option>
            <option value="growth" ${obj.team==="growth"?"selected":""}>Growth & Marketing</option>
          </select>
        </div>
      </div>
    `;
  } else if (type === "kr") {
    const kr = state.keyResults.find((k) => k.id === id);
    if (!kr) return;
    document.getElementById("edit-modal-title").textContent = "Edit Key Result";
    dynFields.innerHTML = `
      <div class="form-group">
        <label>Judul Key Result</label>
        <input type="text" id="edit-kr-title" value="${kr.title.replace(/"/g, '&quot;')}" required />
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Target Value</label>
          <input type="number" step="any" id="edit-kr-target" value="${kr.target}" required />
        </div>
        <div class="form-group">
          <label>Current Value (Capaian)</label>
          <input type="number" step="any" id="edit-kr-current" value="${kr.current}" required />
        </div>
      </div>
    `;
  }
  editModal.classList.add("show");
}

if (editForm) {
  editForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const type = document.getElementById("edit-type").value;
    const id = document.getElementById("edit-id").value;

    if (type === "objective") {
      const obj = state.objectives.find((o) => o.id === id);
      if (obj) {
        obj.title = document.getElementById("edit-obj-title").value;
        obj.perspective = document.getElementById("edit-obj-persp").value;
        obj.team = document.getElementById("edit-obj-team").value;
        
        state.auditLog.unshift({
          timestamp: new Date().toISOString().slice(0, 16).replace("T", " "),
          user: "Admin", action: "Edit Objective", target: obj.title, oldVal: "-", newVal: "-", note: "Mengedit detail objective"
        });
      }
    } else if (type === "kr") {
      const kr = state.keyResults.find((k) => k.id === id);
      if (kr) {
        kr.title = document.getElementById("edit-kr-title").value;
        kr.target = parseFloat(document.getElementById("edit-kr-target").value);
        kr.current = parseFloat(document.getElementById("edit-kr-current").value);
        
        const progress = calculateKRProgress(kr);
        kr.status = calculateAutoStatus(progress);

        state.auditLog.unshift({
          timestamp: new Date().toISOString().slice(0, 16).replace("T", " "),
          user: "Admin", action: "Edit Key Result", target: kr.title, oldVal: "-", newVal: "-", note: "Mengedit capaian/detail KR"
        });
      }
    }
    
    saveState();
    renderDashboard();
    renderBSCGrid();
    renderAuditTrail();
    populateAdminDropdowns();
    editModal.classList.remove("show");
  });
}

function openDeleteModal(type, id) {
  itemToDelete = { type, id };
  deleteModal.classList.add("show");
}

const confirmDeleteBtn = document.getElementById("confirm-delete-btn");
if (confirmDeleteBtn) {
  confirmDeleteBtn.addEventListener("click", () => {
    if (!itemToDelete) return;
    const { type, id } = itemToDelete;
    
    if (type === "objective") {
      const objIndex = state.objectives.findIndex((o) => o.id === id);
      if (objIndex !== -1) {
        const title = state.objectives[objIndex].title;
        state.objectives.splice(objIndex, 1);
        state.keyResults = state.keyResults.filter(kr => kr.objId !== id);
        
        state.auditLog.unshift({
          timestamp: new Date().toISOString().slice(0, 16).replace("T", " "),
          user: "Admin", action: "Hapus Objective", target: title, oldVal: "-", newVal: "-", note: "Menghapus objective beserta KRs"
        });
      }
    } else if (type === "kr") {
      const krIndex = state.keyResults.findIndex((k) => k.id === id);
      if (krIndex !== -1) {
        const title = state.keyResults[krIndex].title;
        state.keyResults.splice(krIndex, 1);
        
        state.auditLog.unshift({
          timestamp: new Date().toISOString().slice(0, 16).replace("T", " "),
          user: "Admin", action: "Hapus KR", target: title, oldVal: "-", newVal: "-", note: "Menghapus key result"
        });
      }
    }

    saveState();
    renderDashboard();
    renderBSCGrid();
    renderAuditTrail();
    populateAdminDropdowns();
    deleteModal.classList.remove("show");
    itemToDelete = null;
  });
}

const closeEditBtn = document.getElementById("close-edit-modal-btn");
if (closeEditBtn) closeEditBtn.addEventListener("click", () => editModal.classList.remove("show"));
const cancelEditBtn = document.getElementById("cancel-edit-btn");
if (cancelEditBtn) cancelEditBtn.addEventListener("click", () => editModal.classList.remove("show"));

const closeDelBtn = document.getElementById("close-delete-modal-btn");
if (closeDelBtn) closeDelBtn.addEventListener("click", () => deleteModal.classList.remove("show"));
const cancelDelBtn = document.getElementById("cancel-delete-btn");
if (cancelDelBtn) cancelDelBtn.addEventListener("click", () => deleteModal.classList.remove("show"));


window.addEventListener("DOMContentLoaded", initApp);
