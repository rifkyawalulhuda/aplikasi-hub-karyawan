# Open Workspace Mobile UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the employee mobile portal UI from the current navy/sky-blue theme to the Open Workspace design system defined in `docs/Design.md`.

**Architecture:** All changes are purely visual — tokens, colors, typography, and border radius. Zero logic, routing, or state changes. Three files carry the full surface area: the theme file (global tokens), the mobile layout shell (chrome), and the dashboard page (content layer). A fourth file (`index.html`) adds the Inter font.

**Tech Stack:** React 18, MUI v5, Vite, `@mui/material`, `@mui/icons-material`

## Global Constraints

- Primary color: `#4f6bff` (Open Blue) — replaces all instances of `#3A93F2`
- Secondary color: `#8b5cf6` (AI Purple) — replaces `#89A9CB`
- Font: `Inter, system-ui, -apple-system, sans-serif` — replaces `"Rubik", "Roboto", ...`
- Max border radius: **8px** (0.5rem) — no component may exceed this
- Canvas light: `#f8f9fc` / dark: `#0e0f14` — flat, no radial gradients on page background
- Surface light: `#ffffff` / dark: `#1c1e26`
- Foreground light: `#0e0f14` / dark: `#e2e8f0`
- Border light: `#e2e8f0` / dark: `#2a2d3d`
- Semantic success: `#10b981` / warning: `#f59e0b` / danger: `#ef4444` / info: `#0ea5e9`
- Shadows: moderate layered — not flat, not dramatic
- Dark mode default: OFF (light mode default unchanged)
- No new npm dependencies
- All Indonesian copy preserved verbatim

---

### Task 1: Load Inter font + update theme-color meta

**Files:**
- Modify: `app-karyawan/index.html`

**What to do:** Replace the entire file content with the following:

```html
<!DOCTYPE html>
<html lang="en">
	<head>
		<meta charset="UTF-8" />
		<link rel="icon" type="image/png" href="/pwa/icon-192.png" />
		<meta name="viewport" content="width=device-width, initial-scale=1.0" />
		<meta name="theme-color" content="#4f6bff" />
		<meta name="apple-mobile-web-app-capable" content="yes" />
		<meta name="apple-mobile-web-app-status-bar-style" content="default" />
		<title>Sankyu Hub</title>
		<link rel="preconnect" href="https://fonts.googleapis.com" />
		<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
		<link
			href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
			rel="stylesheet"
		/>
	</head>
	<body>
		<div id="root"></div>
		<script type="module" src="/src/main.jsx"></script>
	</body>
</html>
```

- [ ] Apply the change
- [ ] Verify: run `npm run dev`, open DevTools → Network, filter "inter" → confirm Google Fonts CSS loads
- [ ] Commit: `git add app-karyawan/index.html && git commit -m "style: load Inter font and update theme-color to Open Blue"`

---

### Task 2: Replace theme tokens — `employeePortalTheme.js`

**Files:**
- Modify: `app-karyawan/src/utils/theme/employeePortalTheme.js` (full replacement)

**What to do:** Replace the entire file with:

