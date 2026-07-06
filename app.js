// Initial Seed Data
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
    owner: "Alex Rivera",
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
    owner: "Alex Rivera",
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
  },
  {
    timestamp: "2026-07-03 10:10",
    user: "Admin",
    action: "Update Capaian",
    target: "Mempercepat Cycle Time deployment menjadi 3 hari",
    oldVal: "6",
    newVal: "5",
  },
  {
    timestamp: "2026-07-03 09:00",
    user: "Admin",
    action: "Update Capaian",
    target: "Mengurangi Operating Expenses sebesar 10%",
    oldVal: "2",
    newVal: "4",
  },
];

const defaultNotifications = [
  {
    id: "n1",
    type: "warning",
    message:
      "Key Result 'Mempercepat Cycle Time deployment' berada pada status At Risk (5/3 Hari).",
    time: "2 jam lalu",
    read: false,
  },
  {
    id: "n2",
    type: "danger",
    message:
      "Key Result 'Mengurangi Operating Expenses' berada pada status Off Track (4/10%).",
    time: "4 jam lalu",
    read: false,
  },
];

// Initialize State
let state = {
  objectives:
    JSON.parse(localStorage.getItem("dashboard_objectives")) ||
    defaultObjectives,
  keyResults: JSON.parse(localStorage.getItem("dashboard_krs")) || defaultKRs,
  causalRelations:
    JSON.parse(localStorage.getItem("dashboard_causal")) ||
    defaultCausalRelations,
  auditLog:
    JSON.parse(localStorage.getItem("dashboard_audit")) || defaultAuditLog,
  notifications:
    JSON.parse(localStorage.getItem("dashboard_notifications")) ||
    defaultNotifications,
  currentRole: "c-level",
  theme: localStorage.getItem("dashboard_theme") || "dark-theme",
};

// State Helper Functions
function saveState() {
  localStorage.setItem(
    "dashboard_objectives",
    JSON.stringify(state.objectives),
  );
  localStorage.setItem("dashboard_krs", JSON.stringify(state.keyResults));
  localStorage.setItem(
    "dashboard_causal",
    JSON.stringify(state.causalRelations),
  );
  localStorage.setItem("dashboard_audit", JSON.stringify(state.auditLog));
  localStorage.setItem(
    "dashboard_notifications",
    JSON.stringify(state.notifications),
  );
}

// Progress Calculator (taking direction into account)
function calculateKRProgress(kr) {
  if (kr.direction === "down") {
    if (kr.current <= kr.target) return 100;
    // Assuming a standard baseline for down metrics if current is larger (e.g., target 3, current 5 -> progress decreases)
    // Simple scale: if target is 3, baseline is 2x target.
    const baseline = kr.target * 2;
    if (kr.current >= baseline) return 0;
    return Math.round(((baseline - kr.current) / (baseline - kr.target)) * 100);
  } else {
    if (kr.current >= kr.target) return 100;
    return Math.round((kr.current / kr.target) * 100);
  }
}

function calculateObjProgress(objId) {
  const krs = state.keyResults.filter((k) => k.objId === objId);
  if (krs.length === 0) return 0;
  const totalProgress = krs.reduce(
    (acc, kr) => acc + calculateKRProgress(kr),
    0,
  );
  return Math.round(totalProgress / krs.length);
}

// UI Elements
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

// Tab Navigation
const navItems = document.querySelectorAll(".nav-item");
const tabPanes = document.querySelectorAll(".tab-pane");

navItems.forEach((item) => {
  item.addEventListener("click", (e) => {
    e.preventDefault();
    const targetTab = item.getAttribute("data-tab");

    navItems.forEach((i) => i.classList.remove("active"));
    tabPanes.forEach((pane) => pane.classList.remove("active"));

    item.classList.add("active");
    const activePane = document.getElementById(`tab-${targetTab}`);
    if (activePane) {
      activePane.classList.add("active");
    }

    if (targetTab === "strategy-map") {
      setTimeout(drawStrategyConnections, 100);
    }
  });
});

// Theme Management
themeToggleBtn.addEventListener("click", () => {
  if (state.theme === "dark-theme") {
    document.body.classList.remove("dark-theme");
    document.body.classList.add("light-theme");
    state.theme = "light-theme";
  } else {
    document.body.classList.remove("light-theme");
    document.body.classList.add("dark-theme");
    state.theme = "dark-theme";
  }
  localStorage.setItem("dashboard_theme", state.theme);
  if (
    document.getElementById("tab-strategy-map").classList.contains("active")
  ) {
    drawStrategyConnections();
  }
});

