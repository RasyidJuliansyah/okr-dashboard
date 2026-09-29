# Dark Mode Implementation Plan

**Project:** OKR Dashboard (Nuxt 3 + Vue 3)
**Current state:** Design tokens in `:root` (light), `.dark-theme` commented out, `useTheme.ts` & `ThemeToggle.vue` disabled
**Goal:** Full dark mode with toggle, persisted in localStorage

---

## 📊 Scope

| Category | Files | Hardcoded Colors | Uses CSS vars |
|----------|-------|------------------|---------------|
| Pages | 25 | ~1,500 | 322 |
| Components | 15 | ~360 | 52 |
| App shell | 1 | 6 | — |
| **Total** | **41** | **~1,860** | **~374** |

---

## 🎯 Phase 1: Foundation (4 files, ~30 min)

### 1.1 `frontend/app/app.vue` — Dark theme tokens

Replace commented `.dark-theme` block (lines 400-431) with:

```css
.dark-theme {
  --card-bg: #131a2c;
  --card-border: rgba(255, 255, 255, 0.08);
  --content-bg: #0b0f19;
  --bg-page: #0b0f19;
  --text-heading: #f8fafc;
  --text-body: #e2e8f0;
  --text-secondary: #94a3b8;
  --text-muted: #64748b;
  --text-color: #e2e8f0;
  --header-bg: rgba(19, 26, 44, 0.95);
  --input-bg: rgba(255, 255, 255, 0.04);
  --input-border: rgba(255, 255, 255, 0.12);
  --input-focus: #0e97d6;
  --color-field: #1a2236;
  --color-green-badge: rgba(52, 211, 153, 0.15);
  --color-yellow-badge: rgba(251, 191, 36, 0.15);
  --color-red-badge: rgba(248, 113, 113, 0.15);
  --color-purple-badge: rgba(167, 139, 250, 0.15);
  --color-blue-badge: rgba(56, 182, 240, 0.15);
  --color-black-badge: #94a3b8;
  --color-border: rgba(255, 255, 255, 0.12);
  --shadow-color: rgba(0, 0, 0, 0.5);
  --shadow-color-rgb: 0, 0, 0;
}
```

Add light-mode defaults to `:root` (if missing):
```css
--text-heading: #1e293b;
--text-body: #334155;
--text-secondary: #475569;
--text-muted: #94a3b8;
--text-color: #334155;
--header-bg: #ffffff;
--bg-page: #f8fafc;
--input-bg: #f0f3f9;
--input-border: #e2e8f0;
--input-focus: #0e97d6;
```

### 1.2 `frontend/app/composables/useTheme.ts` — Real toggle

Replace entire file:
```typescript
import { useState, onMounted } from '#imports'

export function useTheme() {
  const isDark = useState('theme-dark', () => false)

  const applyTheme = (dark: boolean) => {
    if (typeof window === 'undefined') return
    document.documentElement.classList.toggle('dark-theme', dark)
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }

  const toggleTheme = () => {
    isDark.value = !isDark.value
    applyTheme(isDark.value)
  }

  onMounted(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme')
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      isDark.value = saved ? saved === 'dark' : prefersDark
      applyTheme(isDark.value)
    }
  })

  return { isDark, toggleTheme }
}
```

### 1.3 `frontend/app/components/ThemeToggle.vue` — Working button

Replace entire file with sun/moon toggle button:
- Sun SVG shown in dark mode, Moon SVG in light mode
- Uses `useTheme()` composable (auto-imported)
- Styled with CSS vars (`--card-bg`, `--card-border`, `--text-body`)
- Hover highlights with `--color-primary`
- Size: 36x36px circle, icon 18x18px

### 1.4 `frontend/app/components/AppHeader.vue` — Add toggle
- Place `<ThemeToggle />` in header right section, near user avatar

---

## 🎯 Phase 2: Shell Components (2 files, ~1 hr)

### 2.1 `frontend/app/components/AppSidebar.vue` (859 lines)

**Inline JS style objects with hardcoded hex:**
```
Line 665:  background: "#ffffff"       → var(--card-bg)
Line 723:  color: "#8897ae"            → var(--text-muted)
Line 750:  color: "#5e718d"            → var(--text-secondary)
Line 767:  color: "#5e718d"            → var(--text-secondary)
Line 792:  color: active ? "#ffffff"   → var(--color-primary-contrast)
Line 793:  backgroundColor: "#0e97d6" → var(--color-primary)
Line 811-812: same pattern
```
Inline divider `style="background: #e2e8f0"` on lines 258, 450, 536.

