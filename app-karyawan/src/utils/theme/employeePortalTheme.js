import { alpha, createTheme } from '@mui/material/styles';
import { enUS } from '@mui/material/locale';

const EMPLOYEE_BRAND = '#3A93F2';
const EMPLOYEE_BRAND_DARK = '#266FB6';
const EMPLOYEE_BRAND_DEEP = '#153A64';

function createEmployeeSurface(mode) {
	const isDarkMode = mode === 'dark';

	return {
		pageBackground: isDarkMode
			? 'radial-gradient(circle at top center, rgba(58, 147, 242, 0.16), transparent 26%), linear-gradient(180deg, #09121E 0%, #0E1828 48%, #122033 100%)'
			: 'radial-gradient(circle at top center, rgba(58, 147, 242, 0.22), transparent 22%), linear-gradient(180deg, #F7FBFF 0%, #EEF4FA 48%, #E7EFF8 100%)',
		authBackground: isDarkMode
			? 'radial-gradient(circle at top left, rgba(58, 147, 242, 0.24), transparent 28%), radial-gradient(circle at bottom right, rgba(255,255,255,0.08), transparent 20%), linear-gradient(160deg, #08111D 0%, #11233A 52%, #1F5E9B 100%)'
			: 'radial-gradient(circle at top left, rgba(76, 154, 232, 0.32), transparent 28%), radial-gradient(circle at bottom right, rgba(255,255,255,0.12), transparent 22%), linear-gradient(160deg, #071A2F 0%, #123B66 48%, #3A93F2 100%)',
		cardGradient: isDarkMode
			? 'linear-gradient(180deg, rgba(20, 31, 47, 0.94) 0%, rgba(18, 29, 45, 0.9) 100%)'
			: 'linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(248,251,255,0.96) 100%)',
		heroGradient: isDarkMode
			? 'linear-gradient(145deg, #173A61 0%, #1D4C7C 58%, #2D6FB4 100%)'
			: 'linear-gradient(145deg, #123B66 0%, #1B5189 58%, #3A93F2 100%)',
		glass: isDarkMode ? alpha('#162235', 0.86) : alpha('#FFFFFF', 0.84),
		card: isDarkMode ? alpha('#152132', 0.94) : '#FFFFFF',
		muted: isDarkMode ? alpha('#0F1724', 0.92) : alpha('#F7FAFD', 0.94),
		soft: isDarkMode ? alpha('#132030', 0.76) : alpha('#FFFFFF', 0.82),
		borderSoft: isDarkMode ? alpha('#D9E6F4', 0.08) : alpha('#123B66', 0.08),
		borderStrong: isDarkMode ? alpha('#D9E6F4', 0.14) : alpha('#123B66', 0.14),
		shadowSoft: isDarkMode ? '0 16px 36px rgba(0, 0, 0, 0.28)' : '0 14px 34px rgba(18, 59, 102, 0.08)',
		shadowMedium: isDarkMode ? '0 18px 42px rgba(0, 0, 0, 0.34)' : '0 18px 40px rgba(18, 59, 102, 0.12)',
		shadowFloating: isDarkMode ? '0 22px 48px rgba(0, 0, 0, 0.42)' : '0 20px 44px rgba(18, 59, 102, 0.16)',
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
					light: '#8BC0F8',
					main: EMPLOYEE_BRAND,
					dark: EMPLOYEE_BRAND_DARK,
					contrastText: '#FFFFFF',
				},
				secondary: {
					light: '#D9E7F6',
					main: '#89A9CB',
					dark: '#5C7696',
					contrastText: '#09121E',
				},
				success: {
					light: '#CDEBD9',
					main: '#3FA56A',
					dark: '#1E6A42',
					contrastText: '#FFFFFF',
				},
				warning: {
					light: '#F6DEB3',
					main: '#D38A19',
					dark: '#9B6210',
					contrastText: '#FFFFFF',
				},
				error: {
					light: '#F4C9C9',
					main: '#D45757',
					dark: '#A73B3B',
					contrastText: '#FFFFFF',
				},
				background: {
					default: isDarkMode ? '#0B1420' : '#EEF4FA',
					paper: isDarkMode ? '#152132' : '#FFFFFF',
				},
				text: {
					primary: isDarkMode ? '#F4F8FC' : '#123B66',
					secondary: isDarkMode ? '#A7B5C7' : '#5D738B',
				},
				divider: isDarkMode ? alpha('#D9E6F4', 0.1) : alpha('#123B66', 0.08),
				employeeSurface,
			},
			shape: {
				borderRadius: 2,
			},
			typography: {
				fontFamily: '"Rubik", "Roboto", "Helvetica", "Arial", sans-serif',
				button: {
					textTransform: 'none',
					fontWeight: 700,
				},
			},
			components: {
				MuiCssBaseline: {
					styleOverrides: {
						':root': {
							colorScheme: mode,
						},
						body: {
							backgroundColor: isDarkMode ? '#0B1420' : '#EEF4FA',
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
							backgroundColor: alpha(isDarkMode ? '#101A29' : '#FFFFFF', 0.94),
							backdropFilter: 'blur(18px)',
							borderTop: `1px solid ${employeeSurface.borderSoft}`,
						},
					},
				},
				MuiBottomNavigationAction: {
					styleOverrides: {
						root: {
							color: isDarkMode ? '#94A7BD' : '#5D738B',
							'&.Mui-selected': {
								color: EMPLOYEE_BRAND,
							},
						},
					},
				},
				MuiChip: {
					styleOverrides: {
						root: {
							borderRadius: 999,
						},
					},
				},
				MuiDivider: {
					styleOverrides: {
						root: {
							borderColor: employeeSurface.borderSoft,
						},
					},
				},
				MuiOutlinedInput: {
					styleOverrides: {
						root: {
							borderRadius: 16,
							backgroundColor: isDarkMode ? alpha('#0E1826', 0.88) : alpha('#FFFFFF', 0.98),
							'& fieldset': {
								borderColor: employeeSurface.borderSoft,
							},
							'&:hover fieldset': {
								borderColor: alpha(EMPLOYEE_BRAND, isDarkMode ? 0.42 : 0.32),
							},
							'&.Mui-focused fieldset': {
								borderColor: EMPLOYEE_BRAND,
							},
						},
					},
				},
				MuiTextField: {
					defaultProps: {
						variant: 'outlined',
					},
				},
				MuiButton: {
					styleOverrides: {
						root: {
							borderRadius: 14,
						},
						containedPrimary: {
							boxShadow: isDarkMode
								? '0 14px 28px rgba(58, 147, 242, 0.2)'
								: '0 12px 26px rgba(58, 147, 242, 0.18)',
						},
					},
				},
				MuiAlert: {
					styleOverrides: {
						root: {
							borderRadius: 14,
						},
						standardSuccess: {
							backgroundColor: isDarkMode ? alpha('#1E6A42', 0.28) : alpha('#3FA56A', 0.12),
						},
						standardError: {
							backgroundColor: isDarkMode ? alpha('#A73B3B', 0.28) : alpha('#D45757', 0.12),
						},
						standardWarning: {
							backgroundColor: isDarkMode ? alpha('#9B6210', 0.28) : alpha('#D38A19', 0.12),
						},
						standardInfo: {
							backgroundColor: isDarkMode ? alpha(EMPLOYEE_BRAND_DEEP, 0.5) : alpha(EMPLOYEE_BRAND, 0.12),
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