```javascript
import { alpha, createTheme } from '@mui/material/styles';
import { enUS } from '@mui/material/locale';

// Open Workspace design tokens (docs/Design.md)
const OW_PRIMARY = '#4f6bff';       // Open Blue
const OW_SECONDARY = '#8b5cf6';     // AI Purple
const OW_SUCCESS = '#10b981';
const OW_WARNING = '#f59e0b';
const OW_DANGER = '#ef4444';
const OW_INFO = '#0ea5e9';

function createEmployeeSurface(mode) {
	const isDarkMode = mode === 'dark';

	return {
		// Flat canvas backgrounds — no radial gradients per Open Workspace spec
		pageBackground: isDarkMode ? '#0e0f14' : '#f8f9fc',
		authBackground: isDarkMode
			? 'linear-gradient(160deg, #0e0f14 0%, #1c1e26 100%)'
			: 'linear-gradient(160deg, #f8f9fc 0%, #eef1f8 100%)',
		cardGradient: isDarkMode
			? 'linear-gradient(180deg, rgba(28,30,38,0.97) 0%, rgba(21,23,30,0.97) 100%)'
			: 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,249,252,0.98) 100%)',
		heroGradient: isDarkMode
			? 'linear-gradient(145deg, #1c1e26 0%, #22253a 58%, #2a2d4a 100%)'
			: 'linear-gradient(145deg, #eef1ff 0%, #e0e6ff 58%, #d0d9ff 100%)',
		glass: isDarkMode ? alpha('#1c1e26', 0.88) : alpha('#ffffff', 0.88),
		card: isDarkMode ? '#1c1e26' : '#ffffff',
		muted: isDarkMode ? '#15171e' : '#f1f3f8',
		soft: isDarkMode ? alpha('#1c1e26', 0.76) : alpha('#ffffff', 0.82),
		borderSoft: isDarkMode ? alpha('#e2e8f0', 0.08) : alpha('#0e0f14', 0.07),
		borderStrong: isDarkMode ? alpha('#e2e8f0', 0.14) : alpha('#0e0f14', 0.13),
		// Moderate layered shadows — professional depth, not dramatic
		shadowSoft: isDarkMode
			? '0 2px 8px rgba(0,0,0,0.32), 0 1px 3px rgba(0,0,0,0.24)'
			: '0 2px 8px rgba(79,107,255,0.06), 0 1px 3px rgba(14,15,20,0.06)',
		shadowMedium: isDarkMode
			? '0 4px 16px rgba(0,0,0,0.36), 0 2px 6px rgba(0,0,0,0.24)'
			: '0 4px 16px rgba(79,107,255,0.08), 0 2px 6px rgba(14,15,20,0.06)',
		shadowFloating: isDarkMode
			? '0 8px 24px rgba(0,0,0,0.42), 0 3px 8px rgba(0,0,0,0.28)'
			: '0 8px 24px rgba(79,107,255,0.10), 0 3px 8px rgba(14,15,20,0.07)',
	};
}

export function createEmployeePortalTheme(mode = 'light') {
	const isDarkMode = mode === 'dark';
	const employeeSurface = createEmployeeSurface(mode);

	const theme = createTheme(
		{
			palette: {
				mode,
				primary: {
					light: alpha(OW_PRIMARY, 0.6),
					main: OW_PRIMARY,
					dark: '#3a52e0',
					contrastText: '#ffffff',
				},
				secondary: {
					light: alpha(OW_SECONDARY, 0.6),
					main: OW_SECONDARY,
					dark: '#6d3fd4',
					contrastText: '#ffffff',
				},
				success: {
					light: alpha(OW_SUCCESS, 0.6),
					main: OW_SUCCESS,
					dark: '#059669',
					contrastText: '#ffffff',
				},
				warning: {
					light: alpha(OW_WARNING, 0.6),
					main: OW_WARNING,
					dark: '#d97706',
					contrastText: '#ffffff',
				},
				error: {
					light: alpha(OW_DANGER, 0.6),
					main: OW_DANGER,
					dark: '#dc2626',
					contrastText: '#ffffff',
				},
				info: {
					light: alpha(OW_INFO, 0.6),
					main: OW_INFO,
					dark: '#0284c7',
					contrastText: '#ffffff',
				},
				background: {
					default: isDarkMode ? '#0e0f14' : '#f8f9fc',
					paper: isDarkMode ? '#1c1e26' : '#ffffff',
				},
				text: {
					primary: isDarkMode ? '#e2e8f0' : '#0e0f14',
					secondary: isDarkMode ? '#94a3b8' : '#64748b',
				},
				divider: isDarkMode ? alpha('#e2e8f0', 0.08) : alpha('#0e0f14', 0.07),
				employeeSurface,
			},
			shape: {
				borderRadius: 2,
			},
			typography: {
				fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
				button: {
					textTransform: 'none',
					fontWeight: 600,
				},
			},
			components: {
				MuiCssBaseline: {
					styleOverrides: {
						':root': {
							colorScheme: mode,
						},
						body: {
							backgroundColor: isDarkMode ? '#0e0f14' : '#f8f9fc',
						},
					},
				},
				MuiPaper: {
					defaultProps: {
						elevation: 0,
					},
					styleOverrides: {
						root: {
							backgroundImage: 'none',
						},
					},
				},
				MuiDialog: {
					styleOverrides: {
						paper: {
							backgroundImage: 'none',
							borderRadius: 8,
							border: `1px solid ${employeeSurface.borderSoft}`,
							boxShadow: employeeSurface.shadowFloating,
							backgroundColor: employeeSurface.card,
						},
					},
				},
				MuiDrawer: {
					styleOverrides: {
						paper: {
							backgroundImage: 'none',
							border: `1px solid ${employeeSurface.borderSoft}`,
							backgroundColor: employeeSurface.card,
						},
					},
				},
				MuiBottomNavigation: {
					styleOverrides: {
						root: {
							backgroundColor: alpha(isDarkMode ? '#1c1e26' : '#ffffff', 0.94),
							backdropFilter: 'blur(16px)',
							borderTop: `1px solid ${employeeSurface.borderSoft}`,
						},
					},
				},
				MuiBottomNavigationAction: {
					styleOverrides: {
						root: {
							color: isDarkMode ? '#94a3b8' : '#64748b',
							'&.Mui-selected': {
								color: OW_PRIMARY,
							},
						},
					},
				},
				MuiButton: {
					styleOverrides: {
						root: {
							borderRadius: 6,
							boxShadow: 'none',
							'&:hover': { boxShadow: 'none' },
						},
						contained: {
							boxShadow: `0 2px 8px ${alpha(OW_PRIMARY, isDarkMode ? 0.28 : 0.22)}`,
							'&:hover': {
								boxShadow: `0 4px 12px ${alpha(OW_PRIMARY, isDarkMode ? 0.36 : 0.28)}`,
							},
						},
					},
				},
				MuiChip: {
					styleOverrides: {
						root: {
							borderRadius: 6,
						},
					},
				},
				MuiAlert: {
					styleOverrides: {
						root: {
							borderRadius: 6,
						},
						standardSuccess: {
							backgroundColor: isDarkMode ? alpha(OW_SUCCESS, 0.18) : alpha(OW_SUCCESS, 0.10),
						},
						standardError: {
							backgroundColor: isDarkMode ? alpha(OW_DANGER, 0.18) : alpha(OW_DANGER, 0.10),
						},
						standardWarning: {
							backgroundColor: isDarkMode ? alpha(OW_WARNING, 0.18) : alpha(OW_WARNING, 0.10),
						},
						standardInfo: {
							backgroundColor: isDarkMode ? alpha(OW_PRIMARY, 0.18) : alpha(OW_PRIMARY, 0.10),
						},
					},
				},
			},
		},
		enUS,
	);

	theme.shadows[25] = employeeSurface.shadowSoft;
	theme.shadows[26] = employeeSurface.shadowMedium;
	theme.shadows[27] = employeeSurface.shadowFloating;

	return theme;
}

export default createEmployeePortalTheme;
```

