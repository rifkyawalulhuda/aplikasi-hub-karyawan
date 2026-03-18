import { createContext, useContext, useEffect, useMemo, useState } from 'react';

import EMPLOYEE_AUTH_STORAGE_KEY from '@/constants/employeePortal';

const EmployeeAuthContext = createContext(null);

function clearStoredSession() {
	if (typeof window !== 'undefined') {
		window.localStorage.removeItem(EMPLOYEE_AUTH_STORAGE_KEY);
	}
}

function readStoredSession() {
	if (typeof window === 'undefined') {
		return null;
	}

	try {
		const storedValue = window.localStorage.getItem(EMPLOYEE_AUTH_STORAGE_KEY);

		if (!storedValue) {
			return null;
		}

		const parsedValue = JSON.parse(storedValue);

		if (!parsedValue?.accessToken || !parsedValue?.user) {
			clearStoredSession();
			return null;
		}

		if (parsedValue.expiresAt && new Date(parsedValue.expiresAt).getTime() <= Date.now()) {
			clearStoredSession();
			return null;
		}

		return parsedValue;
	} catch {
		clearStoredSession();
		return null;
	}
}

function EmployeeAuthProvider({ children }) {
	const [session, setSession] = useState(() => readStoredSession());

	useEffect(() => {
		const handleStorage = (event) => {
			if (event.key === EMPLOYEE_AUTH_STORAGE_KEY) {
				setSession(readStoredSession());
			}
		};

		window.addEventListener('storage', handleStorage);

		return () => {
			window.removeEventListener('storage', handleStorage);
		};
	}, []);

	const value = useMemo(
		() => ({
			session,
			user: session?.user || null,
			accessToken: session?.accessToken || null,
			isAuthenticated: Boolean(session?.accessToken && session?.user),
			login: (nextSession) => {
				window.localStorage.setItem(EMPLOYEE_AUTH_STORAGE_KEY, JSON.stringify(nextSession));
				setSession(nextSession);
			},
			logout: () => {
				clearStoredSession();
				setSession(null);
			},
		}),
		[session],
	);

	return <EmployeeAuthContext.Provider value={value}>{children}</EmployeeAuthContext.Provider>;
}

function useEmployeeAuth() {
	const context = useContext(EmployeeAuthContext);

	if (!context) {
		throw new Error('useEmployeeAuth harus digunakan di dalam EmployeeAuthProvider.');
	}

	return context;
}

export { EmployeeAuthProvider, clearStoredSession, readStoredSession, useEmployeeAuth };
