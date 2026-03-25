import '@/assets/css/style.css';
import '@fontsource/rubik/300.css';
import '@fontsource/rubik/400.css';
import '@fontsource/rubik/500.css';
import '@fontsource/rubik/700.css';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import { useEffect } from 'react';

import StoreProvider from '@/store';
import { AuthProvider } from '@/contexts/authContext';
import { EmployeeAuthProvider } from '@/contexts/employeeAuthContext';

import { Provider as SnackbarProvider } from '@/components/snackbar';

import MUITheme from '@/utils/theme';
import Router from '@/utils/routes';
import CustomizationLayout from '@/components/layouts/customization';

const PWA_HOSTNAMES = new Set(['pwa.aplikasi-hub.my.id']);

function App() {
	useEffect(() => {
		const { hostname, pathname, search, hash } = window.location;
		if (!PWA_HOSTNAMES.has(hostname)) {
			return;
		}

		if (pathname.startsWith('/karyawan')) {
			return;
		}

		window.location.replace(`/karyawan/login${search}${hash}`);
	}, []);

	return (
		<StoreProvider>
			<AuthProvider>
				<EmployeeAuthProvider>
					<MUITheme>
						<SnackbarProvider>
							<CustomizationLayout />
							<Router />
						</SnackbarProvider>
					</MUITheme>
				</EmployeeAuthProvider>
			</AuthProvider>
		</StoreProvider>
	);
}

export default App;