// Initialize Theme on startup
document.body.className = state.theme;

// Role Change Management
const roleInfoMap = {
  "c-level": {
    name: "C-Level Executive",
    label: "Company-wide Strategy View",
    avatar:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80",
  },
  // "manager": { name: "Sarah Smith", label: "Manager (Product & Tech)", avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=100&q=80" },
  // "employee": { name: "John Doe", label: "Product Engineer", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80" },
  admin: {
    name: "Sistem Admin",
    label: "Admin Console Active",
    avatar:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=100&q=80",
  },
};

roleSelect.value = state.currentRole;
updateRoleUI(state.currentRole);

roleSelect.addEventListener("change", (e) => {
  state.currentRole = e.target.value;
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

  // Toggle Admin Console view in menu
  const adminTabBtn = document.querySelector('[data-tab="admin"]');
  if (role === "admin") {
    adminTabBtn.style.display = "flex";
  } else {
    adminTabBtn.style.display = "none";
    // If on admin tab but switched role, switch to dashboard tab
    if (adminTabBtn.classList.contains("active")) {
      document.querySelector('[data-tab="dashboard"]').click();
    }
  }
}

// Notifications toggle
notifBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  notifDropdown.classList.toggle("show");
});

document.addEventListener("click", () => {
  notifDropdown.classList.remove("show");
});

notifDropdown.addEventListener("click", (e) => {
  e.stopPropagation();
});

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
    notifList.innerHTML = `<div style="padding: 20px; text-align: center; color: var(--text-muted); font-size: 0.8rem;">Tidak ada notifikasi</div>`;
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

