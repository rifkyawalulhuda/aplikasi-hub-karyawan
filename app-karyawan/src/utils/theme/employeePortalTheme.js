import { alpha, createTheme } from '@mui/material/styles';
import { enUS } from '@mui/material/locale';

// Open Workspace design tokens (docs/Design.md)
const OW_PRIMARY = '#4f6bff'; // Open Blue
const OW_SECONDARY = '#8b5cf6'; // AI Purple
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
							backgroundColor: isDarkMode ? alpha(OW_SUCCESS, 0.18) : alpha(OW_SUCCESS, 0.1),
						},
						standardError: {
							backgroundColor: isDarkMode ? alpha(OW_DANGER, 0.18) : alpha(OW_DANGER, 0.1),
						},
						standardWarning: {
							backgroundColor: isDarkMode ? alpha(OW_WARNING, 0.18) : alpha(OW_WARNING, 0.1),
						},
						standardInfo: {
							backgroundColor: isDarkMode ? alpha(OW_PRIMARY, 0.18) : alpha(OW_PRIMARY, 0.1),
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
