import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const AUTH_STORAGE_KEY = 'hub-karyawan-auth';

const AuthContext = createContext(null);

function readStoredUser() {
	if (typeof window === 'undefined') {
		return null;
	}

	try {
		const storedValue = window.localStorage.getItem(AUTH_STORAGE_KEY);

		if (!storedValue) {
			return null;
		}

		return JSON.parse(storedValue);
	} catch (error) {
		window.localStorage.removeItem(AUTH_STORAGE_KEY);
		return null;
	}
}

function AuthProvider({ children }) {
	const [user, setUser] = useState(() => readStoredUser());

	useEffect(() => {
		const handleStorage = (event) => {
			if (event.key === AUTH_STORAGE_KEY) {
				setUser(readStoredUser());
			}
		};

		window.addEventListener('storage', handleStorage);

		return () => {
			window.removeEventListener('storage', handleStorage);
		};
	}, []);

	const value = useMemo(
		() => ({
			user,
			isAuthenticated: Boolean(user),
			login: (nextUser) => {
				window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextUser));
				setUser(nextUser);
			},
			logout: () => {
				window.localStorage.removeItem(AUTH_STORAGE_KEY);
				setUser(null);
			},
		}),
		[user],
	);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function useAuth() {
	const context = useContext(AuthContext);

	if (!context) {
		throw new Error('useAuth harus digunakan di dalam AuthProvider.');
	}

	return context;
}

export { AuthProvider, useAuth };