- [ ] Apply the change
- [ ] Verify: `npm run dev` starts without console errors; primary color is `#4f6bff`
- [ ] Commit: `git add app-karyawan/src/utils/theme/employeePortalTheme.js && git commit -m "style: apply Open Workspace design tokens to employee portal theme"`

---

### Task 3: Update dashboard content colors — `dashboard/index.jsx`

**Files:**
- Modify: `app-karyawan/src/pages/employeeMobile/dashboard/index.jsx`

**What to do — 3 targeted edits:**

#### 3a: Replace QUICK_MENU_ITEMS (line ~36)

Find the `QUICK_MENU_ITEMS` constant and replace it entirely:

```javascript
const QUICK_MENU_ITEMS = [
	{
		title: 'Cuti Saya',
		icon: <CalendarMonthOutlinedIcon />,
		path: '/karyawan/cuti',
		description: 'Lihat pengajuan dan saldo cuti',
		accent: '#4f6bff',
		tint: 'rgba(79,107,255,0.10)',
	},
	{
		title: 'Profil',
		icon: <BadgeOutlinedIcon />,
		path: '/karyawan/profil',
		description: 'Data diri dan keamanan akun',
		accent: '#8b5cf6',
		tint: 'rgba(139,92,246,0.10)',
	},
	{
		title: 'Pelatihan',
		icon: <SchoolOutlinedIcon />,
		path: '/karyawan/pelatihan',
		description: 'Riwayat dan jadwal pelatihan',
		accent: '#0ea5e9',
		tint: 'rgba(14,165,233,0.10)',
	},
	{
		title: 'Catatan',
		icon: <FeedOutlinedIcon />,
		path: 'group-catatan',
		description: 'Catatan kerja dan laporan',
		accent: '#10b981',
		tint: 'rgba(16,185,129,0.10)',
	},
];
```

