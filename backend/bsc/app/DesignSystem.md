# Skolla Design System

Dokumentasi token, komponen, dan pattern yang diekstrak dari desain **Company Performance** dan **OKR Causal Map**.

---

## 1. Brand & Identity

### Logo
Logo Skolla terdiri dari dua elemen yang selalu muncul bersama:

| Elemen | Keterangan |
|--------|-----------|
| **Icon mark** | Bentuk kotak rounded dengan gradien biru, dimensi ±26×26px |
| **Wordmark** | Teks "Skolla" dalam warna navy `#010571`, dimensi ±87×26px |

**Warna brand pada icon:**
- Body/outline: `#010571` (navy)
- Highlight atas: `#30B1E8` (light blue)
- Gradien tengah: `#0583C3` → `#14B1E2` → `#0583C3` (left-to-right, userSpaceOnUse)

---

## 2. Color Tokens

### Primitive Colors

| Token | Hex | Penggunaan |
|-------|-----|-----------|
| `navy-900` | `#010571` | Logo wordmark & icon body |
| `blue-primary` | `#0E97D6` | Nav item aktif (background), aksen utama |
| `blue-light` | `#30B1E8` | Logo icon highlight |
| `blue-grad-start` | `#0583C3` | Gradient logo |
| `blue-grad-mid` | `#14B1E2` | Gradient logo |

### Semantic Colors

| Token | Hex | Penggunaan |
|-------|-----|-----------|
| `color-success` | `#00A925` | Nilai positif / target tercapai (Target Revenue) |
| `color-danger` | `#EB3123` | Nilai negatif / gap / capaian rendah |
| `color-warning` | `#F2CA17` | Icon progress / indikator kuning |
| `color-text-heading` | `#2D3643` | Judul halaman (h1) |
| `color-text-body` | `#5E718D` | Label navigasi, teks sekunder |
| `color-text-muted` | `#8897AE` | Label stat card (subheading kecil) |
| `color-text-dark` | `#1A1A1A` | Teks node causal map |
| `color-text-slate` | `#64748B` | Title bar causal map |
| `color-text-sidebar-label` | `#334155` | Warna connector line causal map |

### Surface & Border Colors

| Token | Hex | Penggunaan |
|-------|-----|-----------|
| `surface-white` | `#FFFFFF` | Background sidebar, header, card |
| `surface-page` | `#F8FAFC` | Background halaman utama |
| `surface-icon-bg` | `#F8FAFC` | Background kontainer icon stat card |
| `border-default` | `#F0F3F9` | Border sidebar, header, card |
| `border-subtle` | `#E2E8F0` | Border node causal map, band separator |

### Band Colors (Causal Map)

| Band | Background | Keterangan |
|------|-----------|-----------|
| Financial | `#F0FDFA` | Teal sangat muda |
| Customer | `#FFFBEB` | Kuning sangat muda |
| Internal Process | `#FFF1F2` | Merah muda sangat muda |
| Learning & Growth | `#EFF6FF` | Biru sangat muda |

---

## 3. Typography

### Font Families

| Family | Weight yang digunakan | Dipakai untuk |
|--------|----------------------|--------------|
| **Rubik** | Medium (500), SemiBold (600) | Seluruh UI teks — navigasi, heading, stat, label |
| **Geist** | Medium (500), ExtraBold (800) | Causal map — title bar & label band |

> **Catatan:** Rubik adalah font utama sistem. Geist hanya muncul di konteks diagram/teknikal.

### Type Scale

| Peran | Font | Weight | Size | Line-height | Warna default |
|-------|------|--------|------|-------------|--------------|
| Page heading (h1) | Rubik | SemiBold 600 | 24px | 32px | `#2D3643` |
| Nav label | Rubik | Medium 500 | 16px | 24px | `#5E718D` / `white` (aktif) |
| Stat value large | Rubik | SemiBold 600 | 32px | 32px | `#00A925` / `#EB3123` |
| Stat sub-label | Rubik | Medium 500 | 12px | 16px | `#EB3123` |
| Card label (muted) | Rubik | Medium 500 | 14px | 1.4 (×) | `#8897AE` |
| Node label (diagram) | Geist | Medium 500 | 9.328px | 1.4 (×) | `#1A1A1A` |
| Band label | Geist | ExtraBold 800 | 7.773px | normal | `#1A1A1A` |
| Title bar diagram | Geist | Medium 500 | 10.105px | normal | `#64748B` |