**Fix:** Move inline styles to `<style scoped>` classes using CSS vars.

### 2.2 `frontend/app/components/AppHeader.vue`

**Hardcoded backgrounds in `<style>`:**
```
#ffffff  → var(--card-bg)          (lines 480, 564, 628)
#f8fafc  → var(--bg-page)          (lines 513, 554, 641, 809)
#f0fdf4  → var(--color-green-badge) (lines 570, 706)
#dcfce7  → (keep or green tint)
#eff6ff  → var(--color-blue-badge)  (line 711)
#fef3c7  → var(--color-yellow-badge)(line 727)
#e0f2fe  → var(--color-blue-badge)  (line 731)
#e2e8f0  → var(--card-border)       (line 751)
#f1f5f9  → var(--bg-page)           (line 702)
#eb3123  → keep (alert red)         (line 818)
```


---

## 🎯 Phase 3: Pages (25 files, ~3-4 hrs)

### Color mapping table

| Search hex | Replace with | Meaning |
|---|---|---|
| `#ffffff` (background) | `var(--card-bg)` | Card/surface bg |
| `#f8fafc` `#fafcff` `#f1f5f9` | `var(--bg-page)` | Page bg |
| `#e2e8f0` `#e4e4e4` `#cbd5e1` | `var(--card-border)` | Borders, dividers |
| `#334155` `#1e293b` `#0f172a` (text) | `var(--text-heading)` | Heading text |
| `#475569` (text) | `var(--text-secondary)` | Secondary text |
| `#64748b` (text) | `var(--text-secondary)` | Secondary text |
| `#94a3b8` (text) | `var(--text-muted)` | Muted/hint text |
| `#f0f3f9` (input bg) | `var(--input-bg)` | Input fields |
| `#0e97d6` | `var(--color-primary)` | Primary brand |
| `#f0fdf4` `#dcfce7` `#e3fdea` | `var(--color-green-badge)` | Success bg |
| `#ffeaed` `#fef2f2` | `var(--color-red-badge)` | Danger bg |
| `#fefbe5` `#fef3c7` | `var(--color-yellow-badge)` | Warning bg |
| `#eef5ff` `#eff6ff` `#e0f2fe` | `var(--color-blue-badge)` | Info bg |

### Execution order (by hardcoded count)

| # | File | Count | Priority |
|---|---|---|---|
| 1 | `pages/initiatives.vue` | 120 | HIGH |
| 2 | `pages/dashboard.vue` | 102 | HIGH |
| 3 | `pages/team/my-work.vue` | 94 | HIGH |
| 4 | `pages/manager/overview.vue` | 75 | HIGH |
| 5 | `pages/admin/initiatives-kanban.vue` | 59 | HIGH |
| 6 | `pages/strategy-map.vue` | 46 | MED |
| 7 | `pages/leader/my-krs.vue` | 44 | MED |
| 8 | `pages/member-achievement.vue` | 36 | MED |
| 9 | `pages/admin/kpis.vue` | 31 | MED |
| 10 | `pages/admin/sprints.vue` | 30 | MED |
| 11 | `pages/leader/initiatives.vue` | 29 | MED |
| 12 | `pages/approvals.vue` | 28 | MED |
| 13 | `pages/admin/employees.vue` | 25 | MED |
| 14 | `pages/kr-history.vue` | 20 | LOW |
| 15 | `pages/departments.vue` | 15 | LOW |
| 16 | `pages/admin/objectives.vue` | 14 | LOW |
| 17 | `pages/admin/audit-logs.vue` | 12 | LOW |
| 18 | `pages/c-level.vue` | 6 | LOW |
| 19 | `pages/admin/initiatives.vue` | 2 | LOW |
| 20 | `pages/admin/annual-bsc.vue` | 2 | LOW |
| 21 | `pages/bsc-view.vue` | 1 | LOW |
| 22-25 | index, login, admin/departments, update-progress | 0 | SKIP |

