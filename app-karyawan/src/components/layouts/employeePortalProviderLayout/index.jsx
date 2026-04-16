import { Outlet } from 'react-router-dom';

import { Provider as SnackbarProvider } from '@/components/snackbar';
import { EmployeeThemeProvider } from '@/contexts/employeeThemeContext';

function EmployeePortalProviderLayout() {
	return (
		<EmployeeThemeProvider>
			<SnackbarProvider>
				<Outlet />
			</SnackbarProvider>
		</EmployeeThemeProvider>
	);
}

export default EmployeePortalProviderLayout;
