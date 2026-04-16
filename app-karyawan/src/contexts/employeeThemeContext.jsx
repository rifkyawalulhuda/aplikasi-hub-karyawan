import { createContext, useContext, useEffect, useMemo, useState } from 'react';

import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';

import buildEmployeePortalTheme from '@/utils/theme/employeePortalTheme';

export const EMPLOYEE_THEME_STORAGE_KEY = 'hub-karyawan-employee-theme-mode';

const EmployeeThemeContext = createContext({
	mode: 'light',
	isDarkMode: false,
	setMode: () => {},
	toggleColorMode: () => {},
});

function getInitialMode() {
	if (typeof window === 'undefined') {
		return 'light';
	}

	const storedMode = window.localStorage.getItem(EMPLOYEE_THEME_STORAGE_KEY);
	return storedMode === 'dark' ? 'dark' : 'light';
}

export function EmployeeThemeProvider({ children }) {
	const [mode, setMode] = useState(getInitialMode);

	useEffect(() => {
		if (typeof window === 'undefined') {
			return;
		}

		window.localStorage.setItem(EMPLOYEE_THEME_STORAGE_KEY, mode);
	}, [mode]);

	const theme = useMemo(() => buildEmployeePortalTheme(mode), [mode]);

	const contextValue = useMemo(
		() => ({
			mode,
			isDarkMode: mode === 'dark',
			setMode,
			toggleColorMode: () => {
				setMode((currentMode) => (currentMode === 'dark' ? 'light' : 'dark'));
			},
		}),
		[mode],
	);

	return (
		<EmployeeThemeContext.Provider value={contextValue}>
			<ThemeProvider theme={theme}>
				<CssBaseline enableColorScheme />
				{children}
			</ThemeProvider>
		</EmployeeThemeContext.Provider>
	);
}

export function useEmployeeTheme() {
	return useContext(EmployeeThemeContext);
}

export default EmployeeThemeContext;