// Main Dashboard Renderer
function renderDashboard() {
  const okrContainer = document.getElementById("okr-list-container");
  okrContainer.innerHTML = "";

  // Calculate total summary statistics
  const activeKRs = filterAndSearchKRs();
  const totalObjectives = state.objectives.length;

  let sumProgress = 0;
  state.objectives.forEach((obj) => {
    sumProgress += calculateObjProgress(obj.id);
  });
  const avgProgress =
    totalObjectives > 0 ? Math.round(sumProgress / totalObjectives) : 0;

  const onTrackKRs = state.keyResults.filter(
    (k) => k.status === "on-track",
  ).length;
  const atRiskKRs = state.keyResults.filter(
    (k) => k.status === "at-risk" || k.status === "off-track",
  ).length;

  document.getElementById("stat-total-objectives").textContent =
    totalObjectives;
  document.getElementById("stat-avg-progress").textContent = `${avgProgress}%`;
  document.getElementById("stat-on-track").textContent =
    `${onTrackKRs} / ${state.keyResults.length} KR`;
  document.getElementById("stat-at-risk").textContent =
    `${atRiskKRs} / ${state.keyResults.length} KR`;

  // Group KRs by Objective
  state.objectives.forEach((obj) => {
    const objKRs = activeKRs.filter((kr) => kr.objId === obj.id);

    // Under role conditions: manager only sees their team/managed, employee sees own
    const isCLevel =
      state.currentRole === "c-level" || state.currentRole === "admin";
    const isManager =
      state.currentRole === "manager" &&
      (obj.team === "product" || obj.team === "engineering");
    const isEmployee =
      state.currentRole === "employee" && obj.team === "engineering";

    if (!isCLevel && !isManager && !isEmployee) {
      // Hide dashboard section if no hierarchy permission
      return;
    }

    if (
      objKRs.length === 0 &&
      (filterTeam.value !== "all" ||
        filterStatus.value !== "all" ||
        searchInput.value !== "")
    ) {
      return; // Skip if no matching search/filtered KR in this objective
    }

    const objProgress = calculateObjProgress(obj.id);
    const objCard = document.createElement("div");
    objCard.className = "objective-item";

    let krListHtml = "";
    objKRs.forEach((kr) => {
      const progress = calculateKRProgress(kr);
      const progressColor =
        progress >= 80 ? "bg-green" : progress >= 50 ? "bg-orange" : "bg-red";

      // Format status label
      const statusLabel = kr.status.replace("-", " ");

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
                                    <span class="source-tooltip-content">Sumber: ${kr.source}<br>Terakhir Update: ${kr.lastUpdated} (Manual Admin)</span>
                                </span>
                            </div>
                        </div>
                    </div>
                    <div class="kr-right">
                        <div class="obj-progress-bar-container" style="width: 150px;">
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
                </div>
            `;
    });

    const objProgressColor =
      objProgress >= 80
        ? "bg-green"
        : objProgress >= 50
          ? "bg-orange"
          : "bg-red";
    objCard.innerHTML = `
            <div class="objective-header">
                <div class="obj-title-area">
                    <span class="perspective-tag ${obj.perspective}">${obj.perspective.replace("-", " ")}</span>
                    <h4>${obj.title}</h4>
                </div>
                <div class="obj-progress-bar-container">
                    <div class="progress-bar-track">
                        <div class="progress-bar-fill ${objProgressColor}" style="width: ${objProgress}%;"></div>
                    </div>
                    <span class="obj-progress-val">${objProgress}%</span>
                </div>
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
  const searchVal = searchInput.value.toLowerCase();

  return state.keyResults.filter((kr) => {
    const matchesTeam = teamVal === "all" || kr.team === teamVal;
    const matchesStatus = statusVal === "all" || kr.status === statusVal;
    const matchesSearch =
      kr.title.toLowerCase().includes(searchVal) ||
      kr.owner.toLowerCase().includes(searchVal);
    return matchesTeam && matchesStatus && matchesSearch;
  });
}

// Search and Filter Listeners
searchInput.addEventListener("input", renderDashboard);
filterTeam.addEventListener("change", renderDashboard);
filterStatus.addEventListener("change", renderDashboard);

// Balanced Scorecard Renderer
function renderBSCGrid() {
  const perspectives = [
    "financial",
    "customer",
    "internal-process",
    "learning-growth",
  ];

  perspectives.forEach((p) => {
    const pKRs = state.keyResults.filter((kr) => {
      const obj = state.objectives.find((o) => o.id === kr.objId);
      return obj && obj.perspective === p;
    });

    const avgBscProgress =
      pKRs.length > 0
        ? Math.round(
            pKRs.reduce((acc, kr) => acc + calculateKRProgress(kr), 0) /
              pKRs.length,
          )
        : 0;
    document.getElementById(`bsc-progress-${p}`).textContent =
      `${avgBscProgress}%`;

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
      moreDiv.style.cssText =
        "font-size: 0.75rem; color: var(--primary); text-align: right; padding-top: 4px; font-weight: 500;";
      moreDiv.textContent = `+ ${pKRs.length - 3} metrik lainnya`;
      listContainer.appendChild(moreDiv);
    }
  });
}

// Modal handling for BSC Drill-down
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
        const progressColor =
          progress >= 80 ? "bg-green" : progress >= 50 ? "bg-orange" : "bg-red";
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
                        <span class="status-badge ${kr.status}">${kr.status}</span>
                    </div>
                `;
        modalContent.appendChild(div);
      });
    }

    bscModal.classList.add("show");
  });
});

closeModalBtn.addEventListener("click", () => {
  bscModal.classList.remove("show");
});

window.addEventListener("click", (e) => {
  if (e.target === bscModal) {
    bscModal.classList.remove("show");
  }
});

// Strategy Map Renderer & Drag/Draw Logic
function renderStrategyMap() {
  const containers = {
    financial: document.getElementById("nodes-financial"),
    customer: document.getElementById("nodes-customer"),
    "internal-process": document.getElementById("nodes-internal-process"),
    "learning-growth": document.getElementById("nodes-learning-growth"),
  };

  // Clear rows
  Object.values(containers).forEach((c) => (c.innerHTML = ""));

  // Render KR nodes into rows based on mapped objectives perspective
  state.keyResults.forEach((kr) => {
    const obj = state.objectives.find((o) => o.id === kr.objId);
    if (!obj) return;

    const container = containers[obj.perspective];
    if (!container) return;

    const progress = calculateKRProgress(kr);
    const node = document.createElement("div");
    node.className = "node";
    node.id = `node-${kr.id}`;
    node.setAttribute("data-kr-id", kr.id);

    node.innerHTML = `
            <div class="node-title" title="${kr.title}">${kr.title}</div>
            <div class="node-footer">
                <div class="node-progress-wrapper">
                    <div class="progress-bar-track" style="height: 6px;">
                        <div class="progress-bar-fill ${progress >= 80 ? "bg-green" : progress >= 50 ? "bg-orange" : "bg-red"}" style="width: ${progress}%;"></div>
                    </div>
                    <span class="node-percent">${progress}%</span>
                </div>
                <span class="kr-status-indicator ${kr.status}" style="width: 8px; height: 8px;"></span>
            </div>
        `;

    // Hover effects to highlight drivers and outcomes
    node.addEventListener("mouseenter", () => highlightRelations(kr.id));
    node.addEventListener("mouseleave", clearHighlights);

    container.appendChild(node);
  });
}

function highlightRelations(krId) {
  const nodes = document.querySelectorAll(".node");
  const paths = document.querySelectorAll(".connection-path");

  // Highlight self
  const selfNode = document.getElementById(`node-${krId}`);
  if (selfNode) selfNode.classList.add("highlighted");

  // Find drivers (things driving this metric) and outcomes (things this metric drives)
  const drivers = [];
  const outcomes = [];

  // Find pathways recursively or directly
  state.causalRelations.forEach((rel) => {
    if (rel.to === krId) {
      drivers.push(rel.from);
      // Highlight specific lines
      const path = document.getElementById(`path-${rel.from}-${rel.to}`);
      if (path) path.classList.add("highlighted");
    }
    if (rel.from === krId) {
      outcomes.push(rel.to);
      const path = document.getElementById(`path-${rel.from}-${rel.to}`);
      if (path) path.classList.add("highlighted");
    }
  });

  drivers.forEach((dId) => {
    const dNode = document.getElementById(`node-${dId}`);
    if (dNode) dNode.classList.add("driver-highlighted");
  });

  outcomes.forEach((oId) => {
    const oNode = document.getElementById(`node-${oId}`);
    if (oNode) oNode.classList.add("outcome-highlighted");
  });
}

function clearHighlights() {
  document.querySelectorAll(".node").forEach((n) => {
    n.classList.remove(
      "highlighted",
      "driver-highlighted",
      "outcome-highlighted",
    );
  });
  document.querySelectorAll(".connection-path").forEach((p) => {
    p.classList.remove("highlighted");
  });
}

// Drawing SVG paths linking nodes
function drawStrategyConnections() {
  const svg = document.getElementById("connections-svg");
  svg.innerHTML = "";

  const wrapper = document.querySelector(".strategy-canvas-wrapper");
  if (!wrapper) return;

  const wrapperRect = wrapper.getBoundingClientRect();
  svg.setAttribute("width", wrapperRect.width);
  svg.setAttribute("height", wrapperRect.height);

  // Create arrow marker definition
  const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
  defs.innerHTML = `
        <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--text-muted)" />
        </marker>
        <marker id="arrow-highlighted" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
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

    // Coordinates relative to the wrapper canvas
    const fromX = fromRect.left + fromRect.width / 2 - wrapperRect.left;
    const fromY = fromRect.bottom - wrapperRect.top;
    const toX = toRect.left + toRect.width / 2 - wrapperRect.left;
    const toY = toRect.top - wrapperRect.top;

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.id = `path-${rel.from}-${rel.to}`;
    path.className.baseVal = "connection-path";

    // Bezier curve from bottom of driver node to top of outcome node
    const controlY1 = fromY + (toY - fromY) / 2;
    const controlY2 = toY - (toY - fromY) / 2;
    const d = `M ${fromX} ${fromY} C ${fromX} ${controlY1}, ${toX} ${controlY2}, ${toX} ${toY}`;

    path.setAttribute("d", d);
    path.setAttribute("marker-end", "url(#arrow)");

    svg.appendChild(path);
  });
}