---

## 4. Spacing & Sizing

### Layout Grid

| Elemen | Nilai |
|--------|-------|
| Sidebar width | `240px` |
| Header height | `72px` |
| Sidebar padding horizontal (logo) | `20px` |
| Nav padding (container) | `16px` |
| Page content padding | `32px` |
| Gap antar stat card | `9.576px` |

### Komponen Spacing

| Komponen | Padding | Gap internal |
|----------|---------|-------------|
| Nav button | `12px 16px` | `12px` (icon ↔ label) |
| Stat card | `12px` | `8px` (vertikal) |
| Icon container (stat) | `3.192px` | — |
| Node causal map | `6.219px` | — |

---

## 5. Border & Radius

| Elemen | Radius | Border |
|--------|--------|--------|
| Nav button (aktif/hover) | `14px` | — |
| Stat card | `8px` | `0.399px solid #F0F3F9` |
| Icon container (stat) | `3.99px` | — |
| Node causal map | `3.109px` | `0.777px solid #E2E8F0` |
| Sidebar | — | `1px solid #F0F3F9` (right) |
| Header | — | `1px solid #F0F3F9` (bottom) |

---

## 6. Komponen

### 6.1 Sidebar

Sidebar fixed di kiri, lebar `240px`, background `white`.

**Struktur:**
```
Sidebar
├── Logo (icon + wordmark) — padding 20px
└── Navigation — padding 16px, gap 4px
    ├── NavButton (active)
    ├── NavButton
    └── NavButton
```

**Nav Button States:**

| State | Background | Teks | Icon stroke |
|-------|-----------|------|------------|
| Default | Transparan | `#5E718D` | `#5E718D` |
| Hover | `#F8FAFC` | `#5E718D` | `#5E718D` |
| Active | `#0E97D6` | `white` | `white` |

**Nav icon size:** `20×20px`

---

### 6.2 Header

Bar horizontal di atas content area.

| Properti | Nilai |
|----------|-------|
| Height | `72px` |
| Background | `#FFFFFF` |
| Border bottom | `1px solid #F0F3F9` |
| Padding horizontal | `32px` |
| Title font | Rubik SemiBold 24px / `#2D3643` |

---

### 6.3 Stat Card

Kartu metrik ringkas untuk menampilkan satu KPI.

**Struktur:**
```
StatCard (rounded-8px, border #F0F3F9, padding 12px)
├── Icon Container (39×40px, bg #F8FAFC, rounded-4px)
│   └── Icon SVG (30–31×32px)
└── Content
    ├── Label     — Rubik Medium 14px, #8897AE
    ├── Value     — Rubik SemiBold 32px, color sesuai semantic
    └── Sub-label — Rubik Medium 12px, color sesuai semantic (opsional)
```

**Warna value:**

| Kondisi | Warna |
|---------|-------|
| Target / positif | `#00A925` (success green) |
| Aktual / gap / negatif | `#EB3123` (danger red) |

**Icon warna per tipe:**

| Metrik | Icon | Warna stroke |
|--------|------|-------------|
| Revenue / keuangan | Dollar sign | `#0E97D6` (blue) |
| Progress / aktivitas | Activity wave | `#F2CA17` (yellow) |
| GAP / selisih | Arrow diagonal | `#EB3123` (red) |

---

### 6.4 Causal Map Diagram

Diagram strategi berbasis Balanced Scorecard dengan 4 layer horizontal.