> If QUICK_MENU_ITEMS has more than 4 items in the actual file, map extras: leave/calendar → `#4f6bff`, warning/error → `#ef4444`, training → `#0ea5e9`, document → `#10b981`, profile → `#8b5cf6`.

#### 3b: Fix ActivityCard default accent (line ~172)

Change:
```javascript
function ActivityCard({ title, subtitle, description, meta, icon, accent = '#2F74BC' }) {
```
To:
```javascript
function ActivityCard({ title, subtitle, description, meta, icon, accent = '#4f6bff' }) {
```

#### 3c: Replace all hardcoded navy accent values in recentActivities

Search the file for these patterns and replace:
- `accent: '#2F74BC'` → `accent: '#4f6bff'`
- `accent: '#356FA8'` → `accent: '#4f6bff'`
- `accent: '#4D83BF'` → `accent: '#4f6bff'`
- `accent: '#123B66'` → `accent: '#4f6bff'`
- `accent: '#1B5189'` → `accent: '#4f6bff'`

> Note on border radius: `SummaryCard` and `ActivityCard` both use `borderRadius: 4` in their Paper sx. In MUI, `borderRadius: 4` in sx = `4 × theme.shape.borderRadius(2)` = **8px exactly** — the maximum allowed. No change needed.

- [ ] Replace QUICK_MENU_ITEMS
- [ ] Fix ActivityCard default accent
- [ ] Replace hardcoded navy accent values
- [ ] Verify dashboard renders with new colors, no old navy visible
- [ ] Commit: `git add app-karyawan/src/pages/employeeMobile/dashboard/index.jsx && git commit -m "style: migrate dashboard to Open Workspace color palette"`

---

### Task 4: Build verification

- [ ] Run `cd app-karyawan && npm run build` — expect no errors
- [ ] Run `npm run preview` and navigate: Beranda → Profil → Cuti → Catatan drawer
- [ ] Confirm: Inter font renders, primary is `#4f6bff`, dark mode toggle shows `#0e0f14` canvas
- [ ] Confirm: no element has rounded corners > 8px
- [ ] Final commit if any loose changes: `git add -A && git commit -m "style: Open Workspace UI complete — theme, layout, dashboard"`

---

## Spec Coverage Checklist

- ✅ Primary `#4f6bff` — Task 2
- ✅ Secondary `#8b5cf6` — Task 2
- ✅ Font Inter — Task 1 + Task 2
- ✅ Canvas `#f8f9fc` / `#0e0f14` — Task 2
- ✅ Surface `#ffffff` / `#1c1e26` — Task 2
- ✅ Border tokens — Task 2
- ✅ Max radius 8px — Task 2 (MuiButton:6, MuiChip:6, MuiAlert:6, MuiDialog:8)
- ✅ Moderate shadows — Task 2
- ✅ No aggressive gradients on page bg — Task 2
- ✅ Bottom nav active `#4f6bff` — Task 2
- ✅ QUICK_MENU_ITEMS palette migration — Task 3a
- ✅ ActivityCard default accent — Task 3b
- ✅ Hardcoded navy colors in dashboard — Task 3c
- ✅ theme-color meta updated — Task 1
- ✅ Build verification — Task 4

## Notes for Implementer

- `borderRadius: 4` in MUI `sx` = `4 × theme.shape.borderRadius(2)` = **8px**. This is the maximum allowed per spec. Do NOT reduce it.
- `borderRadius: 3` = 6px — acceptable.
- The `employeeSurface.pageBackground` referenced in `employeeMobileLayout/index.jsx:137` will automatically use the new flat value from Task 2 — no layout JSX change needed.
- The layout shell `Paper` header uses `borderRadius: 4` (8px) — correct per spec, no change.
- Do NOT add a global `borderRadius` override to `MuiPaper` — that would break all Paper instances that rely on explicit radius in sx.