// Redraw connections on window resize to preserve placement
window.addEventListener("resize", () => {
  if (
    document.getElementById("tab-strategy-map").classList.contains("active")
  ) {
    drawStrategyConnections();
  }
});

// Admin Module Functions
const overrideKRSelect = document.getElementById("override-kr-select");
const overrideCurrentVal = document.getElementById("override-current-val");
const overrideTargetVal = document.getElementById("override-target-val");
const overrideForm = document.getElementById("override-form");

const builderObjSelect = document.getElementById("builder-objective-select");
const builderForm = document.getElementById("builder-form");

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
    opt.textContent = `${obj.perspective.toUpperCase()}: ${obj.title}`;
    builderObjSelect.appendChild(opt);
  });

  // Trigger form state update
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

// Quick Capaian Update Submission (Manual Admin Action)
if (overrideForm) {
  overrideForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const krId = overrideKRSelect.value;
    const krIndex = state.keyResults.findIndex((k) => k.id === krId);
    if (krIndex === -1) return;

    const kr = state.keyResults[krIndex];
    const oldVal = kr.current;
    const newVal = parseFloat(overrideCurrentVal.value);

    // Calculate new status based on target and direction
    let status = "on-track";
    const progress =
      kr.direction === "down"
        ? newVal <= kr.target
          ? 100
          : Math.round((kr.target / newVal) * 100)
        : newVal >= kr.target
          ? 100
          : Math.round((newVal / kr.target) * 100);

    if (progress < 50) {
      status = "off-track";
    } else if (progress < 85) {
      status = "at-risk";
    }

    // Update metric details
    state.keyResults[krIndex].current = newVal;
    state.keyResults[krIndex].status = status;
    state.keyResults[krIndex].lastUpdated = new Date()
      .toISOString()
      .slice(0, 16)
      .replace("T", " ");

    // Log to Audit Trail
    const logEntry = {
      timestamp: new Date().toISOString().slice(0, 16).replace("T", " "),
      user: "Admin",
      action: "Override Capaian",
      target: kr.title,
      oldVal: `${oldVal} ${kr.unit}`,
      newVal: `${newVal} ${kr.unit}`,
    };
    state.auditLog.unshift(logEntry);

    // Push notification if status changed to Risk/Off track
    if (status === "at-risk" || status === "off-track") {
      const notifMsg = `Key Result '${kr.title}' berubah status menjadi ${status.toUpperCase()} (${newVal}/${kr.target} ${kr.unit}).`;
      state.notifications.unshift({
        id: "notif-" + Date.now(),
        type: status === "off-track" ? "danger" : "warning",
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

    alert(
      "Pencapaian Key Result berhasil diperbarui dan dicatat dalam audit trail!",
    );
  });
}

// Add New Key Result (Manual Admin Action)
if (builderForm) {
  builderForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const objId = builderObjSelect.value;
    const bscPerspective = document.getElementById("builder-bsc-select").value;
    const title = document.getElementById("builder-kr-title").value;
    const owner = document.getElementById("builder-owner").value;
    const team = document.getElementById("builder-team").value;
    const target = parseFloat(document.getElementById("builder-target").value);
    const unit = document.getElementById("builder-unit").value;

    const newKR = {
      id: `kr-${Date.now()}`,
      objId: objId,
      title: title,
      owner: owner,
      team: team,
      current: 0,
      target: target,
      unit: unit,
      status: "off-track", // starts at 0, hence off-track
      direction: "up",
      source: "Manual Input",
      lastUpdated: new Date().toISOString().slice(0, 16).replace("T", " "),
    };

    state.keyResults.push(newKR);

    // Add audit trail log
    state.auditLog.unshift({
      timestamp: new Date().toISOString().slice(0, 16).replace("T", " "),
      user: "Admin",
      action: "Tambah KR Baru",
      target: title,
      oldVal: "-",
      newVal: `Target: ${target} ${unit}`,
    });

    saveState();
    renderDashboard();
    renderBSCGrid();
    renderAuditTrail();
    populateAdminDropdowns();

    // Clear builder form
    document.getElementById("builder-kr-title").value = "";
    document.getElementById("builder-owner").value = "";
    document.getElementById("builder-target").value = "";
    document.getElementById("builder-unit").value = "";

    alert("Key Result baru berhasil dibuat dan ditambahkan!");
  });
}

// Audit Trail Renderer
function renderAuditTrail() {
  const auditBody = document.getElementById("audit-trail-body");
  if (!auditBody) return;

  auditBody.innerHTML = "";

  state.auditLog.forEach((log) => {
    const row = document.createElement("tr");
    row.innerHTML = `
            <td><strong>${log.timestamp}</strong></td>
            <td>${log.user}</td>
            <td><span class="status-badge" style="background: rgba(255,255,255,0.05); color: var(--text-primary); border: none;">${log.action}</span></td>
            <td>${log.target}</td>
            <td><span style="color: var(--text-muted);">${log.oldVal}</span></td>
            <td><span style="font-weight: 600; color: var(--green);">${log.newVal}</span></td>
        `;
    auditBody.appendChild(row);
  });
}

// Application Startup Boot
function initApp() {
  renderDashboard();
  renderBSCGrid();
  renderStrategyMap();
  populateAdminDropdowns();
  renderAuditTrail();
  renderNotifications();
}

window.addEventListener("DOMContentLoaded", initApp);