### Per-page workflow
```
1. grep -n '#[0-9a-fA-F]{3,8}' <file>     — list all hardcoded hex
2. Replace <style> hex → var() per mapping table
3. grep -n 'style="[^"]*#' <file>          — find inline style colors
4. Move inline hex to CSS class OR use var() in style=""
5. Visual test both themes in browser
6. Commit: "darkmode: <page-name>"
```

### Special cases
- **`dashboard.vue`** — Chart.js colors in JS → leave for Phase 4
- **`initiatives.vue`** — 4,981 lines, work in batches
- **`strategy-map.vue`** — Vue Flow node colors in JS objects → use `:style` with var()
- **`team/my-work.vue`** — kanban-like layout, many surface colors

---

## 🎯 Phase 4: Polish & Edge Cases (~1 hr)

### Components to update
- [ ] `ConfirmModal.vue` — modal overlay + card dark
- [ ] `BulkUploadModal.vue` — modal + dropzone dark
- [ ] `ChangePasswordModal.vue` — modal dark
- [ ] `CrossDeptCommentModal.vue` — modal dark
- [ ] `KpiSelector.vue` — dropdown dark
- [ ] `MonthlyMatrixTable.vue` — table dark
- [ ] `UnitTargetInput.vue` — input dark
- [ ] `InitiativesList.vue` — list items dark
- [ ] `InitiativesGantt.vue` — gantt bars dark

### Global polish in `app.vue`
```css
/* Dark scrollbar */
.dark-theme { scrollbar-color: #334155 #0b0f19; }
.dark-theme ::-webkit-scrollbar { width: 8px; }
.dark-theme ::-webkit-scrollbar-track { background: #0b0f19; }
.dark-theme ::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }

/* Print — force light */
@media print { .dark-theme { /* reset dark vars to light */ } }
```

### Chart.js dark palette (optional)
Create `frontend/app/composables/useChartColors.ts`:
```typescript
export function useChartColors() {
  const { isDark } = useTheme()
  return computed(() => ({
    grid: isDark.value ? 'rgba(255,255,255,0.06)' : '#e2e8f0',
    text: isDark.value ? '#94a3b8' : '#64748b',
    tooltipBg: isDark.value ? '#1e293b' : '#ffffff',
  }))
}
```

---

## 🔧 Useful Commands

```bash
# All hardcoded hex in a file
grep -n '#[0-9a-fA-F]\{3,8\}' frontend/app/pages/dashboard.vue

# Count per file
grep -rn '#[0-9a-fA-F]\{3,8\}' frontend/app/pages/ --include='*.vue' -c | sort -t: -k2 -rn

# Inline style with colors
grep -n 'style="[^"]*#[0-9a-fA-F]' frontend/app/pages/dashboard.vue

# Test build
cd frontend && npm run build
```

---

## ✅ Acceptance Criteria

1. Toggle works — click icon → instant switch, no reload
2. Persisted — refresh → theme remembered (localStorage)
3. System pref — first visit respects OS `prefers-color-scheme`
4. SSR-safe — no hydration mismatch (`useState` pattern)
5. All pages readable — no white-on-white or black-on-black
6. Status badges visible in dark
7. Modals dark — backgrounds, text readable
8. Sidebar & header — dark applied, active states visible
9. No new dependencies
10. `npm run build` passes clean

---

## 📝 Rules

- **No** `@nuxtjs/color-mode` — `useState` + class toggle covers it
- **No** Tailwind rewrite — not in project
- **Keep** `--color-primary: #0e97d6` same both themes
- **Keep** status colors readable — adjust badge bg only
- **Commit** after each phase

---

## 📅 Estimated Effort

| Phase | Time | Cumulative |
|-------|------|------------|
| 1: Foundation | ~30 min | 30 min |
| 2: Shell (Sidebar + Header) | ~1 hr | 1.5 hr |
| 3: Pages (25 files) | ~3-4 hr | 5 hr |
| 4: Polish | ~1 hr | 6 hr |

Start Phase 1+2 first → instant visible result.

---

## 🧪 Test Users

| Email | Password | Role |
|-------|----------|------|
| `hrd@skolla.education` | `SkollaEdu` | ADMIN |
| `erika@skolla.education` | `TestPass123` | TEAM |
| `syarief@skolla.education` | `TestPass123` | LEADER |