**Struktur:**
```
CausalMap (min-width 1119px, scrollable horizontal)
├── TitleBar (height 62px, center-aligned)
└── DiagramContainer (relative, overflow: visible)
    ├── Band: Financial    (height 248.75px, bg #F0FDFA)
    ├── Band: Customer     (height 155.469px, bg #FFFBEB)
    ├── Band: Internal     (height 171.016px, bg #FFF1F2)
    ├── Band: L&G          (height 158.578px, bg #EFF6FF)
    ├── [Causal Connectors] — rotated SVG lines, opacity 0.4, stroke #334155
    └── [Node Containers]  — absolute positioned, 147.695×40.422px each
```

**Node container:**

| Properti | Nilai |
|----------|-------|
| Width | `147.695px` |
| Height | `40.422px` |
| Background | `#FFFFFF` |
| Border | `0.777px solid #E2E8F0` |
| Radius | `3.109px` |
| Padding | `6.219px` |
| Font | Geist Medium 9.328px / `#1A1A1A` |
| Text align | center |

**Causal connector:**

| Properti | Nilai |
|----------|-------|
| Line stroke | `#334155` |
| Opacity | `0.4` |
| Stroke width | `0.583px` |
| Teknik render | SVG `<line>` di dalam wrapper `rotate()` |

**Band label:**

| Properti | Nilai |
|----------|-------|
| Font | Geist ExtraBold 7.773px |
| Case | UPPERCASE |
| Color | `#1A1A1A` |
| Padding | `18.656px` kiri, `15.547px` atas |

---

## 7. Iconography

Semua icon menggunakan **line style** (stroke, bukan fill), dengan ketebalan `1.66667px` (nav) atau `1.8–2px` (stat card).

| Icon | Digunakan di | Stroke color default |
|------|-------------|---------------------|
| Grid / Dashboard | Nav: Dashboard | `#5E718D` / `white` |
| Target / Circle | Nav: Strategic Mapping, Causal Map | `#5E718D` / `white` |
| Trending up | Nav: KPI Tracking | `#5E718D` / `white` |
| Dollar sign | Stat card: Revenue | `#0E97D6` |
| Activity wave | Stat card: Progress | `#F2CA17` |
| Arrow diagonal | Stat card: GAP | `#EB3123` |

---

## 8. Layout Pattern

### Shell Layout

```
┌────────────────────────────────────────────────────┐
│  Sidebar (240px fixed)  │  Main Area (flex: 1)     │
│  ┌──────────────────┐   │  ┌──────────────────────┐ │
│  │ Logo             │   │  │ Header (72px)        │ │
│  │ ─────────────── │   │  ├──────────────────────┤ │
│  │ Nav items        │   │  │                      │ │
│  │                  │   │  │  Page Content        │ │
│  │                  │   │  │  (padding 32px)      │ │
│  └──────────────────┘   │  │                      │ │
│                         │  └──────────────────────┘ │
└────────────────────────────────────────────────────┘
```

- **Background keseluruhan:** `#F8FAFC`
- **Sidebar & Header:** `#FFFFFF` dengan border pemisah `#F0F3F9`
- **Content area:** scrollable secara vertikal dan horizontal (causal map)

---

## 9. Motion & Interaction

Tidak ada animasi eksplisit dalam desain ini. Rekomendasi untuk implementasi:

| Interaksi | Durasi | Easing |
|-----------|--------|--------|
| Nav button hover/active | `150ms` | `ease-out` |
| Page transition | `200ms` | `ease-in-out` |

---

## 10. Checklist Konsistensi

Gunakan checklist ini saat membuat komponen baru:

- [ ] Font hanya dari: **Rubik** (UI) atau **Geist** (diagram)
- [ ] Warna teks mengacu pada token semantik, bukan hex mentah
- [ ] Border menggunakan `#F0F3F9` (UI) atau `#E2E8F0` (diagram)
- [ ] Radius nav button: `14px` — jangan gunakan nilai lain
- [ ] Icon selalu line style, stroke width `1.667px` (nav) atau `1.8–2px` (ilustrasi)
- [ ] State aktif nav: background `#0E97D6`, teks & icon berubah ke `white`
- [ ] Nilai positif → `#00A925`, nilai negatif/gap → `#EB3123`
